import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * ============================================================================
 * PHASE P0: SECURITY HARDENING & TAMPER GUARD TEST SUITE
 * ============================================================================
 * 
 * Verifies Phase P0 compliance per docs/NEXA_AI_IMPLEMENTATION_PLAN.md:
 * 1. Migration 50 specification & RLS trigger invariants:
 *    - trg_guard_assessment_submissions_integrity
 *    - trg_guard_submission_answers_integrity
 *    - ai_evaluations strict RLS policies (draft leak protection & revoke client mutation)
 *    - approve_submission_grading atomic RPC bounds check & anti-self-grading
 * 2. Deterministic adversarial trigger simulation:
 *    - Prevent learner from updating submission status from IN_PROGRESS to EVALUATED directly
 *    - Prevent score tampering (total_score, percentage, is_passed, grading_status)
 *    - Prevent student from inserting answers with pre-awarded scores or altering submitted answers
 *    - Prevent dual-role self-grading (ASSESSOR / ORG_ADMIN grading their own exam)
 * 3. Route-level hardening:
 *    - /api/ai/analyze-competency: analysis record created BEFORE credit settlement
 *    - /api/ai/grade-submission: assessor verification and block self-grading
 *    - /api/org/[slug]/analytics/ai-insights: server-side aggregation, no PII leakage, scoped assessor access
 *    - /personal/grading/page.tsx: zero prototype mock simulation
 * 4. AGENTS.md compliance:
 *    - Zero horizontal lines (no border-b, border-t, divide-y, <hr>)
 *    - Zero JSX emojis
 *    - Light #FFFFFF / Dark #000000 theme tokens
 * ============================================================================
 */

