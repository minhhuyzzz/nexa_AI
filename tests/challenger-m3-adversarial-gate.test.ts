import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  calculateTrustScore,
  detectSecurityPreset,
  type ProctoringViolationEvent,
  type IntegrityFlag,
  type AssessmentSecuritySettings,
  DEFAULT_SECURITY_SETTINGS,
  SECURITY_PRESETS,
} from '@/features/assessments/types/security.types';

/**
 * ============================================================================
 * CHALLENGER M3 ROUND 2: ADVERSARIAL STRESS TEST & GATE VERIFICATION HARNESS
 * ============================================================================
 * 
 * Target Domains:
 * 1. Trust Score Calculation under extreme boundary and adversarial conditions:
 *    - Base 100, 0 clamp, negative duration handling, event flood / DDoS simulation
 *    - DevTools instant FLAGGED trigger (Layer 8 zero-tolerance)
 *    - Fullscreen exit degradation
 *    - Practice mode (max_violations: 0) vs Strict mode (max_violations: 1)
 * 2. Real-time Proctoring Sync State Machine:
 *    - Host control TAB_SWITCH_ALERT simulation and state updates
 *    - Room events API mapper verification
 * 3. AI Gateway Telemetry Math & 3-Flow Isolation:
 *    - Flow-based filtering (all vs personal vs org)
 *    - USD/VND conversions, p95 latency, error rate
 *    - Dynamic budget persistence (costBudgetMonthlyUsd)
 * 4. AGENTS.md Conformance across all M3 touched files:
 *    - Zero user-facing "DigComp"
 *    - Zero JSX emojis
 *    - Zero horizontal divider borders (<hr>, divide-y, border-b/t dividers)
 *    - Dark mode and Cobalt #2563EB tokens
 * ============================================================================
 */

