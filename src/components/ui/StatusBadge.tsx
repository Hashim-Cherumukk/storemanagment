import React from 'react';
import { ItemDisplayStatus } from '@/types/database';

interface StatusBadgeProps {
  status: ItemDisplayStatus | 'Active' | 'Inactive';
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  let colorStyles = '';
  let dotColor = '';

  switch (status) {
    case 'Available':
    case 'Active':
      colorStyles = 'bg-[#F2F8F4] text-[#3F7654] border-[#D1E5D7]';
      dotColor = 'bg-[#3F7654]';
      break;
    case 'Low Stock':
      colorStyles = 'bg-[#FDF9F2] text-[#A87932] border-[#F5E8D0]';
      dotColor = 'bg-[#A87932]';
      break;
    case 'Out of Stock':
      colorStyles = 'bg-[#FDF3F3] text-[#B5524B] border-[#F5D3D1]';
      dotColor = 'bg-[#B5524B]';
      break;
    case 'Maintenance':
      colorStyles = 'bg-[#FDF9F2] text-[#A87932] border-[#F5E8D0]';
      dotColor = 'bg-[#A87932]';
      break;
    case 'Inactive':
    default:
      colorStyles = 'bg-[#F1F3F2] text-[#697077] border-[#E3E5E7]';
      dotColor = 'bg-[#878D96]';
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-medium ${sizeClasses} ${colorStyles} ${className}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
