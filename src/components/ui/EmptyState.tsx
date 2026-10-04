import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface border border-dashed border-border-subtle rounded-xl my-4">
      <div className="w-12 h-12 rounded-full bg-warm-bg flex items-center justify-center text-primary mb-3.5 border border-border-subtle">
        <Icon className="w-6 h-6 text-text-muted" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-text-main tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-sm text-text-muted max-w-md leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
