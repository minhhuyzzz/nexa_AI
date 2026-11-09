import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  CANONICAL_DOMAINS,
  OrgCompetencyAnalyticsService,
  type RawAnalyticsSubmission,
} from '@/features/analytics/services/org-competency-analytics.service';
import type { OrgClassItem } from '@/components/dashboard/org/classes/types';

export interface ClassDomainScoreItem {
  domainCode: 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
  name: string;
  score: number | null;
  testedCount: number;
}

/**
 * ============================================================================
 * CHALLENGER M3: EMPIRICAL CALCULATION & DOMAIN SCORING STRESS TEST
 * ============================================================================
 * 
 * Objectives:
 * 1. Verify `src/app/api/ai/analyze-competency/route.ts` line 430 logic:
 *    - When d.max === 0 (unassessed domain), returns percentage: null
 *    - When d.max > 0 and d.earned === 0, returns percentage: 0
 *    - NEVER returns 70% as default
 * 2. Verify class 5-domain scores aggregation logic:
 *    - Empty submissions list returns score: null for all 5 domains, no NaN, no div/0
 *    - Partial domains (e.g. only D1 and D2 have scores, while D3, D4, D5 are untested)
 *    - Student with 0 score in D1 (distinguishes 0 score vs unassessed null)
 * 3. Verify OrgClassAnalyticsView UI presentation logic reflects null vs 0 correctly
 * 4. Verify AGENTS.md compliance: no fake 70%, no horizontal borders, no emojis in JSX, no "DigComp"
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// Helper: Replicate exact class domain score aggregation logic from:
// src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/page.tsx:205-254
// ---------------------------------------------------------------------------
interface SubWithDomainScores {
  id?: string;
  status: string;
  domain_scores?: Record<string, any> | null;
  percentage?: number | null;
}

function calculateClassDomainScores(evaluatedSubs: SubWithDomainScores[]) {
  const CANONICAL: Array<{
    domainCode: 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
    name: string;
  }> = [
    { domainCode: 'D1', name: 'Thông tin & Dữ liệu' },
    { domainCode: 'D2', name: 'Giao tiếp & Hợp tác' },
    { domainCode: 'D3', name: 'Sáng tạo nội dung số' },
    { domainCode: 'D4', name: 'An toàn & Bảo mật' },
    { domainCode: 'D5', name: 'Giải quyết Vấn đề' },
  ];

  const classDomainSums: Record<'D1' | 'D2' | 'D3' | 'D4' | 'D5', { sum: number; count: number }> = {
    D1: { sum: 0, count: 0 },
    D2: { sum: 0, count: 0 },
    D3: { sum: 0, count: 0 },
    D4: { sum: 0, count: 0 },
    D5: { sum: 0, count: 0 },
  };

  evaluatedSubs.forEach((sub: any) => {
    if (sub.domain_scores && typeof sub.domain_scores === 'object') {
      Object.entries(sub.domain_scores).forEach(([rawKey, val]) => {
        if (typeof val === 'number') {
          let code: 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | null = null;
          const upper = rawKey.toUpperCase();
          if (upper === 'D1' || upper === 'DOMAIN_1' || upper === 'DOMAIN1' || upper === '1' || upper === '01') code = 'D1';
          else if (upper === 'D2' || upper === 'DOMAIN_2' || upper === 'DOMAIN2' || upper === '2' || upper === '02') code = 'D2';
          else if (upper === 'D3' || upper === 'DOMAIN_3' || upper === 'DOMAIN3' || upper === '3' || upper === '03') code = 'D3';
          else if (upper === 'D4' || upper === 'DOMAIN_4' || upper === 'DOMAIN4' || upper === '4' || upper === '04') code = 'D4';
          else if (upper === 'D5' || upper === 'DOMAIN_5' || upper === 'DOMAIN5' || upper === '5' || upper === '05') code = 'D5';

          if (code && classDomainSums[code]) {
            classDomainSums[code].sum += val;
            classDomainSums[code].count += 1;
          }
        }
      });
    }
  });

  return CANONICAL.map((d) => {
    const data = classDomainSums[d.domainCode];
    return {
      domainCode: d.domainCode,
      name: d.name,
      score: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : null,
      testedCount: data.count,
    };
  });
}

// ---------------------------------------------------------------------------
// Helper: Replicate exact domain scoring calculation from:
// src/app/api/ai/analyze-competency/route.ts:428-447
// ---------------------------------------------------------------------------
interface AggScore {
  earned: number;
  max: number;
  name: string;
  code: string;
}

function calculateAnalyzeCompetencyDomainScores(domainAgg: Record<string, AggScore>) {
  return Object.values(domainAgg).map((d) => {
    const hasItems = d.max > 0;
    const percentage = hasItems ? (d.earned / d.max) * 100 : null;

    return {
      domainCode: d.code,
      domainName: d.name,
      score: Number(d.earned.toFixed(1)),
      maxScore: Number(d.max.toFixed(1)),
      percentage: percentage !== null ? Number(percentage.toFixed(1)) : (null as unknown as number),
    };
  });
}

// ---------------------------------------------------------------------------
// Helper: Replicate exact UI view rendering model from OrgClassAnalyticsView.tsx
// ---------------------------------------------------------------------------
function formatDomainCardDisplay(domain: ClassDomainScoreItem) {
  const hasScore = domain.score !== null;
  return {
    hasScore,
    scoreDisplay: hasScore ? `${domain.score}%` : 'Chưa đủ dữ liệu',
    badgeText: hasScore ? (domain.score! >= 70 ? 'Đạt chuẩn' : 'Cần cải thiện') : null,
    testedDisplay: domain.testedCount > 0 ? `${domain.testedCount} bài` : '0 bài',
    progressPercent: hasScore ? Math.min(100, Math.max(0, domain.score!)) : 0,
    progressColor: hasScore ? (domain.score! >= 70 ? 'bg-blue-600' : 'bg-amber-500') : null,
  };
}

describe('Challenger M3: Empirical Calculation & Hardening Test Suite', () => {
  const rootDir = process.cwd();

  // =========================================================================
  // OBJECTIVE 1: Verify analyze-competency route line 430 logic
  // =========================================================================
  describe('Objective 1: analyze-competency Domain Score Calculation Logic', () => {
    it('1.1. Returns percentage: null when d.max === 0 (unassessed domain)', () => {
      const mockDomainAgg: Record<string, AggScore> = {
        DOMAIN_1: { earned: 0, max: 0, name: 'Thông tin và dữ liệu', code: 'DOMAIN_1' },
      };

      const result = calculateAnalyzeCompetencyDomainScores(mockDomainAgg);
      expect(result).toHaveLength(1);
      expect(result[0].domainCode).toBe('DOMAIN_1');
      expect(result[0].score).toBe(0);
      expect(result[0].maxScore).toBe(0);
      expect(result[0].percentage).toBeNull();
      // Strict null check: neither 70, nor 0, nor NaN, nor undefined
      expect(result[0].percentage).not.toBe(70);
      expect(result[0].percentage).not.toBe(0);
      expect(Number.isNaN(result[0].percentage)).toBe(false);
    });

    it('1.2. Returns percentage: 0 when d.max > 0 and d.earned === 0 (assessed but scored 0)', () => {
      const mockDomainAgg: Record<string, AggScore> = {
        DOMAIN_1: { earned: 0, max: 30, name: 'Thông tin và dữ liệu', code: 'DOMAIN_1' },
      };

      const result = calculateAnalyzeCompetencyDomainScores(mockDomainAgg);
      expect(result).toHaveLength(1);
      expect(result[0].domainCode).toBe('DOMAIN_1');
      expect(result[0].score).toBe(0);
      expect(result[0].maxScore).toBe(30);
      expect(result[0].percentage).toBe(0);
      // Strictly 0, not null and not 70
      expect(result[0].percentage).not.toBeNull();
      expect(result[0].percentage).not.toBe(70);
    });

    it('1.3. Returns genuine earned percentage and NEVER defaults to 70% when unassessed', () => {
      const mockDomainAgg: Record<string, AggScore> = {
        DOMAIN_1: { earned: 40, max: 50, name: 'Thông tin và dữ liệu', code: 'DOMAIN_1' }, // 80%
        DOMAIN_2: { earned: 35, max: 50, name: 'Giao tiếp và hợp tác', code: 'DOMAIN_2' }, // 70% legitimate
        DOMAIN_3: { earned: 0, max: 0, name: 'Sáng tạo nội dung số', code: 'DOMAIN_3' },   // unassessed -> null
        DOMAIN_4: { earned: 0, max: 0, name: 'An toàn số', code: 'DOMAIN_4' },             // unassessed -> null
        DOMAIN_5: { earned: 0, max: 0, name: 'Giải quyết vấn đề', code: 'DOMAIN_5' },      // unassessed -> null
      };

      const result = calculateAnalyzeCompetencyDomainScores(mockDomainAgg);
      expect(result).toHaveLength(5);

      const d1 = result.find((d) => d.domainCode === 'DOMAIN_1')!;
      const d2 = result.find((d) => d.domainCode === 'DOMAIN_2')!;
      const d3 = result.find((d) => d.domainCode === 'DOMAIN_3')!;
      const d4 = result.find((d) => d.domainCode === 'DOMAIN_4')!;
      const d5 = result.find((d) => d.domainCode === 'DOMAIN_5')!;

      expect(d1.percentage).toBe(80);
      expect(d2.percentage).toBe(70); // Legitimate 35/50 earned
      expect(d3.percentage).toBeNull(); // NEVER 70 default!
      expect(d4.percentage).toBeNull(); // NEVER 70 default!
      expect(d5.percentage).toBeNull(); // NEVER 70 default!
    });

    it('1.4. Empirically scans route source code file to ensure no ": 70" default remains in analyze-competency', () => {
      const targetFilePath = path.join(rootDir, 'src/app/api/ai/analyze-competency/route.ts');
      expect(fs.existsSync(targetFilePath)).toBe(true);

      const content = fs.readFileSync(targetFilePath, 'utf8');

      // The old vulnerable line was:
      // const percentage = d.max > 0 ? (d.earned / d.max) * 100 : 70;
      expect(content).not.toContain('(d.earned / d.max) * 100 : 70');
      expect(content).not.toContain(': 70;');

      // Verify the hardened implementation is present
      expect(content).toContain('const hasItems = d.max > 0;');
      expect(content).toContain('const percentage = hasItems ? (d.earned / d.max) * 100 : null;');
      expect(content).toContain('percentage: percentage !== null ? Number(percentage.toFixed(1)) : (null as unknown as number)');
    });
  });

  // =========================================================================
  // OBJECTIVE 2: Verify class 5-domain scores aggregation logic
  // =========================================================================
  describe('Objective 2: Class 5-Domain Scores Aggregation Logic', () => {
    it('2.1. Empty submissions list returns score: null for all 5 domains, no NaN, no division by zero', () => {
      const emptySubs: SubWithDomainScores[] = [];
      const result = calculateClassDomainScores(emptySubs);

      expect(result).toHaveLength(5);
      result.forEach((domain) => {
        expect(domain.score).toBeNull();
        expect(domain.testedCount).toBe(0);
        expect(Number.isNaN(domain.score)).toBe(false);
      });

      // Verify domain codes are canonical D1..D5
      expect(result.map((d) => d.domainCode)).toEqual(['D1', 'D2', 'D3', 'D4', 'D5']);
    });

    it('2.2. Only D1 and D2 have scores, while D3, D4, D5 are untested', () => {
      const subs: SubWithDomainScores[] = [
        {
          status: 'EVALUATED',
          domain_scores: { D1: 80, D2: 60 },
        },
        {
          status: 'EVALUATED',
          domain_scores: { D1: 90, D2: 70 },
        },
      ];

      const result = calculateClassDomainScores(subs);
      expect(result).toHaveLength(5);

      const d1 = result.find((d) => d.domainCode === 'D1')!;
      const d2 = result.find((d) => d.domainCode === 'D2')!;
      const d3 = result.find((d) => d.domainCode === 'D3')!;
      const d4 = result.find((d) => d.domainCode === 'D4')!;
      const d5 = result.find((d) => d.domainCode === 'D5')!;

      // D1: (80 + 90) / 2 = 85
      expect(d1.score).toBe(85);
      expect(d1.testedCount).toBe(2);

      // D2: (60 + 70) / 2 = 65
      expect(d2.score).toBe(65);
      expect(d2.testedCount).toBe(2);

      // D3, D4, D5 must be strictly null with testedCount 0
      expect(d3.score).toBeNull();
      expect(d3.testedCount).toBe(0);
      expect(d4.score).toBeNull();
      expect(d4.testedCount).toBe(0);
      expect(d5.score).toBeNull();
      expect(d5.testedCount).toBe(0);
    });

    it('2.3. Student has 0 score in D1 (distinguishes between 0 score vs unassessed null)', () => {
      const subs: SubWithDomainScores[] = [
        {
          status: 'EVALUATED',
          domain_scores: { D1: 0, D2: 75 }, // Student A got 0 in D1
        },
      ];

      const result = calculateClassDomainScores(subs);
      const d1 = result.find((d) => d.domainCode === 'D1')!;
      const d2 = result.find((d) => d.domainCode === 'D2')!;
      const d3 = result.find((d) => d.domainCode === 'D3')!;

      // D1 was assessed and resulted in 0%
      expect(d1.score).toBe(0);
      expect(d1.score).not.toBeNull();
      expect(d1.testedCount).toBe(1);

      // D2 was assessed and resulted in 75%
      expect(d2.score).toBe(75);
      expect(d2.testedCount).toBe(1);

      // D3 was NOT assessed
      expect(d3.score).toBeNull();
      expect(d3.testedCount).toBe(0);
    });

    it('2.4. Multiple students with mixed zero and positive scores in D1', () => {
      const subs: SubWithDomainScores[] = [
        { status: 'EVALUATED', domain_scores: { D1: 0 } },
        { status: 'EVALUATED', domain_scores: { D1: 60 } },
        { status: 'EVALUATED', domain_scores: { D1: 90 } },
      ];

      const result = calculateClassDomainScores(subs);
      const d1 = result.find((d) => d.domainCode === 'D1')!;

      // Average: (0 + 60 + 90) / 3 = 50.0
      expect(d1.score).toBe(50);
      expect(d1.testedCount).toBe(3);
    });

    it('2.5. Handles alias keys (DOMAIN_1, DOMAIN1, 01, 1, D1) consistently', () => {
      const subs: SubWithDomainScores[] = [
        { status: 'EVALUATED', domain_scores: { DOMAIN_1: 80, DOMAIN_2: 70 } },
        { status: 'EVALUATED', domain_scores: { D1: 60, D2: 50 } },
        { status: 'EVALUATED', domain_scores: { '01': 100, '02': 90 } },
        { status: 'EVALUATED', domain_scores: { '1': 40, '2': 30 } },
      ];

      const result = calculateClassDomainScores(subs);
      const d1 = result.find((d) => d.domainCode === 'D1')!;
      const d2 = result.find((d) => d.domainCode === 'D2')!;

      // D1: (80 + 60 + 100 + 40) / 4 = 70.0
      expect(d1.score).toBe(70);
      expect(d1.testedCount).toBe(4);

      // D2: (70 + 50 + 90 + 30) / 4 = 60.0
      expect(d2.score).toBe(60);
      expect(d2.testedCount).toBe(4);
    });

    it('2.6. Robust against null, undefined, non-numeric values, or SUBMITTED status', () => {
      const subs: SubWithDomainScores[] = [
        { status: 'SUBMITTED', domain_scores: { D1: 100 } }, // Ignore un-evaluated
        { status: 'EVALUATED', domain_scores: null },          // Null domain_scores
        { status: 'EVALUATED', domain_scores: undefined },     // Undefined
        { status: 'EVALUATED', domain_scores: { D1: null, D2: undefined, D3: 'bad' as any } }, // Non-numbers
        { status: 'EVALUATED', domain_scores: { D1: 80 } },    // 1 genuine submission
      ];

      const evaluated = subs.filter((s) => s.status === 'EVALUATED');
      const result = calculateClassDomainScores(evaluated);

      const d1 = result.find((d) => d.domainCode === 'D1')!;
      const d2 = result.find((d) => d.domainCode === 'D2')!;

      expect(d1.score).toBe(80);
      expect(d1.testedCount).toBe(1);
      expect(d2.score).toBeNull();
      expect(d2.testedCount).toBe(0);
    });

    it('2.7. Cross-verifies with OrgCompetencyAnalyticsService.aggregateOrgCompetency', () => {
      const rawSubs: RawAnalyticsSubmission[] = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          status: 'EVALUATED',
          percentage: 50,
          is_passed: false,
          domain_scores: { D1: 0, D2: 100 },
        },
      ];

      const summary = OrgCompetencyAnalyticsService.aggregateOrgCompetency(rawSubs);
      const d1 = summary.domains.find((d) => d.domainCode === 'D1')!;
      const d2 = summary.domains.find((d) => d.domainCode === 'D2')!;
      const d3 = summary.domains.find((d) => d.domainCode === 'D3')!;

      // D1 scored 0 -> score: 0, tested: 1, pass: 0
      expect(d1.score).toBe(0);
      expect(d1.testedCount).toBe(1);
      expect(d1.passedCount).toBe(0);

      // D2 scored 100 -> score: 100, tested: 1, pass: 1
      expect(d2.score).toBe(100);
      expect(d2.testedCount).toBe(1);
      expect(d2.passedCount).toBe(1);

      // D3 untested -> score: null, tested: 0
      expect(d3.score).toBeNull();
      expect(d3.testedCount).toBe(0);
    });
  });

  // =========================================================================
  // OBJECTIVE 3: Component Rendering Model (OrgClassAnalyticsView)
  // =========================================================================
  describe('Objective 3: OrgClassAnalyticsView Presentation Model & Null/0 Distinctions', () => {
    it('3.1. Formats "Chưa đủ dữ liệu" and "0 bài" when score is null', () => {
      const unassessedDomain: ClassDomainScoreItem = {
        domainCode: 'D1',
        name: 'Thông tin & Dữ liệu',
        score: null,
        testedCount: 0,
      };

      const display = formatDomainCardDisplay(unassessedDomain);
      expect(display.hasScore).toBe(false);
      expect(display.scoreDisplay).toBe('Chưa đủ dữ liệu');
      expect(display.badgeText).toBeNull();
      expect(display.testedDisplay).toBe('0 bài');
      expect(display.progressPercent).toBe(0);
      expect(display.progressColor).toBeNull();
    });

    it('3.2. Formats "0%" and "Cần cải thiện" when score is 0 (assessed but scored 0)', () => {
      const zeroScoredDomain: ClassDomainScoreItem = {
        domainCode: 'D1',
        name: 'Thông tin & Dữ liệu',
        score: 0,
        testedCount: 3,
      };

      const display = formatDomainCardDisplay(zeroScoredDomain);
      expect(display.hasScore).toBe(true);
      expect(display.scoreDisplay).toBe('0%');
      expect(display.badgeText).toBe('Cần cải thiện');
      expect(display.testedDisplay).toBe('3 bài');
      expect(display.progressPercent).toBe(0);
      expect(display.progressColor).toBe('bg-amber-500');
    });

    it('3.3. Formats "85.5%" and "Đạt chuẩn" with Cobalt progress bar when score >= 70%', () => {
      const passingDomain: ClassDomainScoreItem = {
        domainCode: 'D2',
        name: 'Giao tiếp & Hợp tác',
        score: 85.5,
        testedCount: 12,
      };

      const display = formatDomainCardDisplay(passingDomain);
      expect(display.hasScore).toBe(true);
      expect(display.scoreDisplay).toBe('85.5%');
      expect(display.badgeText).toBe('Đạt chuẩn');
      expect(display.testedDisplay).toBe('12 bài');
      expect(display.progressPercent).toBe(85.5);
      expect(display.progressColor).toBe('bg-blue-600');
    });

    it('3.4. Formats "45%" and "Cần cải thiện" with Amber progress bar when 0 < score < 70%', () => {
      const lowDomain: ClassDomainScoreItem = {
        domainCode: 'D3',
        name: 'Sáng tạo nội dung số',
        score: 45,
        testedCount: 8,
      };

      const display = formatDomainCardDisplay(lowDomain);
      expect(display.hasScore).toBe(true);
      expect(display.scoreDisplay).toBe('45%');
      expect(display.badgeText).toBe('Cần cải thiện');
      expect(display.testedDisplay).toBe('8 bài');
      expect(display.progressPercent).toBe(45);
      expect(display.progressColor).toBe('bg-amber-500');
    });

    it('3.5. Verifies OrgClassAnalyticsView.tsx template structure mirrors presentation model exactly', () => {
      const classViewPath = path.join(rootDir, 'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx');
      const content = fs.readFileSync(classViewPath, 'utf8');

      // Verify null check
      expect(content).toContain('const hasScore = domain.score !== null;');
      expect(content).toContain('Chưa đủ dữ liệu');
      expect(content).toContain('Đạt chuẩn');
      expect(content).toContain('Cần cải thiện');
      expect(content).toContain('domain.score! >= 70 ? \'bg-blue-600\' : \'bg-amber-500\'');
    });
  });

  // =========================================================================
  // OBJECTIVE 4: AGENTS.md Hard Rules Verification
  // =========================================================================
  describe('Objective 4: AGENTS.md Conformance & Forensic Quality Checks', () => {
    it('4.1. Prohibits horizontal dividing borders ("không sử dụng đường viền ngang") in modified UI files', () => {
      const horizontalBorderRegex = /\b(border-b|border-t|divide-y)\b|<hr[\s/>]/;
      const uiFiles = [
        'src/features/analytics/components/AnalyticsInsightPanel.tsx',
        'src/features/analytics/components/DataSourceRulesBox.tsx',
        'src/app/(dashboard)/personal/competency/analysis/page.tsx',
        'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/page.tsx',
        'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx',
        'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/loading.tsx',
      ];

      uiFiles.forEach((relPath) => {
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
          if (horizontalBorderRegex.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Found horizontal border violations in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });

    it('4.2. Prohibits emojis in JSX ("không dùng emoji làm icon sản phẩm trong JSX")', () => {
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
      const uiFiles = [
        'src/features/analytics/components/AnalyticsInsightPanel.tsx',
        'src/app/(dashboard)/personal/competency/analysis/page.tsx',
        'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/page.tsx',
        'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx',
      ];

      uiFiles.forEach((relPath) => {
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
          `Found emoji violations in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });

    it('4.3. Prohibits technical terms "DigComp" or "DigComp 2.2/3.0" in user-facing JSX/UI files', () => {
      const userFacingFiles = [
        'src/app/(dashboard)/org/[slug]/classes/[classId]/analytics/page.tsx',
        'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx',
        'src/app/(dashboard)/personal/competency/analysis/page.tsx',
      ];

      userFacingFiles.forEach((relPath) => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        const violations: Array<{ line: number; text: string }> = [];
        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          if (/digcomp/i.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Found forbidden "DigComp" in UI file ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });

    it('4.4. Validates dark mode theme token conformance (Dark nền đen #000000/#111114, Cobalt #2563EB)', () => {
      const classViewPath = path.join(rootDir, 'src/components/dashboard/org/classes/OrgClassAnalyticsView.tsx');
      const content = fs.readFileSync(classViewPath, 'utf8');

      // Must support dark mode backgrounds and borders
      expect(content).toContain('dark:bg-[#111114]');
      expect(content).toContain('dark:border-zinc-800');
      expect(content).toContain('dark:text-neutral-100');
      expect(content).toContain('bg-blue-600');
    });
  });
});
