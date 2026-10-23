import { describe, it, expect } from 'vitest';
import { parseMCQCSV, parseScenarioCSV, parsePracticalCSV } from '../utils/csv-helper';

describe('Boundary Test 1: Malformed CSV, Wrong Format, & Invalid DigComp Domain', () => {
  it('rejects Practical CSV uploaded to MCQ parser', () => {
    const wrongFormatCSV = `domain,prompt,submission_type,criterion_1_name,criterion_1_weight
3,"Thiết kế dashboard",BOTH,"Giao diện trực quan",50`;
    const result = parseMCQCSV(wrongFormatCSV);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/định dạng|lựa chọn|option_a/i);
  });

  it('reports specific line numbers when domain contains invalid values (e.g. 9 or text)', () => {
    const invalidDomainCSV = `domain,prompt,option_a,option_b,option_c,option_d,correct_answer
9,"Câu hỏi 1","A","B","C","D","A"
ABC,"Câu hỏi 2","A","B","C","D","B"`;
    const result = parseMCQCSV(invalidDomainCSV);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0]).toContain('Dòng 2');
    expect(result.errors[0]).toContain('9');
    expect(result.errors[1]).toContain('Dòng 3');
    expect(result.errors[1]).toContain('ABC');
  });

  it('accepts valid 5 DigComp domains as numbers or comma-separated strings', () => {
    const validCSV = `domain,prompt,option_a,option_b,option_c,option_d,correct_answer,explanation,points
4,"Bảo mật tài khoản bằng 2FA","Bật 2FA","Tắt 2FA","Bỏ qua","Không rõ","A","Giải thích",10
"1, 2","Tìm kiếm thông tin khoa học","Google Scholar","Facebook","Tiktok","Zalo","A","Giải thích",10`;
    const result = parseMCQCSV(validCSV);
    expect(result.errors.length).toBe(0);
    expect(result.items.length).toBe(2);
    expect(result.items[0].domains).toEqual([4]);
    expect(result.items[1].domains).toEqual([1, 2]);
  });
});

describe('Boundary Test 2: Late Joiner Remaining Time Calculation', () => {
  function computeRemainingTime(
    durationMinutes: number,
    startedAt: string | null | undefined,
    currentTime: Date
  ): { elapsedSeconds: number; remainingSeconds: number; hasStarted: boolean } {
    const totalSeconds = durationMinutes * 60;
    if (!startedAt) {
      return { elapsedSeconds: 0, remainingSeconds: totalSeconds, hasStarted: false };
    }
    const startTime = new Date(startedAt).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((currentTime.getTime() - startTime) / 1000));
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
    return { elapsedSeconds, remainingSeconds, hasStarted: true };
  }

  it('deducts exactly 3 minutes (180 seconds) when student joins 3 minutes after start', () => {
    const startedAt = new Date('2026-10-22T10:00:00Z').toISOString();
    const studentJoinTime = new Date('2026-10-22T10:03:00Z'); // 3 mins later
    const durationMinutes = 45; // 2700s

    const result = computeRemainingTime(durationMinutes, startedAt, studentJoinTime);
    expect(result.hasStarted).toBe(true);
    expect(result.elapsedSeconds).toBe(180);
    expect(result.remainingSeconds).toBe(2520); // 42 minutes remaining
  });

  it('clamps remaining time to 0 if student joins after the exam duration has ended', () => {
    const startedAt = new Date('2026-10-22T10:00:00Z').toISOString();
    const lateJoinTime = new Date('2026-10-22T11:00:00Z'); // 60 mins later for a 45 min exam
    const durationMinutes = 45;

    const result = computeRemainingTime(durationMinutes, startedAt, lateJoinTime);
    expect(result.hasStarted).toBe(true);
    expect(result.elapsedSeconds).toBe(3600);
    expect(result.remainingSeconds).toBe(0);
  });

  it('preserves full duration when room has not started yet', () => {
    const durationMinutes = 45;
    const result = computeRemainingTime(durationMinutes, null, new Date());
    expect(result.hasStarted).toBe(false);
    expect(result.elapsedSeconds).toBe(0);
    expect(result.remainingSeconds).toBe(2700);
  });
});

describe('Boundary Test 3: Anti-Cheat Proctoring & Stage 1 Auto-Lock Logic', () => {
  interface ProctoringState {
    activeStage: 'STAGE_1_OBJECTIVE' | 'STAGE_2_PRACTICAL';
    isStage1Locked: boolean;
    violationCount: number;
    modalOpen: boolean;
    warningLevel: number;
  }

  function handleBlurViolation(state: ProctoringState): ProctoringState {
    // If in Practical stage or Stage 1 is already locked, do NOT count violations
    if (state.activeStage === 'STAGE_2_PRACTICAL' || state.isStage1Locked) {
      return state;
    }

    const newCount = state.violationCount + 1;
    if (newCount >= 3) {
      return {
        ...state,
        violationCount: newCount,
        isStage1Locked: true,
        activeStage: 'STAGE_2_PRACTICAL',
        modalOpen: true,
        warningLevel: 3,
      };
    }

    return {
      ...state,
      violationCount: newCount,
      modalOpen: true,
      warningLevel: newCount,
    };
  }

  it('gives warning 1/3 on first blur, keeping Stage 1 unlocked', () => {
    let state: ProctoringState = {
      activeStage: 'STAGE_1_OBJECTIVE',
      isStage1Locked: false,
      violationCount: 0,
      modalOpen: false,
      warningLevel: 0,
    };

    state = handleBlurViolation(state);
    expect(state.violationCount).toBe(1);
    expect(state.warningLevel).toBe(1);
    expect(state.modalOpen).toBe(true);
    expect(state.isStage1Locked).toBe(false);
    expect(state.activeStage).toBe('STAGE_1_OBJECTIVE');
  });

  it('gives warning 2/3 on second blur, keeping Stage 1 unlocked', () => {
    let state: ProctoringState = {
      activeStage: 'STAGE_1_OBJECTIVE',
      isStage1Locked: false,
      violationCount: 1,
      modalOpen: false,
      warningLevel: 1,
    };

    state = handleBlurViolation(state);
    expect(state.violationCount).toBe(2);
    expect(state.warningLevel).toBe(2);
    expect(state.isStage1Locked).toBe(false);
  });

  it('automatically locks Stage 1 and switches to Stage 2 on 3rd violation', () => {
    let state: ProctoringState = {
      activeStage: 'STAGE_1_OBJECTIVE',
      isStage1Locked: false,
      violationCount: 2,
      modalOpen: false,
      warningLevel: 2,
    };

    state = handleBlurViolation(state);
    expect(state.violationCount).toBe(3);
    expect(state.warningLevel).toBe(3);
    expect(state.isStage1Locked).toBe(true);
    expect(state.activeStage).toBe('STAGE_2_PRACTICAL');
  });

  it('ignores blur events when learner is in Stage 2 Practical mode', () => {
    let state: ProctoringState = {
      activeStage: 'STAGE_2_PRACTICAL',
      isStage1Locked: true,
      violationCount: 3,
      modalOpen: false,
      warningLevel: 3,
    };

    state = handleBlurViolation(state);
    expect(state.violationCount).toBe(3);
    expect(state.modalOpen).toBe(false);
  });
});
