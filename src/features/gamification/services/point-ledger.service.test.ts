import { describe, it, expect, vi } from 'vitest';
import { PointLedgerService } from './point-ledger.service';

describe('PointLedgerService', () => {
  it('should immediately return if delta <= 0 without making DB calls', async () => {
    const mockSupabase = {
      rpc: vi.fn(),
    } as any;

    const result = await PointLedgerService.grantPoints(mockSupabase, {
      userId: 'user-123',
      delta: 0,
      eventType: 'ASSESSMENT_PASSED',
      sourceType: 'ASSESSMENT',
      idempotencyKey: 'idemp-123',
    });

    expect(result.success).toBe(true);
    expect(result.delta).toBe(0);
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('should call grant_points_atomic RPC with accurate params', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          success: true,
          already_awarded: false,
          delta: 50,
          points: 150,
        },
        error: null,
      }),
    } as any;

    const result = await PointLedgerService.grantPoints(mockSupabase, {
      userId: 'user-456',
      delta: 50,
      eventType: 'MODULE_COMPLETED',
      sourceType: 'MODULE',
      sourceId: 'mod-1',
      idempotencyKey: 'mod_user-456_mod-1',
      metadata: { title: 'An toàn dữ liệu' },
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith('grant_points_atomic', {
      p_user_id: 'user-456',
      p_delta: 50,
      p_event_type: 'MODULE_COMPLETED',
      p_source_type: 'MODULE',
      p_source_id: 'mod-1',
      p_idempotency_key: 'mod_user-456_mod-1',
      p_metadata: { title: 'An toàn dữ liệu' },
    });

    expect(result.success).toBe(true);
    expect(result.alreadyAwarded).toBe(false);
    expect(result.delta).toBe(50);
    expect(result.points).toBe(150);
  });

  it('should handle idempotent duplicate requests safely', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          success: true,
          already_awarded: true,
          delta: 0,
          points: 150,
        },
        error: null,
      }),
    } as any;

    const result = await PointLedgerService.grantPoints(mockSupabase, {
      userId: 'user-456',
      delta: 50,
      eventType: 'MODULE_COMPLETED',
      sourceType: 'MODULE',
      sourceId: 'mod-1',
      idempotencyKey: 'mod_user-456_mod-1',
    });

    expect(result.alreadyAwarded).toBe(true);
    expect(result.delta).toBe(0);
    expect(result.points).toBe(150);
  });
});
