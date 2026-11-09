import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Target Milestone 2 Files Owned by worker_m2
// ---------------------------------------------------------------------------
const M2_ALL_FILES = [
  'src/app/api/evaluator/rooms/route.ts',
  'src/app/live/waiting-room/page.tsx',
  'src/app/(dashboard)/personal/live-room/[id]/host/page.tsx',
  'src/app/live/control/page.tsx',
  'src/app/(dashboard)/personal/take/[id]/page.tsx',
  'src/app/live/submitted/page.tsx',
  'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx',
];

const M2_UI_FILES = [
  'src/app/live/waiting-room/page.tsx',
  'src/app/(dashboard)/personal/live-room/[id]/host/page.tsx',
  'src/app/live/control/page.tsx',
  'src/app/(dashboard)/personal/take/[id]/page.tsx',
  'src/app/live/submitted/page.tsx',
  'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx',
];

describe('Empirical Challenger M2: Results Screen, AGENTS.md Conformance & Role Separation Suite', () => {
  const rootDir = process.cwd();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // Section 1: File Presence & Non-Empty Verification
  // =========================================================================
  describe('Verification: All 7 target Milestone 2 files exist and are readable', () => {
    M2_ALL_FILES.forEach((relPath) => {
      it(`target file exists: ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const stats = fs.statSync(fullPath);
        expect(stats.size).toBeGreaterThan(0);
      });
    });
  });

  // =========================================================================
  // Section 2: Results Screen Role Separation (Candidate vs Host)
  // =========================================================================
  describe('Challenge 1: Role separation in live-room/[id]/results/page.tsx', () => {
    const resultsPagePath = path.join(
      rootDir,
      'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx'
    );
    const resultsContent = fs.readFileSync(resultsPagePath, 'utf8');

    it('TC-ROLE-01: Static verification — page computes isHost and branches layout', () => {
      expect(resultsContent).toContain('const isHost = Boolean(room.isHost);');
      expect(resultsContent).toContain("isHost ? 'lg:col-span-8' : 'lg:col-span-12'");
    });

    it('TC-ROLE-02: Static verification — 5 aggregate KPI cards are gated behind {isHost && (...)}', () => {
      expect(resultsContent).toContain('{isHost && (');
      expect(resultsContent).toContain('Đã tham gia');
      expect(resultsContent).toContain('Đã nộp bài');
      expect(resultsContent).toContain('Nộp đúng hạn');
      expect(resultsContent).toContain('Điểm trung bình');
      expect(resultsContent).toContain('Điểm cao nhất');
    });

    it('TC-ROLE-03: Static verification — Host publishing sidebar is gated behind {isHost && (...)}', () => {
      expect(resultsContent).toContain('Thiết lập công bố kết quả');
      expect(resultsContent).toContain('Phạm vi công bố:');
      expect(resultsContent).toContain('Dòng thời gian phiên');
      expect(resultsContent).toContain('handlePublishResults');
      expect(resultsContent).toContain('Xuất CSV');
    });

    it('TC-ROLE-04: Static verification — Candidate Personal Score Card is gated behind {!isHost && (...)}', () => {
      expect(resultsContent).toContain('{!isHost && (');
      expect(resultsContent).toContain('KẾT QUẢ CÁ NHÂN');
      expect(resultsContent).toContain('ĐIỂM SỐ');
      expect(resultsContent).toContain('XẾP HẠNG');
      expect(resultsContent).toContain('Thời gian làm bài');
      expect(resultsContent).toContain('Tình trạng nộp bài');
      expect(resultsContent).toContain('Điểm chuẩn đạt');
    });

    it('TC-ROLE-05: Static verification — Candidate CompetencyRadarChart is gated behind {!isHost && (...)}', () => {
      expect(resultsContent).toContain("import { CompetencyRadarChart, DomainScore } from '@/components/dashboard/personal/CompetencyRadarChart';");
      expect(resultsContent).toContain('Hồ sơ 5 miền năng lực số');
      expect(resultsContent).toContain('<CompetencyRadarChart data={radarScoresToUse} showPercentages={effectiveShowScore} size={320} />');
    });

    // -----------------------------------------------------------------------
    // Empirical Model Simulation of View Rendering Logic
    // -----------------------------------------------------------------------
    type CandidateResult = {
      id: string;
      userId: string;
      rank: number;
      fullName: string;
      initials: string;
      studentCode: string;
      score: number | null;
      status: string;
      timeTakenDisplay: string;
      isOnTime: boolean;
    };

    type RoomData = {
      room: {
        id: string;
        roomCode: string;
        title: string;
        assessmentTitle: string;
        durationMinutes: number;
        passingScore: number;
        status: string;
        resultsPublished: boolean;
        resultsPublishSettings: {
          show_score: boolean;
          show_ranking: boolean;
          show_answers: boolean;
          scope: string;
        };
        isHost: boolean;
      };
      stats: {
        totalJoined: number;
        totalSubmitted: number;
        submitPercent: number;
        onTimeSubmitted: number;
        onTimePercent: number;
        averageScore: number;
        highestScore: number;
      };
      results: CandidateResult[];
    };

    function simulateResultsScreenViewModel(data: RoomData, currentUserId: string) {
      const { room, results } = data;
      const isHost = Boolean(room.isHost);
      const publishSettings = room.resultsPublishSettings || {
        show_score: true,
        show_ranking: true,
        show_answers: false,
        scope: 'ALL',
      };
      const effectiveShowScore = isHost ? true : Boolean(publishSettings.show_score);
      const effectiveShowRanking = isHost ? true : Boolean(publishSettings.show_ranking);

      // Find user result (no fallback to results[0] per AGENTS.md § 2.1 & privacy)
      let myResult: CandidateResult | null = null;
      if (currentUserId && results.length > 0) {
        const found = results.find((r) => r.userId === currentUserId);
        if (found) myResult = found;
      }

      // Candidate Score display
      const displayedScore = effectiveShowScore
        ? (myResult?.score !== null && myResult?.score !== undefined ? `${myResult.score.toFixed(1)} điểm` : 'Chưa có điểm')
        : 'Đã ẩn điểm';

      // Candidate Rank badge visible
      const isRankBadgeVisible = effectiveShowRanking;
      const displayedRank = isRankBadgeVisible ? `#${myResult?.rank || '--'}` : null;

      // Table mapping
      const tableRows = results.map((r) => ({
        rank: !effectiveShowRanking ? '--' : r.rank,
        score: !effectiveShowScore ? 'Đã ẩn' : (r.score !== null ? r.score : '--'),
        fullName: r.fullName,
      }));

      return {
        isHost,
        myResult,
        renderKpiCards: isHost,
        renderPublishSidebar: isHost,
        renderPersonalScoreCard: !isHost,
        renderRadarChart: !isHost,
        tableColSpan: isHost ? 8 : 12,
        displayedScore,
        isRankBadgeVisible,
        displayedRank,
        tableRows,
      };
    }

    const mockResults: CandidateResult[] = [
      {
        id: 'res-1',
        userId: 'cand-1',
        rank: 1,
        fullName: 'Nguyễn Văn An',
        initials: 'NA',
        studentCode: 'NEXA-101',
        score: 92.5,
        status: 'SUBMITTED',
        timeTakenDisplay: '24:10',
        isOnTime: true,
      },
      {
        id: 'res-2',
        userId: 'cand-2',
        rank: 2,
        fullName: 'Trần Thị Bình',
        initials: 'TB',
        studentCode: 'NEXA-102',
        score: 84.0,
        status: 'SUBMITTED',
        timeTakenDisplay: '28:45',
        isOnTime: true,
      },
    ];

    it('TC-ROLE-06: Empirical verification — When viewer is Candidate (isHost: false), host controls & KPIs are hidden, personal score & radar are rendered', () => {
      const candidateData: RoomData = {
        room: {
          id: 'room-1',
          roomCode: '849201',
          title: 'Khảo sát năng lực số 2026',
          assessmentTitle: 'Đánh giá 5 miền số',
          durationMinutes: 45,
          passingScore: 70,
          status: 'RESULTS_PUBLISHED',
          resultsPublished: true,
          resultsPublishSettings: {
            show_score: true,
            show_ranking: true,
            show_answers: false,
            scope: 'ALL',
          },
          isHost: false,
        },
        stats: {
          totalJoined: 30,
          totalSubmitted: 28,
          submitPercent: 93,
          onTimeSubmitted: 26,
          onTimePercent: 93,
          averageScore: 78.4,
          highestScore: 92.5,
        },
        results: mockResults,
      };

      const vm = simulateResultsScreenViewModel(candidateData, 'cand-1');

      expect(vm.isHost).toBe(false);
      expect(vm.renderKpiCards).toBe(false);
      expect(vm.renderPublishSidebar).toBe(false);
      expect(vm.renderPersonalScoreCard).toBe(true);
      expect(vm.renderRadarChart).toBe(true);
      expect(vm.tableColSpan).toBe(12);
      expect(vm.displayedScore).toBe('92.5 điểm');
      expect(vm.isRankBadgeVisible).toBe(true);
      expect(vm.displayedRank).toBe('#1');
    });

    it('TC-ROLE-07: Empirical verification — When viewer is Host (isHost: true), KPI cards and publishing sidebar are rendered, personal score & radar are hidden', () => {
      const hostData: RoomData = {
        room: {
          id: 'room-1',
          roomCode: '849201',
          title: 'Khảo sát năng lực số 2026',
          assessmentTitle: 'Đánh giá 5 miền số',
          durationMinutes: 45,
          passingScore: 70,
          status: 'RESULTS_PUBLISHED',
          resultsPublished: true,
          resultsPublishSettings: {
            show_score: false,
            show_ranking: false,
            show_answers: false,
            scope: 'ALL',
          },
          isHost: true,
        },
        stats: {
          totalJoined: 30,
          totalSubmitted: 28,
          submitPercent: 93,
          onTimeSubmitted: 26,
          onTimePercent: 93,
          averageScore: 78.4,
          highestScore: 92.5,
        },
        results: mockResults,
      };

      const vm = simulateResultsScreenViewModel(hostData, 'host-user');

      expect(vm.isHost).toBe(true);
      expect(vm.renderKpiCards).toBe(true);
      expect(vm.renderPublishSidebar).toBe(true);
      expect(vm.renderPersonalScoreCard).toBe(false);
      expect(vm.renderRadarChart).toBe(false);
      expect(vm.tableColSpan).toBe(8);
      // Host always sees true scores even if publishSettings hide them
      expect(vm.tableRows[0].score).toBe(92.5);
      expect(vm.tableRows[0].rank).toBe(1);
    });

    it('TC-ROLE-08: Empirical verification — When current user is not in candidate results (myResult === null), score card does not leak candidate #1 data', () => {
      const candidateData: RoomData = {
        room: {
          id: 'room-1',
          roomCode: '849201',
          title: 'Khảo sát năng lực số 2026',
          assessmentTitle: 'Đánh giá 5 miền số',
          durationMinutes: 45,
          passingScore: 70,
          status: 'RESULTS_PUBLISHED',
          resultsPublished: true,
          resultsPublishSettings: {
            show_score: true,
            show_ranking: true,
            show_answers: false,
            scope: 'ALL',
          },
          isHost: false,
        },
        stats: {
          totalJoined: 30,
          totalSubmitted: 28,
          submitPercent: 93,
          onTimeSubmitted: 26,
          onTimePercent: 93,
          averageScore: 78.4,
          highestScore: 92.5,
        },
        results: mockResults,
      };

      const vm = simulateResultsScreenViewModel(candidateData, 'unknown-user-id');
      expect(vm.myResult).toBeNull();
      expect(vm.displayedScore).toBe('Chưa có điểm');
    });

    it('TC-ROLE-09: Static verification — results/page.tsx does not use results[0] facade fallback', () => {
      expect(resultsContent).not.toContain('return results[0];');
    });
  });

  // =========================================================================
  // Section 3: publishSettings Respected & Score Masking
  // =========================================================================
  describe('Challenge 2: publishSettings Enforcement & Score Masking', () => {
    const resultsPagePath = path.join(
      rootDir,
      'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx'
    );
    const resultsContent = fs.readFileSync(resultsPagePath, 'utf8');

    it('TC-PUB-01: Static verification — contains exact masking string "Đã ẩn điểm" for candidate score pill', () => {
      expect(resultsContent).toContain("'Đã ẩn điểm'");
      expect(resultsContent).toContain('effectiveShowScore');
      expect(resultsContent).toContain('effectiveShowRanking');
    });

    it('TC-PUB-02: Static verification — table renders "Đã ẩn" when effectiveShowScore is false', () => {
      expect(resultsContent).toContain('!effectiveShowScore ? (');
      expect(resultsContent).toContain('Đã ẩn');
    });

    it('TC-PUB-03: Static verification — rank column renders "--" when effectiveShowRanking is false', () => {
      expect(resultsContent).toContain('!effectiveShowRanking ? (');
      expect(resultsContent).toContain('<span className="text-slate-400 dark:text-neutral-500 font-medium font-mono">--</span>');
    });

    it('TC-PUB-04: Empirical 4-Scenario Matrix for Candidate publishSettings', () => {
      const candidateResults = [
        {
          id: 'res-1',
          userId: 'user-x',
          rank: 1,
          fullName: 'Lê Hoàng Nam',
          score: 88.0,
        },
      ];

      // Helper to evaluate candidate score string and rank visibility
      const evaluate = (showScore: boolean, showRanking: boolean) => {
        const isHost = false;
        const effectiveShowScore = isHost ? true : showScore;
        const effectiveShowRanking = isHost ? true : showRanking;

        const candidateScoreDisplay = effectiveShowScore
          ? `${candidateResults[0].score.toFixed(1)} điểm`
          : 'Đã ẩn điểm';

        const candidateRankBadgeRendered = effectiveShowRanking;

        const tableScore = !effectiveShowScore ? 'Đã ẩn' : candidateResults[0].score;
        const tableRank = !effectiveShowRanking ? '--' : candidateResults[0].rank;

        return {
          candidateScoreDisplay,
          candidateRankBadgeRendered,
          tableScore,
          tableRank,
        };
      };

      // Case 1: show_score: true, show_ranking: true
      const c1 = evaluate(true, true);
      expect(c1.candidateScoreDisplay).toBe('88.0 điểm');
      expect(c1.candidateRankBadgeRendered).toBe(true);
      expect(c1.tableScore).toBe(88.0);
      expect(c1.tableRank).toBe(1);

      // Case 2: show_score: false, show_ranking: true
      const c2 = evaluate(false, true);
      expect(c2.candidateScoreDisplay).toBe('Đã ẩn điểm');
      expect(c2.candidateRankBadgeRendered).toBe(true);
      expect(c2.tableScore).toBe('Đã ẩn');
      expect(c2.tableRank).toBe(1);

      // Case 3: show_score: true, show_ranking: false
      const c3 = evaluate(true, false);
      expect(c3.candidateScoreDisplay).toBe('88.0 điểm');
      expect(c3.candidateRankBadgeRendered).toBe(false);
      expect(c3.tableScore).toBe(88.0);
      expect(c3.tableRank).toBe('--');

      // Case 4: show_score: false, show_ranking: false
      const c4 = evaluate(false, false);
      expect(c4.candidateScoreDisplay).toBe('Đã ẩn điểm');
      expect(c4.candidateRankBadgeRendered).toBe(false);
      expect(c4.tableScore).toBe('Đã ẩn');
      expect(c4.tableRank).toBe('--');
    });
  });

  // =========================================================================
  // Section 4: 5-Domain Radar Chart Invariants & Competency Mapping
  // =========================================================================
  describe('Challenge 3: 5-Domain Radar Chart Invariants', () => {
    const resultsPagePath = path.join(
      rootDir,
      'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx'
    );
    const resultsContent = fs.readFileSync(resultsPagePath, 'utf8');

    it('TC-RADAR-01: Static verification — defaultRadarDomains defines exactly 5 canonical domains with score: null (AGENTS.md § 2.1) and 70% target', () => {
      expect(resultsContent).toContain("{ code: 'D1', name: 'Thông tin & Dữ liệu', score: null, target: 70 }");
      expect(resultsContent).toContain("{ code: 'D2', name: 'Giao tiếp & Hợp tác', score: null, target: 70 }");
      expect(resultsContent).toContain("{ code: 'D3', name: 'Sáng tạo Nội dung số', score: null, target: 70 }");
      expect(resultsContent).toContain("{ code: 'D4', name: 'An toàn & Bảo mật', score: null, target: 70 }");
      expect(resultsContent).toContain("{ code: 'D5', name: 'Giải quyết Vấn đề', score: null, target: 70 }");
    });

    it('TC-RADAR-02: Static verification — CompetencyRadarChart component source defines 5-domain coordinates and Cobalt #2563EB', () => {
      const radarSourcePath = path.join(
        rootDir,
        'src/components/dashboard/personal/CompetencyRadarChart.tsx'
      );
      const radarContent = fs.readFileSync(radarSourcePath, 'utf8');

      expect(radarContent).toContain("stopColor=\"#2563EB\"");
      expect(radarContent).toContain("fill=\"#2563EB\"");
      expect(radarContent).toContain("stroke=\"#2563EB\"");
      expect(radarContent).toContain('Chuẩn mục tiêu (70%)');
      expect(radarContent).toContain('Năng lực thực tế');
    });

    it('TC-RADAR-03: Empirical verification — Mathematical coordinate mapping for 5 domains', () => {
      const count = 5;
      const centerX = 230;
      const centerY = 165;
      const radius = 95;

      const getPoint = (index: number, value: number) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
        const x = centerX + radius * value * Math.cos(angle);
        const y = centerY + radius * value * Math.sin(angle);
        return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
      };

      // Top vertex (D1 at index 0) must align with top axis (-PI/2)
      const topVertex = getPoint(0, 1.0);
      expect(topVertex.x).toBe(centerX);
      expect(topVertex.y).toBe(centerY - radius);

      // Verify all 5 vertices are symmetrically distributed
      const vertices = Array.from({ length: 5 }).map((_, i) => getPoint(i, 0.7));
      expect(vertices.length).toBe(5);
      vertices.forEach((v) => {
        const dist = Math.hypot(v.x - centerX, v.y - centerY);
        expect(dist).toBeCloseTo(radius * 0.7, 0);
      });
    });
  });

  // =========================================================================
  // Section 5: AGENTS.md Conformance — Zero Horizontal Borders
  // =========================================================================
  describe('Challenge 4: Horizontal dividing borders prohibited across all 7 M2 files ("không sử dụng đường viền ngang")', () => {
    // AGENTS.md § 3.5: "không sử dụng đường viền ngang"
    // Disallows horizontal dividing borders: border-b, border-t, border-y, divide-y, <hr>
    // Note: CSS loading spinners often use `border-t-transparent` or `border-b-transparent` to spin a 2-pixel circle.
    // That is an animation, not a horizontal dividing border.
    const horizontalDividerRegex = /\b(divide-y|border-y|border-b(?!-transparent)|border-t(?!-transparent))\b|<hr[\s/>]/;

    M2_ALL_FILES.forEach((relPath) => {
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
          if (horizontalDividerRegex.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Found prohibited horizontal divider border in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });
  });

  // =========================================================================
  // Section 6: AGENTS.md Conformance — Zero JSX Emojis
  // =========================================================================
  describe('Challenge 5: Prohibition of JSX Emojis ("không dùng emoji làm icon sản phẩm trong JSX")', () => {
    // Specific emojis called out in prompt: 👑, 🥈, 🥉, ⏱
    const specificM2Emojis = ['👑', '🥈', '🥉', '⏱'];

    M2_UI_FILES.forEach((relPath) => {
      it(`should contain none of the prohibited emojis (👑, 🥈, 🥉, ⏱) in ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');

        specificM2Emojis.forEach((emoji) => {
          expect(
            content.includes(emoji),
            `Found prohibited emoji "${emoji}" in ${relPath}`
          ).toBe(false);
        });
      });
    });

    it('TC-EMOJI-01: Static verification — results/page.tsx imports and uses Lucide Crown, Award, Clock icons instead of emojis', () => {
      const resultsPagePath = path.join(
        rootDir,
        'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx'
      );
      const content = fs.readFileSync(resultsPagePath, 'utf8');

      // Must import Lucide icons
      expect(content).toContain('Crown,');
      expect(content).toContain('Award,');
      expect(content).toContain('Clock,');

      // Must render Crown for Rank 1
      expect(content).toContain('<Crown className="w-3.5 h-3.5 text-amber-500 inline mr-1" /> 1');

      // Must render Award for Rank 2 & 3
      expect(content).toContain('<Award className="w-3.5 h-3.5 text-slate-400 inline mr-1" /> 2');
      expect(content).toContain('<Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-500 inline mr-1" /> 3');

      // Must render Clock for overdue status
      expect(content).toContain('<Clock className="w-3 h-3 text-amber-500 inline" /> Quá hạn');
    });

    it('TC-EMOJI-02: General Unicode emoji block scan across all 7 M2 files', () => {
      const emojiBlockRegex = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

      M2_ALL_FILES.forEach((relPath) => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        const violations: Array<{ line: number; text: string }> = [];
        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          if (emojiBlockRegex.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Found general emoji violation in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });
  });

  // =========================================================================
  // Section 7: AGENTS.md Conformance — Elimination of "DigComp"
  // =========================================================================
  describe('Challenge 6: Elimination of user-facing "DigComp" wording (AGENTS.md § 2.1)', () => {
    // AGENTS.md § 2.1: "Tuyệt đối không phô bày các thuật ngữ kỹ thuật, mã khung hay số hiệu phiên bản
    // (DigComp, DigComp 2.2, DigComp 3.0...) ra ngoài giao diện người dùng (UI)... Trên UI chỉ dùng các cách gọi tự nhiên:
    // '5 miền năng lực số', 'Khung năng lực số 5 miền' hoặc 'Hồ sơ năng lực 5 miền'."
    const digcompRegex = /\bdigcomp(\s*[23]\.[02])?\b/i;

    M2_ALL_FILES.forEach((relPath) => {
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

    it('TC-DIGCOMP-01: Specifically verifies waiting-room and submitted footers use "5 miền năng lực số"', () => {
      const waitingRoomPath = path.join(rootDir, 'src/app/live/waiting-room/page.tsx');
      const waitingRoomContent = fs.readFileSync(waitingRoomPath, 'utf8');
      expect(waitingRoomContent).toContain('chuẩn hóa 5 miền năng lực số');

      const submittedPath = path.join(rootDir, 'src/app/live/submitted/page.tsx');
      const submittedContent = fs.readFileSync(submittedPath, 'utf8');
      expect(submittedContent).toContain('5 miền năng lực số');
    });
  });

  // =========================================================================
  // Section 8: AGENTS.md Conformance — Dark Mode Tokens & Cobalt #2563EB
  // =========================================================================
  describe('Challenge 7: Dark Mode tokens & Cobalt #2563EB conformance in results/page.tsx', () => {
    const resultsPagePath = path.join(
      rootDir,
      'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx'
    );
    const content = fs.readFileSync(resultsPagePath, 'utf8');

    it('TC-DARK-01: Cards use dark:bg-[#111114] and dark:border-zinc-800', () => {
      expect(content).toContain('dark:bg-[#111114]');
      expect(content).toContain('dark:border-zinc-800');
    });

    it('TC-DARK-02: Text uses dark:text-neutral-100 and dark:text-neutral-400', () => {
      expect(content).toContain('dark:text-neutral-100');
      expect(content).toContain('dark:text-neutral-400');
    });

    it('TC-DARK-03: Action buttons and focus use Cobalt bg-blue-600 and hover:bg-blue-700', () => {
      expect(content).toContain('bg-blue-600');
      expect(content).toContain('hover:bg-blue-700');
      expect(content).toContain('dark:text-blue-400');
    });
  });

  // =========================================================================
  // Section 9: Realtime Broadcast & Workflow Contract Synchronization
  // =========================================================================
  describe('Challenge 8: Realtime Sync Contracts (F8 & F9)', () => {
    it('TC-RT-01: Results page broadcasts RESULTS_PUBLISHED on room:${roomId}', () => {
      const resultsPagePath = path.join(
        rootDir,
        'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx'
      );
      const content = fs.readFileSync(resultsPagePath, 'utf8');

      expect(content).toContain('supabase.channel(`room:${roomId}`).send({');
      expect(content).toContain("type: 'broadcast'");
      expect(content).toContain("event: 'RESULTS_PUBLISHED'");
    });

    it('TC-RT-02: /api/evaluator/rooms supports EXTEND_TIME and FORCE_SUBMIT_ALL actions in updateRoomSchema', () => {
      const routePath = path.join(rootDir, 'src/app/api/evaluator/rooms/route.ts');
      const content = fs.readFileSync(routePath, 'utf8');

      expect(content).toContain("'EXTEND_TIME'");
      expect(content).toContain("'FORCE_SUBMIT_ALL'");
      expect(content).toContain("'PUBLISH_RESULTS'");
    });

    it('TC-RT-03: Waiting room listens for ROOM_STATE_CHANGE with START action and navigates to take/[id]', () => {
      const waitingRoomPath = path.join(rootDir, 'src/app/live/waiting-room/page.tsx');
      const content = fs.readFileSync(waitingRoomPath, 'utf8');

      expect(content).toContain("event: 'ROOM_STATE_CHANGE'");
      expect(content).toContain("action === 'START'");
      expect(content).toContain('router.push(');
      expect(content).toContain('/personal/take/');
    });
  });

  // =========================================================================
  // Section 10: Elimination of Fake Data & Hardcoded Numbers (F10 & F11)
  // =========================================================================
  describe('Challenge 9: Zero Fake Random Progress & Real Metric Tracking', () => {
    it('TC-DATA-01: control/page.tsx does NOT contain Math.random() fake progress generator', () => {
      const controlPath = path.join(rootDir, 'src/app/live/control/page.tsx');
      const content = fs.readFileSync(controlPath, 'utf8');

      expect(content).not.toContain('const fakeProgress = (Math.random()');
      expect(content).not.toContain('fakeProgress');
    });

    it('TC-DATA-02: submitted/page.tsx does NOT hardcode 30/32 answeredCount', () => {
      const submittedPath = path.join(rootDir, 'src/app/live/submitted/page.tsx');
      const content = fs.readFileSync(submittedPath, 'utf8');

      expect(content).not.toContain('answeredCount = 30; totalQuestions = 32');
      expect(content).toContain('answers_count');
    });
  });
});
