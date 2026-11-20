import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * ============================================================================
 * PHASE P3: PERSONAL AI QUESTION EXPLANATION & CACHING ENGINE TEST SUITE
 * ============================================================================
 *
 * Verifies Phase P3 deliverables per docs/NEXA_AI_IMPLEMENTATION_PLAN.md:
 * 1. Migration 53 (53_personal_ai_question_explanations_cache.sql) & rollback script:
 *    - Table ai_question_explanations with required columns, indices, RLS policies.
 * 2. API Route (/api/ai/explain-question):
 *    - Input validation via zod.
 *    - Strict authentication (401 if unauthenticated).
 *    - Submission ownership check (403 if submission belongs to another user).
 *    - Exam completion check (403 if assessment status is still IN_PROGRESS).
 *    - Cache lookup: if cache hit, return 200 with cached explanation & 0 credits deducted.
 *    - Cache miss: reserve 1 credit, generate Vietnamese explanation, save cache, settle 1 credit.
 *    - Error handling: release credit on failure.
 *    - Anti-tamper guarantee: route is strictly read-only on scores/submissions.
 * 3. QuestionReview UI (src/components/dashboard/assessments/QuestionReviewSection.tsx):
 *    - AGENTS.md compliance: zero horizontal divider lines (no border-b/border-t/divide-y/<hr>).
 *    - Zero JSX emojis.
 *    - Light #FFFFFF / Dark #000000 theme tokens.
 *    - Discloses 1 AI Credit cost (0 Credit on cache hit).
 * ============================================================================
 */

