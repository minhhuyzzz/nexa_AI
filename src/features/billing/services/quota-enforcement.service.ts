import type { SupabaseClient } from '@supabase/supabase-js';



export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';



export interface QuotaCheckResult {

  allowed: boolean;

  reason?: string;

  currentUsage: number;

  maxLimit: number;

  planTier: PlanTier;

}



export interface AICreditsCheckResult {

  allowed: boolean;

  remainingCredits: number;

  requiredCredits: number;

  reason?: string;

  planTier: PlanTier;

}



export interface OrgEntitlementSummary {
  contractNumber: string;
  planName?: string;
  status?: 'ACTIVE' | 'EXPIRING' | 'PROVISIONING' | 'EXPIRED';
  isProvisioning?: boolean;
  daysRemaining?: number;
  maxSeats: number;
  maxAssessments: number;
  aiCreditsGranted: number;
  aiCreditsUsed: number;
  remainingCredits: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}



/**

 * Service quản lý và cưỡng chế hạn mức tập trung cho Personal Workspace & Organization Workspace

 * Đảm bảo gói FREE có giá trị sử dụng thực tế và chặn vượt hạn mức ở cấp máy chủ.

 */

export class QuotaEnforcementService {

  // Cấu hình hạn mức chuẩn hóa theo đặc tả sản phẩm

  public static readonly TIER_LIMITS = {

    FREE: {

      maxAssessments: 15,

      maxClasses: 10,

      maxClassMembers: 100,

      maxLiveRooms: 3,

      maxRoomParticipants: 50,

      baseCredits: 10,

    },

    PRO: {

      maxAssessments: 999999,

      maxClasses: 999999,

      maxClassMembers: 1000,

      maxLiveRooms: 20,

      maxRoomParticipants: 500,

      baseCredits: 1000,

    },

    ENTERPRISE: {

      maxAssessments: 999999,

      maxClasses: 999999,

      maxClassMembers: 100000,

      maxLiveRooms: 100,

      maxRoomParticipants: 5000,

      baseCredits: 10000,

    },

  } as const;



  /**

   * Lấy hạng gói dịch vụ của người dùng

   */

  static async getUserPlanTier(supabase: SupabaseClient, userId: string): Promise<PlanTier> {

    const { data: profile } = await supabase

      .from('profiles')

      .select('plan_tier')

      .eq('id', userId)

      .maybeSingle();



    const rawTier = profile?.plan_tier?.toUpperCase() || 'FREE';

    if (rawTier === 'ENTERPRISE' || rawTier.startsWith('ORG_')) {

      return 'ENTERPRISE';

    }

    if (rawTier === 'PRO' || rawTier.endsWith('_PRO') || rawTier.endsWith('_PLUS')) {

      return 'PRO';

    }

    return 'FREE';

  }



  /**

   * Lấy thông tin chi tiết gói dịch vụ, hạn mức và ngày hết hạn

   */

  static async getUserPlanDetails(

    supabase: SupabaseClient,

    userId: string

  ): Promise<{

    planCode: string;

    planName: string;

    tier: PlanTier;

    credits: number;

    billingCycle: string;

    expiresAt: string | null;

  }> {

    const { data: profile } = await supabase

      .from('profiles')

      .select('plan_tier, credits')

      .eq('id', userId)

      .maybeSingle();



    const rawCode = profile?.plan_tier || 'LEARNER_FREE';

    const credits = profile?.credits ?? 0;



    const { data: plan } = await supabase

      .from('service_plans')

      .select('name, billing_cycle')

      .eq('code', rawCode)

      .maybeSingle();



    const { data: latestTx } = await supabase

      .from('payment_transactions')

      .select('verified_at, created_at')

      .eq('user_id', userId)

      .eq('status', 'SUCCESS')

      .order('verified_at', { ascending: false })

      .limit(1)

      .maybeSingle();



    let expiresAt: string | null = null;

    if (latestTx?.verified_at) {

      const verifiedDate = new Date(latestTx.verified_at);

      const days = plan?.billing_cycle === 'YEARLY' ? 365 : 30;

      verifiedDate.setDate(verifiedDate.getDate() + days);

      expiresAt = verifiedDate.toISOString();

    }



    const tier = await this.getUserPlanTier(supabase, userId);



    return {

      planCode: rawCode,

      planName: plan?.name || (tier === 'PRO' ? 'Gói Nâng Cao' : 'Gói Khởi Động'),

      tier,

      credits,

      billingCycle: plan?.billing_cycle || 'MONTHLY',

      expiresAt,

    };

  }



