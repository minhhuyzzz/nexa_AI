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

      maxAssessments: 3,

      maxClasses: 1,

      maxClassMembers: 15,

      maxLiveRooms: 1,

      maxRoomParticipants: 15,

      baseCredits: 10,

    },

    PRO: {

      maxAssessments: 50,

      maxClasses: 10,

      maxClassMembers: 100,

      maxLiveRooms: 5,

      maxRoomParticipants: 100,

      baseCredits: 500,

    },

    ENTERPRISE: {

      maxAssessments: 9999,

      maxClasses: 500,

      maxClassMembers: 10000,

      maxLiveRooms: 50,

      maxRoomParticipants: 1000,

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

      const maxLimit = org.quota_assessments || 500;



      return {

        allowed: currentUsage < maxLimit,

        reason:

          currentUsage >= maxLimit

            ? `Tổ chức đã đạt giới hạn tối đa ${maxLimit} đề thi. Vui lòng liên hệ quản trị viên để mở rộng hạn mức.`

            : undefined,

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

    if (entitlement) {
      const now = new Date();
      const isExpired = entitlement.expires_at ? new Date(entitlement.expires_at) < now : false;
      const isActive = Boolean(entitlement.is_active) && !isExpired;
      const granted = entitlement.ai_credits_granted ?? 0;
      const used = entitlement.ai_credits_used ?? 0;
      return {
        contractNumber: entitlement.contract_number || 'NEXA-B2B-STD',
        maxSeats: entitlement.max_seats ?? 0,
        maxAssessments: entitlement.max_assessments ?? 0,
        aiCreditsGranted: granted,
        aiCreditsUsed: used,
        remainingCredits: isActive ? Math.max(0, granted - used) : 0,
        startsAt: entitlement.starts_at || now.toISOString(),
        expiresAt: entitlement.expires_at || now.toISOString(),
        isActive,
      };
    }

    // SEC-07: Tổ chức chưa có hợp đồng/entitlement chính thức thì không cấp quota ảo
    const nowIso = new Date().toISOString();
    return {
      contractNumber: 'CHƯA_KÍCH_HOẠT',
      maxSeats: 0,
      maxAssessments: 0,
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
   * Trừ AI credits nguyên tử cho tổ chức (AI-01)
   */
  static async deductOrgAICredits(
    supabase: SupabaseClient,
    organizationId: string,
    amount: number = 1
  ): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
    try {
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
    } catch {
      // Fallback
    }

    const { data: entitlement, error: fetchErr } = await supabase
      .from('organization_entitlements')
      .select('id, ai_credits_granted, ai_credits_used, is_active, expires_at')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !entitlement) {
      return {
        success: false,
        remainingCredits: 0,
        error: 'Tổ chức chưa kích hoạt hợp đồng hoặc hợp đồng đã hết hạn.',
      };
    }

    const isExpired = entitlement.expires_at ? new Date(entitlement.expires_at) < new Date() : false;
    if (isExpired) {
      return {
        success: false,
        remainingCredits: 0,
        error: 'Hợp đồng tổ chức đã hết hạn.',
      };
    }

    const granted = entitlement.ai_credits_granted ?? 0;
    const used = entitlement.ai_credits_used ?? 0;
    const remaining = granted - used;

    if (remaining < amount) {
      return {
        success: false,
        remainingCredits: remaining,
        error: `Hạn mức AI Credits của tổ chức không đủ (Còn: ${remaining}, Cần: ${amount}).`,
      };
    }

    const nextUsed = used + amount;
    const { error: updateErr } = await supabase
      .from('organization_entitlements')
      .update({ ai_credits_used: nextUsed })
      .eq('id', entitlement.id);

    if (updateErr) {
      return {
        success: false,
        remainingCredits: remaining,
        error: 'Không thể trừ AI credits của tổ chức: ' + updateErr.message,
      };
    }

    return {
      success: true,
      remainingCredits: granted - nextUsed,
    };
  }

  /**
   * Trừ AI credits nguyên tử cho cá nhân (AI-01)
   */
  static async deductPersonalAICredits(
    supabase: SupabaseClient,
    userId: string,
    amount: number = 1
  ): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
    try {
      const { data: rpcRemaining, error: rpcError } = await supabase.rpc('deduct_ai_credits', {
        p_user_id: userId,
        p_amount: amount,
      });

      if (!rpcError && typeof rpcRemaining === 'number') {
        return { success: true, remainingCredits: rpcRemaining };
      }
    } catch {
      // Fallback
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    const currentCredits = profile?.credits ?? 0;
    if (currentCredits < amount) {
      return {
        success: false,
        remainingCredits: currentCredits,
        error: `Số dư AI Credits không đủ (Còn: ${currentCredits}, Cần: ${amount}).`,
      };
    }

    const nextCredits = currentCredits - amount;
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ credits: nextCredits })
      .eq('id', userId);

    if (updateErr) {
      return {
        success: false,
        remainingCredits: currentCredits,
        error: 'Không thể trừ AI credits cá nhân: ' + updateErr.message,
      };
    }

    return {
      success: true,
      remainingCredits: nextCredits,
    };
  }
}

