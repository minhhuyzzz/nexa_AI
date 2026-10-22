import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getRedisClient } from '@/lib/redis/client';

export const dynamic = 'force-dynamic';

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
      console.error('Supabase profiles query error:', error.message);
      return NextResponse.json({
        cached: false,
        fetchTimeMs: Number((performance.now() - startTime).toFixed(2)),
        total: 0,
        leaderboard: [],
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

    // 4. Calculate current user rank if authenticated
    let currentUserRank: {
      rank: number;
      userId: string;
      displayName: string;
      avatarUrl: string | null;
      points: number;
    } | null = null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let effectiveUserId = user?.id;
      if (!effectiveUserId) {
        const cookieStore = await cookies();
        const demoRole = cookieStore.get('nexa_demo_role')?.value?.toUpperCase();
        if (process.env.NODE_ENV !== 'production' || demoRole === 'LEARNER') {
          effectiveUserId = '11111111-1111-1111-1111-111111111111';
        }
      }

      if (effectiveUserId) {
        const foundIndex = leaderboard.findIndex((item) => item.userId === effectiveUserId);
        if (foundIndex !== -1) {
          currentUserRank = {
            rank: foundIndex + 1,
            userId: effectiveUserId,
            displayName: leaderboard[foundIndex].displayName,
            avatarUrl: leaderboard[foundIndex].avatarUrl,
            points: leaderboard[foundIndex].points,
          };
        } else {
          const { data: myProfile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, points')
            .eq('id', effectiveUserId)
            .single();

          if (myProfile) {
            const { count } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'LEARNER')
              .gt('points', myProfile.points || 0);

            currentUserRank = {
              rank: (count ?? 0) + 1,
              userId: myProfile.id,
              displayName: formatDisplayName(myProfile.full_name),
              avatarUrl: myProfile.avatar_url,
              points: myProfile.points || 0,
            };
          }
        }
      }
    } catch {
      // Non-blocking for unauthenticated requests
    }

    const fetchTimeMs = Number((performance.now() - startTime).toFixed(2));

    return NextResponse.json({
      cached: false,
      fetchTimeMs,
      total: leaderboard.length,
      leaderboard,
      currentUserRank,
    });
  } catch (err) {
    console.error('Unexpected error in leaderboard:', err);
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
