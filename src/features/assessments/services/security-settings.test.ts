import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SECURITY_SETTINGS,
  SECURITY_PRESETS,
  detectSecurityPreset,
  calculateTrustScore,
  AssessmentSecuritySettings,
  ProctoringViolationEvent,
} from '../types/security.types';

describe('Assessment Security Settings & 11 Toggles Contract', () => {
  it('DEFAULT_SECURITY_SETTINGS should have all 11 toggles with secure default values', () => {
    expect(DEFAULT_SECURITY_SETTINGS).toBeDefined();
    // T1..T7: Security & Anti-Cheat
    expect(DEFAULT_SECURITY_SETTINGS.fullscreen_lock).toBe(false);
    expect(DEFAULT_SECURITY_SETTINGS.tab_switch_guard).toBe(false);
    expect(DEFAULT_SECURITY_SETTINGS.max_violations).toBe(3);
    expect(DEFAULT_SECURITY_SETTINGS.active_warning).toBe(true);
    expect(DEFAULT_SECURITY_SETTINGS.block_copy).toBe(false);
    expect(DEFAULT_SECURITY_SETTINGS.dynamic_watermark).toBe(false);
    expect(DEFAULT_SECURITY_SETTINGS.block_devtools).toBe(false);

    // T8..T11: Format & Experience
    expect(DEFAULT_SECURITY_SETTINGS.shuffle_questions).toBe(false);
    expect(DEFAULT_SECURITY_SETTINGS.shuffle_options).toBe(false);
    expect(DEFAULT_SECURITY_SETTINGS.review_flag_palette).toBe(true);
    expect(DEFAULT_SECURITY_SETTINGS.linear_progression).toBe(false);
  });

  it('SECURITY_PRESETS should define PRACTICE, STANDARD, and STRICT accurately', () => {
    expect(SECURITY_PRESETS.PRACTICE).toBeDefined();
    expect(SECURITY_PRESETS.STANDARD).toBeDefined();
    expect(SECURITY_PRESETS.STRICT).toBeDefined();

    // Practice allows free navigation
    expect(SECURITY_PRESETS.PRACTICE.settings.fullscreen_lock).toBe(false);
    expect(SECURITY_PRESETS.PRACTICE.settings.tab_switch_guard).toBe(false);

    // Standard enforces tab switch & copy block
    expect(SECURITY_PRESETS.STANDARD.settings.fullscreen_lock).toBe(false);
    expect(SECURITY_PRESETS.STANDARD.settings.tab_switch_guard).toBe(true);
    expect(SECURITY_PRESETS.STANDARD.settings.block_copy).toBe(true);
    expect(SECURITY_PRESETS.STANDARD.settings.max_violations).toBe(3);

    // Strict enforces full lockdown including watermark, devtools block, copy block
    expect(SECURITY_PRESETS.STRICT.settings.fullscreen_lock).toBe(true);
    expect(SECURITY_PRESETS.STRICT.settings.dynamic_watermark).toBe(true);
    expect(SECURITY_PRESETS.STRICT.settings.block_devtools).toBe(true);
    expect(SECURITY_PRESETS.STRICT.settings.block_copy).toBe(true);
    expect(SECURITY_PRESETS.STRICT.settings.max_violations).toBe(1);
  });

  it('detectSecurityPreset should identify presets and custom configurations correctly', () => {
    expect(detectSecurityPreset(SECURITY_PRESETS.PRACTICE.settings as AssessmentSecuritySettings)).toBe('PRACTICE');
    expect(detectSecurityPreset(SECURITY_PRESETS.STANDARD.settings as AssessmentSecuritySettings)).toBe('STANDARD');
    expect(detectSecurityPreset(SECURITY_PRESETS.STRICT.settings as AssessmentSecuritySettings)).toBe('STRICT');

    // Custom toggle modification
    const customSettings: AssessmentSecuritySettings = {
      ...SECURITY_PRESETS.PRACTICE.settings,
      dynamic_watermark: true, // modified switch
    } as AssessmentSecuritySettings;
    expect(detectSecurityPreset(customSettings)).toBe('CUSTOM');
  });
});

