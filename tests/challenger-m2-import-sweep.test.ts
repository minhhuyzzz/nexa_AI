import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Milestone 2 Adversarial Empirical Verification: Pruned Components & Redirect Gate', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const srcDir = path.join(projectRoot, 'src');

  // Helper function to collect all .ts and .tsx files recursively
  function getSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...getSourceFiles(fullPath));
      } else if (/\.(ts|tsx)$/.test(item)) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allSourceFiles = getSourceFiles(srcDir);

  describe('1. Adversarial Sweep for Pruned Component Imports Across src/', () => {
    const prunedComponentNames = [
      'AssessmentStudio',
      'QuestionBankDrawer',
      'PublishValidationModal',
      'ItemBankImporter',
      'ProctoringTimeline',
    ];

    it('collects source files in src/ for scanning', () => {
      expect(allSourceFiles.length).toBeGreaterThan(100);
    });

    for (const compName of prunedComponentNames) {
      it(`ensures 0 imports or require statements for "${compName}" across all src/ files`, () => {
        const importPattern = new RegExp(
          `import\\s+.*\\b${compName}\\b.*from|import\\s*\\(['"][^'"]*${compName}[^'"]*['"]\\)|require\\(['"][^'"]*${compName}[^'"]*['"]\\)`,
          'g'
        );

        const offenders: { file: string; line: number; text: string }[] = [];

        for (const filePath of allSourceFiles) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');
          lines.forEach((lineText, idx) => {
            if (importPattern.test(lineText)) {
              offenders.push({
                file: path.relative(projectRoot, filePath),
                line: idx + 1,
                text: lineText.trim(),
              });
            }
          });
        }

        expect(offenders, `Found dangling imports for ${compName}: ${JSON.stringify(offenders, null, 2)}`).toHaveLength(0);
      });
    }

    it('ensures deleted component files physically do NOT exist on disk', () => {
      const deletedFiles = [
        'src/features/assessments/components/AssessmentStudio.tsx',
        'src/features/assessments/components/QuestionBankDrawer.tsx',
        'src/features/assessments/components/PublishValidationModal.tsx',
        'src/features/assessments/components/ItemBankImporter.tsx',
        'src/components/live/ProctoringTimeline.tsx',
      ];

      for (const relPath of deletedFiles) {
        const absPath = path.join(projectRoot, relPath);
        expect(fs.existsSync(absPath), `File should be deleted: ${relPath}`).toBe(false);
      }
    });
  });

  describe('2. Pruned Route Stubs & Personal Redirect Verification', () => {
    it('ensures pruned route page files do NOT exist on disk', () => {
      const deletedRoutes = [
        'src/app/(dashboard)/personal/accept-invite/page.tsx',
        'src/app/(dashboard)/personal/exams/page.tsx',
        'src/app/(dashboard)/personal/item-bank/page.tsx',
        'src/app/(dashboard)/personal/live-pin/page.tsx',
        'src/app/(dashboard)/personal/live-pin/waiting-room/page.tsx',
      ];

      for (const relPath of deletedRoutes) {
        const absPath = path.join(projectRoot, relPath);
        expect(fs.existsSync(absPath), `Route stub should be pruned: ${relPath}`).toBe(false);
      }
    });

    it('verifies src/app/(dashboard)/personal/page.tsx exists and redirects to /personal/dashboard', () => {
      const personalPagePath = path.join(projectRoot, 'src/app/(dashboard)/personal/page.tsx');
      expect(fs.existsSync(personalPagePath)).toBe(true);

      const content = fs.readFileSync(personalPagePath, 'utf-8');
      expect(content).toContain("import { redirect } from 'next/navigation'");
      expect(content).toContain("redirect('/personal/dashboard')");
    });

    it('verifies next.config.ts configures canonical redirects', () => {
      const nextConfigPath = path.join(projectRoot, 'next.config.ts');
      expect(fs.existsSync(nextConfigPath)).toBe(true);

      const content = fs.readFileSync(nextConfigPath, 'utf-8');
      expect(content).toContain("source: '/personal/exams', destination: '/personal/authoring', permanent: true");
      expect(content).toContain("source: '/personal/item-bank', destination: '/personal/authoring', permanent: true");
      expect(content).toContain("source: '/personal/live-pin', destination: '/live/waiting-room', permanent: false");
      expect(content).toContain("source: '/personal/accept-invite', destination: '/accept-invite', permanent: true");
    });
  });

  describe('3. Cleaned Artifacts & Static Assets Normalization', () => {
    it('ensures obsolete scripts, payload, and non-ASCII images are purged', () => {
      const purgedPaths = [
        'scripts/__pycache__',
        'scripts/part3_payload.json',
        'public/images/dashboard/Banner Thư viện đề đánh giá.jpg',
        'public/images/dashboard/Banner Tổng quan.jpg',
        'public/images/dashboard/tổng hợp.png',
      ];

      for (const relPath of purgedPaths) {
        const absPath = path.join(projectRoot, relPath);
        expect(fs.existsSync(absPath), `Artifact should be purged: ${relPath}`).toBe(false);
      }
    });

    it('ensures normalized ASCII asset banner-tong-quan.jpg exists and is non-empty', () => {
      const bannerPath = path.join(projectRoot, 'public/images/dashboard/banner-tong-quan.jpg');
      expect(fs.existsSync(bannerPath)).toBe(true);
      const stat = fs.statSync(bannerPath);
      expect(stat.size).toBeGreaterThan(100000); // ~427KB
    });

    it('verifies org dashboard references normalized banner asset', () => {
      const orgPagePath = path.join(projectRoot, 'src/app/(dashboard)/org/[slug]/page.tsx');
      expect(fs.existsSync(orgPagePath)).toBe(true);

      const content = fs.readFileSync(orgPagePath, 'utf-8');
      expect(content).toContain('/images/dashboard/banner-tong-quan.jpg');
      expect(content).not.toContain('/images/dashboard/Banner Tổng quan.jpg');
    });
  });

  describe('4. Guardrails & Back-Link Repairs', () => {
    it('preserves AssessmentDetailTabs.tsx for M3 gate test assertions', () => {
      const tabsPath = path.join(projectRoot, 'src/components/dashboard/assessments/AssessmentDetailTabs.tsx');
      expect(fs.existsSync(tabsPath)).toBe(true);
    });

    it('preserves item-bank/[id]/page.tsx and points back links to /personal/authoring', () => {
      const itemDetailPath = path.join(projectRoot, 'src/app/(dashboard)/personal/item-bank/[id]/page.tsx');
      expect(fs.existsSync(itemDetailPath)).toBe(true);

      const content = fs.readFileSync(itemDetailPath, 'utf-8');
      expect(content).toContain('href="/personal/authoring"');
      expect(content).not.toContain('href="/personal/item-bank"');
    });

    it('verifies authoring-assist route fixed prefer-const lint blocker', () => {
      const routePath = path.join(projectRoot, 'src/app/api/ai/authoring-assist/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);

      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toMatch(/const\s+systemInstruction\s*=/);
      expect(content).not.toMatch(/let\s+systemInstruction\s*=/);
    });
  });
});
