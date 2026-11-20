import { SupabaseClient } from '@supabase/supabase-js';

export type AiPayerType = 'ORG' | 'PERSONAL';

export interface AiCreditPayer {
  type: AiPayerType;
  id: string; // organizationId if ORG, userId if PERSONAL
  userId?: string;
  organizationId?: string | null;
}

export type AiTaskType =
  | 'RUBRIC_GRADING'
  | 'GRADING'
  | 'RUBRIC_EVAL'
  | 'COMPETENCY_ANALYSIS'
  | 'ORG_INSIGHT'
  | 'AUTHORING_ASSIST'
  | 'EXPLAIN_QUESTION'
  | string;

export interface ReserveCreditOptions {
  submissionId?: string | null;
  itemId?: string | null;
  campaignId?: string | null;
  timeoutMinutes?: number;
  idempotentHash?: string | null;
}

export interface CreditReservationResult {
  success: boolean;
  reservationId: string;
  isIdempotentReplay?: boolean;
  payerType: AiPayerType;
  payerId: string;
  amount: number;
  remainingCredits?: number;
  error?: string;
}

export interface CreditSettleResult {
  success: boolean;
  status: 'SETTLED' | 'RELEASED';
  reservationId: string;
  settledAmount?: number;
  refundedAmount?: number;
  remainingCredits?: number;
  alreadySettled?: boolean;
  alreadyReleased?: boolean;
  error?: string;
}

export interface ReconciliationReport {
  success: boolean;
  autoSettledCount: number;
  autoReleasedCount: number;
  flaggedManualReviewCount: number;
  reconciledAt: string;
  error?: string;
}

/**
 * AiCreditsService
 * Quản lý vòng đời 5 pha của AI Credits:
 * Pha 1: Payer Resolution & Validation
 * Pha 2: Atomic DB Reservation (reserve_ai_credits có pg_advisory_xact_lock & FOR UPDATE)
 * Pha 3: AI Gateway Execution (Do Gateway Adapter xử lý)
 * Pha 4: Data Persistence (Lưu ai_evaluations / competency_analyses)
 * Pha 5: Atomic Settlement (settle_ai_credits) hoặc Release (release_ai_credits)
 * Pha phụ: Background Reconciliation (reconcile_ai_credit_reservations)
 */
