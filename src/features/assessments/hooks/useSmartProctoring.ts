'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AssessmentSecuritySettings,
  ProctoringViolationEvent,
  ViolationType,
  calculateTrustScore,
  IntegrityFlag,
} from '../types/security.types';

interface CandidateInfo {
  userId?: string;
  email?: string;
  fullName?: string;
}

interface UseSmartProctoringProps {
  settings?: Partial<AssessmentSecuritySettings>;
  candidateInfo?: CandidateInfo;
  onViolation?: (event: ProctoringViolationEvent) => void;
  enabled?: boolean;
}

export function useSmartProctoring({
  settings = {},
  candidateInfo = {},
  onViolation,
  enabled = true,
}: UseSmartProctoringProps) {
  const [events, setEvents] = useState<ProctoringViolationEvent[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeWarning, setActiveWarning] = useState<{
    message: string;
    violationCount: number;
    type: ViolationType;
  } | null>(null);

  // Grace period tracking for file upload dialogs & external link clicks
  const isFileUploadGraceRef = useRef(false);
  const fileUploadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blurStartTimeRef = useRef<number | null>(null);

  // Record a proctoring violation event
  const logViolation = useCallback(
    (type: ViolationType, details?: string, durationSeconds?: number) => {
      const newEvent: ProctoringViolationEvent = {
        id: `pv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type,
        timestamp: new Date().toISOString(),
        durationSeconds,
        details,
      };

      setEvents((prev) => {
        const next = [...prev, newEvent];
        return next;
      });

      if (onViolation) {
        onViolation(newEvent);
      }

      // If active warning mode is enabled, display warning toast/modal to candidate
      const isActiveWarning = settings.active_warning ?? true;
      if (isActiveWarning) {
        let msg = 'Phát hiện hành vi rời khỏi không gian bài thi!';
        if (type === 'TAB_SWITCH') {
          msg = 'Cảnh báo: Bạn vừa rời khỏi màn hình bài thi hoặc chuyển tab. Mọi lần rời tab đều được ghi nhận.';
        } else if (type === 'FULLSCREEN_EXIT') {
          msg = 'Cảnh báo: Bạn vừa thoát chế độ toàn màn hình. Vui lòng mở lại toàn màn hình để tiếp tục.';
        } else if (type === 'COPY_ATTEMPT') {
          msg = 'Nội dung đề thi được bảo vệ bản quyền. Thao tác sao chép đề bài không được phép.';
        } else if (type === 'DEVTOOLS_ATTEMPT') {
          msg = 'Cảnh báo: Phím tắt kiểm tra mã nguồn (DevTools) bị vô hiệu hóa trong phòng thi.';
        }

        setEvents((current) => {
          const count = current.filter((e) => e.type === type).length;
          setActiveWarning({
            message: msg,
            violationCount: count,
            type,
          });
          return current;
        });
      }
    },
    [settings.active_warning, onViolation]
  );

  // Mark file upload start: grants 60s grace period for File Explorer dialogs
  const markFileUploadStart = useCallback(() => {
    isFileUploadGraceRef.current = true;
    if (fileUploadTimerRef.current) clearTimeout(fileUploadTimerRef.current);
    fileUploadTimerRef.current = setTimeout(() => {
      isFileUploadGraceRef.current = false;
    }, 60000);
  }, []);

  const markFileUploadEnd = useCallback(() => {
    if (fileUploadTimerRef.current) clearTimeout(fileUploadTimerRef.current);
    // Give an extra 2s buffer after file selection closes
    fileUploadTimerRef.current = setTimeout(() => {
      isFileUploadGraceRef.current = false;
    }, 2000);
  }, []);

  // Request Fullscreen
  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('[PROCTORING] Fullscreen request rejected:', err);
    }
  }, []);

  // Exit Fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('[PROCTORING] Fullscreen exit error:', err);
    }
  }, []);

  // 1. T1: Fullscreen Lock change handler
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);

      if (settings.fullscreen_lock && !active) {
        logViolation('FULLSCREEN_EXIT', 'Thí sinh đã thoát chế độ toàn màn hình');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [enabled, settings.fullscreen_lock, logViolation]);

  // 2. T2: Tab Switch Guard & Blur focus detector with 2s grace threshold
  useEffect(() => {
    if (!enabled || !settings.tab_switch_guard) return;

    const handleVisibilityChange = () => {
      if (isFileUploadGraceRef.current) return;

      if (document.hidden) {
        blurStartTimeRef.current = Date.now();
      } else if (blurStartTimeRef.current) {
        const elapsedSeconds = Math.max(1, Math.round((Date.now() - blurStartTimeRef.current) / 1000));
        blurStartTimeRef.current = null;
        // Only trigger violation if away for more than 2 seconds (debounce momentary glitches)
        if (elapsedSeconds >= 2) {
          logViolation(
            'TAB_SWITCH',
            `Thí sinh chuyển tab hoặc ẩn cửa sổ trong ${elapsedSeconds} giây`,
            elapsedSeconds
          );
        }
      }
    };

    const handleWindowBlur = () => {
      if (isFileUploadGraceRef.current) return;
      if (!blurStartTimeRef.current) {
        blurStartTimeRef.current = Date.now();
      }
    };

    const handleWindowFocus = () => {
      if (isFileUploadGraceRef.current) return;
      if (blurStartTimeRef.current) {
        const elapsedSeconds = Math.max(1, Math.round((Date.now() - blurStartTimeRef.current) / 1000));
        blurStartTimeRef.current = null;
        if (elapsedSeconds >= 2) {
          logViolation(
            'TAB_SWITCH',
            `Thí sinh mất tiêu điểm cửa sổ trong ${elapsedSeconds} giây`,
            elapsedSeconds
          );
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [enabled, settings.tab_switch_guard, logViolation]);

  // 3. T5: Block Copy & Right-click (Exceptions: permit pasting URL into input/textarea)
  useEffect(() => {
    if (!enabled || !settings.block_copy) return;

    const handleContextMenu = (e: MouseEvent) => {
      // If user right-clicks on input/textarea, allow for paste/spellcheck
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
      logViolation('COPY_ATTEMPT', 'Thí sinh nhấn chuột phải để mở menu ngữ cảnh');
    };

    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // If candidate is copying their own input response, allow
        return;
      }
      e.preventDefault();
      logViolation('COPY_ATTEMPT', 'Thí sinh sao chép nội dung câu hỏi');
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, [enabled, settings.block_copy, logViolation]);

  // 4. T7: Block DevTools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
  useEffect(() => {
    if (!enabled || !settings.block_devtools) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isF12 = e.key === 'F12';
      const isDevToolsCombo =
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c');
      const isViewSource = (e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u');

      if (isF12 || isDevToolsCombo || isViewSource) {
        e.preventDefault();
        e.stopPropagation();
        logViolation(
          'DEVTOOLS_ATTEMPT',
          `Thí sinh sử dụng phím tắt kiểm tra mã nguồn: ${e.key}`
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, settings.block_devtools, logViolation]);

  // Calculate current Trust Score & Flag status dynamically
  const trustData = calculateTrustScore(events, settings);

  const dismissWarning = useCallback(() => {
    setActiveWarning(null);
  }, []);

  return {
    events,
    violationsCount: events.length,
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    activeWarning,
    dismissWarning,
    markFileUploadStart,
    markFileUploadEnd,
    trustScore: trustData.trustScore,
    integrityFlag: trustData.integrityFlag,
    tabSwitchesCount: trustData.tabSwitchesCount,
    fullscreenExitsCount: trustData.fullscreenExitsCount,
    totalTimeOutOfFocusSeconds: trustData.totalTimeOutOfFocusSeconds,
  };
}
