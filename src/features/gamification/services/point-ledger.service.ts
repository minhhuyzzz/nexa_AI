import { SupabaseClient } from '@supabase/supabase-js';

export type PointEventType =
  | 'ASSESSMENT_PASSED'
  | 'MODULE_COMPLETED'
  | 'STREAK_BONUS'
  | 'ADMIN_ADJUSTMENT';

export type PointSourceType = 'ASSESSMENT' | 'MODULE' | 'ADMIN' | 'SYSTEM';

export interface GrantPointsParams {
  userId: string;
  delta: number;
  eventType: PointEventType;
  sourceType: PointSourceType;
  sourceId?: string | null;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}

export interface GrantPointsResult {
  success: boolean;
  alreadyAwarded: boolean;
  delta: number;
  points: number;
}

export class PointLedgerService {
  /**
   * Atomically grants points with idempotency and audit trail in point_ledger.
   */
  static async grantPoints(
    supabase: SupabaseClient,
    params: GrantPointsParams
  ): Promise<GrantPointsResult> {
    const {
      userId,
      delta,
      eventType,
      sourceType,
      sourceId = null,
      idempotencyKey,
      metadata = {},
    } = params;

    if (delta <= 0) {
      return {
        success: true,
        alreadyAwarded: false,
        delta: 0,
        points: 0,
      };
    }

    const { data, error } = await supabase.rpc('grant_points_atomic', {
      p_user_id: userId,
      p_delta: delta,
      p_event_type: eventType,
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_idempotency_key: idempotencyKey,
      p_metadata: metadata,
    });

    if (error || !data) {
      console.error('PointLedgerService.grantPoints error:', error);
      throw new Error(error?.message || 'Không thể ghi nhận điểm vào sổ cái');
    }

    const res = data as {
      success: boolean;
      already_awarded: boolean;
      delta: number;
      points: number;
    };

    return {
      success: res.success,
      alreadyAwarded: res.already_awarded,
      delta: res.delta,
      points: res.points,
    };
  }

  /**
   * Retrieves points ledger history for a specific user.
   */
  static async getLedgerHistory(
    supabase: SupabaseClient,
    userId: string,
    limit: number = 20
  ) {
    const { data, error } = await supabase
      .from('point_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('PointLedgerService.getLedgerHistory error:', error);
      throw new Error('Không thể tải lịch sử điểm tích lũy');
    }

    return data || [];
  }
}
