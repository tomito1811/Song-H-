import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'dropdown' | 'inline-buttons';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'dropdown',
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Sáng',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
    },
    {
      value: 'dark',
      label: 'Tối',
      icon: <Moon className="w-4 h-4 text-[#E8B7C8]" />,
    },
    {
      value: 'system',
      label: 'Theo hệ thống',
      icon: <Laptop className="w-4 h-4 text-neutral-400" />,
    },
  ];

  if (variant === 'inline-buttons') {
    return (
      <div className={`p-1 bg-[#F6DCE5]/40 dark:bg-[#2A232A] rounded-xl flex items-center gap-1 border border-[#E8B7C8]/30 dark:border-[#3D333D] transition-colors duration-200 ${className}`}>
        {options.map((opt) => {
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-label={`Chọn giao diện ${opt.label}`}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#1F1A1F] text-[#453C45] dark:text-[#F5EDE8] shadow-xs font-semibold'
                  : 'text-[#827580] dark:text-[#B9A9B4] hover:text-[#453C45] dark:hover:text-[#F5EDE8]'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chuyển chế độ giao diện Sáng / Tối / Theo hệ thống"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="p-2 rounded-xl text-[#453C45] dark:text-[#F5EDE8] hover:bg-[#F6DCE5]/50 dark:hover:bg-[#2A232A] border border-[#E8B7C8]/40 dark:border-[#3D333D] transition-colors duration-200 cursor-pointer flex items-center justify-center"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-[#E8B7C8] transition-transform duration-200 hover:rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200 hover:rotate-45" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-[#2A232A] border border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#827580] dark:text-[#B9A9B4] border-b border-[#E8B7C8]/20 dark:border-[#3D333D]/60 mb-1">
            Giao diện
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                role="menuitem"
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#F6DCE5]/40 dark:bg-[#1F1A1F] text-[#C76A82] dark:text-[#E8B7C8] font-semibold'
                    : 'text-[#453C45] dark:text-[#F5EDE8] hover:bg-[#FFF4F7] dark:hover:bg-[#352C35]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#C76A82] dark:text-[#E8B7C8]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
