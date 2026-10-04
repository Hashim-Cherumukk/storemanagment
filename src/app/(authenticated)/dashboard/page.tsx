import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getDashboardStats } from '@/lib/services/repository';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Institutional store overview.',
};

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function calculateDaysOverdue(expectedReturnDateStr: string) {
  const now = new Date();
  const due = new Date(expectedReturnDateStr);
  const diffMs = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E5E7] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#202326]">Store Overview</h1>
          <p className="text-xs text-[#697077] mt-0.5">
            Store activity, active loans, and items requiring attention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/inventory/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#E3E5E7] hover:bg-[#F1F3F2] text-[#202326] text-xs font-medium rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#697077]" />
            Add Item
          </Link>
          <Link
            href="/issues/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#34495E] hover:bg-[#263746] text-white text-xs font-medium rounded transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Issue Item
          </Link>
        </div>
      </div>

      {/* Restrained Summary Bar (No giant colorful cards) */}
      <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md divide-y sm:divide-y-0 sm:divide-x divide-[#E3E5E7] grid grid-cols-2 sm:grid-cols-4">
        <div className="p-4">
          <div className="text-[12px] text-[#697077]">Items in Store</div>
          <div className="text-xl font-semibold text-[#202326] mt-1 tabular-nums">
            {stats.totalItems}
          </div>
          <div className="text-[11px] text-[#878D96] mt-0.5">
            {stats.totalQuantity} total units
          </div>
        </div>

        <div className="p-4">
          <div className="text-[12px] text-[#697077]">Currently Out</div>
          <div className="text-xl font-semibold text-[#202326] mt-1 tabular-nums">
            {stats.activeIssueCount}
          </div>
          <div className="text-[11px] text-[#878D96] mt-0.5">
            Active issue records
          </div>
        </div>

        <div className="p-4">
          <div className="text-[12px] text-[#697077]">Low Stock</div>
          <div className="text-xl font-semibold text-[#A87932] mt-1 tabular-nums">
            {stats.lowStockCount}
          </div>
          <div className="text-[11px] text-[#697077] mt-0.5">
            At or below minimum
          </div>
        </div>

        <div className="p-4">
          <div className="text-[12px] text-[#697077]">Overdue</div>
          <div
            className={`text-xl font-semibold mt-1 tabular-nums ${
              stats.overdueCount > 0 ? 'text-[#B5524B]' : 'text-[#202326]'
            }`}
          >
            {stats.overdueCount}
          </div>
          <div className="text-[11px] text-[#697077] mt-0.5">
            Past expected return
          </div>
        </div>
      </div>

      {/* Two Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Needs Attention (Overdue, Due Today, Low Stock) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overdue Items Section */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B5524B]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                  Overdue Items ({stats.overdueCount})
                </h2>
              </div>
            </div>

            {stats.overdueIssues.length === 0 ? (
              <div className="px-4 py-5 text-xs text-[#697077] text-center">
                No items are currently overdue.
              </div>
            ) : (
              <div className="divide-y divide-[#E3E5E7]">
                {stats.overdueIssues.map((issue) => {
                  const daysOverdue = calculateDaysOverdue(issue.expected_return_date!);
                  const firstItem = issue.items[0]?.item?.name || 'Item';
                  const extraCount = issue.items.length - 1;

                  return (
                    <div
                      key={issue.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-[#F6F6F3] transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-[#202326]">
                          {issue.person?.full_name}
                          <span className="text-[#697077] font-normal ml-1.5">
                            ({issue.person?.role})
                          </span>
                        </div>
                        <div className="text-xs text-[#697077]">
                          {firstItem}
                          {extraCount > 0 && ` +${extraCount} more`} ·{' '}
                          <span className="text-[#B5524B] font-medium">
                            {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/returns/new?issue_id=${issue.id}`}
                        className="px-2.5 py-1 text-xs font-medium border border-[#E3E5E7] rounded text-[#202326] hover:bg-[#EEF0F1] transition-colors"
                      >
                        Return Item
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Due Today Section */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#A87932]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                  Due Today ({stats.dueTodayIssues.length})
                </h2>
              </div>
            </div>

            {stats.dueTodayIssues.length === 0 ? (
              <div className="px-4 py-5 text-xs text-[#697077] text-center">
                Nothing is due today.
              </div>
            ) : (
              <div className="divide-y divide-[#E3E5E7]">
                {stats.dueTodayIssues.map((issue) => {
                  const firstItem = issue.items[0]?.item?.name || 'Item';
                  const extraCount = issue.items.length - 1;

                  return (
                    <div
                      key={issue.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-[#F6F6F3] transition-colors"
                    >
                      <div>
                        <div className="text-xs font-medium text-[#202326]">
                          {issue.person?.full_name}
                        </div>
                        <div className="text-xs text-[#697077]">
                          {firstItem}
                          {extraCount > 0 && ` +${extraCount} more`} · Expected today
                        </div>
                      </div>

                      <Link
                        href={`/issues/${issue.id}`}
                        className="px-2 py-1 text-xs border border-[#E3E5E7] rounded text-[#202326] hover:bg-[#EEF0F1]"
                      >
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Low Stock & Out of Stock List */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#A87932]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                  Stock Attention Needed ({stats.lowStockItems.length})
                </h2>
              </div>
              <Link
                href="/inventory"
                className="text-xs text-[#697077] hover:text-[#202326]"
              >
                View all inventory
              </Link>
            </div>

            {stats.lowStockItems.length === 0 ? (
              <div className="px-4 py-5 text-xs text-[#697077] text-center">
                All inventory items have adequate stock levels.
              </div>
            ) : (
              <div className="divide-y divide-[#E3E5E7]">
                {stats.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-[#F6F6F3] transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-[#202326]">{item.name}</div>
                      <div className="text-xs text-[#697077]">
                        {item.available_quantity} available · Minimum threshold: {item.minimum_quantity}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                        item.available_quantity === 0
                          ? 'bg-[#FDF3F3] text-[#B5524B] border-[#F5D3D1]'
                          : 'bg-[#FDF9F2] text-[#A87932] border-[#F5E8D0]'
                      }`}
                    >
                      {item.available_quantity === 0 ? 'Out of stock' : 'Low stock'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Log */}
        <div className="lg:col-span-5">
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                Recent Activity
              </h2>
            </div>

            {stats.activities.length === 0 ? (
              <div className="px-4 py-5 text-xs text-[#697077] text-center">
                No recent store activity recorded.
              </div>
            ) : (
              <div className="divide-y divide-[#E3E5E7]">
                {stats.activities.map((act) => (
                  <Link
                    key={act.id}
                    href={act.link}
                    className="px-4 py-3 block hover:bg-[#F6F6F3] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-[#697077]">
                      <span className="font-mono text-[11px]">{act.subtitle}</span>
                      <span>{formatRelativeTime(act.timestamp)}</span>
                    </div>
                    <div className="text-xs font-medium text-[#202326] mt-0.5">
                      {act.title}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
