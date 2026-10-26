import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const Icon = nextTheme === 'light' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'light'}
      title={`Switch to ${nextTheme} mode`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 text-slate-200 transition-colors hover:bg-slate-700 hover:text-white cursor-pointer ${
        compact ? 'p-2' : 'px-3 py-2 text-xs font-semibold'
      }`}
    >
      <Icon className="w-4 h-4" />
      {!compact && <span>{nextTheme === 'light' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
};
