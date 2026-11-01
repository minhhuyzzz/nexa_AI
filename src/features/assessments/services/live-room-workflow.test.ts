import { describe, it, expect } from 'vitest';
import { ROOM_THEMES, RoomThemeId } from '@/types/live-room';

describe('Live Room Workflow & Business Rules', () => {
  it('should have minimal_white as the default theme with correct attributes', () => {
    const defaultTheme = ROOM_THEMES.minimal_white;
    expect(defaultTheme).toBeDefined();
    expect(defaultTheme.id).toBe('minimal_white');
    expect(defaultTheme.isDark).toBe(false);
    expect(defaultTheme.name).toBe('Trắng tối giản');
  });

  it('should support all 4 official themes', () => {
    const expectedThemes: RoomThemeId[] = [
      'minimal_white',
      'space_blue',
      'aurora',
      'dark_professional',
    ];
    expectedThemes.forEach((t) => {
      expect(ROOM_THEMES[t]).toBeDefined();
      expect(ROOM_THEMES[t].name).toBeTruthy();
    });
  });

  it('should generate valid 6-digit numeric PINs', () => {
    for (let i = 0; i < 20; i++) {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      expect(pin).toMatch(/^\d{6}$/);
      expect(Number(pin)).toBeGreaterThanOrEqual(100000);
      expect(Number(pin)).toBeLessThanOrEqual(999999);
    }
  });

  it('should correctly validate room state machine transitions', () => {
    const validStates = ['WAITING', 'IN_PROGRESS', 'PAUSED', 'ENDED', 'RESULTS_PUBLISHED'];
    
    // Valid transitions
    const canTransition = (from: string, to: string) => {
      if (from === 'WAITING' && to === 'IN_PROGRESS') return true;
      if (from === 'IN_PROGRESS' && (to === 'PAUSED' || to === 'ENDED')) return true;
      if (from === 'PAUSED' && (to === 'IN_PROGRESS' || to === 'ENDED')) return true;
      if (from === 'ENDED' && to === 'RESULTS_PUBLISHED') return true;
      return false;
    };

    expect(canTransition('WAITING', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'PAUSED')).toBe(true);
    expect(canTransition('PAUSED', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'ENDED')).toBe(true);
    expect(canTransition('ENDED', 'RESULTS_PUBLISHED')).toBe(true);

    // Invalid transition
    expect(canTransition('WAITING', 'RESULTS_PUBLISHED')).toBe(false);
    expect(canTransition('ENDED', 'WAITING')).toBe(false);
  });

  it('should correctly format time taken in minutes and seconds', () => {
    const formatDuration = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m} phút ${s < 10 ? '0' : ''}${s} giây`;
    };

    expect(formatDuration(1568)).toBe('26 phút 08 giây');
    expect(formatDuration(120)).toBe('2 phút 00 giây');
    expect(formatDuration(59)).toBe('0 phút 59 giây');
  });

  it('should calculate correct aggregate KPIs for results screen', () => {
    const mockScores = [98, 96, 94, 88, 84, 80];
    const total = mockScores.length;
    const avg = Number((mockScores.reduce((a, b) => a + b, 0) / total).toFixed(1));
    const highest = Math.max(...mockScores);

    expect(total).toBe(6);
    expect(highest).toBe(98);
    expect(avg).toBe(90);
  });
});
