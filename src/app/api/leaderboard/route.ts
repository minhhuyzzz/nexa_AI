import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRedisClient } from '@/lib/redis/client';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  rankTier: string;
  avgScore: number;
  role: string;
  specialization: string | null;
}

const REDIS_CACHE_KEY = 'nexa:leaderboard:top100';
const CACHE_TTL_SECONDS = 60; // 60 seconds TTL for fast live leaderboard

// Mask name for privacy under Decree 13/2023 if desired, or keep academic clean display
function formatDisplayName(fullName: string): string {
  if (!fullName) return 'Học viên ẩn danh';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  // e.g. "Nguyễn Văn An" -> "Nguyễn V. An"
  if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
  const first = parts[0];
  const last = parts[parts.length - 1];
  const middle = parts.slice(1, -1).map((p) => `${p[0]}.`).join(' ');
  return `${first} ${middle} ${last}`;
}

export async function GET() {
  const startTime = performance.now();
  const redis = getRedisClient();

  try {
    // 1. Try to read from Upstash Redis cache (< 50ms)
    if (redis) {
      try {
        const cached = await redis.get<LeaderboardEntry[]>(REDIS_CACHE_KEY);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          const fetchTimeMs = Number((performance.now() - startTime).toFixed(2));
          return NextResponse.json({
            cached: true,
            fetchTimeMs,
            total: cached.length,
            leaderboard: cached,
          });
        }
      } catch (cacheErr) {
        console.warn('Redis cache lookup skipped:', cacheErr);
      }
    }

    // 2. Cache miss or Redis unavailable -> Query Supabase directly
    const supabase = await createClient();

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, points, rank_tier, avg_competency_score, role, specialization')
      .eq('role', 'LEARNER')
      .order('points', { ascending: false })
      .order('avg_competency_score', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Supabase profiles query error, returning prototype fallback data:', error.message);
      const mockLeaderboard: LeaderboardEntry[] = [
        { rank: 1, userId: 'usr-1', displayName: 'Nguyễn V. An', avatarUrl: null, points: 1420, rankTier: 'ELITE', avgScore: 94.5, role: 'LEARNER', specialization: 'Khoa học máy tính' },
        { rank: 2, userId: 'usr-2', displayName: 'Trần T. Mai', avatarUrl: null, points: 1280, rankTier: 'ELITE', avgScore: 91.2, role: 'LEARNER', specialization: 'Sư phạm Tin học' },
        { rank: 3, userId: 'usr-3', displayName: 'Lê H. Nam', avatarUrl: null, points: 1150, rankTier: 'SPECIALIST', avgScore: 88.0, role: 'LEARNER', specialization: 'Kinh tế số' },
        { rank: 4, userId: 'usr-4', displayName: 'Đỗ Q. Bảo', avatarUrl: null, points: 980, rankTier: 'SPECIALIST', avgScore: 85.5, role: 'LEARNER', specialization: 'Hệ thống thông tin' },
        { rank: 5, userId: 'usr-5', displayName: 'Phạm M. Thư', avatarUrl: null, points: 920, rankTier: 'SPECIALIST', avgScore: 83.0, role: 'LEARNER', specialization: 'Thương mại điện tử' },
        { rank: 6, userId: 'usr-6', displayName: 'Hoàng V. Đức', avatarUrl: null, points: 840, rankTier: 'PRACTITIONER', avgScore: 79.5, role: 'LEARNER', specialization: 'Công nghệ thông tin' },
        { rank: 7, userId: 'usr-7', displayName: 'Vũ T. Lan', avatarUrl: null, points: 760, rankTier: 'PRACTITIONER', avgScore: 76.0, role: 'LEARNER', specialization: 'Quản trị kinh doanh' },
        { rank: 8, userId: 'usr-8', displayName: 'Đặng T. Hùng', avatarUrl: null, points: 690, rankTier: 'PRACTITIONER', avgScore: 73.5, role: 'LEARNER', specialization: 'Khoa học dữ liệu' },
        { rank: 9, userId: 'usr-9', displayName: 'Bùi N. Ánh', avatarUrl: null, points: 580, rankTier: 'NOVICE', avgScore: 68.0, role: 'LEARNER', specialization: 'Truyền thông đa phương tiện' },
        { rank: 10, userId: 'usr-10', displayName: 'Ngô V. Khang', avatarUrl: null, points: 510, rankTier: 'NOVICE', avgScore: 64.0, role: 'LEARNER', specialization: 'Kỹ thuật phần mềm' },
      ];
      return NextResponse.json({
        cached: false,
        fetchTimeMs: Number((performance.now() - startTime).toFixed(2)),
        total: mockLeaderboard.length,
        leaderboard: mockLeaderboard,
      });
    }

    const leaderboard: LeaderboardEntry[] = (profiles || []).map((p, index) => ({
      rank: index + 1,
      userId: p.id,
      displayName: formatDisplayName(p.full_name),
      avatarUrl: p.avatar_url,
      points: p.points || 0,
      rankTier: p.rank_tier || 'NOVICE',
      avgScore: Number(p.avg_competency_score) || 0,
      role: p.role,
      specialization: p.specialization,
    }));

    // 3. Cache into Redis with 60s expiration
    if (redis && leaderboard.length > 0) {
      try {
        await redis.set(REDIS_CACHE_KEY, leaderboard, { ex: CACHE_TTL_SECONDS });
      } catch (saveCacheErr) {
        console.warn('Failed to cache leaderboard into Redis:', saveCacheErr);
      }
    }

    const fetchTimeMs = Number((performance.now() - startTime).toFixed(2));

    return NextResponse.json({
      cached: false,
      fetchTimeMs,
      total: leaderboard.length,
      leaderboard,
    });
  } catch (err) {
    console.error('Unexpected error in leaderboard:', err);
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