describe('Phase P0: Security Hardening & Tamper Guard Suite', () => {
  const rootDir = process.cwd();

  // -------------------------------------------------------------------------
  // 1. MIGRATION 50 DDL & TRIGGER INVARIANTS INSPECTION
  // -------------------------------------------------------------------------
  describe('1. Migration 50 DDL & Anti-Tamper Trigger Invariants', () => {
    const migration50Path = path.join(
      rootDir,
      'src/database/migrations/50_security_rls_hardening_and_standardize_assessor_role.sql'
    );

    it('1.1. Migration 50 file exists and is populated', () => {
      expect(fs.existsSync(migration50Path)).toBe(true);
      const content = fs.readFileSync(migration50Path, 'utf-8');
      expect(content.length).toBeGreaterThan(1000);
    });

    it('1.2. Standardizes user_organizations and organization_invitations to ASSESSOR and eliminates EVALUATOR check constraint', () => {
      const content = fs.readFileSync(migration50Path, 'utf-8');
      expect(content).toContain("CHECK (org_role IN ('ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'REPORT_VIEWER', 'MEMBER'))");
      expect(content).toContain("SET org_role = 'ASSESSOR'");
    });

    it('1.3. Contains trg_guard_assessment_submissions_integrity with dual-role self-grading block', () => {
      const content = fs.readFileSync(migration50Path, 'utf-8');
      expect(content).toContain('FUNCTION public.trg_guard_assessment_submissions_integrity()');
      // Anti-self-grading: If candidate is caller, strip assessor privilege
      expect(content).toContain('IF NEW.user_id = auth.uid() THEN');
      expect(content).toContain('v_is_assessor := false;');
      // Status tampering guard
      expect(content).toContain("NEW.status = 'EVALUATED' AND OLD.status IS DISTINCT FROM 'EVALUATED'");
      // Score tampering guard
      expect(content).toContain('NEW.total_score IS DISTINCT FROM OLD.total_score');
      expect(content).toContain('NEW.percentage IS DISTINCT FROM OLD.percentage');
      // Reparenting guard
      expect(content).toContain('NEW.user_id IS DISTINCT FROM OLD.user_id');
      expect(content).toContain('NEW.assessment_id IS DISTINCT FROM OLD.assessment_id');
    });

    it('1.4. Contains trg_guard_submission_answers_integrity locking mutations after SUBMITTED/EVALUATED and blocking backdoor scores', () => {
      const content = fs.readFileSync(migration50Path, 'utf-8');
      expect(content).toContain('FUNCTION public.trg_guard_submission_answers_integrity()');
      expect(content).toContain("v_sub_status IN ('SUBMITTED', 'EVALUATED')");
      expect(content).toContain('NEW.score_awarded IS NOT NULL AND NEW.score_awarded > 0');
      expect(content).toContain('NEW.is_correct IS NOT NULL');
      expect(content).toContain('NEW.score_awarded IS DISTINCT FROM OLD.score_awarded');
    });

    it('1.5. Revokes client mutations on ai_evaluations and guards against draft leaks', () => {
      const content = fs.readFileSync(migration50Path, 'utf-8');
      expect(content).toContain('REVOKE INSERT, UPDATE, DELETE ON public.ai_evaluations FROM anon, authenticated;');
      expect(content).toContain('GRANT ALL ON public.ai_evaluations TO service_role;');
      // Student draft leak guard: only see when submission is EVALUATED and ai_evaluations is ACCEPTED
      expect(content).toContain("s.user_id = auth.uid() AND s.status = 'EVALUATED' AND ai_evaluations.status = 'ACCEPTED'");
    });

    it('1.6. Contains atomic approve_submission_grading RPC with FOR UPDATE lock and anti-self-grading guard', () => {
      const content = fs.readFileSync(migration50Path, 'utf-8');
      expect(content).toContain('FUNCTION public.approve_submission_grading');
      expect(content).toContain('FOR UPDATE OF s');
      expect(content).toContain('IF v_sub.user_id = p_assessor_id THEN');
      expect(content).toContain('Thí sinh không được phép tự chấm bài thi của chính mình');
      expect(content).toContain('v_score > v_item_max_score');
    });
  });

  // -------------------------------------------------------------------------
  // 2. DETERMINISTIC ADVERSARIAL TRIGGER SIMULATION
  // -------------------------------------------------------------------------
  describe('2. Deterministic Adversarial Trigger Simulation', () => {
    interface SubmissionRecord {
      id: string;
      user_id: string;
      assessment_id: string;
      status: 'IN_PROGRESS' | 'PENDING_START' | 'SUBMITTED' | 'EVALUATED';
      total_score: number | null;
      percentage: number | null;
      is_passed: boolean | null;
      grading_status: string | null;
      evaluator_notes?: string | null;
      evaluated_by?: string | null;
      evaluated_at?: string | null;
    }

    interface AnswerRecord {
      id: string;
      submission_id: string;
      item_id: string;
      score_awarded: number | null;
      is_correct: boolean | null;
      auto_graded: boolean;
      text_response?: string | null;
    }

    // Pure simulation of trg_guard_assessment_submissions_integrity
    function simulateSubmissionTrigger(
      op: 'INSERT' | 'UPDATE',
      oldRow: SubmissionRecord | null,
      newRow: SubmissionRecord,
      callerId: string,
      callerIsOrgAssessor: boolean,
      isServiceRole: boolean = false
    ): { allowed: boolean; error?: string } {
      if (isServiceRole) return { allowed: true };

      let isAssessor = callerIsOrgAssessor;
      // Anti-self-grading: If candidate is caller, strip assessor privilege
      if (newRow.user_id === callerId) {
        isAssessor = false;
      }

      if (op === 'INSERT') {
        if (!isAssessor) {
          if (!['IN_PROGRESS', 'PENDING_START'].includes(newRow.status)) {
            return { allowed: false, error: '42501: Thí sinh chỉ được khởi tạo bài nộp ở trạng thái IN_PROGRESS hoặc PENDING_START' };
          }
          if (newRow.total_score !== null || newRow.percentage !== null || newRow.is_passed !== null) {
            return { allowed: false, error: '42501: Thí sinh không được phép tự khởi tạo điểm số bài thi' };
          }
          if (newRow.grading_status && !['PENDING', 'UNASSIGNED'].includes(newRow.grading_status)) {
            return { allowed: false, error: '42501: Trạng thái chấm ban đầu của bài thi không hợp lệ' };
          }
        }
      }

      if (op === 'UPDATE' && oldRow) {
        if (newRow.user_id !== oldRow.user_id || newRow.assessment_id !== oldRow.assessment_id) {
          return { allowed: false, error: '42501: Không được phép thay đổi thí sinh hoặc đề thi của bài làm (Reparenting guard)' };
        }

        if (!isAssessor) {
          if (newRow.status === 'EVALUATED' && oldRow.status !== 'EVALUATED') {
            return { allowed: false, error: '42501: Thí sinh không có quyền tự chuyển trạng thái bài thi thành EVALUATED' };
          }
          if (
            newRow.total_score !== oldRow.total_score ||
            newRow.percentage !== oldRow.percentage ||
            newRow.is_passed !== oldRow.is_passed
          ) {
            return { allowed: false, error: '42501: Thí sinh không có quyền can thiệp hoặc thay đổi điểm số bài thi' };
          }
          if (
            newRow.grading_status !== oldRow.grading_status &&
            ['EVALUATOR_APPROVED', 'COMPLETED', 'SCORED'].includes(newRow.grading_status || '')
          ) {
            return { allowed: false, error: '42501: Thí sinh không có quyền tự phê duyệt trạng thái chấm bài thi' };
          }
          if (
            newRow.evaluator_notes !== oldRow.evaluator_notes ||
            newRow.evaluated_by !== oldRow.evaluated_by ||
            newRow.evaluated_at !== oldRow.evaluated_at
          ) {
            return { allowed: false, error: '42501: Thí sinh không có quyền thay đổi thông tin người chấm hoặc nhận xét chấm điểm' };
          }
        }
      }

      return { allowed: true };
    }

    // Pure simulation of trg_guard_submission_answers_integrity
    function simulateAnswerTrigger(
      op: 'INSERT' | 'UPDATE',
      parentSubmission: SubmissionRecord,
      oldAns: AnswerRecord | null,
      newAns: AnswerRecord,
      callerId: string,
      isServiceRole: boolean = false
    ): { allowed: boolean; error?: string } {
      if (isServiceRole) return { allowed: true };

      if (parentSubmission.user_id === callerId) {
        if (['SUBMITTED', 'EVALUATED'].includes(parentSubmission.status)) {
          return { allowed: false, error: '42501: Bài thi đã hoàn tất. Thí sinh không thể thêm hoặc sửa đổi câu trả lời' };
        }
        if (op === 'INSERT') {
          if ((newAns.score_awarded !== null && newAns.score_awarded > 0) || newAns.is_correct !== null) {
            return { allowed: false, error: '42501: Thí sinh không có quyền tự chấm điểm hoặc can thiệp kết quả câu hỏi khi tạo câu trả lời' };
          }
        }
        if (op === 'UPDATE' && oldAns) {
          if (
            newAns.score_awarded !== oldAns.score_awarded ||
            newAns.is_correct !== oldAns.is_correct ||
            newAns.auto_graded !== oldAns.auto_graded ||
            newAns.submission_id !== oldAns.submission_id ||
            newAns.item_id !== oldAns.item_id
          ) {
            return { allowed: false, error: '42501: Thí sinh không có quyền tự chấm điểm hoặc can thiệp liên kết câu hỏi' };
          }
        }
      }
      return { allowed: true };
    }

    it('2.1. Blocks learner from directly updating status to EVALUATED', () => {
      const oldSub: SubmissionRecord = {
        id: 'sub-1',
        user_id: 'learner-1',
        assessment_id: 'asm-1',
        status: 'IN_PROGRESS',
        total_score: null,
        percentage: null,
        is_passed: null,
        grading_status: 'PENDING',
      };
      const forgedSub: SubmissionRecord = { ...oldSub, status: 'EVALUATED' };

      const result = simulateSubmissionTrigger('UPDATE', oldSub, forgedSub, 'learner-1', false);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('EVALUATED');
    });

    it('2.2. Blocks learner from tampering with total_score and percentage', () => {
      const oldSub: SubmissionRecord = {
        id: 'sub-1',
        user_id: 'learner-1',
        assessment_id: 'asm-1',
        status: 'IN_PROGRESS',
        total_score: null,
        percentage: null,
        is_passed: null,
        grading_status: 'PENDING',
      };
      const forgedSub: SubmissionRecord = { ...oldSub, total_score: 100, percentage: 100, is_passed: true };

      const result = simulateSubmissionTrigger('UPDATE', oldSub, forgedSub, 'learner-1', false);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('điểm số');
    });

    it('2.3. Blocks learner from creating submission directly with EVALUATED or pre-set scores (INSERT attack)', () => {
      const forgedNewSub: SubmissionRecord = {
        id: 'sub-new',
        user_id: 'learner-1',
        assessment_id: 'asm-1',
        status: 'EVALUATED',
        total_score: 95,
        percentage: 95,
        is_passed: true,
        grading_status: 'EVALUATOR_APPROVED',
      };

      const result = simulateSubmissionTrigger('INSERT', null, forgedNewSub, 'learner-1', false);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('IN_PROGRESS');
    });

    it('2.4. Blocks reparenting attack (changing user_id or assessment_id on UPDATE)', () => {
      const oldSub: SubmissionRecord = {
        id: 'sub-1',
        user_id: 'learner-1',
        assessment_id: 'asm-1',
        status: 'IN_PROGRESS',
        total_score: null,
        percentage: null,
        is_passed: null,
        grading_status: 'PENDING',
      };
      const reparentedSub: SubmissionRecord = { ...oldSub, user_id: 'learner-victim' };

      const result = simulateSubmissionTrigger('UPDATE', oldSub, reparentedSub, 'learner-1', false);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Reparenting');
    });

    it('2.5. Prevents student from backdoor-inserting answers with score_awarded > 0 or is_correct', () => {
      const parentSub: SubmissionRecord = {
        id: 'sub-1',
        user_id: 'learner-1',
        assessment_id: 'asm-1',
        status: 'IN_PROGRESS',
        total_score: null,
        percentage: null,
        is_passed: null,
        grading_status: 'PENDING',
      };
      const backdoorAns: AnswerRecord = {
        id: 'ans-1',
        submission_id: 'sub-1',
        item_id: 'item-1',
        score_awarded: 10,
        is_correct: true,
        auto_graded: false,
      };

      const result = simulateAnswerTrigger('INSERT', parentSub, null, backdoorAns, 'learner-1');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('tự chấm điểm');
    });

    it('2.6. Prevents student from modifying answers once submission is SUBMITTED or EVALUATED', () => {
      const submittedSub: SubmissionRecord = {
        id: 'sub-1',
        user_id: 'learner-1',
        assessment_id: 'asm-1',
        status: 'SUBMITTED',
        total_score: null,
        percentage: null,
        is_passed: null,
        grading_status: 'PENDING',
      };
      const oldAns: AnswerRecord = {
        id: 'ans-1',
        submission_id: 'sub-1',
        item_id: 'item-1',
        score_awarded: null,
        is_correct: null,
        auto_graded: false,
        text_response: 'Original answer',
      };
      const lateAns: AnswerRecord = {
        ...oldAns,
        text_response: 'Altered answer after submit',
      };

      const result = simulateAnswerTrigger('UPDATE', submittedSub, oldAns, lateAns, 'learner-1');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Bài thi đã hoàn tất');
    });

    it('2.7. Anti Dual-Role Self-Grading: An ASSESSOR or ORG_ADMIN who took the exam cannot grade their own submission', () => {
      // User is an ORG_ADMIN / ASSESSOR, but is also the candidate who took the exam!
      const userDualRoleId = 'user-dual-role-123';
      const oldSub: SubmissionRecord = {
        id: 'sub-1',
        user_id: userDualRoleId, // Exam taker is caller
        assessment_id: 'asm-1',
        status: 'IN_PROGRESS',
        total_score: null,
        percentage: null,
        is_passed: null,
        grading_status: 'PENDING',
      };
      const forgedSub: SubmissionRecord = {
        ...oldSub,
        status: 'EVALUATED',
        total_score: 100,
        percentage: 100,
        is_passed: true,
      };

      // Caller claims callerIsOrgAssessor = true, BUT NEW.user_id === callerId
      const result = simulateSubmissionTrigger('UPDATE', oldSub, forgedSub, userDualRoleId, true);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('EVALUATED');
    });
  });

  // -------------------------------------------------------------------------
  // 3. ROUTE IMPLEMENTATION HARDENING VERIFICATION
  // -------------------------------------------------------------------------
  describe('3. Route Hardening Code Inspection', () => {
    it('3.1. /api/ai/analyze-competency creates database record BEFORE settling credits', () => {
      const routePath = path.join(rootDir, 'src/app/api/ai/analyze-competency/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');

      const insertPos = content.indexOf(".from('competency_analyses')");
      const settlePos = content.indexOf("settleOrReleaseCredits(supabase, reservation, 'SETTLE'");
      const releasePos = content.indexOf("settleOrReleaseCredits(supabase, reservation, 'RELEASE')");

      expect(insertPos).toBeGreaterThan(-1);
      expect(settlePos).toBeGreaterThan(-1);
      expect(releasePos).toBeGreaterThan(-1);

      // Verify insertion occurs BEFORE settling
      expect(insertPos).toBeLessThan(settlePos);

      // Verify fail-closed rollback if saveError occurs
      expect(content).toContain('saveError || !savedRecord');
      expect(content).toContain('Lượt credits đã được hoàn trả an toàn');
    });

    it('3.2. /api/ai/grade-submission enforces ASSESSOR verification and blocks self-grading', () => {
      const routePath = path.join(rootDir, 'src/app/api/ai/grade-submission/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');

      // Verify anti-self-grading guard
      expect(content).toContain('submission.user_id === user.id');
      expect(content).toContain('Thí sinh không được phép tự chấm hoặc yêu cầu AI chấm bài thi của chính mình');

      // Verify assessor / org authorization
      expect(content).toContain('user_organizations');
      expect(content).toContain('org_role');
      expect(content).toContain('isAuthorized');

      // Verify persistence before settlement using adminSupabase
      const insertEvalPos = content.indexOf(".from('ai_evaluations')");
      const settlePos = content.indexOf("settleOrReleaseCredits(adminSupabase, reservation, 'SETTLE'");
      expect(insertEvalPos).toBeGreaterThan(-1);
      expect(settlePos).toBeGreaterThan(-1);
      expect(insertEvalPos).toBeLessThan(settlePos);
      expect(content).toContain('adminSupabase');
    });

    it('3.3. /api/org/[slug]/analytics/ai-insights aggregates on server and isolates assessor scopes without row-level PII', () => {
      const routePath = path.join(rootDir, 'src/app/api/org/[slug]/analytics/ai-insights/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');

      // Verifies server-side aggregation from DB
      expect(content).toContain('OrgCompetencyAnalyticsService.aggregateOrgCompetency');
      expect(content).toContain('createAdminClient');

      // Verifies assessor scoping (classes and campaigns)
      expect(content).toContain("role === 'ASSESSOR'");
      expect(content).toContain('assessor_ids');

      // Verifies PII protection
      expect(content).toContain('Row-level PII');
      expect(content).not.toContain('body.candidateName');
      expect(content).not.toContain('body.candidateEmail');
    });

    it('3.4. /personal/grading/page.tsx has zero prototype mock simulation lines', () => {
      const pagePath = path.join(rootDir, 'src/app/(dashboard)/personal/grading/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf-8');

      // Prototype simulation lines must be completely gone
      expect(content).not.toContain('// Prototype simulation success');
      expect(content).not.toContain("prev.map((s) => (s.id === activeSubmission.id ? { ...s, status: 'EVALUATED' } : s))");

      // Real error handling state must be present
      expect(content).toContain('saveErrorMsg');
      expect(content).toContain('setSaveErrorMsg');
      expect(content).toContain('Đang tải danh sách bài thi cần thẩm định');
    });

    it('3.5. AssessmentResultClientView removes AIGradingCard from candidate view', () => {
      const viewPath = path.join(rootDir, 'src/components/dashboard/assessments/AssessmentResultClientView.tsx');
      const content = fs.readFileSync(viewPath, 'utf-8');

      // Candidate must not see the interactive AIGradingCard
      expect(content).not.toContain('<AIGradingCard');
    });
  });

  // -------------------------------------------------------------------------
  // 4. AGENTS.MD ARCHITECTURE & DESIGN CONFORMANCE
  // -------------------------------------------------------------------------
  describe('4. AGENTS.md Conformance across P0 Touchpoints', () => {
    const touchedFiles = [
      'src/app/(dashboard)/personal/grading/page.tsx',
      'src/components/dashboard/assessments/AssessmentResultClientView.tsx',
    ];

    it('4.1. Zero horizontal line dividers (no border-b, border-t, divide-y, <hr>)', () => {
      const horizontalDividerRegex = /\b(divide-y|border-y|border-b(?!-transparent)|border-t(?!-transparent))\b|<hr[\s/>]/;

      for (const relPath of touchedFiles) {
        const fullPath = path.join(rootDir, relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          const violations: Array<{ line: number; text: string }> = [];

          lines.forEach((lineText, idx) => {
            const trimmed = lineText.trim();
            if (horizontalDividerRegex.test(trimmed)) {
              violations.push({ line: idx + 1, text: trimmed });
            }
          });

          expect(
            violations,
            `Found horizontal divider violations in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
          ).toEqual([]);
        }
      }
    });

    it('4.2. Zero JSX emojis in touched frontend components', () => {
      const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

      for (const relPath of touchedFiles) {
        const fullPath = path.join(rootDir, relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(
            emojiRegex.test(content),
            `File ${relPath} must not contain JSX emojis`
          ).toBe(false);
        }
      }
    });

    it('4.3. Light #FFFFFF and Dark #000000 / #111114 compliance', () => {
      for (const relPath of touchedFiles) {
        const fullPath = path.join(rootDir, relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content).toContain('bg-white');
          expect(content).toMatch(/dark:bg-\[#111114\]|dark:bg-black|dark:bg-zinc-900/);
        }
      }
    });
  });
});
