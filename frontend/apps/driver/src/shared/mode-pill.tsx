import { Sun, Moon } from 'lucide-react';
import type { ThemeMode } from './theme';

interface ModePillProps {
  theme: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
}

export function ModePill({ theme, onSelect }: ModePillProps) {
  return (
    <div className="mode-pill" role="group" aria-label="Chế độ giao diện">
      <button
        type="button"
        className={theme === 'light' ? 'on' : ''}
        aria-label="Chế độ sáng"
        onClick={() => onSelect('light')}
      >
        <Sun size={16} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        className={theme === 'dark' ? 'on' : ''}
        aria-label="Chế độ tối"
        onClick={() => onSelect('dark')}
      >
        <Moon size={16} strokeWidth={1.8} />
      </button>
    </div>
  );
}
