/**
 * Security & Proctoring Types for NEXA Assessment Platform
 * Implements 11 Configurable Toggles (T1..T11), Quick Presets, and Automated Trust Scoring.
 */

export interface AssessmentSecuritySettings {
  /** T1: Khóa toàn màn hình (Fullscreen Lock) */
  fullscreen_lock: boolean;
  /** T2: Chống chuyển tab (Tab-Switch Guard) */
  tab_switch_guard: boolean;
  /** T3: Số lần rời tab tối đa (1, 3, 5, hoặc 0 cho không giới hạn) */
  max_violations: number;
  /** T4: Chế độ cảnh báo thí sinh (true = Active warning popup/toast; false = Silent proctoring) */
  active_warning: boolean;
  /** T5: Chặn sao chép đề thi (Vô hiệu chuột phải, Ctrl+C - cho phép dán URL/văn bản) */
  block_copy: boolean;
  /** T6: Watermark chống chụp lén (Dynamic Watermark email + ID) */
  dynamic_watermark: boolean;
  /** T7: Chặn DevTools (F12, Ctrl+Shift+I) */
  block_devtools: boolean;
  /** T8: Xáo trộn thứ tự câu hỏi (Shuffle Questions) */
  shuffle_questions: boolean;
  /** T9: Xáo trộn thứ tự đáp án (Shuffle Options) */
  shuffle_options: boolean;
  /** T10: Cờ xem lại & Bảng câu hỏi (Review Flag & 3-Color Question Palette) */
  review_flag_palette: boolean;
  /** T11: Khóa quay lại câu trước (Linear Progression) */
  linear_progression: boolean;
}

export type SecurityPresetKey = 'PRACTICE' | 'STANDARD' | 'STRICT' | 'CUSTOM';

export interface SecurityPresetDefinition {
  key: SecurityPresetKey;
  label: string;
  description: string;
  badge: string;
  settings: AssessmentSecuritySettings;
}

export const DEFAULT_SECURITY_SETTINGS: AssessmentSecuritySettings = {
  fullscreen_lock: false,
  tab_switch_guard: false,
  max_violations: 3,
  active_warning: true,
  block_copy: false,
  dynamic_watermark: false,
  block_devtools: false,
  shuffle_questions: false,
  shuffle_options: false,
  review_flag_palette: true,
  linear_progression: false,
};

export const SECURITY_PRESETS: Record<Exclude<SecurityPresetKey, 'CUSTOM'>, SecurityPresetDefinition> = {
  PRACTICE: {
    key: 'PRACTICE',
    label: 'Luyện tập tự do',
    description: 'Tắt mọi rào cản giám sát, cho phép chuyển tab tra cứu tài liệu, xáo đề và hỗ trợ gắn cờ xem lại.',
    badge: 'Tự do',
    settings: {
      fullscreen_lock: false,
      tab_switch_guard: false,
      max_violations: 0,
      active_warning: false,
      block_copy: false,
      dynamic_watermark: false,
      block_devtools: false,
      shuffle_questions: true,
      shuffle_options: true,
      review_flag_palette: true,
      linear_progression: false,
    },
  },
  STANDARD: {
    key: 'STANDARD',
    label: 'Khảo thí tiêu chuẩn',
    description: 'Chống chuyển tab (tối đa 3 lần), chặn copy đề bài, xáo câu hỏi và đáp án. Phù hợp kiểm tra lớp học.',
    badge: 'Tiêu chuẩn',
    settings: {
      fullscreen_lock: false,
      tab_switch_guard: true,
      max_violations: 3,
      active_warning: true,
      block_copy: true,
      dynamic_watermark: false,
      block_devtools: false,
      shuffle_questions: true,
      shuffle_options: true,
      review_flag_palette: true,
      linear_progression: false,
    },
  },
  STRICT: {
    key: 'STRICT',
    label: 'Nghiêm ngặt / Chứng chỉ',
    description: 'Khóa toàn màn hình, chống chuyển tab 1 lần, in chìm Watermark chống chụp lén, chặn copy & F12.',
    badge: 'Nghiêm ngặt',
    settings: {
      fullscreen_lock: true,
      tab_switch_guard: true,
      max_violations: 1,
      active_warning: true,
      block_copy: true,
      dynamic_watermark: true,
      block_devtools: true,
      shuffle_questions: true,
      shuffle_options: true,
      review_flag_palette: true,
      linear_progression: false,
    },
  },
};

