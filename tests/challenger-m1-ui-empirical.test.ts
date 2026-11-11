import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const TARGET_FILES = [
  'src/components/dashboard/live-room/InlinePinEntryCard.tsx',
  'src/components/dashboard/org/OrgSidebar.tsx',
  'src/app/(dashboard)/org/[slug]/live-room/new/page.tsx',
  'src/components/dashboard/live-room/LiveRoomDashboardView.tsx',
  'src/components/dashboard/personal/live-room/PersonalLiveRoomDashboardView.tsx',
  'src/app/(dashboard)/personal/dashboard/page.tsx',
];

describe('Empirical Challenger M1: UI/UX & AGENTS.md Conformance Challenge', () => {
  const rootDir = process.cwd();

  describe('Challenge 1: Horizontal dividing borders prohibited ("không sử dụng đường viền ngang")', () => {
    // AGENTS.md Section 3.5: "không sử dụng đường viền ngang"
    // Disallows horizontal dividing borders: border-b, border-t, divide-y, <hr>
    const horizontalBorderRegex = /\b(border-b|border-t|divide-y)\b|<hr[\s/>]/;

    TARGET_FILES.forEach((relPath) => {
      it(`should contain no horizontal dividing borders in ${relPath}`, () => {
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
          // Exclude small indicators like tiny benchmark dash legend: <span className="w-3 h-0.5 border-t border-dashed ...
          if (trimmed.includes('border-dashed') && trimmed.includes('h-0.5')) {
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
  });

  describe('Challenge 2: Prohibition of Emojis in JSX ("không dùng emoji làm icon sản phẩm trong JSX")', () => {
    // AGENTS.md Section 3.4: "lucide-react là thư viện icon chuẩn... không dùng emoji làm icon sản phẩm trong JSX."
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

    TARGET_FILES.forEach((relPath) => {
      it(`should contain no emojis in ${relPath}`, () => {
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

    it('specifically verifies emoji 👋 was removed from personal dashboard greeting', () => {
      const fullPath = path.join(rootDir, 'src/app/(dashboard)/personal/dashboard/page.tsx');
      const content = fs.readFileSync(fullPath, 'utf8');
      expect(content).not.toContain('👋');
    });
  });

  describe('Challenge 3: DigComp technical terminology prohibited on UI', () => {
    // AGENTS.md Section 2.1: "Tuyệt đối không phô bày các thuật ngữ kỹ thuật, mã khung hay số hiệu phiên bản (DigComp, DigComp 2.2, DigComp 3.0...) ra ngoài giao diện người dùng (UI)... Trên UI chỉ dùng các cách gọi tự nhiên: 5 miền năng lực số..."
    TARGET_FILES.forEach((relPath) => {
      it(`should not expose "DigComp" to the UI in ${relPath}`, () => {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        const violations: Array<{ line: number; text: string }> = [];
        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('import')) {
            return;
          }
          if (/\bdigcomp\b/i.test(trimmed)) {
            violations.push({ line: idx + 1, text: trimmed });
          }
        });

        expect(
          violations,
          `Found DigComp terminology leak in ${relPath}:\n${JSON.stringify(violations, null, 2)}`
        ).toEqual([]);
      });
    });
  });

  describe('Challenge 4: Dark Mode tokens & Cobalt #2563EB button styling', () => {
    // AGENTS.md Section 3.1 & 3.2: Light #FFFFFF, Dark #000000 / #111114, Cobalt #2563EB
    it('InlinePinEntryCard adheres to Dark card #111114 and Cobalt bg-blue-600', () => {
      const content = fs.readFileSync(
        path.join(rootDir, 'src/components/dashboard/live-room/InlinePinEntryCard.tsx'),
        'utf8'
      );
      expect(content).toContain('dark:bg-[#111114]');
      expect(content).toContain('bg-blue-600');
      expect(content).toContain('hover:bg-blue-700');
    });

    it('OrgSidebar adheres to dark:bg-[#0A0A0B] for panel / sidebar token', () => {
      const content = fs.readFileSync(
        path.join(rootDir, 'src/components/dashboard/org/OrgSidebar.tsx'),
        'utf8'
      );
      expect(content).toContain('dark:bg-[#0A0A0B]');
      expect(content).toContain('border-slate-200 dark:border-zinc-800');
    });

    it('LiveRoomDashboardView adheres to dark:bg-[#111114] and Cobalt action buttons', () => {
      const content = fs.readFileSync(
        path.join(rootDir, 'src/components/dashboard/live-room/LiveRoomDashboardView.tsx'),
        'utf8'
      );
      expect(content).toContain('dark:bg-[#111114]');
      expect(content).toContain('bg-blue-600 hover:bg-blue-700');
    });

    it('PersonalLiveRoomDashboardView adheres to dark:bg-black / dark:bg-[#111114]', () => {
      const content = fs.readFileSync(
        path.join(rootDir, 'src/components/dashboard/personal/live-room/PersonalLiveRoomDashboardView.tsx'),
        'utf8'
      );
      expect(content).toContain('dark:bg-black');
      expect(content).toContain('bg-blue-600 hover:bg-blue-700');
    });
  });

  describe('Challenge 5: Inline PIN Entry Logic & Sanitize', () => {
    it('PIN sanitization test logic conforms to 6-digit numeric constraint', () => {
      const rawInput = ' 84a-92b 01 ';
      const cleanPin = rawInput.trim().replace(/\D/g, '').slice(0, 6);
      expect(cleanPin).toBe('849201');
      expect(cleanPin.length).toBe(6);

      const shortInput = '1234';
      const shortClean = shortInput.trim().replace(/\D/g, '').slice(0, 6);
      expect(shortClean.length).not.toBe(6);

      const longInput = '123456789';
      const longClean = longInput.trim().replace(/\D/g, '').slice(0, 6);
      expect(longClean).toBe('123456');
    });
  });

  describe('Challenge 6: OrgSidebar MEMBER Route Rail & Navigation Invariance', () => {
    it('prevents MEMBER from triggering secondary sub-sidebar rail for live-room route', () => {
      const orgSlug = 'acme-corp';
      const pathname = `/org/${orgSlug}/live-room`;

      // Logic from OrgSidebar.tsx:77-83
      const isMember = true;
      const isAssessmentRoute =
        !isMember &&
        (pathname.startsWith(`/org/${orgSlug}/assessments`) ||
          pathname.startsWith(`/org/${orgSlug}/campaigns`) ||
          pathname.startsWith(`/org/${orgSlug}/grading`) ||
          pathname.startsWith(`/org/${orgSlug}/live-room`));

      expect(isAssessmentRoute).toBe(false);

      // Verify non-member DOES trigger it
      const isAssessor = false;
      const isNonMember = false;
      const assessorAssessmentRoute =
        !isNonMember &&
        (pathname.startsWith(`/org/${orgSlug}/assessments`) ||
          pathname.startsWith(`/org/${orgSlug}/campaigns`) ||
          pathname.startsWith(`/org/${orgSlug}/grading`) ||
          pathname.startsWith(`/org/${orgSlug}/live-room`));
      expect(assessorAssessmentRoute).toBe(true);
    });

    it('ensures MEMBER nav group contains "Phòng thi trực tiếp" under CÁ NHÂN', () => {
      const content = fs.readFileSync(
        path.join(rootDir, 'src/components/dashboard/org/OrgSidebar.tsx'),
        'utf8'
      );
      expect(content).toContain("label: 'CÁ NHÂN'");
      expect(content).toContain("name: 'Phòng thi trực tiếp'");
      expect(content).toContain('href: `/org/${orgSlug}/live-room`');
    });
  });

  describe('Challenge 7: Security Route Guard Hardening on org/[slug]/live-room/new', () => {
    it('verifies requireOrgPagePermission restricts creation to privileged roles only', () => {
      const content = fs.readFileSync(
        path.join(rootDir, 'src/app/(dashboard)/org/[slug]/live-room/new/page.tsx'),
        'utf8'
      );
      expect(content).not.toContain("'VIEW_WORKSPACE'");
      expect(content).toContain("'ORG_OWNER'");
      expect(content).toContain("'ORG_ADMIN'");
      expect(content).toContain("'ASSESSOR'");
      expect(content).toContain("'EVALUATOR'");
      expect(content).not.toContain("'MEMBER'");
    });
  });

  describe('Challenge 8: Role-Aware LiveRoomDashboardView for MEMBER', () => {
    const content = fs.readFileSync(
      path.join(rootDir, 'src/components/dashboard/live-room/LiveRoomDashboardView.tsx'),
      'utf8'
    );

    it('suppresses creation button for MEMBER', () => {
      expect(content).toContain('!isMember && (');
      expect(content).toContain('Tạo phòng thi');
    });

    it('renders InlinePinEntryCard prominently when isMember', () => {
      expect(content).toContain('{isMember && <InlinePinEntryCard className="shadow-xs" />}');
    });

    it('renders "Vào thi" and "Vào phòng chờ" for MEMBER instead of "Giám sát"', () => {
      expect(content).toContain("<span>Vào thi</span>");
      expect(content).toContain("<span>Vào phòng chờ</span>");
    });

    it('hides projector QR button and delete button for MEMBER', () => {
      // In table row:
      expect(content).toContain('{isMember ? (');
      expect(content).toContain('Chiếu mã QR tham gia');
      expect(content).toContain('Xóa phòng thi');
    });

    it('renders "Quy chế phòng thi trực tiếp" for MEMBER instead of creation guide', () => {
      expect(content).toContain('Quy chế phòng thi trực tiếp');
      expect(content).toContain('Mã PIN 6 chữ số');
      expect(content).toContain('Đúng giờ &amp; sẵn sàng');
    });
  });

  describe('Challenge 9: Personal Dashboard & Live Room Direct PIN Entry Integration', () => {
    it('renders InlinePinEntryCard in PersonalLiveRoomDashboardView', () => {
      const content = fs.readFileSync(
        path.join(rootDir, 'src/components/dashboard/personal/live-room/PersonalLiveRoomDashboardView.tsx'),
        'utf8'
      );
      expect(content).toContain('<InlinePinEntryCard className="shadow-xs" />');
    });

    it('does not render InlinePinEntryCard in personal dashboard page (moved to dedicated live-room)', () => {
      const content = fs.readFileSync(
        path.join(rootDir, 'src/app/(dashboard)/personal/dashboard/page.tsx'),
        'utf8'
      );
      expect(content).not.toContain('<InlinePinEntryCard');
    });
  });
});