  /**

   * Kiểm tra hạn mức tạo Đề thi cá nhân / tổ chức

   */

  static async checkAssessmentCreationQuota(

    supabase: SupabaseClient,

    userId: string,

    organizationId?: string | null

  ): Promise<QuotaCheckResult> {

    const planTier = await this.getUserPlanTier(supabase, userId);



    // Nếu thuộc tổ chức B2B

    if (organizationId) {

      const { data: org } = await supabase

        .from('organizations')

        .select('quota_assessments, is_active')

        .eq('id', organizationId)

        .single();



      if (!org?.is_active) {

        return {

          allowed: false,

          reason: 'Tổ chức đang bị tạm ngưng hoạt động.',

          currentUsage: 0,

          maxLimit: 0,

          planTier: 'ENTERPRISE',

        };

      }



      const { count } = await supabase

        .from('assessments')

        .select('id', { count: 'exact', head: true })

        .eq('organization_id', organizationId);



      const currentUsage = count || 0;

      const maxLimit = org.quota_assessments || 999999;

      return {
        // Tổ chức doanh nghiệp B2B: Không giới hạn số lượng đề khảo thí
        allowed: true,
        reason: undefined,
        currentUsage,
        maxLimit,
        planTier: 'ENTERPRISE',
      };

    }



    // Không gian Cá nhân (Personal Workspace)

    const maxLimit = this.TIER_LIMITS[planTier].maxAssessments;



    const { count } = await supabase

      .from('assessments')

      .select('id', { count: 'exact', head: true })

      .or(`owner_user_id.eq.${userId},created_by.eq.${userId}`);



    const currentUsage = count || 0;



    return {

      allowed: currentUsage < maxLimit,

      reason:

        currentUsage >= maxLimit

          ? `Bạn đã sử dụng hết hạn mức ${maxLimit} đề thi của gói ${planTier}. Vui lòng nâng cấp lên gói Pro để tạo thêm.`

          : undefined,

      currentUsage,

      maxLimit,

      planTier,

    };

  }



  /**

   * Kiểm tra hạn mức tạo Nhóm học tập / Lớp học

   */

  static async checkClassCreationQuota(

    supabase: SupabaseClient,

    userId: string,

    organizationId?: string | null

  ): Promise<QuotaCheckResult> {

    const planTier = await this.getUserPlanTier(supabase, userId);



    if (organizationId) {

      const maxLimit = this.TIER_LIMITS.ENTERPRISE.maxClasses;

      const { count } = await supabase

        .from('evaluator_classes')

        .select('id', { count: 'exact', head: true })

        .eq('organization_id', organizationId);



      const currentUsage = count || 0;

      return {

        allowed: currentUsage < maxLimit,

        reason:

          currentUsage >= maxLimit

            ? `Tổ chức đã đạt giới hạn tối đa ${maxLimit} nhóm/lớp học.`

            : undefined,

        currentUsage,

        maxLimit,

        planTier: 'ENTERPRISE',

      };

    }



    const maxLimit = this.TIER_LIMITS[planTier].maxClasses;



    const { count } = await supabase

      .from('evaluator_classes')

      .select('id', { count: 'exact', head: true })

      .or(`owner_user_id.eq.${userId},evaluator_id.eq.${userId}`);



    const currentUsage = count || 0;



    return {

      allowed: currentUsage < maxLimit,

      reason:

        currentUsage >= maxLimit

          ? `Gói ${planTier} cho phép tối đa ${maxLimit} nhóm học tập cá nhân. Vui lòng nâng cấp lên Pro để quản lý nhiều nhóm hơn.`

          : undefined,

      currentUsage,

      maxLimit,

      planTier,

    };

  }



  /**

   * Kiểm tra hạn mức mở Phòng thi Live trực tiếp

   */

