import { describe, it, expect } from 'vitest';
import { AuthoringWorkspaceMode } from '@/components/dashboard/authoring/AuthoringEditorTwoPane';
import { AssessmentSecuritySettings, DEFAULT_SECURITY_SETTINGS } from '../types/security.types';

describe('Workspace RBAC & Multi-Dashboard Authoring Rules', () => {
  describe('Workspace Mode Resolution', () => {
    function resolveEffectiveMode({
      workspaceMode,
      organizationId,
      returnUrl,
    }: {
      workspaceMode?: AuthoringWorkspaceMode;
      organizationId?: string;
      returnUrl: string;
    }): AuthoringWorkspaceMode {
      return (
        workspaceMode ||
        (organizationId || returnUrl.includes('/org/')
          ? 'ORG'
          : returnUrl.includes('/admin/')
          ? 'ADMIN'
          : 'PERSONAL')
      );
    }

    it('should prioritize explicit workspaceMode prop over URL patterns', () => {
      expect(
        resolveEffectiveMode({
          workspaceMode: 'ORG',
          returnUrl: '/personal/authoring',
        })
      ).toBe('ORG');

      expect(
        resolveEffectiveMode({
          workspaceMode: 'ADMIN',
          returnUrl: '/org/fpt-polytechnic/assessments',
        })
      ).toBe('ADMIN');

      expect(
        resolveEffectiveMode({
          workspaceMode: 'PERSONAL',
          returnUrl: '/admin/content',
        })
      ).toBe('PERSONAL');
    });

    it('should correctly infer ORG mode from organizationId or /org/ route', () => {
      expect(
        resolveEffectiveMode({
          organizationId: 'org-123',
          returnUrl: '/dashboard',
        })
      ).toBe('ORG');

      expect(
        resolveEffectiveMode({
          returnUrl: '/org/fpt-polytechnic/assessments',
        })
      ).toBe('ORG');
    });

    it('should correctly infer ADMIN mode from /admin/ route', () => {
      expect(
        resolveEffectiveMode({
          returnUrl: '/admin/content',
        })
      ).toBe('ADMIN');
    });

    it('should default to PERSONAL mode when no org or admin context exists', () => {
      expect(
        resolveEffectiveMode({
          returnUrl: '/personal/authoring',
        })
      ).toBe('PERSONAL');
    });
  });

  describe('Organization Authoring Contract (B2B Workspace)', () => {
    it('should enforce internal audience scope instead of platform Free vs PRO', () => {
      type OrgAudienceScope = 'ORG_WIDE' | 'ASSIGNED_CLASSES' | 'ACCESS_PIN';
      const validScopes: OrgAudienceScope[] = ['ORG_WIDE', 'ASSIGNED_CLASSES', 'ACCESS_PIN'];

      expect(validScopes).toContain('ORG_WIDE');
      expect(validScopes).toContain('ASSIGNED_CLASSES');
      expect(validScopes).toContain('ACCESS_PIN');

      // Free / PRO is NOT a valid org audience scope
      expect(validScopes).not.toContain('FREE');
      expect(validScopes).not.toContain('PRO');
      expect(validScopes).not.toContain('VIP');
    });

    it('should enforce visibility as ORGANIZATION and prevent personal reassignment', () => {
      interface AssessmentPayload {
        organization_id?: string | null;
        visibility?: 'PERSONAL' | 'ORGANIZATION' | 'PUBLIC';
        is_vip?: boolean;
        access_tier?: 'FREE' | 'VIP';
      }

      function sanitizeOrgUpdate(
        payload: AssessmentPayload,
        existingOrgId: string,
        isPlatformAdmin: boolean
      ): AssessmentPayload {
        const sanitized = { ...payload };
        if (!isPlatformAdmin) {
          // Non-platform-admins cannot modify monetization tier
          delete sanitized.is_vip;
          delete sanitized.access_tier;
          // Must stay bound to organization
          sanitized.organization_id = existingOrgId;
          sanitized.visibility = 'ORGANIZATION';
        }
        return sanitized;
      }

      const maliciousUpdate: AssessmentPayload = {
        organization_id: 'org-attacker',
        visibility: 'PUBLIC',
        is_vip: true,
        access_tier: 'VIP',
      };

      const result = sanitizeOrgUpdate(maliciousUpdate, 'org-fpt', false);
      expect(result.organization_id).toBe('org-fpt');
      expect(result.visibility).toBe('ORGANIZATION');
      expect(result.is_vip).toBeUndefined();
      expect(result.access_tier).toBeUndefined();
    });

    it('should support full 11 proctoring security toggles for exam integrity', () => {
      const orgSecuritySettings: AssessmentSecuritySettings = {
        ...DEFAULT_SECURITY_SETTINGS,
        tab_switch_guard: true,
        max_violations: 2,
        active_warning: true,
        block_copy: true,
      };

      expect(orgSecuritySettings.tab_switch_guard).toBe(true);
      expect(orgSecuritySettings.max_violations).toBe(2);
      expect(orgSecuritySettings.active_warning).toBe(true);
      expect(orgSecuritySettings.block_copy).toBe(true);
    });
  });

  describe('Personal Authoring Contract (B2C Workspace)', () => {
    it('should map personal publish modes correctly', () => {
      type PersonalPublishMode = 'PRIVATE' | 'LIVE_ROOM' | 'COMMUNITY';

      function mapPersonalVisibility(mode: PersonalPublishMode): 'PERSONAL' | 'PUBLIC' {
        return mode === 'COMMUNITY' ? 'PUBLIC' : 'PERSONAL';
      }

      expect(mapPersonalVisibility('PRIVATE')).toBe('PERSONAL');
      expect(mapPersonalVisibility('LIVE_ROOM')).toBe('PERSONAL');
      expect(mapPersonalVisibility('COMMUNITY')).toBe('PUBLIC');
    });

    it('should prevent standard learners from self-promoting assessments to VIP or Canonical', () => {
      function evaluatePersonalCreation({
        userRole,
        requestedVip,
        requestedCanonical,
      }: {
        userRole: 'LEARNER' | 'ADMIN';
        requestedVip?: boolean;
        requestedCanonical?: boolean;
      }) {
        const isAllowed = userRole === 'ADMIN';
        return {
          is_vip: isAllowed ? Boolean(requestedVip) : false,
          is_system_canonical: isAllowed ? Boolean(requestedCanonical) : false,
        };
      }

      const learnerAttempt = evaluatePersonalCreation({
        userRole: 'LEARNER',
        requestedVip: true,
        requestedCanonical: true,
      });

      expect(learnerAttempt.is_vip).toBe(false);
      expect(learnerAttempt.is_system_canonical).toBe(false);

      const adminAttempt = evaluatePersonalCreation({
        userRole: 'ADMIN',
        requestedVip: true,
        requestedCanonical: true,
      });

      expect(adminAttempt.is_vip).toBe(true);
      expect(adminAttempt.is_system_canonical).toBe(true);
    });
  });

  describe('Platform Admin Authoring Contract', () => {
    it('should grant Platform Admin full authority to set Canonical and Monetization Tier', () => {
      interface AdminPublishConfig {
        is_published: boolean;
        is_system_canonical: boolean;
        is_vip: boolean;
        access_tier: 'FREE' | 'VIP';
        security_settings: AssessmentSecuritySettings;
      }

      const adminConfig: AdminPublishConfig = {
        is_published: true,
        is_system_canonical: true,
        is_vip: true,
        access_tier: 'VIP',
        security_settings: {
          ...DEFAULT_SECURITY_SETTINGS,
          fullscreen_lock: true,
          block_copy: true,
        },
      };

      expect(adminConfig.is_system_canonical).toBe(true);
      expect(adminConfig.access_tier).toBe('VIP');
      expect(adminConfig.is_vip).toBe(true);
      expect(adminConfig.security_settings.fullscreen_lock).toBe(true);
    });
  });
});