export type ViolationType =
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'DEVTOOLS_ATTEMPT'
  | 'COPY_ATTEMPT';

export interface ProctoringViolationEvent {
  id: string;
  type: ViolationType;
  timestamp: string; // ISO String
  durationSeconds?: number;
  details?: string;
}

export type IntegrityFlag = 'HIGH_TRUST' | 'SUSPICIOUS' | 'FLAGGED';

export interface ProctoringSummary {
  trustScore: number; // 0 - 100
  integrityFlag: IntegrityFlag;
  totalViolations: number;
  tabSwitchesCount: number;
  fullscreenExitsCount: number;
  copyAttemptsCount: number;
  devtoolsAttemptsCount: number;
  totalTimeOutOfFocusSeconds: number;
  events: ProctoringViolationEvent[];
  activeWarningMode: boolean;
  submittedAt: string;
}

/**
 * Calculates candidate Trust Score (0-100%) and Integrity Flag
 * based on proctoring events and assessment settings.
 */
export function calculateTrustScore(
  events: ProctoringViolationEvent[] = [],
  settings: Partial<AssessmentSecuritySettings> = {}
): {
  trustScore: number;
  integrityFlag: IntegrityFlag;
  tabSwitchesCount: number;
  fullscreenExitsCount: number;
  copyAttemptsCount: number;
  devtoolsAttemptsCount: number;
  totalTimeOutOfFocusSeconds: number;
} {
  let score = 100;
  let tabSwitches = 0;
  let fullscreenExits = 0;
  let copyAttempts = 0;
  let devtoolsAttempts = 0;
  let totalOutOfFocus = 0;

  for (const ev of events) {
    if (ev.type === 'TAB_SWITCH') {
      tabSwitches += 1;
      const duration = ev.durationSeconds || 1;
      totalOutOfFocus += duration;
      // Trừ 10 điểm mỗi lần chuyển tab, cộng thêm 2 điểm cho mỗi 5s ngoài màn hình
      score -= 10 + Math.min(20, Math.floor(duration / 5) * 2);
    } else if (ev.type === 'FULLSCREEN_EXIT') {
      fullscreenExits += 1;
      score -= 15;
    } else if (ev.type === 'DEVTOOLS_ATTEMPT') {
      devtoolsAttempts += 1;
      score -= 25;
    } else if (ev.type === 'COPY_ATTEMPT') {
      copyAttempts += 1;
      score -= 5;
    }
  }

  const maxAllowed = settings.max_violations ?? 3;
  if (maxAllowed > 0 && tabSwitches > maxAllowed) {
    score -= (tabSwitches - maxAllowed) * 15;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let integrityFlag: IntegrityFlag = 'HIGH_TRUST';
  if (score < 60 || devtoolsAttempts > 0 || (maxAllowed > 0 && tabSwitches >= maxAllowed + 2)) {
    integrityFlag = 'FLAGGED';
  } else if (score < 85 || tabSwitches > 1 || fullscreenExits > 0) {
    integrityFlag = 'SUSPICIOUS';
  }

  return {
    trustScore: score,
    integrityFlag,
    tabSwitchesCount: tabSwitches,
    fullscreenExitsCount: fullscreenExits,
    copyAttemptsCount: copyAttempts,
    devtoolsAttemptsCount: devtoolsAttempts,
    totalTimeOutOfFocusSeconds: totalOutOfFocus,
  };
}

/**
 * Detects whether the current settings match one of the 3 presets or is custom
 */
export function detectSecurityPreset(settings: AssessmentSecuritySettings): SecurityPresetKey {
  for (const presetKey of ['PRACTICE', 'STANDARD', 'STRICT'] as const) {
    const preset = SECURITY_PRESETS[presetKey].settings;
    const matches =
      settings.fullscreen_lock === preset.fullscreen_lock &&
      settings.tab_switch_guard === preset.tab_switch_guard &&
      settings.block_copy === preset.block_copy &&
      settings.dynamic_watermark === preset.dynamic_watermark &&
      settings.block_devtools === preset.block_devtools &&
      settings.shuffle_questions === preset.shuffle_questions &&
      settings.shuffle_options === preset.shuffle_options &&
      settings.review_flag_palette === preset.review_flag_palette &&
      settings.linear_progression === preset.linear_progression;
    if (matches) return presetKey;
  }
  return 'CUSTOM';
}
