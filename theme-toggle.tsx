'use client';

import { useLibrary } from './library-context';

export function ThemeToggle() {
  const { theme, setTheme } = useLibrary();
  return (
    <button
      className="ghostButton"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      type="button"
    >
      {theme === 'dark' ? '切到日间' : '切到夜间'}
    </button>
  );
}
