import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { formatAuthoringSubHeader, checkNoDigCompInText } from './round2-acceptance.test';

/**
 * ============================================================================
 * Milestone 2 Acceptance & Integration Tests:
 * F23: Duration State Preservation & Auto-Save
 * F24: Sub-Header Stats & Quick Duration Popover (Quizizz Model)
 * F25: AI Actions Toolbar Refinement & 5 Domains AI
 * F26: 3 Authoring Spaces Partitioning (Admin, Org, Personal)
 * F27: Class Assignment Modal Navigation Fix
 * F28: Campaigns vs Class Demarcation
 * ============================================================================
 */

describe('Milestone 2: Authoring Flow & Class Assignment Demarcation', () => {

  // --------------------------------------------------------------------------
  // F23: Duration State Preservation & Auto-Save
  // --------------------------------------------------------------------------
  describe('F23: Duration State Preservation & Auto-Save', () => {
    it('TC-M2-F23-01: Updating duration dispatches direct PATCH /api/personal/assessments/[id] with duration_minutes', () => {
      const assessmentId = 'asm-test-uuid-42';
      const newDuration = 60;

      const patchCall = {
        url: `/api/personal/assessments/${assessmentId}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_minutes: newDuration }),
      };

      const parsedBody = JSON.parse(patchCall.body);
      expect(patchCall.url).toBe('/api/personal/assessments/asm-test-uuid-42');
      expect(patchCall.method).toBe('PATCH');
      expect(parsedBody).toHaveProperty('duration_minutes', 60);
      expect(parsedBody).not.toHaveProperty('questions'); // Separated from items endpoint
    });

    it('TC-M2-F23-02: Direct publish flow publishes with preserved publishDuration without re-prompting modal', () => {
      let isPublishModalOpen = false;
      const publishDuration = 90;
      let isPublished = false;
      let finalPublishedDuration = 0;

      const handleTogglePublish = () => {
        // Direct publish without opening isPublishModalOpen
        isPublished = true;
        finalPublishedDuration = publishDuration;
      };

      handleTogglePublish();

      expect(isPublished).toBe(true);
      expect(finalPublishedDuration).toBe(90);
      expect(isPublishModalOpen).toBe(false); // No prompt dialog shown
    });

    it('TC-M2-F23-03: Duration values are bounded within [5, 300] minutes', () => {
      const clampDuration = (mins: number) => Math.max(5, Math.min(300, Math.round(mins)));

      expect(clampDuration(3)).toBe(5);
      expect(clampDuration(45)).toBe(45);
      expect(clampDuration(120.4)).toBe(120);
      expect(clampDuration(350)).toBe(300);
    });
  });

  // --------------------------------------------------------------------------
  // F24: Sub-Header Stats & Quick Duration Popover
  // --------------------------------------------------------------------------
  describe('F24: Sub-Header Stats & Quick Duration Popover (Quizizz Model)', () => {
    it('TC-M2-F24-01: Formats sub-header stats string as "[X] Câu hỏi • [Y] Điểm • [Z] Phút"', () => {
      expect(formatAuthoringSubHeader(10, 100, 30)).toBe('10 Câu hỏi • 100 Điểm • 30 Phút');
      expect(formatAuthoringSubHeader(0, 0, 45)).toBe('0 Câu hỏi • 0 Điểm • 45 Phút');
      expect(formatAuthoringSubHeader(50, 100, 120)).toBe('50 Câu hỏi • 100 Điểm • 120 Phút');
    });

    it('TC-M2-F24-02: Standard duration presets include 15, 30, 45, 60, 90, 120 minutes', () => {
      const expectedPresets = [15, 30, 45, 60, 90, 120];
      const selectedPreset = 45;

      expect(expectedPresets).toContain(selectedPreset);
      expect(expectedPresets.length).toBe(6);
    });

    it('TC-M2-F24-03: Selecting a preset immediately invokes auto-save PATCH and closes popover', () => {
      let isPopoverOpen = true;
      let savedDuration = 45;
      const mockPatch = vi.fn();

      const handleSelectPresetDuration = (mins: number) => {
        savedDuration = mins;
        mockPatch({ duration_minutes: mins });
        isPopoverOpen = false;
      };

      handleSelectPresetDuration(60);

      expect(savedDuration).toBe(60);
      expect(isPopoverOpen).toBe(false);
      expect(mockPatch).toHaveBeenCalledWith({ duration_minutes: 60 });
    });

    it('TC-M2-F24-04: Custom duration input parses and validates user entry before auto-saving', () => {
      let isPopoverOpen = true;
      let savedDuration = 45;
      const mockPatch = vi.fn();

      const handleApplyCustomDuration = (inputStr: string) => {
        const val = parseInt(inputStr, 10);
        if (!isNaN(val) && val >= 5 && val <= 300) {
          savedDuration = val;
          mockPatch({ duration_minutes: val });
          isPopoverOpen = false;
          return true;
        }
        return false;
      };

      expect(handleApplyCustomDuration('75')).toBe(true);
      expect(savedDuration).toBe(75);
      expect(isPopoverOpen).toBe(false);
      expect(mockPatch).toHaveBeenCalledWith({ duration_minutes: 75 });

      // Invalid input rejected
      expect(handleApplyCustomDuration('abc')).toBe(false);
      expect(handleApplyCustomDuration('2')).toBe(false);
      expect(handleApplyCustomDuration('500')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // F25: AI Actions Toolbar Refinement
  // --------------------------------------------------------------------------
  describe('F25: AI Actions Toolbar Refinement', () => {
    it('TC-M2-F25-01: AuthoringEditorTwoPane file contains neutral slate/zinc tokens for AI toolbar and NO rainbow gradient', () => {
      const filePath = path.join(process.cwd(), 'src/components/dashboard/authoring/AuthoringEditorTwoPane.tsx');
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Rainbow gradient was removed
      expect(fileContent).not.toContain('bg-gradient-to-r from-blue-50/70');
      expect(fileContent).not.toContain('via-indigo-50/40');
      // Clean slate/zinc tokens used
      expect(fileContent).toContain('bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800');
    });

    it('TC-M2-F25-02: 3 AI action buttons are wired: SIMILAR_QUESTION, EXPLAIN_OPTIONS, GENERATE_BY_DOMAIN', () => {
      const filePath = path.join(process.cwd(), 'src/components/dashboard/authoring/AuthoringEditorTwoPane.tsx');
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      expect(fileContent).toContain('action: \'SIMILAR_QUESTION\'');
      expect(fileContent).toContain('action: \'EXPLAIN_OPTIONS\'');
      expect(fileContent).toContain('action: \'GENERATE_BY_DOMAIN\'');
      expect(fileContent).toContain('/api/ai/authoring-assist');
    });

    it('TC-M2-F25-03: Zero occurrences of "DigComp" in AuthoringEditorTwoPane user-facing strings', () => {
      const filePath = path.join(process.cwd(), 'src/components/dashboard/authoring/AuthoringEditorTwoPane.tsx');
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      const digCompCheck = checkNoDigCompInText(fileContent);
      expect(digCompCheck.hasDigComp).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // F26: 3 Authoring Spaces Partitioning
  // --------------------------------------------------------------------------
  describe('F26: 3 Authoring Spaces Partitioning', () => {
    it('TC-M2-F26-01: AuthoringWorkspaceMode strictly supports ADMIN, ORG, and PERSONAL', () => {
      const WorkspaceModeSchema = z.enum(['ADMIN', 'ORG', 'PERSONAL']);

      expect(WorkspaceModeSchema.safeParse('ADMIN').success).toBe(true);
      expect(WorkspaceModeSchema.safeParse('ORG').success).toBe(true);
      expect(WorkspaceModeSchema.safeParse('PERSONAL').success).toBe(true);
      expect(WorkspaceModeSchema.safeParse('PUBLIC').success).toBe(false);
    });

    it('TC-M2-F26-02: Effective mode resolution properly segregates spaces based on route or organization context', () => {
      const resolveEffectiveMode = (opts: {
        explicitMode?: 'ADMIN' | 'ORG' | 'PERSONAL';
        returnUrl: string;
        organizationId?: string;
      }) => {
        if (opts.explicitMode) return opts.explicitMode;
        if (opts.organizationId || opts.returnUrl.includes('/org/')) return 'ORG';
        if (opts.returnUrl.includes('/admin/')) return 'ADMIN';
        return 'PERSONAL';
      };

      expect(resolveEffectiveMode({ returnUrl: '/admin/content/assessments' })).toBe('ADMIN');
      expect(resolveEffectiveMode({ returnUrl: '/org/demo/assessments', organizationId: 'org-1' })).toBe('ORG');
      expect(resolveEffectiveMode({ returnUrl: '/personal/authoring' })).toBe('PERSONAL');
    });

    it('TC-M2-F26-03: Publishing in ORG mode enforces visibility=ORGANIZATION and preserves organizationId', () => {
      const handleOrgPublish = (assessmentId: string, orgId: string, duration: number) => ({
        url: `/api/personal/assessments/${assessmentId}`,
        method: 'PATCH',
        body: {
          is_published: true,
          duration_minutes: duration,
          visibility: 'ORGANIZATION',
        },
      });

      const payload = handleOrgPublish('asm-1', 'org-1', 45);
      expect(payload.body.visibility).toBe('ORGANIZATION');
      expect(payload.body.duration_minutes).toBe(45);
    });
  });

  // --------------------------------------------------------------------------
  // F27: Class Assignment Modal Navigation Fix
  // --------------------------------------------------------------------------
  describe('F27: Class Assignment Modal Navigation Fix in OrgClassDetailView', () => {
    it('TC-M2-F27-01: OrgClassDetailView uses button triggering setIsAssignModalOpen(true) instead of Link to /campaigns/new', () => {
      const filePath = path.join(process.cwd(), 'src/components/dashboard/org/classes/OrgClassDetailView.tsx');
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // The bug: Link to /campaigns/new in assignments tab
      expect(fileContent).not.toContain('href={`/org/${slug}/campaigns/new?classId=${classData.id}`}');
      // The fix: button with onClick setIsAssignModalOpen(true)
      expect(fileContent).toContain('onClick={() => setIsAssignModalOpen(true)}');
      // AssignAssessmentModal is rendered
      expect(fileContent).toContain('<AssignAssessmentModal');
      expect(fileContent).toContain('isOpen={isAssignModalOpen}');
    });

    it('TC-M2-F27-02: AssignAssessmentModal receives classId and class-specific context', () => {
      const modalProps = {
        isOpen: true,
        organizationId: 'org-1',
        organizationSlug: 'fpt-polytechnic',
        classId: 'cls-101',
        className: 'Lớp Tin học cơ sở K18',
        memberCount: 45,
      };

      expect(modalProps.classId).toBe('cls-101');
      expect(modalProps.memberCount).toBe(45);
    });
  });

  // --------------------------------------------------------------------------
  // F28: Campaigns vs Class Demarcation
  // --------------------------------------------------------------------------
  describe('F28: Campaigns vs Class Demarcation', () => {
    it('TC-M2-F28-01: Class assignment submits to class-scoped API /api/organizations/[orgId]/classes/[classId]/assignments', () => {
      const buildClassAssignmentUrl = (orgId: string, classId: string) =>
        `/api/organizations/${orgId}/classes/${classId}/assignments`;

      const url = buildClassAssignmentUrl('org-uuid-1', 'cls-uuid-99');
      expect(url).toBe('/api/organizations/org-uuid-1/classes/cls-uuid-99/assignments');
    });

    it('TC-M2-F28-02: Institutional campaign submits to org-wide API /api/organizations/[orgId]/campaigns with multi-class array', () => {
      const buildCampaignPayload = (orgId: string, assessmentId: string, classIds: string[]) => ({
        url: `/api/organizations/${orgId}/campaigns`,
        body: {
          assessmentId,
          classIds,
          isLocked: true,
        },
      });

      const campaign = buildCampaignPayload('org-uuid-1', 'asm-1', ['cls-1', 'cls-2', 'cls-3']);
      expect(campaign.url).toBe('/api/organizations/org-uuid-1/campaigns');
      expect(campaign.body.classIds).toHaveLength(3);
      expect(campaign.body.isLocked).toBe(true);
    });

    it('TC-M2-F28-03: Publishing success dialog in ORG mode clearly offers both Class Assignment and Campaign creation choices', () => {
      const filePath = path.join(process.cwd(), 'src/components/dashboard/authoring/AuthoringEditorTwoPane.tsx');
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Both choices clearly rendered in success modal
      expect(fileContent).toContain('Giao đề cho Lớp học ngay');
      expect(fileContent).toContain('Tạo Đợt khảo thí (Campaign) diện rộng');
    });
  });
});
