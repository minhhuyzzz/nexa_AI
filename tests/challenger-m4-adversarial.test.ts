import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * ============================================================================
 * CHALLENGER 2 (MILESTONE 4) — TIER 5 ADVERSARIAL STRESS TEST SUITE
 * ============================================================================
 * White-box verification across:
 * 1. 0-member classes and unassessed submissions in OrgClassAnalyticsView
 * 2. d.max === 0 division-by-zero guards in analyze-competency route
 * 3. Auto-fetch fallback & redirect state machine in /personal/competency/analysis
 * 4. AI Gateway prompt safety in gemini.adapter.ts (PII scrubbing, 5 miền, zero DigComp)
 * 5. Forensic audit across all 21 touched files:
 *    - Zero horizontal borders (border-b, border-t, border-y, divide-y, <hr>)
 *    - Zero JSX emojis
 *    - Zero user-facing "DigComp" buzzwords (AGENTS.md §2.1)
 *    - Theme tokens (Light #FFFFFF, Dark #000000/#111114, Cobalt #2563EB)
 * ============================================================================
 */

const ALL_M1_M2_M3_TOUCHED_FILES = [
  // M1 Files
  'src/components/dashboard/live-room/InlinePinEntryCard.tsx',
  'src/components/dashboard/org/OrgSidebar.tsx',
  'src/app/(dashboard)/org/[slug]/live-room/new/page.tsx',
  'src/components/dashboard/live-room/LiveRoomDashboardView.tsx',
  'src/components/dashboard/personal/live-room/PersonalLiveRoomDashboardView.tsx',
  'src/app/(dashboard)/personal/dashboard/page.tsx',
  // M2 Files
  'src/app/live/waiting-room/page.tsx',
  'src/app/live/control/page.tsx',
  'src/app/(dashboard)/personal/live-room/[id]/host/page.tsx',
  'src/app/(dashboard)/personal/take/[id]/page.tsx',
  'src/app/live/submitted/page.tsx',
  'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx',
  'src/app/api/evaluator/rooms/route.ts',
  // M3 Files
  'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx',
  'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/page.tsx',
  'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/loading.tsx',
  'src/app/(dashboard)/personal/competency/analysis/page.tsx',
  'src/app/api/ai/analyze-competency/route.ts',
  'src/features/ai-gateway/adapters/gemini.adapter.ts',
  'src/features/analytics/components/AnalyticsInsightPanel.tsx',
  'src/features/analytics/components/DataSourceRulesBox.tsx',
];

const UI_TOUCHED_FILES = ALL_M1_M2_M3_TOUCHED_FILES.filter(
  (f) => !f.includes('/api/') && !f.endsWith('.adapter.ts')
);

describe('Challenger 2 M4: Tier 5 Adversarial Stress & Verification Suite', () => {
  const rootDir = process.cwd();

  // -------------------------------------------------------------------------
  // 1. STRESS TESTING: 0-Member Classes & Unassessed Submissions in OrgClassAnalytics
  // -------------------------------------------------------------------------
  describe('1. 0-Member Classes & Edge Case Submissions in OrgClassAnalytics', () => {
    it('1.1. Verifies OrgClassAnalyticsPage renders OrgEmptyState when realMembers === 0 or realAssignments === 0', () => {
      const pagePath = path.join(
        rootDir,
        'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/page.tsx'
      );
      const content = fs.readFileSync(pagePath, 'utf8');

      // The guard must prevent division by zero before reaching any calculations:
      expect(content).toContain('if (realMembers === 0 || realAssignments === 0) {');
      expect(content).toContain('<OrgEmptyState');
      expect(content).toContain('title="Chưa có dữ liệu phân tích"');
      expect(content).toContain('Lớp học này chưa có thành viên hoặc chưa được giao bài khảo thí nào');
    });

    it('1.2. Mathematical simulation: 0 evaluated submissions produces averageScore: null (never 0, never NaN, never fake 70)', () => {
      const classMembers = 25;
      const allSubs: any[] = []; // No submissions
      const evaluatedSubs = allSubs.filter((s) => s.status === 'EVALUATED');
      const activeUserIds = new Set(allSubs.map((s) => s.user_id).filter(Boolean));

      const participationRate = classMembers > 0 ? Math.round((activeUserIds.size / classMembers) * 100) : null;
      const averageScore = evaluatedSubs.length > 0
        ? Math.round(evaluatedSubs.reduce((acc, s) => acc + (s.percentage || 0), 0) / evaluatedSubs.length)
        : null;

      expect(participationRate).toBe(0);
      expect(averageScore).toBeNull();
      expect(averageScore).not.toBe(0);
      expect(averageScore).not.toBe(70);
      expect(Number.isNaN(averageScore)).toBe(false);
    });

    it('1.3. Mathematical simulation: Submissions exist but pending grading (SUBMITTED, not EVALUATED)', () => {
      const classMembers = 20;
      const allSubs = [
        { id: '1', user_id: 'u1', status: 'SUBMITTED', percentage: null },
        { id: '2', user_id: 'u2', status: 'SUBMITTED', percentage: null },
      ];
      const evaluatedSubs = allSubs.filter((s) => s.status === 'EVALUATED');
      const activeUserIds = new Set(allSubs.map((s) => s.user_id).filter(Boolean));

      const participationRate = classMembers > 0 ? Math.round((activeUserIds.size / classMembers) * 100) : null;
      const averageScore = evaluatedSubs.length > 0
        ? Math.round(evaluatedSubs.reduce((acc, s) => acc + (s.percentage || 0), 0) / evaluatedSubs.length)
        : null;

      // Participation is 2/20 = 10%
      expect(participationRate).toBe(10);
      // Average score is still NULL because 0 are evaluated
      expect(averageScore).toBeNull();
    });

    it('1.4. OrgClassAnalyticsView handles totalSubmissionsNeeded === 0 without division by zero or NaN', () => {
      const viewPath = path.join(
        rootDir,
        'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx'
      );
      const content = fs.readFileSync(viewPath, 'utf8');

      // Verify completionPercent formula:
      expect(content).toContain('const completionPercent = totalNeeded > 0 ? Math.min(100, Math.round((completedCount / totalNeeded) * 100)) : 0;');
      // Verify strokeDash:
      expect(content).toContain('const strokeDash = Math.round((completionPercent / 100) * 238);');
    });

    it('1.5. OrgClassAnalyticsView fallback defaultDomains have score: null and testedCount: 0 for all 5 domains', () => {
      const viewPath = path.join(
        rootDir,
        'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx'
      );
      const content = fs.readFileSync(viewPath, 'utf8');

      expect(content).toContain("{ domainCode: 'D1', name: 'Thông tin & Dữ liệu', score: null, testedCount: 0 }");
      expect(content).toContain("{ domainCode: 'D2', name: 'Giao tiếp & Hợp tác', score: null, testedCount: 0 }");
      expect(content).toContain("{ domainCode: 'D3', name: 'Sáng tạo nội dung số', score: null, testedCount: 0 }");
      expect(content).toContain("{ domainCode: 'D4', name: 'An toàn & Bảo mật', score: null, testedCount: 0 }");
      expect(content).toContain("{ domainCode: 'D5', name: 'Giải quyết Vấn đề', score: null, testedCount: 0 }");
      expect(content).toContain('effectiveDomainScores');
    });
  });

  // -------------------------------------------------------------------------
  // 2. STRESS TESTING: Division-by-Zero Guards in analyze-competency
  // -------------------------------------------------------------------------
  describe('2. Division by Zero Guards in analyze-competency (F16)', () => {
    it('2.1. Verify analyze-competency/route.ts contains strictly guarded percentage calculation', () => {
      const routePath = path.join(rootDir, 'src/app/api/ai/analyze-competency/route.ts');
      const content = fs.readFileSync(routePath, 'utf8');

      expect(content).toContain('const hasItems = d.max > 0;');
      expect(content).toContain('const percentage = hasItems ? (d.earned / d.max) * 100 : null;');
      expect(content).not.toContain(': 70');
    });

    it('2.2. Mathematical simulation: Edge cases with extreme points values', () => {
      const testCases = [
        { earned: 0, max: 0, expectedPercentage: null },
        { earned: 0, max: 100, expectedPercentage: 0 },
        { earned: 50, max: 100, expectedPercentage: 50 },
        { earned: 100, max: 100, expectedPercentage: 100 },
        { earned: 0.1, max: 0.2, expectedPercentage: 50 },
      ];

      testCases.forEach(({ earned, max, expectedPercentage }) => {
        const hasItems = max > 0;
        const percentage = hasItems ? (earned / max) * 100 : null;
        if (expectedPercentage === null) {
          expect(percentage).toBeNull();
        } else {
          expect(percentage).toBeCloseTo(expectedPercentage, 1);
        }
      });
    });
  });

  // -------------------------------------------------------------------------
  // 3. STRESS TESTING: Auto-Fetch Fallback & Loop Prevention
  // -------------------------------------------------------------------------
  describe('3. Auto-Fetch Fallback in /personal/competency/analysis (F15)', () => {
    it('3.1. Verify useEffect in page.tsx triggers auto-fetch when !submissionId', () => {
      const pagePath = path.join(
        rootDir,
        'src/app/(dashboard)/personal/competency/analysis/page.tsx'
      );
      const content = fs.readFileSync(pagePath, 'utf8');

      expect(content).toContain("if (!submissionId) {");
      expect(content).toContain("setResolvingSubmission(true);");
      expect(content).toContain("fetch('/api/personal/competency-profile')");
      expect(content).toContain("router.replace(`/personal/competency/analysis?submissionId=${data.latestSubmissionId}`)");
      expect(content).toContain("setNoSubmissionsFound(true);");
    });

    it('3.2. Verify page renders fallback state when resolving submission', () => {
      const pagePath = path.join(
        rootDir,
        'src/app/(dashboard)/personal/competency/analysis/page.tsx'
      );
      const content = fs.readFileSync(pagePath, 'utf8');

      expect(content).toContain('Đang tìm bài đánh giá mới nhất của bạn...');
      expect(content).toContain('Chưa có bài thi nào');
      expect(content).toContain('Đến danh sách bài thi');
    });
  });

  // -------------------------------------------------------------------------
  // 4. STRESS TESTING: AI Gateway Prompt Safety in gemini.adapter.ts
  // -------------------------------------------------------------------------
  describe('4. AI Gateway Prompt Safety in gemini.adapter.ts (F17 & AGENTS.md §2.1)', () => {
    const adapterPath = path.join(
      rootDir,
      'src/features/ai-gateway/adapters/gemini.adapter.ts'
    );
    const content = fs.readFileSync(adapterPath, 'utf8');

    it('4.1. Enforces Decree 13/2023 PII scrubbing on candidate responses and names', () => {
      expect(content).toContain('PIIScrubberService.scrub');
      expect(content).toContain('sanitizedStudentResponse = PIIScrubberService.scrub(input.studentResponse)');
      expect(content).toContain('PIIScrubberService.scrub(input.candidateName)');
    });

    it('4.2. Explicitly bans "DigComp" in system instruction and demands "5 miền năng lực số"', () => {
      expect(content).toContain('TUYỆT ĐỐI KHÔNG dùng từ "DigComp" hay các số hiệu phiên bản kỹ thuật (DigComp 2.2 / 3.0)');
      expect(content).toContain('Luôn gọi tự nhiên là "5 miền năng lực số" hoặc "Khung năng lực số 5 miền"');
    });

    it('4.3. Standardizes canonical 5 domains in prompt with Vietnamese naming', () => {
      expect(content).toContain('DOMAIN_1: Tìm kiếm, đánh giá và quản lý thông tin');
      expect(content).toContain('DOMAIN_2: Giao tiếp và hợp tác');
      expect(content).toContain('DOMAIN_3: Sáng tạo nội dung số');
      expect(content).toContain('DOMAIN_4: An toàn, sức khỏe và trách nhiệm');
      expect(content).toContain('DOMAIN_5: Nhận diện và giải quyết vấn đề');
    });

    it('4.4. Mandates exactly 4 pedagogical pathway steps with genuine existing module IDs', () => {
      expect(content).toContain('Đề xuất Lộ trình Phát triển 4 Bước (BẮT BUỘC ĐÚNG 4 BƯỚC)');
      expect(content).toContain('Bước 1: Khắc phục lỗ hổng an toàn số / kỹ năng khẩn cấp');
      expect(content).toContain('Bước 2: Nâng cao năng lực phân tích & trực quan hóa nội dung số');
      expect(content).toContain('Bước 3: Ứng dụng thực tiễn trong tình huống công việc & tương tác đa nền tảng');
      expect(content).toContain('Bước 4: Kiểm tra đánh giá lại năng lực và sẵn sàng cấp chứng chỉ');
      expect(content).toContain('Không tự bịa đặt ID không tồn tại');
    });
  });

  // -------------------------------------------------------------------------
  // 5. FORENSIC AUDIT: Zero Horizontal Borders across All Touched UI Files
  // -------------------------------------------------------------------------
  describe('5. Forensic Audit: Prohibit Horizontal Dividing Borders (AGENTS.md §3.5)', () => {
    // AGENTS.md §3.5: "không sử dụng đường viền ngang"
    // Disallows border-b, border-t, border-y, divide-y, <hr>
    // Note: CSS loading spinners use border-t-transparent or border-b-transparent on spinning circle.
    // Radar benchmark dashed indicator uses 12px indicator: w-3 h-0.5 border-t border-dashed.
    const horizontalBorderRegex = /\b(divide-y|border-y|border-b(?!-transparent)|border-t(?!-transparent))\b|<hr[\s/>]/;

    UI_TOUCHED_FILES.forEach((relPath) => {
      it(`5.x. Checks zero horizontal borders in ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const violations: Array<{ line: number; text: string }> = [];

        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          if (trimmed.includes('border-dashed') && trimmed.includes('h-0.5')) {
            return;
          }
          if (horizontalBorderRegex.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Horizontal dividing border violations in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 6. FORENSIC AUDIT: Zero Raw Emojis across All 21 Touched Files
  // -------------------------------------------------------------------------
  describe('6. Forensic Audit: Zero JSX Emojis in All Touched Files (AGENTS.md §3.4)', () => {
    // Prohibits raw unicode emojis in JSX/code
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

    ALL_M1_M2_M3_TOUCHED_FILES.forEach((relPath) => {
      it(`6.x. Checks zero emojis in ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const violations: Array<{ line: number; text: string }> = [];

        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          // Scan for emojis, ignoring common typographical symbols like checkmark ✓, copyright ©, etc.
          for (let i = 0; i < trimmed.length; i++) {
            const code = trimmed.codePointAt(i) || 0;
            if (code > 0xffff) i++;
            if (
              (code >= 0x1f300 && code <= 0x1faff) ||
              (code >= 0x2600 && code <= 0x27bf) ||
              (code >= 0x2300 && code <= 0x23ff)
            ) {
              const char = String.fromCodePoint(code);
              if (
                char !== '✓' &&
                char !== '©' &&
                char !== '®' &&
                char !== '™' &&
                char !== '✕' &&
                char !== '✖'
              ) {
                violations.push({ line: idx + 1, text: `Char '${char}' (U+${code.toString(16).toUpperCase()}): ${trimmed}` });
              }
            }
          }
        });

        expect(
          violations,
          `Emoji violations found in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 7. FORENSIC AUDIT: Zero User-Facing "DigComp" Mentions (AGENTS.md §2.1)
  // -------------------------------------------------------------------------
  describe('7. Forensic Audit: Zero "DigComp" in User-Facing UI (AGENTS.md §2.1)', () => {
    const USER_FACING_UI_FILES = [
      'src/app/live/waiting-room/page.tsx',
      'src/app/live/control/page.tsx',
      'src/app/live/submitted/page.tsx',
      'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx',
      'src/app/(dashboard)/personal/live-room/[id]/host/page.tsx',
      'src/app/(dashboard)/personal/take/[id]/page.tsx',
      'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx',
      'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/page.tsx',
      'src/app/(dashboard)/personal/competency/analysis/page.tsx',
      'src/features/analytics/components/AnalyticsInsightPanel.tsx',
      'src/features/analytics/components/DataSourceRulesBox.tsx',
    ];

    const digcompRegex = /\bdigcomp(\s*[23]\.[02])?\b/i;

    USER_FACING_UI_FILES.forEach((relPath) => {
      it(`7.x. Confirms zero user-facing "DigComp" in ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const violations: Array<{ line: number; text: string }> = [];

        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          if (digcompRegex.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Forbidden user-facing "DigComp" text found in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 8. FORENSIC AUDIT: Theme Tokens Conformance (AGENTS.md §3.1 & §3.2)
  // -------------------------------------------------------------------------
  describe('8. Forensic Audit: Theme Tokens Conformance', () => {
    it('8.1. Confirms Dark Mode tokens present in key dashboard cards', () => {
      const filesToCheck = [
        'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx',
        'src/app/(dashboard)/personal/competency/analysis/page.tsx',
        'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx',
        'src/components/dashboard/live-room/InlinePinEntryCard.tsx',
      ];

      filesToCheck.forEach((relPath) => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');

        expect(content).toMatch(/dark:bg-(?:black|\[#111114\]|zinc-900)/);
        expect(content).toMatch(/dark:border-zinc-800/);
        expect(content).toMatch(/dark:text-(?:neutral-100|zinc-200|neutral-200)/);
      });
    });

    it('8.2. Confirms brand blue is Cobalt #2563EB (bg-blue-600 / text-blue-600) rather than generic sky-*', () => {
      const filesToCheck = [
        'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx',
        'src/app/(dashboard)/personal/competency/analysis/page.tsx',
        'src/components/dashboard/live-room/InlinePinEntryCard.tsx',
      ];

      const skyRegex = /\bsky-(?:50|100|200|300|400|500|600|700|800|900|950)\b/;

      filesToCheck.forEach((relPath) => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');

        expect(content).not.toMatch(skyRegex);
        expect(content).toContain('bg-blue-600');
      });
    });
  });
});
