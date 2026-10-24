import { NextResponse } from 'next/server';
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
const CACHE_TTL_SECONDS = 60; // 60 seconds TTL

export async function GET() {
  const startTime = performance.now();
  const redis = getRedisClient();
  const supabase = await createClient();

  try {
    let leaderboard: LeaderboardEntry[] = [];
    let isCached = false;

    // 1. Try to read leaderboard from Upstash Redis cache
    if (redis) {
      try {
        const cached = await redis.get<LeaderboardEntry[]>(REDIS_CACHE_KEY);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          leaderboard = cached;
          isCached = true;
        }
      } catch (cacheErr) {
        console.warn('Redis cache lookup skipped:', cacheErr);
      }
    }

    // 2. Cache miss or Redis unavailable -> Query Supabase directly
    if (leaderboard.length === 0) {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, points, rank_tier, avg_competency_score, role, specialization')
        .eq('role', 'LEARNER')
        .order('points', { ascending: false })
        .order('avg_competency_score', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Supabase profiles query error:', error.message);
      } else {
        leaderboard = (profiles || []).map((p, index) => ({
          rank: index + 1,
          userId: p.id,
          displayName: p.nickname || 'Học viên ẩn danh',
          avatarUrl: p.avatar_url,
          points: p.points || 0,
          rankTier: p.rank_tier || 'NOVICE',
          avgScore: Number(p.avg_competency_score) || 0,
          role: p.role,
          specialization: p.specialization,
        }));

        if (redis && leaderboard.length > 0) {
          try {
            await redis.set(REDIS_CACHE_KEY, leaderboard, { ex: CACHE_TTL_SECONDS });
          } catch (saveCacheErr) {
            console.warn('Failed to cache leaderboard into Redis:', saveCacheErr);
          }
        }
      }
    }

    // 3. Always calculate current user rank dynamically based on currently logged in user session
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

      if (user?.id) {
        const foundIndex = leaderboard.findIndex((item) => item.userId === user.id);
        if (foundIndex !== -1) {
          currentUserRank = {
            rank: foundIndex + 1,
            userId: user.id,
            displayName: leaderboard[foundIndex].displayName,
            avatarUrl: leaderboard[foundIndex].avatarUrl,
            points: leaderboard[foundIndex].points,
          };
        } else {
          // If not in top 100, calculate exact rank for current user
          const { data: myProfile } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url, points')
            .eq('id', user.id)
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
              displayName: myProfile.nickname || 'Học viên ẩn danh',
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

    return NextResponse.json(
      {
        cached: isCached,
        fetchTimeMs,
        total: leaderboard.length,
        leaderboard,
        currentUserRank,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err) {
    console.error('Unexpected error in leaderboard:', err);
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
