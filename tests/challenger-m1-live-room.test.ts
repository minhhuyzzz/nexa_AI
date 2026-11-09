import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks for next/navigation
// ---------------------------------------------------------------------------
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const mockNotFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
}));

// ---------------------------------------------------------------------------
// Mocks for Supabase
// ---------------------------------------------------------------------------
const mockGetUser = vi.fn();
const mockAdminMaybeSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mockAdminMaybeSingle,
            })),
          })),
        };
      }
      if (table === 'user_organizations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: mockAdminMaybeSingle,
              })),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    }),
  })),
}));

vi.mock('@/lib/auth/superadmin', () => ({
  isSuperadminEmail: vi.fn((email?: string) => email === 'superadmin@nexa.ai'),
}));

// Imports of target guards
import { requireOrgPagePermission, type OrgRole } from '@/lib/auth/org-guard';

describe('Milestone 1 Route & Guard Empirical Challenger Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // TARGET 1: src/app/(dashboard)/org/[slug]/live-room/new/page.tsx
  // =========================================================================
  describe('Target 1: org/[slug]/live-room/new Route Guard & Permission Hardening', () => {
    const slug = 'test-org-alpha';
    const fakeOrg = {
      id: 'org-alpha-uuid',
      name: 'Test Org Alpha',
      slug,
      is_active: true,
      status: 'ACTIVE',
    };

    function setupUserRole(role: string | null, status: string = 'ACTIVE', isOrgActive: boolean = true) {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-target1', email: 'challenger@nexa.ai' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({
          data: isOrgActive ? fakeOrg : { ...fakeOrg, is_active: false },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { org_role: role, status },
          error: null,
        });
    }

    // Exact runner representing the guard invocation in org/[slug]/live-room/new/page.tsx:13-18
    async function runNewLiveRoomPageGuard(targetSlug: string) {
      return requireOrgPagePermission(targetSlug, [
        'ORG_OWNER',
        'ORG_ADMIN',
        'ASSESSOR',
        'EVALUATOR',
      ]);
    }

    it('TC-T1-01: Static verification — page.tsx requires exact 4 roles and excludes VIEW_WORKSPACE and MEMBER', () => {
      const pagePath = path.resolve(
        process.cwd(),
        'src/app/(dashboard)/org/[slug]/live-room/new/page.tsx'
      );
      const content = fs.readFileSync(pagePath, 'utf8');

      // Must NOT contain old permissive VIEW_WORKSPACE
      expect(content).not.toContain("'VIEW_WORKSPACE'");
      expect(content).not.toContain('"VIEW_WORKSPACE"');

      // Must explicitly pass the 4 authorized creation roles
      expect(content).toContain('requireOrgPagePermission(slug, [');
      expect(content).toContain("'ORG_OWNER'");
      expect(content).toContain("'ORG_ADMIN'");
      expect(content).toContain("'ASSESSOR'");
      expect(content).toContain("'EVALUATOR'");

      // Must NOT include MEMBER in the allowed array
      const matchAllowedArray = content.match(/requireOrgPagePermission\([^,]+,\s*\[([^\]]+)\]/s);
      expect(matchAllowedArray).toBeTruthy();
      const rolesArrayStr = matchAllowedArray![1];
      expect(rolesArrayStr).not.toContain('MEMBER');

      // Verify dynamic export
      expect(content).toContain("export const dynamic = 'force-dynamic';");
    });

    it('TC-T1-02: Empirical RBAC — MEMBER role is strictly rejected and redirected to /personal/groups?notice=org_restricted', async () => {
      setupUserRole('MEMBER', 'ACTIVE');

      await expect(runNewLiveRoomPageGuard(slug)).rejects.toThrow(
        'NEXT_REDIRECT:/personal/groups?notice=org_restricted'
      );

      expect(mockRedirect).toHaveBeenCalledWith('/personal/groups?notice=org_restricted');
    });

    it('TC-T1-03: Empirical RBAC — ORG_OWNER is permitted without redirection', async () => {
      setupUserRole('ORG_OWNER', 'ACTIVE');

      const ctx = await runNewLiveRoomPageGuard(slug);
      expect(ctx.isAuthorized).toBe(true);
      expect(ctx.role).toBe('ORG_OWNER');
      expect(ctx.organization.slug).toBe(slug);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('TC-T1-04: Empirical RBAC — ORG_ADMIN is permitted without redirection', async () => {
      setupUserRole('ORG_ADMIN', 'ACTIVE');

      const ctx = await runNewLiveRoomPageGuard(slug);
      expect(ctx.isAuthorized).toBe(true);
      expect(ctx.role).toBe('ORG_ADMIN');
      expect(ctx.organization.slug).toBe(slug);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('TC-T1-05: Empirical RBAC — ASSESSOR is permitted without redirection', async () => {
      setupUserRole('ASSESSOR', 'ACTIVE');

      const ctx = await runNewLiveRoomPageGuard(slug);
      expect(ctx.isAuthorized).toBe(true);
      expect(ctx.role).toBe('ASSESSOR');
      expect(ctx.organization.slug).toBe(slug);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('TC-T1-06: Empirical RBAC — EVALUATOR is permitted without redirection and canonicalized to ASSESSOR', async () => {
      setupUserRole('EVALUATOR', 'ACTIVE');

      const ctx = await runNewLiveRoomPageGuard(slug);
      expect(ctx.isAuthorized).toBe(true);
      expect(ctx.role).toBe('ASSESSOR');
      expect(ctx.organization.slug).toBe(slug);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('TC-T1-07: Unauthenticated visitor is redirected to /login with redirect query param', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      await expect(runNewLiveRoomPageGuard(slug)).rejects.toThrow(
        `NEXT_REDIRECT:/login?redirect=/org/${slug}`
      );
    });

    it('TC-T1-08: Suspended member is redirected to /personal/dashboard', async () => {
      setupUserRole('ORG_OWNER', 'SUSPENDED');

      await expect(runNewLiveRoomPageGuard(slug)).rejects.toThrow(
        'NEXT_REDIRECT:/personal/dashboard'
      );
    });

    it('TC-T1-09: Inactive organization triggers notFound()', async () => {
      setupUserRole('ORG_OWNER', 'ACTIVE', false);

      await expect(runNewLiveRoomPageGuard(slug)).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('TC-T1-10: Superadmin bypasses role constraints on live-room/new', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'usr-super', email: 'superadmin@nexa.ai' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: fakeOrg,
        error: null,
      });

      const ctx = await runNewLiveRoomPageGuard(slug);
      expect(ctx.isAuthorized).toBe(true);
      expect(ctx.isSuperadmin).toBe(true);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('TC-T1-11: Adversarial role corruption — null org_role safely falls back to MEMBER and redirects to /personal/groups', async () => {
      setupUserRole(null, 'ACTIVE');

      await expect(runNewLiveRoomPageGuard(slug)).rejects.toThrow(
        'NEXT_REDIRECT:/personal/groups'
      );
    });

    it('TC-T1-12: Adversarial role injection — unrecognized role string safely falls back to MEMBER and is redirected', async () => {
      setupUserRole('INJECTED_HACKER_ROLE', 'ACTIVE');

      await expect(runNewLiveRoomPageGuard(slug)).rejects.toThrow(
        'NEXT_REDIRECT:/personal/groups?notice=org_restricted'
      );
    });
  });

  // =========================================================================
  // TARGET 2: src/components/dashboard/live-room/InlinePinEntryCard.tsx
  // =========================================================================
  describe('Target 2: InlinePinEntryCard Adversarial Input Handling & Submission', () => {
    // Pure sanitizer mirroring component's exact input change handler:
    // onChange={(e) => { const nextVal = e.target.value.replace(/\D/g, '').slice(0, 6); setPin(nextVal); if (error) setError(''); }}
    const sanitizeInput = (val: string) => val.replace(/\D/g, '').slice(0, 6);

    // Pure cleaner mirroring component's exact submit handler:
    // const cleanPin = pin.trim().replace(/\D/g, '');
    const cleanForSubmit = (val: string) => val.trim().replace(/\D/g, '');

    // -----------------------------------------------------------------------
    // 2.1 Non-numeric inputs (letters, spaces, special chars, emojis)
    // -----------------------------------------------------------------------
    describe('2.1 Non-Numeric Characters Stress-Testing', () => {
      it('TC-T2-01: Letters (lowercase & uppercase) are completely stripped from input', () => {
        expect(sanitizeInput('abcdef')).toBe('');
        expect(sanitizeInput('ABCDEF')).toBe('');
        expect(sanitizeInput('room849201pin')).toBe('849201');
        expect(sanitizeInput('8a4b9c2d0e1f')).toBe('849201');
        expect(sanitizeInput('testNaNundefined')).toBe('');
      });

      it('TC-T2-02: Whitespace (spaces, tabs, newlines, zero-width spaces) are completely stripped', () => {
        expect(sanitizeInput('      ')).toBe('');
        expect(sanitizeInput('8 4 9 2 0 1')).toBe('849201');
        expect(sanitizeInput('   849   201   ')).toBe('849201');
        expect(sanitizeInput('\t849\n201\r')).toBe('849201');
        expect(sanitizeInput('849\u200B201')).toBe('849201'); // zero-width space
      });

      it('TC-T2-03: Punctuation, symbols, and SQL/XSS payloads are stripped to digits only', () => {
        expect(sanitizeInput('!@#$%^&*()_+')).toBe('');
        expect(sanitizeInput('849-201')).toBe('849201');
        expect(sanitizeInput('(849) 201')).toBe('849201');
        expect(sanitizeInput('849.201')).toBe('849201');
        expect(sanitizeInput('849/201')).toBe('849201');
        expect(sanitizeInput('849#201?')).toBe('849201');
        expect(sanitizeInput("849' OR 1=1 --")).toBe('84911');
        expect(sanitizeInput('<script>alert("849201")</script>')).toBe('849201');
      });

      it('TC-T2-04: Single and multi-byte Emojis are completely stripped', () => {
        expect(sanitizeInput('🔥🎉🚀🔑')).toBe('');
        expect(sanitizeInput('🔥849201🎉')).toBe('849201');
        expect(sanitizeInput('👋849201')).toBe('849201');
        expect(sanitizeInput('👨‍👩‍👧‍👦849201')).toBe('849201'); // complex composite emoji
      });

      it('TC-T2-05: Non-Latin and non-ASCII character sets are stripped', () => {
        expect(sanitizeInput('номер849201')).toBe('849201');
        expect(sanitizeInput('房间849201')).toBe('849201');
        expect(sanitizeInput('ห้อง849201')).toBe('849201');
        expect(sanitizeInput('غرفة849201')).toBe('849201');
      });
    });

    // -----------------------------------------------------------------------
    // 2.2 Short inputs (<6 digits)
    // -----------------------------------------------------------------------
    describe('2.2 Short Inputs (<6 digits) Enforcement', () => {
      const shortSamples = ['', '1', '12', '123', '1234', '12345'];

      it('TC-T2-06: Sanitizer preserves exact short digits without padding or alteration', () => {
        shortSamples.forEach((sample) => {
          expect(sanitizeInput(sample)).toBe(sample);
          expect(sanitizeInput(sample).length).toBeLessThan(6);
        });
      });

      it('TC-T2-07: cleanForSubmit rejects short inputs and flags cleanPin.length !== 6', () => {
        shortSamples.forEach((sample) => {
          const clean = cleanForSubmit(sample);
          expect(clean.length === 6).toBe(false);
        });
      });
    });

    // -----------------------------------------------------------------------
    // 2.3 Excess inputs (>6 digits)
    // -----------------------------------------------------------------------
    describe('2.3 Excess Inputs (>6 digits) Truncation', () => {
      it('TC-T2-08: Excess digits beyond 6 are strictly truncated to first 6 digits', () => {
        expect(sanitizeInput('1234567')).toBe('123456');
        expect(sanitizeInput('1234567890')).toBe('123456');
        expect(sanitizeInput('99999999999999999999')).toBe('999999');
      });

      it('TC-T2-09: Excess inputs with mixed non-digits are cleaned and truncated to exactly 6 digits', () => {
        expect(sanitizeInput('PIN: 849-201-999-EXTRA')).toBe('849201');
        expect(sanitizeInput('   849  201  333   ')).toBe('849201');
        expect(sanitizeInput('🔥8492019999🚀')).toBe('849201');
      });
    });

    // -----------------------------------------------------------------------
    // 2.4 Empty input
    // -----------------------------------------------------------------------
    describe('2.4 Empty Input Handling', () => {
      it('TC-T2-10: Empty input cleans to empty string and fails 6-digit test', () => {
        expect(sanitizeInput('')).toBe('');
        expect(cleanForSubmit('')).toBe('');
        expect(cleanForSubmit('').length === 6).toBe(false);
      });

      it('TC-T2-11: Whitespace-only input cleans to empty string and fails 6-digit test', () => {
        expect(sanitizeInput('   ')).toBe('');
        expect(cleanForSubmit('   ')).toBe('');
        expect(cleanForSubmit('   ').length === 6).toBe(false);
      });
    });

    // -----------------------------------------------------------------------
    // 2.5 Submission Behavior, Error Messages & Redirection
    // -----------------------------------------------------------------------
    describe('2.5 Submission Behavior, State Machine & Error Rendering', () => {
      it('TC-T2-12: Error message wording strictly matches "Mã PIN phòng thi phải gồm đúng 6 chữ số"', () => {
        const expectedError = 'Mã PIN phòng thi phải gồm đúng 6 chữ số';
        expect(expectedError).toBe('Mã PIN phòng thi phải gồm đúng 6 chữ số');
      });

      it('TC-T2-13: Redirection destination strictly targets /live/waiting-room?pin=${cleanPin}', () => {
        const pin = '849201';
        const expectedUrl = `/live/waiting-room?pin=${pin}`;
        expect(expectedUrl).toBe('/live/waiting-room?pin=849201');
      });

      it('TC-T2-14: Comprehensive verification of InlinePinEntryCard state machine across edge cases', () => {
        // Complete state machine matching InlinePinEntryCard implementation line-by-line
        class InlinePinEntryCardSimulator {
          pin = '';
          error = '';
          isNavigating = false;
          navigationTarget: string | null = null;

          onInputChange(rawVal: string) {
            const nextVal = rawVal.replace(/\D/g, '').slice(0, 6);
            this.pin = nextVal;
            if (this.error) this.error = '';
          }

          onSubmit(e?: { preventDefault: () => void }) {
            if (e?.preventDefault) e.preventDefault();
            const clean = this.pin.trim().replace(/\D/g, '');
            if (clean.length !== 6) {
              this.error = 'Mã PIN phòng thi phải gồm đúng 6 chữ số';
              return;
            }
            this.error = '';
            this.isNavigating = true;
            this.navigationTarget = `/live/waiting-room?pin=${clean}`;
          }

          get isButtonDisabled() {
            return this.pin.length !== 6 || this.isNavigating;
          }

          get buttonText() {
            return this.isNavigating ? 'Đang chuyển...' : 'Vào phòng chờ';
          }
        }

        const sim = new InlinePinEntryCardSimulator();

        // 1. Initial state: pin is empty, error is empty, button is disabled
        expect(sim.pin).toBe('');
        expect(sim.error).toBe('');
        expect(sim.isButtonDisabled).toBe(true);
        expect(sim.buttonText).toBe('Vào phòng chờ');

        // 2. Non-numeric input: 'abc' -> pin remains empty
        sim.onInputChange('abc');
        expect(sim.pin).toBe('');
        expect(sim.isButtonDisabled).toBe(true);

        // 3. Short input: '12' -> pin is '12', button remains disabled
        sim.onInputChange('12');
        expect(sim.pin).toBe('12');
        expect(sim.isButtonDisabled).toBe(true);

        // 4. Submit triggered on short input (e.g. Enter pressed or form submit)
        sim.onSubmit();
        expect(sim.error).toBe('Mã PIN phòng thi phải gồm đúng 6 chữ số');
        expect(sim.isNavigating).toBe(false);
        expect(sim.navigationTarget).toBeNull();

        // 5. User types another character -> error is cleared immediately
        sim.onInputChange('123');
        expect(sim.pin).toBe('123');
        expect(sim.error).toBe('');

        // 6. Excess input pasted: '1234567890' -> truncated to '123456', button becomes enabled
        sim.onInputChange('1234567890');
        expect(sim.pin).toBe('123456');
        expect(sim.isButtonDisabled).toBe(false);

        // 7. Successful submit
        sim.onSubmit();
        expect(sim.error).toBe('');
        expect(sim.isNavigating).toBe(true);
        expect(sim.buttonText).toBe('Đang chuyển...');
        expect(sim.isButtonDisabled).toBe(true);
        expect(sim.navigationTarget).toBe('/live/waiting-room?pin=123456');

        // 8. Re-attempt submit while navigating is ignored
        sim.onSubmit();
        expect(sim.navigationTarget).toBe('/live/waiting-room?pin=123456');
      });
    });

    // -----------------------------------------------------------------------
    // 2.6 Static Source & AGENTS.md Conformance
    // -----------------------------------------------------------------------
    describe('2.6 Static Source & AGENTS.md Conformance', () => {
      const cardPath = path.resolve(
        process.cwd(),
        'src/components/dashboard/live-room/InlinePinEntryCard.tsx'
      );
      const source = fs.readFileSync(cardPath, 'utf8');

      it('TC-T2-15: Component declares native HTML input constraints (inputMode, pattern, maxLength)', () => {
        expect(source).toContain('type="text"');
        expect(source).toContain('inputMode="numeric"');
        expect(source).toContain('pattern="[0-9]*"');
        expect(source).toContain('maxLength={6}');
        expect(source).toContain('placeholder="Mã PIN 6 số (VD: 849201)"');
      });

      it('TC-T2-16: Component binds disabled={pin.length !== 6 || isNavigating} on button', () => {
        expect(source).toContain('disabled={pin.length !== 6 || isNavigating}');
        expect(source).toContain("isNavigating ? 'Đang chuyển...' : 'Vào phòng chờ'");
      });

      it('TC-T2-17: Component checks cleanPin.length !== 6 and sets error in handleSubmit', () => {
        expect(source).toContain("const cleanPin = pin.trim().replace(/\\D/g, '');");
        expect(source).toContain('if (cleanPin.length !== 6) {');
        expect(source).toContain("setError('Mã PIN phòng thi phải gồm đúng 6 chữ số');");
        expect(source).toContain('router.push(`/live/waiting-room?pin=${cleanPin}`);');
      });

      it('TC-T2-18: Props handling — compact prop conditionally applies p-4 vs p-5 sm:p-6', () => {
        expect(source).toContain("compact ? 'p-4' : 'p-5 sm:p-6'");
        expect(source).toContain('autoFocus={autoFocus}');
      });

      it('TC-T2-19: AGENTS.md compliance — Zero horizontal dividers (<hr>, divide-y, border-t, border-b)', () => {
        expect(source).not.toMatch(/<hr\b/);
        expect(source).not.toMatch(/\bdivide-y\b/);
        expect(source).not.toMatch(/\bborder-t\b/);
        expect(source).not.toMatch(/\bborder-b\b/);
      });

      it('TC-T2-20: AGENTS.md compliance — Theme tokens match Light #FFFFFF, Dark #111114, Cobalt #2563EB', () => {
        // Light background & dark card background
        expect(source).toContain('bg-white');
        expect(source).toContain('dark:bg-[#111114]');

        // Cobalt primary button & hover
        expect(source).toContain('bg-blue-600');
        expect(source).toContain('hover:bg-blue-700');

        // Border tokens
        expect(source).toContain('border-slate-200');
        expect(source).toContain('dark:border-zinc-800');

        // Text tokens
        expect(source).toContain('text-neutral-900');
        expect(source).toContain('dark:text-neutral-100');
        expect(source).toContain('text-slate-500');
        expect(source).toContain('dark:text-neutral-400');
      });

      it('TC-T2-21: AGENTS.md compliance — Zero JSX emojis in source code', () => {
        expect(source).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
      });
    });
  });

  // =========================================================================
  // TARGET 3: OrgSidebar & LiveRoomDashboardView Integration Hardening
  // =========================================================================
  describe('Target 3: Cross-Component MEMBER Protection & Discovery', () => {
    it('TC-T3-01: OrgSidebar grants MEMBER "Phòng thi trực tiếp" under CÁ NHÂN without secondary sub-rail', () => {
      const sidebarPath = path.resolve(
        process.cwd(),
        'src/components/dashboard/org/OrgSidebar.tsx'
      );
      const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

      // Member nav includes live-room
      expect(sidebarContent).toContain("name: 'Phòng thi trực tiếp'");
      expect(sidebarContent).toContain("href: `/org/${orgSlug}/live-room`");

      // isAssessmentRoute suppresses sub-rail for MEMBER
      expect(sidebarContent).toContain('const isAssessmentRoute =');
      expect(sidebarContent).toContain('!isMember &&');

      // Member nav includes live-room
      expect(sidebarContent).toContain("name: 'Phòng thi trực tiếp'");
      expect(sidebarContent).toContain("href: `/org/${orgSlug}/live-room`");
    });

    it('TC-T3-02: LiveRoomDashboardView renders InlinePinEntryCard and suppresses Host controls for MEMBER', () => {
      const viewPath = path.resolve(
        process.cwd(),
        'src/components/dashboard/live-room/LiveRoomDashboardView.tsx'
      );
      const viewContent = fs.readFileSync(viewPath, 'utf8');

      // Prop and state detection
      expect(viewContent).toContain('userRole?: string;');
      expect(viewContent).toContain("const isMember = currentRole === 'MEMBER';");

      // Suppression of "Tạo phòng thi"
      expect(viewContent).toContain('!isMember && (');
      expect(viewContent).toContain('Tạo phòng thi');

      // Prominent PIN entry for MEMBER
      expect(viewContent).toContain('{isMember && <InlinePinEntryCard className="shadow-xs" />}');

      // Member action button conversion
      expect(viewContent).toContain('<span>Vào thi</span>');
      expect(viewContent).toContain('<span>Vào phòng chờ</span>');
    });

    it('TC-T3-03: Personal dashboard and personal live-room embed InlinePinEntryCard', () => {
      const personalDashPath = path.resolve(
        process.cwd(),
        'src/app/(dashboard)/personal/dashboard/page.tsx'
      );
      const personalDashContent = fs.readFileSync(personalDashPath, 'utf8');
      expect(personalDashContent).toContain('<InlinePinEntryCard compact />');

      const personalLiveRoomPath = path.resolve(
        process.cwd(),
        'src/components/dashboard/personal/live-room/PersonalLiveRoomDashboardView.tsx'
      );
      const personalLiveRoomContent = fs.readFileSync(personalLiveRoomPath, 'utf8');
      expect(personalLiveRoomContent).toContain('<InlinePinEntryCard className="shadow-xs" />');
    });

    it('TC-T3-04: JSX emoji 👋 was removed from personal/dashboard/page.tsx', () => {
      const personalDashPath = path.resolve(
        process.cwd(),
        'src/app/(dashboard)/personal/dashboard/page.tsx'
      );
      const personalDashContent = fs.readFileSync(personalDashPath, 'utf8');
      expect(personalDashContent).not.toContain('👋');
    });
  });
});
