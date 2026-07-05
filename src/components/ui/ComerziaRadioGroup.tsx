import React, { type ReactNode } from 'react';

export interface ComerziaRadioOption {
  value: string | number;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface ComerziaRadioGroupProps {
  label?: string;
  name: string;
  options: ComerziaRadioOption[];
  value: string | number;
  onChange: (value: any) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const ComerziaRadioGroup: React.FC<ComerziaRadioGroupProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  orientation = 'horizontal',
  className = '',
}) => {
  return (
    <div className={`form-control w-full ${className}`}>
      {label && (
        <label className="label pb-2">
          <span className="label-text font-semibold">{label}</span>
        </label>
      )}
      <div 
        className={`flex gap-3 ${orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'}`}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <label
              key={String(option.value)}
              className={`
                relative flex items-center p-2 cursor-pointer rounded-xl border-2 transition-all duration-200 ease-in-out
                ${isSelected 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-200/50 text-base-content'}
                ${orientation === 'horizontal' ? 'flex-1' : 'w-full'}
              `}
            >
              <input
                type="radio"
                name={name}
                className="opacity-0 absolute w-0 h-0"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
              />
              
              <div className="flex items-center gap-3 w-full">
                {option.icon && (
                  <div className={`
                    flex items-center justify-center w-9 h-9 rounded-full transition-colors
                    ${isSelected ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60'}
                  `}>
                    {option.icon}
                  </div>
                )}
                
                <div className="flex flex-col flex-1">
                  <span className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-xs opacity-70 mt-0.5">
                      {option.description}
                    </span>
                  )}
                </div>
                
                {isSelected ? (
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                       <div className="w-2 h-2 rounded-full bg-primary-content"></div>
                    </div>
                  </div>
                ) : (
                  <div className="ml-2 flex-shrink-0 w-5 h-5 rounded-full border-2 border-base-300 bg-base-100"></div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