describe('Smart Proctoring & Trust Score Calculation (calculateTrustScore)', () => {
  it('should award 100% and HIGH_TRUST when zero violation events occur', () => {
    const result = calculateTrustScore([], { max_violations: 3 });
    expect(result.trustScore).toBe(100);
    expect(result.integrityFlag).toBe('HIGH_TRUST');
    expect(result.tabSwitchesCount).toBe(0);
    expect(result.totalTimeOutOfFocusSeconds).toBe(0);
  });

  it('should flag SUSPICIOUS when candidate switches tab within tolerance', () => {
    const events: ProctoringViolationEvent[] = [
      {
        id: 'ev_1',
        type: 'TAB_SWITCH',
        timestamp: new Date().toISOString(),
        durationSeconds: 3,
        details: 'Rời tab 3 giây',
      },
      {
        id: 'ev_2',
        type: 'TAB_SWITCH',
        timestamp: new Date().toISOString(),
        durationSeconds: 4,
        details: 'Rời tab 4 giây',
      },
    ];

    const result = calculateTrustScore(events, { max_violations: 3 });
    expect(result.tabSwitchesCount).toBe(2);
    expect(result.totalTimeOutOfFocusSeconds).toBe(7);
    expect(result.trustScore).toBeLessThan(100);
    expect(result.trustScore).toBeGreaterThanOrEqual(60);
    expect(result.integrityFlag).toBe('SUSPICIOUS');
  });

  it('should flag FLAGGED when candidate attempts DevTools or exceeds max_violations', () => {
    const events: ProctoringViolationEvent[] = [
      {
        id: 'ev_dev',
        type: 'DEVTOOLS_ATTEMPT',
        timestamp: new Date().toISOString(),
        details: 'Thí sinh bấm F12',
      },
    ];

    const result = calculateTrustScore(events, { max_violations: 3 });
    expect(result.devtoolsAttemptsCount).toBe(1);
    expect(result.integrityFlag).toBe('FLAGGED');
    expect(result.trustScore).toBeLessThanOrEqual(75);
  });

  it('should penalize copy attempts and fullscreen exits', () => {
    const events: ProctoringViolationEvent[] = [
      {
        id: 'ev_fs',
        type: 'FULLSCREEN_EXIT',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'ev_cp',
        type: 'COPY_ATTEMPT',
        timestamp: new Date().toISOString(),
      },
    ];

    const result = calculateTrustScore(events, { max_violations: 3 });
    expect(result.fullscreenExitsCount).toBe(1);
    expect(result.copyAttemptsCount).toBe(1);
    // 100 - 15 (fullscreen) - 5 (copy) = 80
    expect(result.trustScore).toBe(80);
    expect(result.integrityFlag).toBe('SUSPICIOUS');
  });

  it('should compute accurately in silent proctoring mode (active_warning: false)', () => {
    const settings: Partial<AssessmentSecuritySettings> = {
      active_warning: false, // Silent monitoring
      max_violations: 2,
    };

    const events: ProctoringViolationEvent[] = [
      { id: '1', type: 'TAB_SWITCH', timestamp: new Date().toISOString(), durationSeconds: 2 },
      { id: '2', type: 'TAB_SWITCH', timestamp: new Date().toISOString(), durationSeconds: 5 },
      { id: '3', type: 'TAB_SWITCH', timestamp: new Date().toISOString(), durationSeconds: 10 },
      { id: '4', type: 'TAB_SWITCH', timestamp: new Date().toISOString(), durationSeconds: 3 },
    ];

    const result = calculateTrustScore(events, settings);
    expect(result.tabSwitchesCount).toBe(4);
    expect(result.integrityFlag).toBe('FLAGGED');
  });
});