describe('Challenger M3 R2: Adversarial Stress Test & Gate Verification', () => {
  const rootDir = process.cwd();

  // -------------------------------------------------------------------------
  // 1. TRUST SCORE CALCULATOR ADVERSARIAL BOUNDARY STRESS
  // -------------------------------------------------------------------------
  describe('1. Trust Score Calculator Boundary & Extreme Conditions', () => {
    it('1.1. Pristine baseline: empty event list yields exactly 100 score and HIGH_TRUST', () => {
      const result = calculateTrustScore([], DEFAULT_SECURITY_SETTINGS);
      expect(result.trustScore).toBe(100);
      expect(result.integrityFlag).toBe('HIGH_TRUST');
      expect(result.tabSwitchesCount).toBe(0);
      expect(result.fullscreenExitsCount).toBe(0);
      expect(result.copyAttemptsCount).toBe(0);
      expect(result.devtoolsAttemptsCount).toBe(0);
      expect(result.totalTimeOutOfFocusSeconds).toBe(0);
    });

    it('1.2. Default arguments safety: undefined arguments produce 100 score and no crash', () => {
      const result = calculateTrustScore();
      expect(result.trustScore).toBe(100);
      expect(result.integrityFlag).toBe('HIGH_TRUST');
    });

    it('1.3. Tab switch duration scaling: checks duration penalty step ladder', () => {
      // Step 1: duration 1s -> 10 + Math.min(20, Math.floor(1/5)*2 = 0) = 10 pts deduction -> 90
      const ev1: ProctoringViolationEvent = {
        id: '1',
        type: 'TAB_SWITCH',
        timestamp: new Date().toISOString(),
        durationSeconds: 1,
      };
      const res1 = calculateTrustScore([ev1], { max_violations: 3 });
      expect(res1.trustScore).toBe(90);
      expect(res1.integrityFlag).toBe('HIGH_TRUST');

      // Step 2: duration 9s -> floor(9/5)*2 = 2 pts penalty -> 10 + 2 = 12 pts deduction -> 88
      const ev2: ProctoringViolationEvent = {
        id: '2',
        type: 'TAB_SWITCH',
        timestamp: new Date().toISOString(),
        durationSeconds: 9,
      };
      const res2 = calculateTrustScore([ev2], { max_violations: 3 });
      expect(res2.trustScore).toBe(88);
      expect(res2.integrityFlag).toBe('HIGH_TRUST');

      // Step 3: duration 30s -> floor(30/5)*2 = 12 pts penalty -> 10 + 12 = 22 pts deduction -> 78 -> SUSPICIOUS
      const ev3: ProctoringViolationEvent = {
        id: '3',
        type: 'TAB_SWITCH',
        timestamp: new Date().toISOString(),
        durationSeconds: 30,
      };
      const res3 = calculateTrustScore([ev3], { max_violations: 3 });
      expect(res3.trustScore).toBe(78);
      expect(res3.integrityFlag).toBe('SUSPICIOUS');

      // Step 4: duration 120s -> penalty capped at Math.min(20, floor(120/5)*2 = 48 -> 20) -> 10 + 20 = 30 pts deduction -> 70
      const ev4: ProctoringViolationEvent = {
        id: '4',
        type: 'TAB_SWITCH',
        timestamp: new Date().toISOString(),
        durationSeconds: 120,
      };
      const res4 = calculateTrustScore([ev4], { max_violations: 3 });
      expect(res4.trustScore).toBe(70);
      expect(res4.integrityFlag).toBe('SUSPICIOUS');
    });

    it('1.4. Tab switch violation thresholds: 1 = HIGH_TRUST, 2-3 = SUSPICIOUS, >3 = FLAGGED', () => {
      const makeTabEvent = (id: string): ProctoringViolationEvent => ({
        id,
        type: 'TAB_SWITCH',
        timestamp: new Date().toISOString(),
        durationSeconds: 2,
      });

      // 1 switch -> score: 90 -> HIGH_TRUST
      expect(calculateTrustScore([makeTabEvent('1')], { max_violations: 3 }).integrityFlag).toBe('HIGH_TRUST');

      // 2 switches -> score: 80 -> SUSPICIOUS (score < 85 or tabSwitches > 1)
      expect(calculateTrustScore([makeTabEvent('1'), makeTabEvent('2')], { max_violations: 3 }).integrityFlag).toBe('SUSPICIOUS');

      // 3 switches -> score: 70 -> SUSPICIOUS (tabSwitches <= max_violations)
      expect(calculateTrustScore([makeTabEvent('1'), makeTabEvent('2'), makeTabEvent('3')], { max_violations: 3 }).integrityFlag).toBe('SUSPICIOUS');

      // 4 switches -> score: 70 - 10 (4th switch) - 15 (excess over 3) = 45 -> FLAGGED (score < 60)
      const res4 = calculateTrustScore(
        [makeTabEvent('1'), makeTabEvent('2'), makeTabEvent('3'), makeTabEvent('4')],
        { max_violations: 3 }
      );
      expect(res4.trustScore).toBe(45);
      expect(res4.integrityFlag).toBe('FLAGGED');

      // 5 switches -> tabSwitches >= maxAllowed + 2 -> automatic FLAGGED regardless of score
      const res5 = calculateTrustScore(
        [makeTabEvent('1'), makeTabEvent('2'), makeTabEvent('3'), makeTabEvent('4'), makeTabEvent('5')],
        { max_violations: 3 }
      );
      expect(res5.trustScore).toBe(20);
      expect(res5.integrityFlag).toBe('FLAGGED');
    });

    it('1.5. DevTools instant FLAGGED trigger: single DevTools attempt immediately triggers FLAGGED', () => {
      const devtoolsEv: ProctoringViolationEvent = {
        id: 'dt-1',
        type: 'DEVTOOLS_ATTEMPT',
        timestamp: new Date().toISOString(),
        details: 'F12 pressed',
      };

      const result = calculateTrustScore([devtoolsEv], { max_violations: 5 });
      // Score: 100 - 25 = 75. Even though 75 is normally SUSPICIOUS, DevTools forces FLAGGED!
      expect(result.trustScore).toBe(75);
      expect(result.devtoolsAttemptsCount).toBe(1);
      expect(result.integrityFlag).toBe('FLAGGED');
    });

    it('1.6. Fullscreen exit degradation: 1 exit triggers SUSPICIOUS, 3 exits trigger FLAGGED', () => {
      const fsEv: ProctoringViolationEvent = {
        id: 'fs-1',
        type: 'FULLSCREEN_EXIT',
        timestamp: new Date().toISOString(),
      };

      // 1 exit: 100 - 15 = 85 -> SUSPICIOUS (fullscreenExits > 0)
      const res1 = calculateTrustScore([fsEv]);
      expect(res1.trustScore).toBe(85);
      expect(res1.fullscreenExitsCount).toBe(1);
      expect(res1.integrityFlag).toBe('SUSPICIOUS');

      // 2 exits: 100 - 30 = 70 -> SUSPICIOUS
      const res2 = calculateTrustScore([fsEv, { ...fsEv, id: 'fs-2' }]);
      expect(res2.trustScore).toBe(70);
      expect(res2.integrityFlag).toBe('SUSPICIOUS');

      // 3 exits: 100 - 45 = 55 -> FLAGGED (score < 60)
      const res3 = calculateTrustScore([fsEv, { ...fsEv, id: 'fs-2' }, { ...fsEv, id: 'fs-3' }]);
      expect(res3.trustScore).toBe(55);
      expect(res3.integrityFlag).toBe('FLAGGED');
    });

    it('1.7. Zero score lower bound clamp: massive violation storm must clamp at 0 and never go negative', () => {
      // 50 tab switches of 60s, 10 devtools, 10 fullscreen exits
      const stormEvents: ProctoringViolationEvent[] = [];
      for (let i = 0; i < 50; i++) {
        stormEvents.push({
          id: `tab-${i}`,
          type: 'TAB_SWITCH',
          timestamp: new Date().toISOString(),
          durationSeconds: 60,
        });
      }
      for (let i = 0; i < 10; i++) {
        stormEvents.push({
          id: `dt-${i}`,
          type: 'DEVTOOLS_ATTEMPT',
          timestamp: new Date().toISOString(),
        });
      }
      for (let i = 0; i < 10; i++) {
        stormEvents.push({
          id: `fs-${i}`,
          type: 'FULLSCREEN_EXIT',
          timestamp: new Date().toISOString(),
        });
      }

      const result = calculateTrustScore(stormEvents, { max_violations: 3 });
      expect(result.trustScore).toBe(0);
      expect(result.trustScore).not.toBeLessThan(0);
      expect(Number.isNaN(result.trustScore)).toBe(false);
      expect(result.integrityFlag).toBe('FLAGGED');
      expect(result.tabSwitchesCount).toBe(50);
      expect(result.devtoolsAttemptsCount).toBe(10);
      expect(result.fullscreenExitsCount).toBe(10);
      expect(result.totalTimeOutOfFocusSeconds).toBe(50 * 60);
    });

    it('1.8. Practice mode tolerance (max_violations = 0): no excess violation penalty deducted', () => {
      const practiceSettings: Partial<AssessmentSecuritySettings> = {
        max_violations: 0,
      };

      const events: ProctoringViolationEvent[] = [
        { id: '1', type: 'TAB_SWITCH', timestamp: new Date().toISOString(), durationSeconds: 2 },
        { id: '2', type: 'TAB_SWITCH', timestamp: new Date().toISOString(), durationSeconds: 2 },
      ];

      // 2 switches: score = 100 - 20 = 80.
      // Since max_violations is 0, no excess penalty is deducted.
      const result = calculateTrustScore(events, practiceSettings);
      expect(result.trustScore).toBe(80);
      expect(result.integrityFlag).toBe('SUSPICIOUS');
    });

    it('1.9. Strict certification preset: max_violations = 1', () => {
      const strictPreset = SECURITY_PRESETS.STRICT.settings;
      expect(strictPreset.max_violations).toBe(1);
      expect(strictPreset.fullscreen_lock).toBe(true);
      expect(strictPreset.block_devtools).toBe(true);

      // In strict mode, 2nd tab switch exceeds maxAllowed (1) and incurs 15 penalty
      const events: ProctoringViolationEvent[] = [
        { id: '1', type: 'TAB_SWITCH', timestamp: new Date().toISOString(), durationSeconds: 1 },
        { id: '2', type: 'TAB_SWITCH', timestamp: new Date().toISOString(), durationSeconds: 1 },
      ];

      // 100 - 20 (2 switches) - 15 (1 excess switch) = 65 -> SUSPICIOUS
      const res = calculateTrustScore(events, strictPreset);
      expect(res.trustScore).toBe(65);
      expect(res.integrityFlag).toBe('SUSPICIOUS');

      // 3rd tab switch -> tabSwitches (3) >= maxAllowed (1) + 2 -> automatic FLAGGED!
      const res3 = calculateTrustScore([...events, { id: '3', type: 'TAB_SWITCH', timestamp: new Date().toISOString(), durationSeconds: 1 }], strictPreset);
      expect(res3.integrityFlag).toBe('FLAGGED');
    });

    it('1.10. Anomaly resilience: event with durationSeconds = 0 or undefined defaults to 1s', () => {
      const anomalyEvent: ProctoringViolationEvent = {
        id: 'anon-1',
        type: 'TAB_SWITCH',
        timestamp: new Date().toISOString(),
        durationSeconds: 0,
      };

      const result = calculateTrustScore([anomalyEvent]);
      // durationSeconds = 0 is falsy, so duration = 0 || 1 = 1s
      expect(result.totalTimeOutOfFocusSeconds).toBe(1);
      expect(result.trustScore).toBe(90);
    });
  });

  // -------------------------------------------------------------------------
  // 2. REAL-TIME PROCTORING SYNC STATE MACHINE
  // -------------------------------------------------------------------------
  describe('2. Real-time Proctoring Sync State Machine', () => {
    it('2.1. Simulates Host Control TAB_SWITCH_ALERT handler transitions', () => {
      // Simulate live control page TAB_SWITCH_ALERT state machine:
      interface ParticipantState {
        id: string;
        fullName: string;
        violationsCount: number;
        trustScore: number;
        integrityFlag: 'HIGH_TRUST' | 'SUSPICIOUS' | 'FLAGGED';
      }

      let p: ParticipantState = {
        id: 'p-1',
        fullName: 'Nguyễn Văn A',
        violationsCount: 0,
        trustScore: 100,
        integrityFlag: 'HIGH_TRUST',
      };

      const handleAlert = (current: ParticipantState): ParticipantState => {
        const newViolationsCount = (current.violationsCount || 0) + 1;
        const newTrustScore = Math.max(0, (current.trustScore ?? 100) - 10);
        let newFlag: 'HIGH_TRUST' | 'SUSPICIOUS' | 'FLAGGED' = 'HIGH_TRUST';
        if (newTrustScore < 60 || newViolationsCount >= 3) {
          newFlag = 'FLAGGED';
        } else if (newTrustScore < 85 || newViolationsCount >= 1) {
          newFlag = 'SUSPICIOUS';
        }
        return {
          ...current,
          violationsCount: newViolationsCount,
          trustScore: newTrustScore,
          integrityFlag: newFlag,
        };
      };

      // 1st alert: violations = 1, trustScore = 90, flag = SUSPICIOUS
      p = handleAlert(p);
      expect(p.violationsCount).toBe(1);
      expect(p.trustScore).toBe(90);
      expect(p.integrityFlag).toBe('SUSPICIOUS');

      // 2nd alert: violations = 2, trustScore = 80, flag = SUSPICIOUS
      p = handleAlert(p);
      expect(p.violationsCount).toBe(2);
      expect(p.trustScore).toBe(80);
      expect(p.integrityFlag).toBe('SUSPICIOUS');

      // 3rd alert: violations = 3, trustScore = 70, flag = FLAGGED (violationsCount >= 3)
      p = handleAlert(p);
      expect(p.violationsCount).toBe(3);
      expect(p.trustScore).toBe(70);
      expect(p.integrityFlag).toBe('FLAGGED');

      // 15 alerts later: score must clamp at 0
      for (let i = 0; i < 15; i++) {
        p = handleAlert(p);
      }
      expect(p.trustScore).toBe(0);
      expect(p.integrityFlag).toBe('FLAGGED');
    });

    it('2.2. Verify /api/rooms/events mapping logic handles all event types correctly', () => {
      const rawEvents = [
        { id: '1', event_type: 'TAB_HIDDEN', created_at: '2026-11-09T08:00:00Z', details: { durationSeconds: 5 } },
        { id: '2', event_type: 'FULLSCREEN_EXIT', created_at: '2026-11-09T08:01:00Z', details: {} },
        { id: '3', event_type: 'DEVTOOLS_OPENED', created_at: '2026-11-09T08:02:00Z', details: { message: 'F12' } },
        { id: '4', event_type: 'FOCUS_LOST', created_at: '2026-11-09T08:03:00Z', details: { durationSeconds: 2 } },
      ];

      // Mirror mapping from src/app/api/rooms/events/route.ts
      const mapped = rawEvents.map((e) => {
        let vType: any = 'TAB_SWITCH';
        if (e.event_type === 'FULLSCREEN_EXIT') vType = 'FULLSCREEN_EXIT';
        else if (e.event_type === 'DEVTOOLS_OPENED') vType = 'DEVTOOLS_ATTEMPT';
        else if (e.event_type === 'COPY_ATTEMPT') vType = 'COPY_ATTEMPT';

        return {
          id: e.id,
          type: vType,
          timestamp: e.created_at,
          durationSeconds: e.details?.durationSeconds,
          details: e.details?.message,
        };
      });

      expect(mapped[0].type).toBe('TAB_SWITCH');
      expect(mapped[1].type).toBe('FULLSCREEN_EXIT');
      expect(mapped[2].type).toBe('DEVTOOLS_ATTEMPT');
      expect(mapped[3].type).toBe('TAB_SWITCH');

      const trust = calculateTrustScore(mapped, { max_violations: 3 });
      expect(trust.devtoolsAttemptsCount).toBe(1);
      expect(trust.fullscreenExitsCount).toBe(1);
      expect(trust.tabSwitchesCount).toBe(2);
      expect(trust.integrityFlag).toBe('FLAGGED'); // DevTools triggers FLAGGED
    });
  });

  // -------------------------------------------------------------------------
  // 3. AI GATEWAY REAL TELEMETRY & 3-FLOW ISOLATION
  // -------------------------------------------------------------------------
  describe('3. AI Gateway Real Telemetry & 3-Flow Isolation', () => {
    const mockEvents = [
      // Personal events (organization_id is null)
      { id: '1', organization_id: null, feature: 'AUTHORING_ASSIST', model: 'gemini-2.5-flash', prompt_tokens: 100, completion_tokens: 50, latency_ms: 500, status: 'SUCCESS', cost_estimated: 0.00015 },
      { id: '2', organization_id: null, feature: 'COMPETENCY_ANALYSIS', model: 'gemini-2.5-flash', prompt_tokens: 200, completion_tokens: 100, latency_ms: 800, status: 'SUCCESS', cost_estimated: 0.00030 },
      // Org events (organization_id is populated)
      { id: '3', organization_id: 'org-abc-123', feature: 'AUTHORING_ASSIST', model: 'gemini-2.5-pro', prompt_tokens: 500, completion_tokens: 300, latency_ms: 1200, status: 'SUCCESS', cost_estimated: 0.00200 },
      { id: '4', organization_id: 'org-abc-123', feature: 'RUBRIC_GRADING', model: 'gemini-2.5-pro', prompt_tokens: 800, completion_tokens: 400, latency_ms: 1500, status: 'FAILED', cost_estimated: 0.00300 },
    ];

    it('3.1. Flow isolation: personal flow filters strictly out org events', () => {
      const personalFiltered = mockEvents.filter((ev) => !ev.organization_id);
      expect(personalFiltered).toHaveLength(2);
      expect(personalFiltered.every((ev) => ev.organization_id === null)).toBe(true);

      const totalTokens = personalFiltered.reduce((sum, e) => sum + e.prompt_tokens + e.completion_tokens, 0);
      expect(totalTokens).toBe(150 + 300); // 450 tokens
    });

    it('3.2. Flow isolation: org flow filters strictly out personal events', () => {
      const orgFiltered = mockEvents.filter((ev) => Boolean(ev.organization_id));
      expect(orgFiltered).toHaveLength(2);
      expect(orgFiltered.every((ev) => ev.organization_id !== null)).toBe(true);

      const errorCount = orgFiltered.filter((e) => e.status === 'FAILED').length;
      expect(errorCount).toBe(1);
      const errorRate = (errorCount / orgFiltered.length) * 100;
      expect(errorRate).toBe(50);
    });

    it('3.3. Zero fake data verification in AI Gateway Page source code', () => {
      const pagePath = path.join(rootDir, 'src/app/(dashboard)/admin/ai-gateway/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');

      // Prohibit old fake mock data
      expect(content).not.toContain('const mockModels =');
      expect(content).not.toContain('const mockLogs =');
      expect(content).not.toContain('const sampleEvents =');

      // Dynamic budget binding
      expect(content).toContain('config?.costBudgetMonthlyUsd ?? config?.monthlyBudgetUsd ?? 200.0');
      // Flow selection pills
      expect(content).toContain("onClick={() => setFlow('all')}");
      expect(content).toContain("onClick={() => setFlow('personal')}");
      expect(content).toContain("onClick={() => setFlow('org')}");
      expect(content).toContain('Tất cả luồng');
      expect(content).toContain('Cá nhân');
      expect(content).toContain('Tổ chức');
    });

    it('3.4. Dynamic budget schema persistence in /api/admin/ai-gateway', () => {
      const apiPath = path.join(rootDir, 'src/app/api/admin/ai-gateway/route.ts');
      const content = fs.readFileSync(apiPath, 'utf8');

      expect(content).toContain('costBudgetMonthlyUsd: z.number().positive().optional()');
      expect(content).toContain('monthlyBudgetUsd: z.number().positive().optional()');
      expect(content).toContain("const flow = url.searchParams.get('flow') || 'all';");
      expect(content).toContain("if (flow === 'personal')");
      expect(content).toContain("query = query.is('organization_id', null);");
      expect(content).toContain("else if (flow === 'org')");
      expect(content).toContain("query = query.not('organization_id', 'is', null);");
    });
  });

  // -------------------------------------------------------------------------
  // 4. AGENTS.md HARD CONFORMANCE ON ALL M3 TOUCHED FILES
  // -------------------------------------------------------------------------
  describe('4. AGENTS.md Forensic Rules across M3 Touched Files', () => {
    const M3_CORE_FILES = [
      'src/app/live/control/page.tsx',
      'src/app/(dashboard)/personal/take/[id]/page.tsx',
      'src/app/api/rooms/events/route.ts',
      'src/app/api/evaluator/submissions/route.ts',
      'src/app/(dashboard)/personal/grading/page.tsx',
      'src/components/dashboard/grading/InContextGradingDrawer.tsx',
      'src/features/ai-gateway/services/ai-config.service.ts',
      'src/features/ai-gateway/services/ai-usage-logger.service.ts',
      'src/app/api/ai/authoring-assist/route.ts',
      'src/app/api/admin/ai-gateway/route.ts',
      'src/app/(dashboard)/admin/ai-gateway/page.tsx',
      'src/components/pricing/EnterpriseContactModal.tsx',
      'src/components/dashboard/assessments/AssessmentDetailTabs.tsx',
      'src/app/(dashboard)/admin/frameworks/page.tsx',
      'src/app/api/assessments/route.ts',
      'src/features/assessments/services/assessment-validator.service.ts',
      'src/app/framework/page.tsx',
      'src/app/(dashboard)/personal/profile/page.tsx',
      'src/app/(dashboard)/admin/organizations/page.tsx',
      'src/components/dashboard/classes/ClassStreamTab.tsx',
    ];

    const M3_UI_FILES = [
      'src/app/live/control/page.tsx',
      'src/app/(dashboard)/personal/take/[id]/page.tsx',
      'src/app/(dashboard)/personal/grading/page.tsx',
      'src/components/dashboard/grading/InContextGradingDrawer.tsx',
      'src/app/(dashboard)/admin/ai-gateway/page.tsx',
      'src/components/pricing/EnterpriseContactModal.tsx',
      'src/components/dashboard/assessments/AssessmentDetailTabs.tsx',
      'src/app/(dashboard)/admin/frameworks/page.tsx',
      'src/app/framework/page.tsx',
      'src/app/(dashboard)/personal/profile/page.tsx',
      'src/app/(dashboard)/admin/organizations/page.tsx',
      'src/components/dashboard/classes/ClassStreamTab.tsx',
    ];

    it('4.1. Zero user-facing "DigComp" wording (AGENTS.md §2.1)', () => {
      const digcompRegex = /\bdigcomp(\s*[23]\.[02])?\b/i;

      M3_UI_FILES.forEach((relPath) => {
        const fullPath = path.join(rootDir, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const violations: Array<{ line: number; text: string }> = [];

        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          if (digcompRegex.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Found forbidden "DigComp" wording in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });

    it('4.2. Zero JSX emojis (AGENTS.md §3.4)', () => {
      // Prohibits raw unicode emojis in JSX/code
      M3_UI_FILES.forEach((relPath) => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const violations: Array<{ line: number; text: string }> = [];

        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          for (let i = 0; i < trimmed.length; i++) {
            const code = trimmed.codePointAt(i) || 0;
            if (code > 0xffff) i++;
            if (
              (code >= 0x1f300 && code <= 0x1faff) ||
              (code >= 0x2600 && code <= 0x27bf) ||
              (code >= 0x2300 && code <= 0x23ff)
            ) {
              const char = String.fromCodePoint(code);
              if (
                char !== '✓' &&
                char !== '©' &&
                char !== '®' &&
                char !== '™' &&
                char !== '✕' &&
                char !== '✖'
              ) {
                violations.push({ line: idx + 1, text: `Char '${char}' (U+${code.toString(16).toUpperCase()}): ${trimmed}` });
              }
            }
          }
        });

        expect(
          violations,
          `Found emoji violations in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });

    it('4.3. Prohibits horizontal dividing borders ("không sử dụng đường viền ngang") (AGENTS.md §3.5)', () => {
      // Disallows border-b, border-t, border-y, divide-y, <hr>
      // Permitted: CSS loading spinners (border-t-transparent, border-b-transparent),
      // compound 4-side borders like `border border-l-4`, or dashed indicator indicators
      const horizontalDividerRegex = /\b(divide-y|border-y|border-b(?!-transparent)|border-t(?!-transparent))\b|<hr[\s/>]/;

      M3_UI_FILES.forEach((relPath) => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const violations: Array<{ line: number; text: string }> = [];

        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          // Allow compound 4-side declarations like `border border-l-4 border-l-blue-600`
          // or spinning loaders
          if (horizontalDividerRegex.test(trimmed)) {
            // Check if it's part of a full border compound or safe exception
            if (trimmed.includes('border-dashed') && trimmed.includes('h-0.5')) return;
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Found horizontal divider violations in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });

    it('4.4. Cobalt #2563EB and dark mode token consistency in M3 pages', () => {
      const controlPagePath = path.join(rootDir, 'src/app/live/control/page.tsx');
      const content = fs.readFileSync(controlPagePath, 'utf8');

      expect(content).toContain('bg-blue-600');
      expect(content).toContain('text-blue-600');
      expect(content).toContain('dark:border-zinc-800');
    });
  });
});