export class AiCreditsService {
  /**
   * Pha 1 & 2: Giữ trước AI Credits nguyên tử có khóa dòng và Idempotency
   */
  static async reserve(
    supabase: SupabaseClient,
    payer: AiCreditPayer,
    taskType: AiTaskType = 'RUBRIC_GRADING',
    estimatedCredits: number = 1,
    idempotentKey?: string,
    options?: ReserveCreditOptions
  ): Promise<CreditReservationResult> {
    if (!estimatedCredits || estimatedCredits <= 0) {
      return {
        success: false,
        reservationId: idempotentKey || '',
        payerType: payer.type,
        payerId: payer.id,
        amount: estimatedCredits,
        error: 'Số lượng credits giữ trước phải lớn hơn 0.',
      };
    }

    if (payer.type !== 'ORG' && payer.type !== 'PERSONAL') {
      return {
        success: false,
        reservationId: idempotentKey || '',
        payerType: payer.type,
        payerId: payer.id,
        amount: estimatedCredits,
        error: `Loại chủ thể chi trả không hợp lệ (nhận: ${payer.type}).`,
      };
    }

    const reservationId = idempotentKey || `res_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Thử gọi PostgreSQL RPC reserve_ai_credits (Migration 51)
    if (typeof supabase.rpc === 'function') {
      try {
        const { data, error } = await supabase.rpc('reserve_ai_credits', {
          p_request_id: reservationId,
          p_payer_type: payer.type,
          p_payer_id: payer.id,
          p_amount: estimatedCredits,
          p_feature: taskType,
          p_submission_id: options?.submissionId ?? null,
          p_item_id: options?.itemId ?? null,
          p_campaign_id: options?.campaignId ?? null,
          p_timeout_minutes: options?.timeoutMinutes ?? 3,
          p_idempotent_hash: options?.idempotentHash ?? idempotentKey ?? reservationId,
        });

        if (error) {
          return {
            success: false,
            reservationId,
            payerType: payer.type,
            payerId: payer.id,
            amount: estimatedCredits,
            error: error.message || 'Lỗi khi giữ chỗ AI credits trong RPC.',
          };
        }

        if (data) {
          return {
            success: true,
            reservationId: data.reservation_id || reservationId,
            isIdempotentReplay: !!data.is_idempotent_replay,
            payerType: payer.type,
            payerId: payer.id,
            amount: estimatedCredits,
            remainingCredits: data.remaining_credits,
          };
        }
      } catch (err: any) {
        // Nếu lỗi không phải do thiếu RPC mà là lỗi logic nghiệp vụ
        if (err?.message && !err.message.includes('function') && !err.message.includes('does not exist')) {
          return {
            success: false,
            reservationId,
            payerType: payer.type,
            payerId: payer.id,
            amount: estimatedCredits,
            error: err.message,
          };
        }
      }
    }

    // Fallback cho môi trường kiểm thử/mock nếu RPC chưa được cấu hình
    return this.fallbackReserve(supabase, payer, taskType, estimatedCredits, reservationId, options);
  }

  /**
   * Pha 5: Quyết toán giao dịch AI Credits sau khi hoàn tất lưu dữ liệu
   */
  static async settle(
    supabase: SupabaseClient,
    reservationId: string,
    actualCredits?: number,
    artifactRef?: { artifactId?: string; artifactType?: string } | string
  ): Promise<CreditSettleResult> {
    if (!reservationId) {
      return {
        success: false,
        status: 'SETTLED',
        reservationId: '',
        error: 'Mã reservationId không hợp lệ.',
      };
    }

    const artifactId = typeof artifactRef === 'string' ? artifactRef : artifactRef?.artifactId ?? null;

    if (typeof supabase.rpc === 'function') {
      try {
        const { data, error } = await supabase.rpc('settle_ai_credits', {
          p_request_id: reservationId,
          p_artifact_id: artifactId,
        });

        if (error) {
          return {
            success: false,
            status: 'SETTLED',
            reservationId,
            error: error.message,
          };
        }

        if (data) {
          return {
            success: true,
            status: 'SETTLED',
            reservationId,
            settledAmount: data.settled_amount,
            remainingCredits: data.remaining_credits,
            alreadySettled: !!data.already_settled,
          };
        }
      } catch (err: any) {
        if (err?.message && !err.message.includes('function') && !err.message.includes('does not exist')) {
          return {
            success: false,
            status: 'SETTLED',
            reservationId,
            error: err.message,
          };
        }
      }
    }

    return this.fallbackSettle(supabase, reservationId, actualCredits, artifactId);
  }

  /**
   * Pha 5 (Hủy/Lỗi): Hoàn trả AI Credits an toàn về đúng nguồn gốc ban đầu
   */
  static async release(
    supabase: SupabaseClient,
    reservationId: string,
    reason: string = 'AI_PROCESSING_FAILED'
  ): Promise<CreditSettleResult> {
    if (!reservationId) {
      return {
        success: false,
        status: 'RELEASED',
        reservationId: '',
        error: 'Mã reservationId không hợp lệ.',
      };
    }

    if (typeof supabase.rpc === 'function') {
      try {
        const { data, error } = await supabase.rpc('release_ai_credits', {
          p_request_id: reservationId,
          p_reason: reason,
        });

        if (error) {
          return {
            success: false,
            status: 'RELEASED',
            reservationId,
            error: error.message,
          };
        }

        if (data) {
          return {
            success: true,
            status: 'RELEASED',
            reservationId,
            refundedAmount: data.refunded_amount,
            alreadyReleased: !!data.already_released,
          };
        }
      } catch (err: any) {
        if (err?.message && !err.message.includes('function') && !err.message.includes('does not exist')) {
          return {
            success: false,
            status: 'RELEASED',
            reservationId,
            error: err.message,
          };
        }
      }
    }

    return this.fallbackRelease(supabase, reservationId, reason);
  }

  /**
   * Pha phụ: Đối soát tự động định kỳ (Background Reconciliation Protocol)
   * Chống treo tiền, kiểm tra hạn định thực thi (grace window) cho các tác vụ in-flight
   */
  static async reconcileStaleReservations(
    supabase: SupabaseClient,
    timeoutMinutes: number = 5
  ): Promise<ReconciliationReport> {
    if (typeof supabase.rpc === 'function') {
      try {
        const { data, error } = await supabase.rpc('reconcile_ai_credit_reservations', {
          p_timeout_minutes: timeoutMinutes,
        });

        if (!error && data) {
          return {
            success: true,
            autoSettledCount: data.auto_settled_count ?? 0,
            autoReleasedCount: data.auto_released_count ?? 0,
            flaggedManualReviewCount: data.flagged_manual_review_count ?? 0,
            reconciledAt: data.reconciled_at ?? new Date().toISOString(),
          };
        }
      } catch {}
    }

    return this.fallbackReconcile(supabase, timeoutMinutes);
  }

  // ============================================================================
  // FALLBACK IMPLEMENTATIONS (Dùng cho môi trường mock hoặc unit tests)
  // ============================================================================

  private static async fallbackReserve(
    supabase: SupabaseClient,
    payer: AiCreditPayer,
    taskType: AiTaskType,
    amount: number,
    reservationId: string,
    options?: ReserveCreditOptions
  ): Promise<CreditReservationResult> {
    try {
      // 1. Idempotency Check
      if (typeof supabase.from === 'function') {
        const { data: existing } = await supabase
          .from('ai_credit_reservations')
          .select('request_id, payer_type, payer_id, amount, status, remaining_credits')
          .eq('request_id', reservationId)
          .maybeSingle();

        if (existing) {
          if (existing.status === 'RESERVED') {
            return {
              success: true,
              isIdempotentReplay: true,
              reservationId: existing.request_id || reservationId,
              payerType: existing.payer_type as AiPayerType,
              payerId: existing.payer_id,
              amount: existing.amount || amount,
              remainingCredits: existing.remaining_credits,
            };
          } else {
            return {
              success: false,
              reservationId,
              payerType: payer.type,
              payerId: payer.id,
              amount,
              error: `Yêu cầu giữ credits này đã được xử lý (trạng thái: ${existing.status}).`,
            };
          }
        }
      }

      // 2. Khấu trừ credits
      let remainingCredits = 0;
      let entitlementId: string | null = null;

      if (payer.type === 'ORG') {
        const { data: ent, error: entErr } = await supabase
          .from('organization_entitlements')
          .select('id, ai_credits_granted, ai_credits_used')
          .eq('organization_id', payer.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (entErr || !ent) {
          return {
            success: false,
            reservationId,
            payerType: 'ORG',
            payerId: payer.id,
            amount,
            error: 'Hợp đồng tổ chức chưa được kích hoạt hoặc đã hết hạn.',
          };
        }

        const remaining = (ent.ai_credits_granted || 0) - (ent.ai_credits_used || 0);
        if (remaining < amount) {
          return {
            success: false,
            reservationId,
            payerType: 'ORG',
            payerId: payer.id,
            amount,
            error: `Hạn mức AI Credits của tổ chức không đủ (còn: ${remaining}, cần: ${amount}).`,
          };
        }

        entitlementId = ent.id;
        remainingCredits = remaining - amount;

        await supabase
          .from('organization_entitlements')
          .update({ ai_credits_used: (ent.ai_credits_used || 0) + amount })
          .eq('id', ent.id);
      } else {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', payer.id)
          .maybeSingle();

        if (profErr || !prof || (prof.credits ?? 0) < amount) {
          return {
            success: false,
            reservationId,
            payerType: 'PERSONAL',
            payerId: payer.id,
            amount,
            error: `Số dư AI Credits cá nhân không đủ (còn: ${prof?.credits ?? 0}, cần: ${amount}).`,
          };
        }

        remainingCredits = (prof.credits ?? 0) - amount;

        await supabase
          .from('profiles')
          .update({ credits: remainingCredits, updated_at: new Date().toISOString() })
          .eq('id', payer.id);
      }

      // 3. Ghi sổ ai_credit_reservations
      const deadline = new Date(Date.now() + (options?.timeoutMinutes ?? 3) * 60 * 1000).toISOString();
      await supabase.from('ai_credit_reservations').insert({
        request_id: reservationId,
        payer_type: payer.type,
        payer_id: payer.id,
        entitlement_id: entitlementId,
        amount,
        status: 'RESERVED',
        task_type: taskType,
        feature: taskType,
        idempotent_hash: options?.idempotentHash ?? reservationId,
        campaign_id: options?.campaignId ?? null,
        submission_id: options?.submissionId ?? null,
        item_id: options?.itemId ?? null,
        remaining_credits: remainingCredits,
        execution_deadline_at: deadline,
      });

      return {
        success: true,
        reservationId,
        isIdempotentReplay: false,
        payerType: payer.type,
        payerId: payer.id,
        amount,
        remainingCredits,
      };
    } catch (err: any) {
      return {
        success: false,
        reservationId,
        payerType: payer.type,
        payerId: payer.id,
        amount,
        error: err.message || 'Lỗi xử lý giữ chỗ credits.',
      };
    }
  }

  private static async fallbackSettle(
    supabase: SupabaseClient,
    reservationId: string,
    actualCredits?: number,
    artifactId?: string | null
  ): Promise<CreditSettleResult> {
    try {
      const { data: res } = await supabase
        .from('ai_credit_reservations')
        .select('*')
        .eq('request_id', reservationId)
        .maybeSingle();

      if (!res) {
        return {
          success: false,
          status: 'SETTLED',
          reservationId,
          error: `Không tìm thấy yêu cầu giữ credits: ${reservationId}`,
        };
      }

      if (res.status === 'SETTLED') {
        return {
          success: true,
          status: 'SETTLED',
          reservationId,
          alreadySettled: true,
          settledAmount: res.amount,
          remainingCredits: res.remaining_credits,
        };
      }

      if (res.status === 'RELEASED') {
        return {
          success: false,
          status: 'RELEASED',
          reservationId,
          error: 'Không thể quyết toán yêu cầu đã bị hoàn trả (RELEASED).',
        };
      }

      // Xử lý hoàn tiền phần chênh lệch nếu actualCredits < reserved amount
      let settledAmount = res.amount;
      let finalRemaining = res.remaining_credits;
      if (actualCredits !== undefined && actualCredits < res.amount) {
        const diff = res.amount - actualCredits;
        settledAmount = actualCredits;

        if (res.payer_type === 'ORG') {
          const entId = res.entitlement_id;
          if (entId) {
            const { data: ent } = await supabase
              .from('organization_entitlements')
              .select('ai_credits_used')
              .eq('id', entId)
              .maybeSingle();
            if (ent) {
              await supabase
                .from('organization_entitlements')
                .update({ ai_credits_used: Math.max(0, (ent.ai_credits_used || 0) - diff) })
                .eq('id', entId);
            }
          }
        } else {
          const { data: prof } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', res.payer_id)
            .maybeSingle();
          if (prof) {
            finalRemaining = (prof.credits || 0) + diff;
            await supabase
              .from('profiles')
              .update({ credits: finalRemaining })
              .eq('id', res.payer_id);
          }
        }
      }

      await supabase
        .from('ai_credit_reservations')
        .update({
          status: 'SETTLED',
          artifact_id: artifactId || res.artifact_id,
          remaining_credits: finalRemaining,
          updated_at: new Date().toISOString(),
        })
        .eq('request_id', reservationId);

      return {
        success: true,
        status: 'SETTLED',
        reservationId,
        settledAmount,
        remainingCredits: finalRemaining,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'SETTLED',
        reservationId,
        error: err.message,
      };
    }
  }

  private static async fallbackRelease(
    supabase: SupabaseClient,
    reservationId: string,
    reason: string
  ): Promise<CreditSettleResult> {
    try {
      const { data: res } = await supabase
        .from('ai_credit_reservations')
        .select('*')
        .eq('request_id', reservationId)
        .maybeSingle();

      if (!res) {
        return {
          success: false,
          status: 'RELEASED',
          reservationId,
          error: `Không tìm thấy yêu cầu giữ credits: ${reservationId}`,
        };
      }

      if (res.status === 'RELEASED') {
        return {
          success: true,
          status: 'RELEASED',
          reservationId,
          alreadyReleased: true,
          refundedAmount: res.amount,
        };
      }

      if (res.status === 'SETTLED') {
        return {
          success: false,
          status: 'SETTLED',
          reservationId,
          error: 'Không thể hoàn trả yêu cầu đã quyết toán thành công (SETTLED).',
        };
      }

      // Hoàn trả vào đúng nguồn gốc ban đầu
      if (res.payer_type === 'ORG') {
        if (res.entitlement_id) {
          const { data: ent } = await supabase
            .from('organization_entitlements')
            .select('ai_credits_used')
            .eq('id', res.entitlement_id)
            .maybeSingle();
          if (ent) {
            await supabase
              .from('organization_entitlements')
              .update({ ai_credits_used: Math.max(0, (ent.ai_credits_used || 0) - res.amount) })
              .eq('id', res.entitlement_id);
          }
        } else {
          const { data: ent } = await supabase
            .from('organization_entitlements')
            .select('id, ai_credits_used')
            .eq('organization_id', res.payer_id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (ent) {
            await supabase
              .from('organization_entitlements')
              .update({ ai_credits_used: Math.max(0, (ent.ai_credits_used || 0) - res.amount) })
              .eq('id', ent.id);
          }
        }
      } else {
        const { data: prof } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', res.payer_id)
          .maybeSingle();
        if (prof) {
          await supabase
            .from('profiles')
            .update({ credits: (prof.credits || 0) + res.amount, updated_at: new Date().toISOString() })
            .eq('id', res.payer_id);
        }
      }

      await supabase
        .from('ai_credit_reservations')
        .update({
          status: 'RELEASED',
          release_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('request_id', reservationId);

      return {
        success: true,
        status: 'RELEASED',
        reservationId,
        refundedAmount: res.amount,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'RELEASED',
        reservationId,
        error: err.message,
      };
    }
  }

  private static async fallbackReconcile(
    supabase: SupabaseClient,
    timeoutMinutes: number
  ): Promise<ReconciliationReport> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - timeoutMinutes * 60 * 1000).toISOString();
    let autoSettledCount = 0;
    let autoReleasedCount = 0;
    let flaggedManualReviewCount = 0;

    try {
      const { data: records } = await supabase
        .from('ai_credit_reservations')
        .select('*')
        .eq('status', 'RESERVED')
        .lt('created_at', cutoff);

      if (!records || records.length === 0) {
        return {
          success: true,
          autoSettledCount: 0,
          autoReleasedCount: 0,
          flaggedManualReviewCount: 0,
          reconciledAt: now.toISOString(),
        };
      }

      for (const r of records) {
        // Kiểm tra grace window: nếu deadline vẫn còn hiệu lực (in-flight), bỏ qua
        if (r.execution_deadline_at && new Date(r.execution_deadline_at) > now) {
          continue;
        }

        const taskType = r.task_type || r.feature;
        let hasArtifact = false;
        let artifactId: string | null = null;
        let isUnsupported = false;

        if (['RUBRIC_GRADING', 'GRADING', 'RUBRIC_EVAL'].includes(taskType)) {
          const { data: evalRec } = await supabase
            .from('ai_evaluations')
            .select('id')
            .eq('request_id', r.request_id)
            .maybeSingle();
          if (evalRec) {
            hasArtifact = true;
            artifactId = evalRec.id;
          } else if (r.submission_id && r.item_id) {
            const { data: fallbackEval } = await supabase
              .from('ai_evaluations')
              .select('id')
              .eq('submission_id', r.submission_id)
              .eq('item_id', r.item_id)
              .gte('created_at', r.created_at)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (fallbackEval) {
              hasArtifact = true;
              artifactId = fallbackEval.id;
            }
          }
        } else if (taskType === 'COMPETENCY_ANALYSIS') {
          const { data: comp } = await supabase
            .from('competency_analyses')
            .select('id')
            .or(`request_id.eq.${r.request_id},submission_id.eq.${r.submission_id}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (comp) {
            hasArtifact = true;
            artifactId = comp.id;
          }
        } else if (taskType === 'AUTHORING_ASSIST') {
          const { data: usage } = await supabase
            .from('ai_usage_events')
            .select('id')
            .eq('request_id', r.request_id)
            .eq('status', 'SUCCESS')
            .maybeSingle();
          if (usage) {
            hasArtifact = true;
            artifactId = usage.id;
          }
        } else if (taskType === 'ORG_INSIGHT') {
          const { data: usage } = await supabase
            .from('ai_usage_events')
            .select('id')
            .eq('request_id', r.request_id)
            .eq('status', 'SUCCESS')
            .maybeSingle();
          if (usage) {
            hasArtifact = true;
            artifactId = usage.id;
          }
        } else if (taskType === 'EXPLAIN_QUESTION') {
          const { data: usage } = await supabase
            .from('ai_usage_events')
            .select('id')
            .eq('request_id', r.request_id)
            .eq('status', 'SUCCESS')
            .maybeSingle();
          if (usage) {
            hasArtifact = true;
            artifactId = usage.id;
          }
        } else {
          isUnsupported = true;
        }

        if (isUnsupported) {
          await supabase
            .from('ai_credit_reservations')
            .update({
              status: 'FLAGGED_MANUAL_REVIEW',
              release_reason: 'UNSUPPORTED_ARTIFACT_TYPE_PREVENT_FALSE_REFUND',
              updated_at: new Date().toISOString(),
            })
            .eq('request_id', r.request_id);
          flaggedManualReviewCount++;
        } else if (hasArtifact) {
          await this.settle(supabase, r.request_id, r.amount, artifactId || undefined);
          autoSettledCount++;
        } else {
          await this.release(supabase, r.request_id, 'RECONCILIATION_TIMEOUT_NO_ARTIFACT');
          autoReleasedCount++;
        }
      }

      return {
        success: true,
        autoSettledCount,
        autoReleasedCount,
        flaggedManualReviewCount,
        reconciledAt: now.toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        autoSettledCount,
        autoReleasedCount,
        flaggedManualReviewCount,
        reconciledAt: now.toISOString(),
        error: err.message,
      };
    }
  }
}
