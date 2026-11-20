import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  AiCreditsService,
  AiCreditPayer,
  CreditReservationResult,
} from '../../src/features/billing/services/ai-credits.service';

describe('Phase P1: AI Credit Ledger & Concurrency (atomic-credit-ledger.test.ts)', () => {
  // ==========================================================================
  // SUITE 1: Migration 51 DDL & SQL Architecture Invariants
  // ==========================================================================
  describe('Migration 51 SQL Architecture & Invariants', () => {
    const migrationPath = path.resolve(__dirname, '../../src/database/migrations/51_ai_task_policies_and_atomic_credit_ledger.sql');
    const rollbackPath = path.resolve(__dirname, '../../src/database/migrations/51_rollback_ai_ledger.sql');

    it('should have migration 51 file present and non-empty', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content.length).toBeGreaterThan(500);
    });

    it('should use safe ALTER TABLE ADD COLUMN IF NOT EXISTS without recreating ai_credit_reservations', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      // Must NOT recreate the table since it exists from migrations 39 & 46
      expect(content).not.toMatch(/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?public\.ai_credit_reservations/i);
      expect(content).toMatch(/ALTER\s+TABLE\s+public\.ai_credit_reservations/i);
      expect(content).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+task_type/i);
      expect(content).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+entitlement_id/i);
      expect(content).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+idempotent_hash/i);
      expect(content).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+execution_deadline_at/i);
      expect(content).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+release_reason/i);
    });

    it('should enforce pg_advisory_xact_lock(hashtext(p_request_id)) in reserve_ai_credits for strict serialization', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content).toContain('pg_advisory_xact_lock(hashtext(p_request_id))');
      expect(content).toContain('FOR UPDATE');
    });

    it('should define ai_task_policies with required task types and Gemini provider', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.ai_task_policies/i);
      expect(content).toContain('RUBRIC_GRADING');
      expect(content).toContain('GRADING');
      expect(content).toContain('RUBRIC_EVAL');
      expect(content).toContain('COMPETENCY_ANALYSIS');
      expect(content).toContain('ORG_INSIGHT');
      expect(content).toContain('AUTHORING_ASSIST');
      expect(content).toContain('EXPLAIN_QUESTION');
      expect(content).toContain('GOOGLE_GEMINI');
    });

    it('should restore credits to the exact source entitlement_id in release_ai_credits', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content).toContain('v_res.entitlement_id IS NOT NULL');
      expect(content).toContain('WHERE id = v_res.entitlement_id');
    });

    it('should have a clean rollback migration 51 file', () => {
      expect(fs.existsSync(rollbackPath)).toBe(true);
      const rollbackContent = fs.readFileSync(rollbackPath, 'utf8');
      expect(rollbackContent).toContain('DROP FUNCTION IF EXISTS public.reserve_ai_credits');
      expect(rollbackContent).toContain('DROP FUNCTION IF EXISTS public.settle_ai_credits');
      expect(rollbackContent).toContain('DROP FUNCTION IF EXISTS public.release_ai_credits');
      expect(rollbackContent).toContain('DROP FUNCTION IF EXISTS public.reconcile_ai_credit_reservations');
      expect(rollbackContent).toContain('DROP TABLE IF EXISTS public.ai_task_policies');
    });
  });

  // ==========================================================================
  // SUITE 2: AiCreditsService - 5-Phase Lifecycle Unit Tests
  // ==========================================================================
  describe('AiCreditsService: 5-Phase Lifecycle (Reserve -> Settle -> Release)', () => {
    it('should successfully reserve credits for Organization and record reservation details', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            success: true,
            is_idempotent_replay: false,
            reservation_id: 'req-org-001',
            remaining_credits: 495,
          },
          error: null,
        }),
      };

      const payer: AiCreditPayer = {
        type: 'ORG',
        id: 'org-111',
        userId: 'user-001',
        organizationId: 'org-111',
      };

      const res = await AiCreditsService.reserve(
        mockSupabase as any,
        payer,
        'RUBRIC_GRADING',
        5,
        'req-org-001'
      );

      expect(res.success).toBe(true);
      expect(res.reservationId).toBe('req-org-001');
      expect(res.payerType).toBe('ORG');
      expect(res.amount).toBe(5);
      expect(res.remainingCredits).toBe(495);
      expect(res.isIdempotentReplay).toBe(false);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('reserve_ai_credits', expect.objectContaining({
        p_request_id: 'req-org-001',
        p_payer_type: 'ORG',
        p_payer_id: 'org-111',
        p_amount: 5,
        p_feature: 'RUBRIC_GRADING',
      }));
    });

    it('should successfully reserve credits for Personal learner from user profile credits', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            success: true,
            is_idempotent_replay: false,
            reservation_id: 'req-pers-001',
            remaining_credits: 9,
          },
          error: null,
        }),
      };

      const payer: AiCreditPayer = {
        type: 'PERSONAL',
        id: 'user-777',
        userId: 'user-777',
      };

      const res = await AiCreditsService.reserve(
        mockSupabase as any,
        payer,
        'COMPETENCY_ANALYSIS',
        1,
        'req-pers-001'
      );

      expect(res.success).toBe(true);
      expect(res.reservationId).toBe('req-pers-001');
      expect(res.payerType).toBe('PERSONAL');
      expect(res.amount).toBe(1);
      expect(res.remainingCredits).toBe(9);
    });

    it('should return isIdempotentReplay: true without double charging on duplicate reserve calls', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            success: true,
            is_idempotent_replay: true,
            reservation_id: 'req-dup-001',
            remaining_credits: 495,
          },
          error: null,
        }),
      };

      const payer: AiCreditPayer = {
        type: 'ORG',
        id: 'org-111',
      };

      const res = await AiCreditsService.reserve(
        mockSupabase as any,
        payer,
        'RUBRIC_GRADING',
        5,
        'req-dup-001'
      );

      expect(res.success).toBe(true);
      expect(res.isIdempotentReplay).toBe(true);
      expect(res.remainingCredits).toBe(495);
    });

    it('should reject reserve calls with zero or negative credits', async () => {
      const mockSupabase = { rpc: vi.fn() };
      const payer: AiCreditPayer = { type: 'ORG', id: 'org-111' };

      const resZero = await AiCreditsService.reserve(mockSupabase as any, payer, 'RUBRIC_GRADING', 0);
      expect(resZero.success).toBe(false);
      expect(resZero.error).toContain('lớn hơn 0');

      const resNegative = await AiCreditsService.reserve(mockSupabase as any, payer, 'RUBRIC_GRADING', -3);
      expect(resNegative.success).toBe(false);
      expect(resNegative.error).toContain('lớn hơn 0');

      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should fail-closed when organization has insufficient credits', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Hạn mức AI Credits của tổ chức không đủ (còn: 2, cần: 5).' },
        }),
      };

      const payer: AiCreditPayer = { type: 'ORG', id: 'org-111' };
      const res = await AiCreditsService.reserve(mockSupabase as any, payer, 'RUBRIC_GRADING', 5);

      expect(res.success).toBe(false);
      expect(res.error).toContain('không đủ');
    });

    it('should settle reservation with artifactId and return status SETTLED', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            success: true,
            status: 'SETTLED',
            reservation_id: 'req-settle-001',
            settled_amount: 1,
            remaining_credits: 494,
          },
          error: null,
        }),
      };

      const res = await AiCreditsService.settle(
        mockSupabase as any,
        'req-settle-001',
        1,
        'artifact-uuid-999'
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe('SETTLED');
      expect(res.settledAmount).toBe(1);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('settle_ai_credits', {
        p_request_id: 'req-settle-001',
        p_artifact_id: 'artifact-uuid-999',
      });
    });

    it('should handle idempotent settlement replay when already SETTLED', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            success: true,
            status: 'SETTLED',
            already_settled: true,
            reservation_id: 'req-already-settled',
            settled_amount: 1,
            remaining_credits: 494,
          },
          error: null,
        }),
      };

      const res = await AiCreditsService.settle(mockSupabase as any, 'req-already-settled');

      expect(res.success).toBe(true);
      expect(res.alreadySettled).toBe(true);
      expect(res.status).toBe('SETTLED');
    });

    it('should release (refund) credits with reason when AI processing fails', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            success: true,
            status: 'RELEASED',
            reservation_id: 'req-fail-001',
            refunded_amount: 2,
          },
          error: null,
        }),
      };

      const res = await AiCreditsService.release(
        mockSupabase as any,
        'req-fail-001',
        'GEMINI_TIMEOUT_504'
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe('RELEASED');
      expect(res.refundedAmount).toBe(2);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('release_ai_credits', {
        p_request_id: 'req-fail-001',
        p_reason: 'GEMINI_TIMEOUT_504',
      });
    });

    it('should handle idempotent release replay when already RELEASED', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            success: true,
            status: 'RELEASED',
            already_released: true,
            reservation_id: 'req-already-released',
            refunded_amount: 2,
          },
          error: null,
        }),
      };

      const res = await AiCreditsService.release(mockSupabase as any, 'req-already-released');

      expect(res.success).toBe(true);
      expect(res.alreadyReleased).toBe(true);
      expect(res.status).toBe('RELEASED');
    });
  });

  // ==========================================================================
  // SUITE 3: Fallback Mode & State Machine Invariants
  // ==========================================================================
  describe('AiCreditsService: Fallback In-Memory Engine & Edge Conditions', () => {
    let mockDb: {
      reservations: Map<string, any>;
      entitlements: Map<string, any>;
      profiles: Map<string, any>;
    };

    beforeEach(() => {
      mockDb = {
        reservations: new Map(),
        entitlements: new Map([
          ['ent-1', { id: 'ent-1', organization_id: 'org-abc', ai_credits_granted: 100, ai_credits_used: 10, is_active: true }],
        ]),
        profiles: new Map([
          ['user-xyz', { id: 'user-xyz', credits: 5 }],
        ]),
      };
    });

    function createMockSupabase() {
      return {
        // No rpc method to force fallback engine
        from: (table: string) => {
          let currentFilterCol: string | null = null;
          let currentFilterVal: any = null;

          const queryBuilder: any = {
            select: vi.fn().mockImplementation(() => queryBuilder),
            eq: vi.fn().mockImplementation((col: string, val: any) => {
              currentFilterCol = col;
              currentFilterVal = val;
              return queryBuilder;
            }),
            order: vi.fn().mockImplementation(() => queryBuilder),
            limit: vi.fn().mockImplementation(() => queryBuilder),
            maybeSingle: vi.fn().mockImplementation(async () => {
              if (table === 'organization_entitlements') {
                if (currentFilterCol === 'id') {
                  return { data: mockDb.entitlements.get(currentFilterVal) || null, error: null };
                }
                return { data: mockDb.entitlements.get('ent-1'), error: null };
              }
              if (table === 'profiles') {
                return { data: mockDb.profiles.get('user-xyz'), error: null };
              }
              if (table === 'ai_credit_reservations') {
                const found = currentFilterVal ? mockDb.reservations.get(currentFilterVal) : null;
                return { data: found || null, error: null };
              }
              return { data: null, error: null };
            }),
            insert: vi.fn().mockImplementation(async (record: any) => {
              mockDb.reservations.set(record.request_id, { ...record });
              return { error: null };
            }),
            update: vi.fn().mockImplementation((updates: any) => ({
              eq: vi.fn().mockImplementation(async (col: string, val: string) => {
                if (table === 'ai_credit_reservations') {
                  const existing = mockDb.reservations.get(val);
                  if (existing) {
                    mockDb.reservations.set(val, { ...existing, ...updates });
                  }
                }
                if (table === 'organization_entitlements') {
                  const existing = mockDb.entitlements.get(val);
                  if (existing) {
                    mockDb.entitlements.set(val, { ...existing, ...updates });
                  }
                }
                if (table === 'profiles') {
                  const existing = mockDb.profiles.get(val);
                  if (existing) {
                    mockDb.profiles.set(val, { ...existing, ...updates });
                  }
                }
                return { error: null };
              }),
            })),
          };

          return queryBuilder;
        },
      };
    }

    it('fallback reserve deducts from organization_entitlements and records entitlement_id', async () => {
      const mockSupabase = createMockSupabase();
      const payer: AiCreditPayer = { type: 'ORG', id: 'org-abc' };

      const res = await AiCreditsService.reserve(
        mockSupabase as any,
        payer,
        'RUBRIC_GRADING',
        4,
        'req-fb-001'
      );

      expect(res.success).toBe(true);
      expect(res.amount).toBe(4);
      expect(res.remainingCredits).toBe(86); // 90 - 4 = 86

      const saved = mockDb.reservations.get('req-fb-001');
      expect(saved).toBeDefined();
      expect(saved.entitlement_id).toBe('ent-1');
      expect(saved.status).toBe('RESERVED');
      expect(saved.task_type).toBe('RUBRIC_GRADING');
    });

    it('fallback release restores credits to the exact entitlement_id source', async () => {
      const mockSupabase = createMockSupabase();
      mockDb.reservations.set('req-fb-rel', {
        id: 'uuid-1',
        request_id: 'req-fb-rel',
        payer_type: 'ORG',
        payer_id: 'org-abc',
        entitlement_id: 'ent-1',
        amount: 4,
        status: 'RESERVED',
        remaining_credits: 86,
      });

      const res = await AiCreditsService.release(mockSupabase as any, 'req-fb-rel', 'TASK_TIMEOUT');

      expect(res.success).toBe(true);
      expect(res.status).toBe('RELEASED');
      expect(res.refundedAmount).toBe(4);

      const ent = mockDb.entitlements.get('ent-1');
      expect(ent.ai_credits_used).toBe(6); // 10 - 4 = 6
    });

    it('cannot settle a reservation that has already been RELEASED', async () => {
      const mockSupabase = createMockSupabase();
      mockDb.reservations.set('req-released', {
        request_id: 'req-released',
        status: 'RELEASED',
        amount: 1,
      });

      const settleRes = await AiCreditsService.settle(mockSupabase as any, 'req-released');
      expect(settleRes.success).toBe(false);
      expect(settleRes.error).toContain('RELEASED');
    });

    it('cannot release a reservation that has already been SETTLED', async () => {
      const mockSupabase = createMockSupabase();
      mockDb.reservations.set('req-settled', {
        request_id: 'req-settled',
        status: 'SETTLED',
        amount: 1,
      });

      const releaseRes = await AiCreditsService.release(mockSupabase as any, 'req-settled');
      expect(releaseRes.success).toBe(false);
      expect(releaseRes.error).toContain('SETTLED');
    });
  });

  // ==========================================================================
  // SUITE 4: Background Reconciliation Protocol
  // ==========================================================================
  describe('AiCreditsService: Background Reconciliation Protocol', () => {
    it('should reconcile stale reservations via RPC reconcile_ai_credit_reservations', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            success: true,
            auto_settled_count: 3,
            auto_released_count: 2,
            flagged_manual_review_count: 1,
            reconciled_at: '2026-11-20T10:00:00Z',
          },
          error: null,
        }),
      };

      const report = await AiCreditsService.reconcileStaleReservations(mockSupabase as any, 5);

      expect(report.success).toBe(true);
      expect(report.autoSettledCount).toBe(3);
      expect(report.autoReleasedCount).toBe(2);
      expect(report.flaggedManualReviewCount).toBe(1);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('reconcile_ai_credit_reservations', {
        p_timeout_minutes: 5,
      });
    });

    it('fallback reconciliation honors execution_deadline_at grace window for actively running tasks', async () => {
      const inFlightDeadline = new Date(Date.now() + 120000).toISOString(); // 2 minutes in future
      const expiredPastCutoff = new Date(Date.now() - 600000).toISOString(); // 10 minutes in past

      const staleRecords = [
        {
          request_id: 'req-in-flight',
          status: 'RESERVED',
          task_type: 'RUBRIC_GRADING',
          amount: 1,
          created_at: expiredPastCutoff,
          execution_deadline_at: inFlightDeadline, // STILL RUNNING - WITHIN GRACE WINDOW
        },
        {
          request_id: 'req-dead',
          status: 'RESERVED',
          task_type: 'RUBRIC_GRADING',
          amount: 1,
          created_at: expiredPastCutoff,
          execution_deadline_at: new Date(Date.now() - 60000).toISOString(), // EXPIRED PAST DEADLINE
        },
      ];

      const released: string[] = [];
      const dbMap = new Map<string, any>(staleRecords.map((r) => [r.request_id, r]));

      const mockSupabase = {
        from: (table: string) => {
          let filterVal: any = null;
          const qb: any = {
            select: vi.fn().mockImplementation(() => qb),
            eq: vi.fn().mockImplementation((_col: string, val: any) => {
              filterVal = val;
              return qb;
            }),
            lt: vi.fn().mockResolvedValue({ data: staleRecords, error: null }),
            maybeSingle: vi.fn().mockImplementation(async () => {
              if (table === 'ai_credit_reservations') {
                return { data: dbMap.get(filterVal) || null, error: null };
              }
              return { data: null, error: null };
            }),
            update: vi.fn().mockImplementation((updates: any) => ({
              eq: vi.fn().mockImplementation(async (_col: string, val: string) => {
                if (updates.status === 'RELEASED') {
                  released.push(val);
                }
                return { error: null };
              }),
            })),
          };
          return qb;
        },
      };

      const report = await AiCreditsService.reconcileStaleReservations(mockSupabase as any, 5);

      expect(report.success).toBe(true);
      // In-flight task MUST NOT be released
      expect(released).not.toContain('req-in-flight');
      // Dead task past deadline MUST be released
      expect(released).toContain('req-dead');
      expect(report.autoReleasedCount).toBe(1);
    });

    it('fallback reconciliation supports all task types (GRADING, RUBRIC_EVAL, AUTHORING_ASSIST, ORG_INSIGHT)', async () => {
      const expiredTime = new Date(Date.now() - 600000).toISOString();
      const expiredDeadline = new Date(Date.now() - 60000).toISOString();

      const reservations = [
        { request_id: 'req-g1', task_type: 'GRADING', status: 'RESERVED', created_at: expiredTime, execution_deadline_at: expiredDeadline },
        { request_id: 'req-re1', task_type: 'RUBRIC_EVAL', status: 'RESERVED', created_at: expiredTime, execution_deadline_at: expiredDeadline },
        { request_id: 'req-aa1', task_type: 'AUTHORING_ASSIST', status: 'RESERVED', created_at: expiredTime, execution_deadline_at: expiredDeadline },
        { request_id: 'req-oi1', task_type: 'ORG_INSIGHT', status: 'RESERVED', created_at: expiredTime, execution_deadline_at: expiredDeadline },
        { request_id: 'req-unsupported', task_type: 'UNKNOWN_EXPERIMENT', status: 'RESERVED', created_at: expiredTime, execution_deadline_at: expiredDeadline },
      ];

      const settled: string[] = [];
      const released: string[] = [];
      const flagged: string[] = [];
      const dbMap = new Map<string, any>(reservations.map((r) => [r.request_id, r]));

      const mockSupabase = {
        from: (table: string) => {
          let filterVal: any = null;
          const qb: any = {
            select: vi.fn().mockImplementation(() => qb),
            eq: vi.fn().mockImplementation((_col: string, val: any) => {
              filterVal = val;
              return qb;
            }),
            lt: vi.fn().mockResolvedValue({ data: reservations, error: null }),
            maybeSingle: vi.fn().mockImplementation(async () => {
              if (table === 'ai_evaluations') return { data: { id: 'eval-123' }, error: null };
              if (table === 'ai_usage_events') return { data: { id: 'usage-456' }, error: null };
              if (table === 'ai_credit_reservations') return { data: dbMap.get(filterVal) || null, error: null };
              return { data: null, error: null };
            }),
            update: vi.fn().mockImplementation((updates: any) => ({
              eq: vi.fn().mockImplementation(async (_col: string, val: string) => {
                if (updates.status === 'SETTLED') settled.push(val);
                if (updates.status === 'RELEASED') released.push(val);
                if (updates.status === 'FLAGGED_MANUAL_REVIEW') flagged.push(val);
                return { error: null };
              }),
            })),
          };
          return qb;
        },
      };

      const report = await AiCreditsService.reconcileStaleReservations(mockSupabase as any, 5);

      expect(report.success).toBe(true);
      // Unsupported task should be FLAGGED for manual review, NEVER auto-refunded
      expect(flagged).toContain('req-unsupported');
      expect(report.flaggedManualReviewCount).toBe(1);
    });
  });

  // ==========================================================================
  // SUITE 5: Concurrency & Race Condition Simulation
  // ==========================================================================
  describe('Concurrency & Serialization Simulation', () => {
    it('simulating 10 concurrent requests with identical idempotentKey: exactly 1 reserve, 9 replays', async () => {
      let callCount = 0;
      let reservedCredits = 0;

      // Mock an atomic database function that serializes via advisory lock
      const mockAtomicRpc = vi.fn().mockImplementation(async (fnName: string, params: any) => {
        if (fnName === 'reserve_ai_credits') {
          callCount++;
          if (callCount === 1) {
            reservedCredits += params.p_amount;
            return {
              data: {
                success: true,
                is_idempotent_replay: false,
                reservation_id: params.p_request_id,
                remaining_credits: 100 - reservedCredits,
              },
              error: null,
            };
          } else {
            // Subsequent serialized concurrent calls hit the existing reservation check
            return {
              data: {
                success: true,
                is_idempotent_replay: true,
                reservation_id: params.p_request_id,
                remaining_credits: 100 - reservedCredits,
              },
              error: null,
            };
          }
        }
        return { data: null, error: null };
      });

      const mockSupabase = { rpc: mockAtomicRpc };
      const payer: AiCreditPayer = { type: 'ORG', id: 'org-111' };
      const sharedIdempotentKey = 'concurrent-tx-id-999';

      // Launch 10 parallel reservation attempts
      const parallelPromises = Array.from({ length: 10 }).map(() =>
        AiCreditsService.reserve(
          mockSupabase as any,
          payer,
          'RUBRIC_GRADING',
          5,
          sharedIdempotentKey
        )
      );

      const results: CreditReservationResult[] = await Promise.all(parallelPromises);

      // All 10 requests must report success to caller
      expect(results.every((r) => r.success)).toBe(true);

      // Exactly 1 performed the deduction
      const initialReservations = results.filter((r) => !r.isIdempotentReplay);
      expect(initialReservations.length).toBe(1);

      // Exactly 9 were idempotent replays
      const replayReservations = results.filter((r) => r.isIdempotentReplay);
      expect(replayReservations.length).toBe(9);

      // Total deducted credits is exactly 5, NOT 50
      expect(reservedCredits).toBe(5);
    });

    it('simulating parallel competing requests: fails cleanly when balance is exhausted without going negative', async () => {
      let balance = 25; // Only enough for two 10-credit requests

      const mockAtomicRpc = vi.fn().mockImplementation(async (fnName: string, params: any) => {
        if (fnName === 'reserve_ai_credits') {
          if (balance >= params.p_amount) {
            balance -= params.p_amount;
            return {
              data: {
                success: true,
                is_idempotent_replay: false,
                reservation_id: params.p_request_id,
                remaining_credits: balance,
              },
              error: null,
            };
          } else {
            return {
              data: null,
              error: { message: `Hạn mức AI Credits của tổ chức không đủ (còn: ${balance}, cần: ${params.p_amount}).` },
            };
          }
        }
        return { data: null, error: null };
      });

      const mockSupabase = { rpc: mockAtomicRpc };
      const payer: AiCreditPayer = { type: 'ORG', id: 'org-111' };

      // 5 concurrent requests, each asking for 10 credits from a 25-credit pool
      const requests = Array.from({ length: 5 }).map((_, i) =>
        AiCreditsService.reserve(
          mockSupabase as any,
          payer,
          'RUBRIC_GRADING',
          10,
          `competing-req-${i}`
        )
      );

      const outcomes = await Promise.all(requests);

      const successful = outcomes.filter((o) => o.success);
      const failed = outcomes.filter((o) => !o.success);

      expect(successful.length).toBe(2);
      expect(failed.length).toBe(3);
      expect(balance).toBe(5); // 25 - 20 = 5. Never negative!
    });
  });
});
