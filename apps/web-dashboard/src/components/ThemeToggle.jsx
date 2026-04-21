import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

// Read initial theme synchronously – avoids React-level flash
const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem('urbackend-theme');
    if (saved === 'light') return false;   // false = light mode
    if (saved === 'dark') return true;     // true = dark mode
  } catch (err) {
    console.warn('localStorage not accessible, using system preference', err);
  }
  try {
    return !window.matchMedia('(prefers-color-scheme: light)').matches;
  } catch (err) {
    console.warn('window.matchMedia not available, defaulting to dark mode', err);
    return true; // default to dark mode
  }
};

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(getInitialTheme);

  // Apply class whenever isDark changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
  }, [isDark]);

  // Listen to system preference changes – safely
  useEffect(() => {
    // Guard for environments where matchMedia is not available
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      console.warn('window.matchMedia not available, skipping system theme sync');
      return;
    }

    let mediaQuery;
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    } catch (err) {
      console.warn('matchMedia unavailable, skipping system theme sync', err);
      return;
    }

    const handleChange = (e) => {
      try {
        if (!localStorage.getItem('urbackend-theme')) {
          setIsDark(!e.matches);
        }
      } catch (err) {
        console.warn('Could not read localStorage for theme sync', err);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      try {
        mediaQuery.removeEventListener('change', handleChange);
      } catch (err) {
        console.warn('Failed to remove matchMedia listener', err);
      }
    };
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    try {
      localStorage.setItem('urbackend-theme', newIsDark ? 'dark' : 'light');
    } catch (err) {
      console.warn('Failed to save theme preference', err);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="nav-item"
      style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '8px' }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      {isDark ? <Moon size={16} /> : <Sun size={16} />}
      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
};

export default ThemeToggle;