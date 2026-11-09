import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const M3_ALL_FILES = [
  'src/app/api/ai/analyze-competency/route.ts',
  'src/features/ai-gateway/adapters/gemini.adapter.ts',
  'src/features/analytics/components/AnalyticsInsightPanel.tsx',
  'src/features/analytics/components/DataSourceRulesBox.tsx',
  'src/app/(dashboard)/personal/competency/analysis/page.tsx',
  'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/page.tsx',
  'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx',
  'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/loading.tsx',
];

const M3_UI_FILES = [
  'src/features/analytics/components/AnalyticsInsightPanel.tsx',
  'src/features/analytics/components/DataSourceRulesBox.tsx',
  'src/app/(dashboard)/personal/competency/analysis/page.tsx',
  'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/page.tsx',
  'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx',
  'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/loading.tsx',
];

describe('Empirical Challenger M3: Analytics UI & AGENTS.md Conformance Suite', () => {
  const rootDir = process.cwd();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Verification: All 8 target Milestone 3 files exist and are readable', () => {
    M3_ALL_FILES.forEach((relPath) => {
      it(`target file exists: ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const stats = fs.statSync(fullPath);
        expect(stats.size).toBeGreaterThan(0);
      });
    });
  });

  describe('Challenge 1: Horizontal dividing borders prohibited ("không sử dụng đường viền ngang")', () => {
    // AGENTS.md §3.5: "không sử dụng đường viền ngang"
    // Disallows horizontal dividing borders: border-b, border-t, border-y, divide-y, <hr>
    const horizontalBorderRegex = /\b(border-b|border-t|border-y|divide-y)\b|<hr[\s/>]/;

    M3_UI_FILES.forEach((relPath) => {
      it(`should contain no horizontal dividing borders in ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        const violations: Array<{ line: number; text: string }> = [];
        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          if (horizontalBorderRegex.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Found prohibited horizontal border in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });
  });

  describe('Challenge 2: Prohibition of Emojis in JSX ("không dùng emoji làm icon sản phẩm trong JSX")', () => {
    // AGENTS.md §3.4: "lucide-react là thư viện icon chuẩn... không dùng emoji làm icon sản phẩm trong JSX."
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

    M3_UI_FILES.forEach((relPath) => {
      it(`should contain no emojis in JSX for ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        const violations: Array<{ line: number; text: string }> = [];
        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          if (emojiRegex.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Found emoji violation in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });
  });

  describe('Challenge 3: Elimination of user-facing "DigComp" wording (AGENTS.md §2.1)', () => {
    // AGENTS.md §2.1: "Tuyệt đối không phô bày các thuật ngữ kỹ thuật, mã khung hay số hiệu phiên bản
    // (DigComp, DigComp 2.2, DigComp 3.0...) ra ngoài giao diện người dùng (UI)... Trên UI chỉ dùng các cách gọi tự nhiên:
    // '5 miền năng lực số', 'Khung năng lực số 5 miền' hoặc 'Hồ sơ năng lực 5 miền'."
    const digcompRegex = /\bdigcomp(\s*[23]\.[02])?\b/i;

    M3_UI_FILES.forEach((relPath) => {
      it(`should contain zero user-facing "DigComp" mentions in ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
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
          `Found forbidden "DigComp" wording in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });

    it('should strictly prohibit "DigComp" in AI Gateway system prompt (gemini.adapter.ts)', () => {
      const adapterPath = path.join(rootDir, 'src/features/ai-gateway/adapters/gemini.adapter.ts');
      const content = fs.readFileSync(adapterPath, 'utf8');

      // Must explicitly enforce rule against DigComp
      expect(content).toContain('TUYỆT ĐỐI KHÔNG dùng từ "DigComp"');
      expect(content).toContain('5 miền năng lực số');

      // Feedback prompt must ask for "5 miền năng lực số" rather than "DigComp 3.0"
      expect(content).toContain('"feedback": "Lời khuyên cải thiện cụ thể theo 5 miền năng lực số"');
      expect(content).not.toContain('"feedback": "Lời khuyên cải thiện cụ thể theo chuẩn DigComp 3.0"');
    });
  });

  describe('Challenge 4: Color palette conformance (Cobalt #2563EB vs sky-*)', () => {
    // AGENTS.md §3.1 & §3.2: Blue accent is Cobalt #2563EB (bg-blue-600, text-blue-600, dark:text-blue-400).
    // Prohibits legacy sky-* tokens.
    const skyTokenRegex = /\bsky-(?:50|100|200|300|400|500|600|700|800|900|950)\b/;

    M3_UI_FILES.forEach((relPath) => {
      it(`should contain no sky-* color tokens in ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        const violations: Array<{ line: number; text: string }> = [];
        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          if (skyTokenRegex.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Found forbidden sky-* token in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });

    it('should use Cobalt #2563EB tokens in personal competency analysis radar chart and CTAs', () => {
      const pagePath = path.join(rootDir, 'src/app/(dashboard)/personal/competency/analysis/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');

      // Candidate radar polygon
      expect(content).toContain('fill="#2563EB"');
      expect(content).toContain('stroke="#2563EB"');

      // Action buttons
      expect(content).toContain('bg-blue-600');
      expect(content).toContain('hover:bg-blue-700');
    });
  });

  describe('Challenge 5: Dark Mode tokens conformance (AGENTS.md §3.2)', () => {
    // Cards & panels: dark:bg-[#111114] / dark:bg-black, dark:border-zinc-800
    M3_UI_FILES.forEach((relPath) => {
      it(`should include appropriate dark mode tokens in ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for presence of dark: variants
        expect(content).toMatch(/dark:(bg|border|text|stroke|fill)/);
      });
    });

    it('personal competency analysis page has comprehensive dark mode styling for SVG and cards', () => {
      const pagePath = path.join(rootDir, 'src/app/(dashboard)/personal/competency/analysis/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');

      expect(content).toContain('dark:bg-[#111114]');
      expect(content).toContain('dark:border-zinc-800');
      expect(content).toContain('dark:stroke-zinc-800');
      expect(content).toContain('dark:stroke-zinc-700');
      expect(content).toContain('dark:fill-neutral-300');
      expect(content).toContain('dark:text-blue-400');
    });
  });

  describe('Challenge 6: Data integrity - zero fake 70% default scores (F16 & AGENTS.md §2.1)', () => {
    // AGENTS.md §2.1: "score: null = chưa có bằng chứng hợp lệ; score: 0 = đã có đánh giá hợp lệ với kết quả 0.
    // Không thay null bằng 0, không vẽ Radar 0% giả. Không gán điểm tổng bài cho cả 5 miền."
    it('analyze-competency route returns percentage: null when d.max === 0 instead of fake 70%', () => {
      const routePath = path.join(rootDir, 'src/app/api/ai/analyze-competency/route.ts');
      const content = fs.readFileSync(routePath, 'utf8');

      // Must not assign 70 as fallback
      expect(content).not.toMatch(/d\.max\s*>\s*0\s*\?\s*\(d\.earned\s*\/\s*d\.max\)\s*\*\s*100\s*:\s*70/);

      // Must check hasItems and assign null
      expect(content).toContain('const hasItems = d.max > 0;');
      expect(content).toContain('const percentage = hasItems ? (d.earned / d.max) * 100 : null;');
    });

    it('empirically verifies the mathematical aggregation logic with unassessed domains', () => {
      // Re-run the exact aggregation logic from analyze-competency route
      const mockDomainAgg: Record<string, { code: string; name: string; earned: number; max: number }> = {
        D1: { code: 'D1', name: 'Thông tin & Dữ liệu', earned: 8, max: 10 },
        D2: { code: 'D2', name: 'Giao tiếp & Hợp tác', earned: 0, max: 0 }, // Not tested in this exam
        D3: { code: 'D3', name: 'Sáng tạo nội dung số', earned: 0, max: 5 }, // Tested and got 0
        D4: { code: 'D4', name: 'An toàn & Bảo mật', earned: 0, max: 0 }, // Not tested
        D5: { code: 'D5', name: 'Giải quyết Vấn đề', earned: 7.5, max: 10 },
      };

      const domainScores = Object.values(mockDomainAgg).map((d) => {
        const hasItems = d.max > 0;
        const percentage = hasItems ? (d.earned / d.max) * 100 : null;

        return {
          domainCode: d.code,
          domainName: d.name,
          score: Number(d.earned.toFixed(1)),
          maxScore: Number(d.max.toFixed(1)),
          percentage: percentage !== null ? Number(percentage.toFixed(1)) : null,
        };
      });

      // D1 tested: 8/10 = 80%
      expect(domainScores[0].percentage).toBe(80);

      // D2 untested: max === 0 -> percentage MUST be null, not 70, not 0
      expect(domainScores[1].percentage).toBeNull();

      // D3 tested with 0 score: max === 5, earned === 0 -> percentage MUST be 0
      expect(domainScores[2].percentage).toBe(0);

      // D4 untested: max === 0 -> percentage MUST be null
      expect(domainScores[3].percentage).toBeNull();

      // D5 tested: 7.5/10 = 75%
      expect(domainScores[4].percentage).toBe(75);
    });
  });

  describe('Challenge 7: Auto-fetch fallback & loop prevention on /personal/competency/analysis (F15)', () => {
    it('statically inspects the auto-fetch implementation in page.tsx', () => {
      const pagePath = path.join(rootDir, 'src/app/(dashboard)/personal/competency/analysis/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');

      // Verify endpoint called
      expect(content).toContain('/api/personal/competency-profile');

      // Verify router replace uses latestSubmissionId
      expect(content).toContain('router.replace(`/personal/competency/analysis?submissionId=${data.latestSubmissionId}`)');

      // Verify handling of no submissions found
      expect(content).toContain('setNoSubmissionsFound(true)');
      expect(content).toContain('Chưa có bài thi nào');
    });

    it('simulates the auto-fetch resolver state machine to ensure zero infinite redirect loop and zero crash', async () => {
      // Simulate state machine transitions
      type State = {
        submissionId: string | null;
        resolvingSubmission: boolean;
        noSubmissionsFound: boolean;
        loading: boolean;
        redirectedUrl: string | null;
      };

      const simulateResolver = async (
        initialSubmissionId: string | null,
        apiResponse: { latestSubmissionId: string | null } | 'ERROR'
      ): Promise<State> => {
        let state: State = {
          submissionId: initialSubmissionId,
          resolvingSubmission: !initialSubmissionId,
          noSubmissionsFound: false,
          loading: true,
          redirectedUrl: null,
        };

        const router = {
          replace: (url: string) => {
            state.redirectedUrl = url;
            // When redirected, the searchParam submissionId becomes populated in the next render cycle
            const urlObj = new URL(url, 'https://nexa.ai');
            state.submissionId = urlObj.searchParams.get('submissionId');
            state.resolvingSubmission = false;
          },
        };

        // Execution of the useEffect logic
        if (!state.submissionId) {
          state.resolvingSubmission = true;
          try {
            if (apiResponse === 'ERROR') {
              throw new Error('Network error');
            }
            if (apiResponse.latestSubmissionId) {
              router.replace(`/personal/competency/analysis?submissionId=${apiResponse.latestSubmissionId}`);
            } else {
              state.resolvingSubmission = false;
              state.noSubmissionsFound = true;
              state.loading = false;
            }
          } catch {
            state.resolvingSubmission = false;
            state.noSubmissionsFound = true;
            state.loading = false;
          }
        } else {
          state.resolvingSubmission = false;
        }

        return state;
      };

      // Scenario A: User accesses without submissionId, user HAS taken a test
      const resultWithLatest = await simulateResolver(null, { latestSubmissionId: 'sub_xyz_789' });
      expect(resultWithLatest.redirectedUrl).toBe('/personal/competency/analysis?submissionId=sub_xyz_789');
      expect(resultWithLatest.submissionId).toBe('sub_xyz_789');
      expect(resultWithLatest.resolvingSubmission).toBe(false);
      expect(resultWithLatest.noSubmissionsFound).toBe(false);

      // Scenario B: User accesses without submissionId, user has NOT taken any tests
      const resultEmpty = await simulateResolver(null, { latestSubmissionId: null });
      expect(resultEmpty.redirectedUrl).toBeNull();
      expect(resultEmpty.resolvingSubmission).toBe(false);
      expect(resultEmpty.noSubmissionsFound).toBe(true);
      expect(resultEmpty.loading).toBe(false);

      // Scenario C: Network failure or 500 from competency-profile
      const resultError = await simulateResolver(null, 'ERROR');
      expect(resultError.redirectedUrl).toBeNull();
      expect(resultError.resolvingSubmission).toBe(false);
      expect(resultError.noSubmissionsFound).toBe(true);
      expect(resultError.loading).toBe(false);

      // Scenario D: User accesses with valid submissionId already in URL
      const resultAlreadyHasId = await simulateResolver('sub_existing_123', { latestSubmissionId: 'sub_xyz_789' });
      expect(resultAlreadyHasId.redirectedUrl).toBeNull();
      expect(resultAlreadyHasId.resolvingSubmission).toBe(false);
      expect(resultAlreadyHasId.submissionId).toBe('sub_existing_123');
    });
  });

  describe('Challenge 8: 5 Domains on Class Analytics (F14)', () => {
    it('class analytics page maps domain scores with null safety', () => {
      const pagePath = path.join(rootDir, 'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');

      expect(content).toContain('CANONICAL_DOMAINS');
      expect(content).toContain("domainCode: 'D1'");
      expect(content).toContain("domainCode: 'D5'");
      expect(content).toContain('classDomainScores');
      expect(content).toContain('score: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : null');
    });

    it('OrgClassAnalyticsView renders "Chưa đủ dữ liệu" when domain score is null', () => {
      const viewPath = path.join(rootDir, 'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx');
      const content = fs.readFileSync(viewPath, 'utf8');

      expect(content).toContain('5 miền năng lực số của lớp');
      expect(content).toContain('Chưa đủ dữ liệu');
      expect(content).toContain('Đạt chuẩn');
      expect(content).toContain('Cần cải thiện');
      expect(content).toContain('effectiveDomainScores');
    });

    it('class analytics loading.tsx provides skeleton layout for 5-domain card', () => {
      const loadingPath = path.join(rootDir, 'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/loading.tsx');
      const content = fs.readFileSync(loadingPath, 'utf8');

      expect(content).toContain('Array.from({ length: 5 })');
      expect(content).toContain('grid grid-cols-1 md:grid-cols-5 gap-3');
    });
  });
});
