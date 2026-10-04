import React from 'react';

interface PageHeaderProps {
  title: string;
  subtext?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtext, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-text-main font-sans">
            {title}
          </h1>
          {badge}
        </div>
        {subtext && (
          <p className="mt-1 text-sm text-text-muted leading-relaxed max-w-3xl">
            {subtext}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