  static async checkLiveRoomQuota(

    supabase: SupabaseClient,

    userId: string,

    organizationId?: string | null

  ): Promise<QuotaCheckResult> {

    const planTier = await this.getUserPlanTier(supabase, userId);

    const maxLimit = organizationId

      ? this.TIER_LIMITS.ENTERPRISE.maxLiveRooms

      : this.TIER_LIMITS[planTier].maxLiveRooms;



    let query = supabase

      .from('exam_rooms')

      .select('id', { count: 'exact', head: true })

      .eq('is_active', true);



    if (organizationId) {

      query = query.eq('organization_id', organizationId);

    } else {

      query = query.or(`owner_user_id.eq.${userId},created_by.eq.${userId}`);

    }



    const { count } = await query;

    const currentUsage = count || 0;



    return {

      allowed: currentUsage < maxLimit,

      reason:

        currentUsage >= maxLimit

          ? `Bạn đang có ${currentUsage} phòng thi Live đang hoạt động (Hạn mức tối đa: ${maxLimit}). Vui lòng kết thúc phòng cũ trước khi mở phòng mới.`

          : undefined,

      currentUsage,

      maxLimit,

      planTier: organizationId ? 'ENTERPRISE' : planTier,

    };

  }



  /**

   * Kiểm tra và cưỡng chế số dư AI Credits trước khi kích hoạt tác vụ AI

   */

  static async checkAICreditsQuota(

    supabase: SupabaseClient,

    userId: string,

    requiredCredits: number = 1

  ): Promise<AICreditsCheckResult> {

    const { data: profile } = await supabase

      .from('profiles')

      .select('credits, plan_tier')

      .eq('id', userId)

      .single();



    const currentCredits = profile?.credits ?? 0;

    const planTier = (profile?.plan_tier?.toUpperCase() as PlanTier) || 'FREE';



    return {

      allowed: currentCredits >= requiredCredits,

      remainingCredits: currentCredits,

      requiredCredits,

      reason:

        currentCredits < requiredCredits

          ? `Số dư AI Credits hiện tại (${currentCredits}) không đủ cho tác vụ này (Cần: ${requiredCredits}). Vui lòng nâng cấp hoặc nạp thêm credits.`

          : undefined,

      planTier,

    };

  }



  /**

   * Lấy thông tin hợp đồng và hạn mức cấp cho tổ chức

   */

  static async getOrgEntitlements(
    supabase: SupabaseClient,
    organizationId: string
  ): Promise<OrgEntitlementSummary> {
    const { data: entitlement } = await supabase
      .from('organization_entitlements')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();

    if (entitlement) {
      const expiresAt = entitlement.expires_at ? new Date(entitlement.expires_at) : now;
      const msDiff = expiresAt.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
      const isExpired = expiresAt < now;
      const isActive = Boolean(entitlement.is_active) && !isExpired;
      const granted = entitlement.ai_credits_granted ?? 0;
      const used = entitlement.ai_credits_used ?? 0;

      let status: 'ACTIVE' | 'EXPIRING' | 'PROVISIONING' | 'EXPIRED' = 'ACTIVE';
      if (entitlement.status === 'PROVISIONING' || (!entitlement.is_active && !isExpired)) {
        status = 'PROVISIONING';
      } else if (isExpired) {
        status = 'EXPIRED';
      } else if (daysRemaining <= 30) {
        status = 'EXPIRING';
      }

      return {
        contractNumber: entitlement.contract_number || 'NEXA-B2B-STD',
        planName: entitlement.plan_name || 'Gói Business',
        status,
        isProvisioning: status === 'PROVISIONING',
        daysRemaining,
        maxSeats: entitlement.max_seats ?? 250,
        maxAssessments: entitlement.max_assessments ?? 100,
        aiCreditsGranted: granted,
        aiCreditsUsed: used,
        remainingCredits: isActive ? Math.max(0, granted - used) : 0,
        startsAt: entitlement.starts_at || now.toISOString(),
        expiresAt: entitlement.expires_at || now.toISOString(),
        isActive: status !== 'EXPIRED' && status !== 'PROVISIONING',
      };
    }

    // SEC-07: Tổ chức chưa có entitlement chính thức thì đọc max_members từ organizations hoặc fallback an toàn
    let fallbackSeats = 50;
    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('max_members')
        .eq('id', organizationId)
        .maybeSingle();
      if (orgData?.max_members) {
        fallbackSeats = orgData.max_members;
      }
    } catch {}

