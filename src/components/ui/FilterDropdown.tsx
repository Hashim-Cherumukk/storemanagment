'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  id?: string;
  className?: string;
}

export function FilterDropdown({
  label,
  value,
  onChange,
  options,
  id,
  className = '',
}: FilterDropdownProps) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-8 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle shadow-xs cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
      >
        <option value="">All {label}s</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 w-4 h-4 text-text-muted pointer-events-none" />
    </div>
  );
}
