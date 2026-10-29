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
      .single();

    const tier = (profile?.plan_tier?.toUpperCase() as PlanTier) || 'FREE';
    if (['FREE', 'PRO', 'ENTERPRISE'].includes(tier)) {
      return tier;
    }
    return 'FREE';
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
}
