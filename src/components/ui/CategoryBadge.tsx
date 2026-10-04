import React from 'react';

interface CategoryBadgeProps {
  name: string;
  color?: string | null;
  className?: string;
}

export function CategoryBadge({ name, color, className = '' }: CategoryBadgeProps) {
  const accentColor = color || '#17352F';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
      style={{
        backgroundColor: `${accentColor}10`,
        borderColor: `${accentColor}30`,
        color: accentColor,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />
      {name}
    </span>
  );
}