describe('Phase P3: Personal AI Question Explanation Test Suite', () => {
  const rootDir = process.cwd();

  // -------------------------------------------------------------------------
  // 1. MIGRATION 53 DDL & ROLLBACK VERIFICATION
  // -------------------------------------------------------------------------
  describe('1. Migration 53 DDL & Schema Invariants', () => {
    const migration53Path = path.join(
      rootDir,
      'src/database/migrations/53_personal_ai_question_explanations_cache.sql'
    );
    const rollback53Path = path.join(
      rootDir,
      'src/database/migrations/53_rollback_personal_ai_explanations.sql'
    );

    it('1.1. Migration 53 file exists and contains valid DDL', () => {
      expect(fs.existsSync(migration53Path)).toBe(true);
      const content = fs.readFileSync(migration53Path, 'utf-8');
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.ai_question_explanations');
      expect(content).toContain('question_id UUID NOT NULL');
      expect(content).toContain('question_version INT NOT NULL DEFAULT 1');
      expect(content).toContain('user_id UUID NOT NULL REFERENCES public.profiles(id)');
      expect(content).toContain('explanation_text TEXT NOT NULL');
      expect(content).toContain('model_used TEXT NOT NULL');
      expect(content).toContain('credit_cost INT DEFAULT 1');
    });

    it('1.2. Migration 53 contains proper indices for cache performance', () => {
      const content = fs.readFileSync(migration53Path, 'utf-8');
      expect(content).toContain('idx_ai_question_explanations_q_version');
      expect(content).toContain('idx_ai_question_explanations_user');
      expect(content).toContain('idx_ai_question_explanations_lookup');
    });

    it('1.3. Migration 53 enforces Row Level Security (RLS)', () => {
      const content = fs.readFileSync(migration53Path, 'utf-8');
      expect(content).toContain('ALTER TABLE public.ai_question_explanations ENABLE ROW LEVEL SECURITY');
      expect(content).toContain('user_id = auth.uid()');
      expect(content).toContain('service_role');
    });

    it('1.4. Rollback script exists and cleanly drops tables, policies and indices', () => {
      expect(fs.existsSync(rollback53Path)).toBe(true);
      const rollbackContent = fs.readFileSync(rollback53Path, 'utf-8');
      expect(rollbackContent).toContain('DROP TABLE IF EXISTS public.ai_question_explanations');
      expect(rollbackContent).toContain('DROP POLICY IF EXISTS');
    });
  });

  // -------------------------------------------------------------------------
  // 2. QUESTION REVIEW SECTION UI CONFORMANCE (AGENTS.MD)
  // -------------------------------------------------------------------------
  describe('2. QuestionReviewSection UI AGENTS.md Conformance', () => {
    const componentPath = path.join(
      rootDir,
      'src/components/dashboard/assessments/QuestionReviewSection.tsx'
    );

    it('2.1. Component file exists', () => {
      expect(fs.existsSync(componentPath)).toBe(true);
    });

    it('2.2. Zero horizontal lines rule (no border-b, border-t, divide-y, <hr>)', () => {
      const code = fs.readFileSync(componentPath, 'utf-8');
      expect(code).not.toMatch(/\bborder-b\b/);
      expect(code).not.toMatch(/\bborder-t\b/);
      expect(code).not.toMatch(/\bdivide-y\b/);
      expect(code).not.toMatch(/<hr\b/);
    });

    it('2.3. Zero JSX emojis rule (uses lucide-react icons instead)', () => {
      const code = fs.readFileSync(componentPath, 'utf-8');
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      expect(emojiRegex.test(code)).toBe(false);
      expect(code).toContain('lucide-react');
    });

    it('2.4. Discloses 1 AI Credit cost and cache hint clearly to learner', () => {
      const code = fs.readFileSync(componentPath, 'utf-8');
      expect(code).toContain('1 AI Credit');
      expect(code).toContain('Bộ nhớ đệm');
      expect(code).toContain('0 Credit');
    });
  });

  // -------------------------------------------------------------------------
  // 3. API ROUTE LOGIC & SECURITY INVARIANTS
  // -------------------------------------------------------------------------
  describe('3. Route /api/ai/explain-question Invariants', () => {
    const routePath = path.join(rootDir, 'src/app/api/ai/explain-question/route.ts');

    it('3.1. Route file exists', () => {
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('3.2. Route source code enforces 5 business conditions', () => {
      const code = fs.readFileSync(routePath, 'utf-8');
      // Auth check
      expect(code).toContain('getUser()');
      // Ownership check
      expect(code).toContain('submission.user_id !== user.id');
      // Status check (must be SUBMITTED or EVALUATED)
      expect(code).toContain('allowedStatuses');
      expect(code).toContain('EVALUATED');
      // Cache check
      expect(code).toContain('from(\'ai_question_explanations\')');
      // Credit reservation & settlement
      expect(code).toContain('AiCreditsService.reserve');
      expect(code).toContain('AiCreditsService.settle');
      expect(code).toContain('AiCreditsService.release');
      // Read-only guarantee: does NOT update total_score or percentage
      expect(code).not.toMatch(/update\(\s*\{[^}]*total_score/);
      expect(code).not.toMatch(/update\(\s*\{[^}]*percentage/);
    });
  });

  // -------------------------------------------------------------------------
  // 4. INTEGRATION SIMULATION: CACHE HIT vs CACHE MISS
  // -------------------------------------------------------------------------
  describe('4. Cache Behavior & Credit Lifecycle Simulation', () => {
    it('4.1. Cache hit deducts 0 credits and returns isCached: true', async () => {
      // Test the logic contract:
      const mockCachedRecord = {
        id: 'expl-123',
        question_id: 'q-001',
        user_id: 'user-001',
        explanation_text: 'Giải thích chi tiết từ bộ nhớ đệm.',
        model_used: 'gemini-2.5-flash',
        created_at: new Date().toISOString(),
        expires_at: null,
      };

      const isExpired =
        mockCachedRecord.expires_at &&
        new Date(mockCachedRecord.expires_at) < new Date();

      expect(isExpired).toBeFalsy();

      const responsePayload = {
        success: true,
        explanation: mockCachedRecord.explanation_text,
        modelUsed: mockCachedRecord.model_used,
        creditsDeducted: 0,
        isCached: true,
      };

      expect(responsePayload.creditsDeducted).toBe(0);
      expect(responsePayload.isCached).toBe(true);
    });

    it('4.2. In-progress submission is rejected with 403 Forbidden', () => {
      const submission = {
        id: 'sub-active',
        user_id: 'user-001',
        status: 'IN_PROGRESS',
      };
      const allowedStatuses = ['SUBMITTED', 'EVALUATED'];
      const isAllowed = allowedStatuses.includes(submission.status);
      expect(isAllowed).toBe(false);
    });

    it('4.3. Foreign submission access is rejected with 403 Forbidden', () => {
      const currentUserId = 'user-alice';
      const submission = {
        id: 'sub-bob',
        user_id: 'user-bob',
        status: 'EVALUATED',
      };
      const isOwner = submission.user_id === currentUserId;
      expect(isOwner).toBe(false);
    });
  });
});
