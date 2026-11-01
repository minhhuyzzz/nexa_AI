import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/redis/client', () => ({
  getRedisClient: vi.fn(() => null),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('/api/leaderboard Route Handler (PTS Slice)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('xếp hạng học viên hoàn toàn theo points DESC, created_at ASC và độc lập với avgScore', async () => {
    const mockProfiles = [
      {
        id: 'u-1',
        nickname: 'Học viên A',
        avatar_url: null,
        points: 500,
        rank_tier: 'PRACTITIONER',
        avg_competency_score: 45.0, // Điểm năng lực thấp hơn nhưng PTS cao hơn -> Vẫn rank 1
        role: 'LEARNER',
        specialization: 'Frontend',
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'u-2',
        nickname: 'Học viên B',
        avatar_url: null,
        points: 200,
        rank_tier: 'EXPLORER',
        avg_competency_score: 95.0, // Điểm năng lực 95% nhưng PTS ít hơn -> Rank 2
        role: 'LEARNER',
        specialization: 'Data Science',
        created_at: '2026-01-02T00:00:00Z',
      },
    ];

    const mockOrder = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({
      data: mockProfiles,
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({
      order: mockOrder,
      limit: mockLimit,
    });
    mockOrder.mockReturnValue({
      order: mockOrder,
      limit: mockLimit,
    });

    const mockSelect = vi.fn().mockReturnValue({
      eq: mockEq,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    });

    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'u-2' } },
    });

    vi.mocked(createClient).mockResolvedValue({
      from: mockFrom,
      auth: {
        getUser: mockGetUser,
      },
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.leaderboard).toHaveLength(2);
    expect(data.leaderboard[0].userId).toBe('u-1');
    expect(data.leaderboard[0].points).toBe(500);
    expect(data.leaderboard[0].rank).toBe(1);

    expect(data.leaderboard[1].userId).toBe('u-2');
    expect(data.leaderboard[1].points).toBe(200);
    expect(data.leaderboard[1].rank).toBe(2);

    // Current user là u-2 -> rank 2
    expect(data.currentUserRank).not.toBeNull();
    expect(data.currentUserRank.userId).toBe('u-2');
    expect(data.currentUserRank.rank).toBe(2);

    // Xác nhận gọi order 'points' DESC đầu tiên, sau đó 'created_at' ASC
    expect(mockOrder).toHaveBeenCalledWith('points', { ascending: false });
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true });
    // Không bao giờ order theo avg_competency_score
    expect(mockOrder).not.toHaveBeenCalledWith('avg_competency_score', expect.anything());
  });
});