    const nowIso = now.toISOString();
    return {
      contractNumber: 'PROVISIONING',
      planName: 'NEXA Business',
      status: 'PROVISIONING',
      isProvisioning: true,
      daysRemaining: 0,
      maxSeats: fallbackSeats,
      maxAssessments: 10,
      aiCreditsGranted: 0,
      aiCreditsUsed: 0,
      remainingCredits: 0,
      startsAt: nowIso,
      expiresAt: nowIso,
      isActive: false,
    };
  }

  static async checkOrgAICreditsQuota(

    supabase: SupabaseClient,

    organizationId: string,

    requiredCredits: number = 1

  ): Promise<{

    allowed: boolean;

    remainingCredits: number;

    requiredCredits: number;

    reason?: string;

  }> {

    const entitlements = await this.getOrgEntitlements(supabase, organizationId);



    if (!entitlements.isActive) {

      return {

        allowed: false,

        remainingCredits: 0,

        requiredCredits,

        reason: 'Hợp đồng tổ chức đang bị tạm ngưng hoặc đã hết hạn.',

      };

    }



    const allowed = entitlements.remainingCredits >= requiredCredits;

    return {

      allowed,

      remainingCredits: entitlements.remainingCredits,

      requiredCredits,

      reason: allowed

        ? undefined

        : `Hạn mức AI Credits của tổ chức không đủ (Còn: ${entitlements.remainingCredits}, Cần: ${requiredCredits}). Vui lòng liên hệ quản trị viên để mở rộng hạn mức hợp đồng.`,

    };

  }


  /**
   * Xác định chủ thể chi trả AI Credits cho một bài nộp (AI-01)
   * Phân biệt giữa Tổ chức (Campaign/Lớp học) và Cá nhân (Personal)
   */
  static async resolveSubmissionPayer(
    supabase: SupabaseClient,
    submissionId: string
  ): Promise<{ isOrg: boolean; organizationId: string | null; learnerId: string | null }> {
    const { data: sub } = await supabase
      .from('assessment_submissions')
      .select('id, user_id, assessment_id, class_assignment_id')
      .eq('id', submissionId)
      .maybeSingle();

    if (!sub) {
      return { isOrg: false, organizationId: null, learnerId: null };
    }

    // 1. Kiểm tra qua bài tập lớp học (class_assignments)
    if (sub.class_assignment_id) {
      const { data: assignment } = await supabase
        .from('class_assignments')
        .select('class_id, evaluator_classes(organization_id)')
        .eq('id', sub.class_assignment_id)
        .maybeSingle();

      const ec = assignment?.evaluator_classes as unknown as { organization_id?: string | null } | null;
      if (ec?.organization_id) {
        return { isOrg: true, organizationId: ec.organization_id, learnerId: sub.user_id };
      }
    }

    // 2. Kiểm tra qua đề thi (assessments)
    if (sub.assessment_id) {
      const { data: asm } = await supabase
        .from('assessments')
        .select('organization_id')
        .eq('id', sub.assessment_id)
        .maybeSingle();

      if (asm?.organization_id) {
        return { isOrg: true, organizationId: asm.organization_id, learnerId: sub.user_id };
      }
    }

    return { isOrg: false, organizationId: null, learnerId: sub.user_id };
  }

  /**
   * Trừ AI credits nguyên tử cho tổ chức (AI-01, P0-02, P0-03)
   * Fail-closed: Tuyệt đối không fallback sang read-modify-write từ client.
   */
  static async deductOrgAICredits(
    supabase: SupabaseClient,
    organizationId: string,
    amount: number = 1
  ): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
    if (amount <= 0) {
      return {
        success: false,
        remainingCredits: 0,
        error: 'Số lượng AI credits trừ phải lớn hơn 0.',
      };
    }

    try {
      if (typeof supabase.rpc === 'function') {
        const { data: rpcRemaining, error: rpcError } = await supabase.rpc(
          'deduct_organization_ai_credits',
          {
            p_org_id: organizationId,
            p_amount: amount,
          }
        );

        if (!rpcError && typeof rpcRemaining === 'number') {
          return { success: true, remainingCredits: rpcRemaining };
        }

        // FAIL-CLOSED: Báo lỗi trực tiếp từ RPC, không chạy fallback read-modify-write
        return {
          success: false,
          remainingCredits: 0,
          error: rpcError?.message || 'Không thể trừ AI credits của tổ chức.',
        };
      }
    } catch (err) {
      return {
        success: false,
        remainingCredits: 0,
        error: err instanceof Error ? err.message : 'Lỗi hệ thống khi trừ AI credits của tổ chức.',
      };
    }

    return {
      success: false,
      remainingCredits: 0,
      error: 'Dịch vụ trừ credits RPC không khả dụng (fail-closed).',
    };
  }

  /**
   * Trừ AI credits nguyên tử cho cá nhân (AI-01, P0-02, P0-03)
   * Fail-closed: Tuyệt đối không fallback sang read-modify-write từ client.
   */
  static async deductPersonalAICredits(
    supabase: SupabaseClient,
    userId: string,
    amount: number = 1
  ): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
    if (amount <= 0) {
      return {
        success: false,
        remainingCredits: 0,
        error: 'Số lượng AI credits trừ phải lớn hơn 0.',
      };
    }

    try {
      if (typeof supabase.rpc === 'function') {
        const { data: rpcRemaining, error: rpcError } = await supabase.rpc('deduct_ai_credits', {
          p_user_id: userId,
          p_amount: amount,
        });

        if (!rpcError && typeof rpcRemaining === 'number') {
          return { success: true, remainingCredits: rpcRemaining };
        }

        // FAIL-CLOSED
        return {
          success: false,
          remainingCredits: 0,
          error: rpcError?.message || 'Không thể trừ AI credits cá nhân.',
        };
      }
    } catch (err) {
      return {
        success: false,
        remainingCredits: 0,
        error: err instanceof Error ? err.message : 'Lỗi hệ thống khi trừ AI credits cá nhân.',
      };
    }

    return {
      success: false,
      remainingCredits: 0,
      error: 'Dịch vụ trừ credits RPC không khả dụng (fail-closed).',
    };
  }

  /**
   * Khóa/giữ trước credits (Reservation) trước khi gửi prompt sang AI Gateway (MOD-02)
   * Đảm bảo fail-closed và chặn race condition tiêu lạm credits.
   */
  static async reserveCredits(
    supabase: SupabaseClient,
    payer: { isOrg: boolean; organizationId?: string | null; userId: string },
    amount: number = 1,
    requestId?: string
  ): Promise<CreditReservationResult> {
    if (amount <= 0) {
      return {
        success: false,
        payerType: payer.isOrg ? 'ORG' : 'PERSONAL',
        payerId: payer.isOrg ? (payer.organizationId || '') : payer.userId,
        amount,
        error: 'Số lượng credits giữ trước phải lớn hơn 0.',
      };
    }

    const reservationId = requestId || `res_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // 1. Idempotency Check: Verify if this requestId was already reserved or processed
    try {
      if (typeof supabase.from === 'function') {
        const { data: existing } = await supabase
          .from('ai_credit_reservations')
          .select('request_id, payer_type, payer_id, amount, status, remaining_credits')
          .eq('request_id', reservationId)
          .maybeSingle();

        if (existing && existing.status) {
          if (existing.status === 'RESERVED') {
            return {
              success: true,
              reservationId: existing.request_id || reservationId,
              payerType: (existing.payer_type || (payer.isOrg ? 'ORG' : 'PERSONAL')) as 'ORG' | 'PERSONAL',
              payerId: existing.payer_id || (payer.isOrg ? (payer.organizationId || '') : payer.userId),
              amount: existing.amount || amount,
              remainingCredits: existing.remaining_credits,
            };
          } else {
            return {
              success: false,
              payerType: (existing.payer_type || (payer.isOrg ? 'ORG' : 'PERSONAL')) as 'ORG' | 'PERSONAL',
              payerId: existing.payer_id || (payer.isOrg ? (payer.organizationId || '') : payer.userId),
              amount: existing.amount || amount,
              error: `Yêu cầu giữ credits này đã được xử lý (trạng thái: ${existing.status}).`,
            };
          }
        }
      }
    } catch {
      // Continue if table is unconfigured or mocked differently
    }

    // 2. Perform atomic credit deduction
    let deductRes: { success: boolean; remainingCredits: number; error?: string };
    const payerType = payer.isOrg && payer.organizationId ? 'ORG' : 'PERSONAL';
    const payerId = payer.isOrg && payer.organizationId ? payer.organizationId : payer.userId;

    if (payerType === 'ORG') {
      deductRes = await this.deductOrgAICredits(supabase, payerId, amount);
      if (!deductRes.success) {
        return {
          success: false,
          payerType: 'ORG',
          payerId,
          amount,
          error: deductRes.error || 'Hạn mức AI Credits của tổ chức không đủ.',
        };
      }
    } else {
      deductRes = await this.deductPersonalAICredits(supabase, payerId, amount);
      if (!deductRes.success) {
        return {
          success: false,
          payerType: 'PERSONAL',
          payerId,
          amount,
          error: deductRes.error || 'Số dư AI Credits của bạn không đủ.',
        };
      }
    }

    // 3. Persist reservation to ai_credit_reservations table
    try {
      if (typeof supabase.from === 'function') {
        const tableRef = supabase.from('ai_credit_reservations');
        if (tableRef && typeof tableRef.insert === 'function') {
          await tableRef.insert({
            request_id: reservationId,
            payer_type: payerType,
            payer_id: payerId,
            amount,
            status: 'RESERVED',
            remaining_credits: deductRes.remainingCredits,
          });
        }
      }
    } catch (insertErr) {
      console.warn('Could not record ai_credit_reservations ledger:', insertErr);
    }

    return {
      success: true,
      reservationId,
      payerType,
      payerId,
      amount,
      remainingCredits: deductRes.remainingCredits,
    };
  }

  /**
   * Quyết toán hoặc hoàn trả credits (Settle / Release) sau khi có kết quả từ AI Gateway (MOD-02)
   */
  static async settleOrReleaseCredits(
    supabase: SupabaseClient,
    reservation: CreditReservationResult,
    action: 'SETTLE' | 'RELEASE',
    actualAmount?: number
  ): Promise<CreditSettleResult> {
    if (!reservation.success) {
      return {
        success: false,
        action: 'RELEASED',
        settledAmount: 0,
        refundedAmount: 0,
        error: 'Không thể quyết toán lượt giữ credits không thành công.',
      };
    }

    // 1. Check reservation status in DB to ensure idempotency and prevent double-refund
    let currentRecord: { status: string; amount: number; remaining_credits?: number } | null = null;
    try {
      if (typeof supabase.from === 'function' && reservation.reservationId) {
        const { data } = await supabase
          .from('ai_credit_reservations')
          .select('status, amount, remaining_credits')
          .eq('request_id', reservation.reservationId)
          .maybeSingle();
        currentRecord = data;
      }
    } catch {}

    if (currentRecord && currentRecord.status !== 'RESERVED') {
      // Already settled or released! Do NOT refund or settle again (idempotent / chống double refund)
      return {
        success: true,
        action: currentRecord.status as 'SETTLED' | 'RELEASED',
        settledAmount: currentRecord.status === 'SETTLED' ? currentRecord.amount : 0,
        refundedAmount: currentRecord.status === 'RELEASED' ? currentRecord.amount : 0,
        remainingCredits: currentRecord.remaining_credits,
      };
    }

    if (action === 'RELEASE') {
      let refundRes: { success: boolean; remainingCredits?: number; error?: string };
      if (reservation.payerType === 'ORG') {
        refundRes = await this.refundOrgAICredits(supabase, reservation.payerId, reservation.amount);
      } else {
        refundRes = await this.refundPersonalAICredits(supabase, reservation.payerId, reservation.amount);
      }

      if (refundRes.success && reservation.reservationId) {
        try {
          if (typeof supabase.from === 'function') {
            await supabase
              .from('ai_credit_reservations')
              .update({
                status: 'RELEASED',
                remaining_credits: refundRes.remainingCredits,
                updated_at: new Date().toISOString(),
              })
              .eq('request_id', reservation.reservationId);
          }
        } catch {}
      }

      return {
        success: refundRes.success,
        action: 'RELEASED',
        settledAmount: 0,
        refundedAmount: reservation.amount,
        remainingCredits: refundRes.remainingCredits,
        error: refundRes.error,
      };
    }

    const charged = actualAmount !== undefined ? Math.max(0, actualAmount) : reservation.amount;
    const refundDiff = Math.max(0, reservation.amount - charged);
    let finalRemainingCredits = reservation.remainingCredits;

    if (refundDiff > 0) {
      if (reservation.payerType === 'ORG') {
        const refundRes = await this.refundOrgAICredits(supabase, reservation.payerId, refundDiff);
        if (refundRes.remainingCredits !== undefined) {
          finalRemainingCredits = refundRes.remainingCredits;
        }
      } else {
        const refundRes = await this.refundPersonalAICredits(supabase, reservation.payerId, refundDiff);
        if (refundRes.remainingCredits !== undefined) {
          finalRemainingCredits = refundRes.remainingCredits;
        }
      }
    }

    if (reservation.reservationId) {
      try {
        if (typeof supabase.from === 'function') {
          await supabase
            .from('ai_credit_reservations')
            .update({
              status: 'SETTLED',
              remaining_credits: finalRemainingCredits,
              updated_at: new Date().toISOString(),
            })
            .eq('request_id', reservation.reservationId);
        }
      } catch {}
    }

    return {
      success: true,
      action: 'SETTLED',
      settledAmount: charged,
      refundedAmount: refundDiff,
      remainingCredits: finalRemainingCredits,
    };
  }

  /**
   * Hoàn trả credits cho tổ chức khi tác vụ AI thất bại (P0-02, P0-03)
   * Fail-closed: Bắt buộc dùng RPC atomic, không dùng read-modify-write client-side.
   */
  static async refundOrgAICredits(
    supabase: SupabaseClient,
    organizationId: string,
    amount: number = 1
  ): Promise<{ success: boolean; remainingCredits?: number; error?: string }> {
    if (amount <= 0) {
      return { success: false, error: 'Số lượng credits hoàn phải lớn hơn 0.' };
    }

    try {
      if (typeof supabase?.rpc === 'function') {
        const { data: rpcRemaining, error: rpcError } = await supabase.rpc(
          'refund_organization_ai_credits',
          {
            p_org_id: organizationId,
            p_amount: amount,
          }
        );

        if (!rpcError && typeof rpcRemaining === 'number') {
          return { success: true, remainingCredits: rpcRemaining };
        }

        return {
          success: false,
          error: rpcError?.message || 'Không thể hoàn credits tổ chức qua RPC.',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi hệ thống khi hoàn credit tổ chức',
      };
    }

    return {
      success: false,
      error: 'Dịch vụ hoàn credits RPC không khả dụng (fail-closed).',
    };
  }

  /**
   * Hoàn trả credits cho cá nhân khi tác vụ AI thất bại (P0-02, P0-03)
   * Fail-closed: Bắt buộc dùng RPC atomic, không dùng read-modify-write client-side.
   */
  static async refundPersonalAICredits(
    supabase: SupabaseClient,
    userId: string,
    amount: number = 1
  ): Promise<{ success: boolean; remainingCredits?: number; error?: string }> {
    if (amount <= 0) {
      return { success: false, error: 'Số lượng credits hoàn phải lớn hơn 0.' };
    }

    try {
      if (typeof supabase?.rpc === 'function') {
        const { data: rpcRemaining, error: rpcError } = await supabase.rpc('refund_ai_credits', {
          p_user_id: userId,
          p_amount: amount,
        });

        if (!rpcError && typeof rpcRemaining === 'number') {
          return { success: true, remainingCredits: rpcRemaining };
        }

        return {
          success: false,
          error: rpcError?.message || 'Không thể hoàn credits cá nhân qua RPC.',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi hệ thống khi hoàn credit cá nhân',
      };
    }

    return {
      success: false,
      error: 'Dịch vụ hoàn credits RPC không khả dụng (fail-closed).',
    };
  }
}

export interface CreditReservationResult {
  success: boolean;
  reservationId?: string;
  payerType: 'ORG' | 'PERSONAL';
  payerId: string;
  amount: number;
  remainingCredits?: number;
  error?: string;
}

export interface CreditSettleResult {
  success: boolean;
  action: 'SETTLED' | 'RELEASED';
  settledAmount: number;
  refundedAmount: number;
  remainingCredits?: number;
  error?: string;
}

