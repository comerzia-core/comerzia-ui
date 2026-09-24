// src/components/ui/ComerziaCheckbox.tsx
import React from 'react';
import { Check, Minus } from 'lucide-react';

export interface ComerziaCheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  id?: string;
}

export const ComerziaCheckbox: React.FC<ComerziaCheckboxProps> = ({
  checked = false,
  indeterminate = false,
  onChange,
  onClick,
  disabled = false,
  label,
  className = '',
  size = 'md',
  title,
  id
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 rounded',
    md: 'w-5 h-5 rounded-md',
    lg: 'w-6 h-6 rounded-lg'
  };

  const iconSizes = {
    sm: 11,
    md: 14,
    lg: 16
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    if (onClick) onClick(e);
    if (onChange) onChange(!checked);
  };

  const isChecked = checked || indeterminate;

  return (
    <label
      id={id}
      title={title}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 cursor-pointer select-none group ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => {
          if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
            e.preventDefault();
            if (onChange) onChange(!checked);
          }
        }}
        className={`flex items-center justify-center transition-all duration-150 shrink-0 border-2 ${
          sizeClasses[size]
        } ${
          isChecked
            ? 'bg-[#432ad5] !border-[#432ad5] !text-white shadow-xs'
            : 'bg-base-100 border-base-content/40 hover:border-[#432ad5] hover:bg-[#432ad5]/5 shadow-2xs'
        }`}
        style={isChecked ? { backgroundColor: '#432ad5', borderColor: '#432ad5', color: '#ffffff' } : undefined}
      >
        {indeterminate ? (
          <Minus size={iconSizes[size]} className="stroke-[3.5] text-white" />
        ) : checked ? (
          <Check size={iconSizes[size]} className="stroke-[3.5] text-white" />
        ) : null}
      </div>
      {label && (
        <span className="text-xs font-medium text-base-content group-hover:text-primary transition-colors">
          {label}
        </span>
      )}
    </label>
  );
};
