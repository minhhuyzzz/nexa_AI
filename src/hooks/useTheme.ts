'use client';

import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial state
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    const handleThemeChange = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextState = !isDarkMode;
    setIsDarkMode(nextState);

    if (nextState) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexa_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexa_theme', 'light');
    }

    window.dispatchEvent(new Event('theme-change'));
  };

  return { isDarkMode, toggleTheme };
}
