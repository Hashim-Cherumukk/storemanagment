'use client';

import React, { useState, useMemo } from 'react';
import { AuditLog, AuditActionType } from '@/types/database';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShieldCheck, Clock, User, FilterX } from 'lucide-react';

interface AuditTableProps {
  initialLogs: AuditLog[];
}

const ACTION_TYPE_LABELS: Record<AuditActionType, { label: string; badgeClass: string }> = {
  ITEM_ADDED: { label: 'Item Added', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  ITEM_EDITED: { label: 'Item Details Updated', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' },
  ITEM_DEACTIVATED: { label: 'Item Deactivated', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  ITEM_REACTIVATED: { label: 'Item Reactivated', badgeClass: 'bg-green-50 text-green-700 border-green-200' },
  ITEM_IMAGE_CHANGED: { label: 'Photo Updated', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  CATEGORY_CREATED: { label: 'Category Created', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  CATEGORY_EDITED: { label: 'Category Updated', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' },
  CATEGORY_DEACTIVATED: { label: 'Category Deactivated', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  PERSON_ADDED: { label: 'Person Registered', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PERSON_IMPORTED: { label: 'Excel Import', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' },
  PERSON_EDITED: { label: 'Person Status Changed', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' },
  PERSON_DEACTIVATED: { label: 'Person Deactivated', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  ITEM_ISSUED: { label: 'Item Issued', badgeClass: 'bg-[#F0F4F8] text-[#34495E] border-[#E3E5E7]' },
  ITEM_RETURNED: { label: 'Item Returned', badgeClass: 'bg-[#F2F8F4] text-[#3F7654] border-[#D1E5D7]' },
  STOCK_ADJUSTED: { label: 'Stock Adjusted', badgeClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' },
};

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditTable({ initialLogs }: AuditTableProps) {
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      const q = search.toLowerCase().trim();
      if (
        q &&
        !log.details.toLowerCase().includes(q) &&
        !log.performed_by.toLowerCase().includes(q) &&
        !log.action_type.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (selectedAction && log.action_type !== selectedAction) {
        return false;
      }

      return true;
    });
  }, [initialLogs, search, selectedAction]);

  const hasActiveFilters = Boolean(search || selectedAction);

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-[#FFFFFF] p-3.5 rounded-md border border-[#E3E5E7] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search audit trail by item, borrower, storekeeper or action..."
              id="audit-search"
            />
          </div>

          <div className="w-full md:w-56">
            <FilterDropdown
              label="Action Type"
              value={selectedAction}
              onChange={setSelectedAction}
              options={Object.entries(ACTION_TYPE_LABELS).map(([key, config]) => ({
                label: config.label,
                value: key,
              }))}
              id="filter-audit-action"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedAction('');
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-[#697077] hover:text-[#202326] rounded border border-[#E3E5E7] hover:bg-[#F1F3F2] transition-colors"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No activity history found"
          description={
            hasActiveFilters
              ? 'No activity records match your filter criteria.'
              : 'Important store actions will be recorded here as operations occur.'
          }
        />
      ) : (
        <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-[#E3E5E7] text-[#697077] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Activity Description</th>
                  <th className="py-2.5 px-4">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E5E7] text-[#202326]">
                {filteredLogs.map((log) => {
                  const config = ACTION_TYPE_LABELS[log.action_type] || {
                    label: log.action_type,
                    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
                  };

                  return (
                    <tr key={log.id} className="hover:bg-[#FAFBFB] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#697077] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#697077]" />
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${config.badgeClass}`}
                        >
                          {config.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-[#202326] max-w-md">
                        {log.details}
                      </td>

                      <td className="py-3 px-4 text-[#697077] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-[#697077]" />
                          <span>{log.performed_by}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
