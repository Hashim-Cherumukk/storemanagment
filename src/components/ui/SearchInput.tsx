'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search records...',
  className = '',
  id = 'search-input',
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className="absolute left-3 w-4 h-4 text-text-muted pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle shadow-xs placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 p-1 text-text-muted hover:text-text-main rounded-md transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
