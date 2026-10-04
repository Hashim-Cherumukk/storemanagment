import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Plus, ArrowUpRight } from 'lucide-react';
import { getIssues } from '@/lib/services/repository';

export const metadata: Metadata = {
  title: 'Issued Items',
  description: 'View and manage all active and historical item issues from the institutional store.',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function calculateDaysOverdue(expectedReturnDateStr: string) {
  const now = new Date();
  const due = new Date(expectedReturnDateStr);
  const diffMs = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export default async function IssuesPage() {
  const issues = await getIssues();

  const todayStr = new Date().toISOString().split('T')[0];

  const activeCount = issues.filter(
    (i) => i.status === 'ACTIVE' || i.status === 'PARTIALLY_RETURNED'
  ).length;

  const overdueCount = issues.filter((i) => {
    if (i.status === 'RETURNED' || !i.expected_return_date) return false;
    return new Date(i.expected_return_date).toISOString().split('T')[0] < todayStr;
  }).length;

  const returnedCount = issues.filter((i) => i.status === 'RETURNED').length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E5E7] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#202326]">Issued Items</h1>
          <p className="text-xs text-[#697077] mt-0.5">
            Store items currently loaned to students, faculty, and staff.
          </p>
        </div>

        <Link
          href="/issues/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#34495E] hover:bg-[#263746] text-white text-xs font-medium rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Issue Items</span>
        </Link>
      </div>

      {/* Restrained Stats Summary */}
      <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md divide-x divide-[#E3E5E7] grid grid-cols-3">
        <div className="p-3.5">
          <div className="text-[11px] text-[#697077]">Currently Out</div>
          <div className="text-lg font-semibold text-[#202326] mt-0.5 tabular-nums">
            {activeCount}
          </div>
        </div>
        <div className="p-3.5">
          <div className="text-[11px] text-[#697077]">Overdue</div>
          <div
            className={`text-lg font-semibold mt-0.5 tabular-nums ${
              overdueCount > 0 ? 'text-[#B5524B]' : 'text-[#202326]'
            }`}
          >
            {overdueCount}
          </div>
        </div>
        <div className="p-3.5">
          <div className="text-[11px] text-[#697077]">Fully Returned</div>
          <div className="text-lg font-semibold text-[#3F7654] mt-0.5 tabular-nums">
            {returnedCount}
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
        {issues.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-xs text-[#697077]">No item issues recorded yet.</p>
            <Link
              href="/issues/new"
              className="inline-block mt-2 text-xs font-medium text-[#34495E] hover:underline"
            >
              + Issue items to borrower
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E3E5E7] bg-[#F6F6F3] text-[11px] font-semibold text-[#697077] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Issue No.</th>
                  <th className="py-2.5 px-4">Borrower</th>
                  <th className="py-2.5 px-4">Items Issued</th>
                  <th className="py-2.5 px-4">Issued Date</th>
                  <th className="py-2.5 px-4">Return Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E5E7]">
                {issues.map((issue) => {
                  const totalIssued = issue.items.reduce(
                    (sum, ii) => sum + ii.quantity_issued,
                    0
                  );
                  const totalReturned = issue.items.reduce(
                    (sum, ii) => sum + ii.quantity_returned,
                    0
                  );

                  const isOverdue =
                    issue.status !== 'RETURNED' &&
                    issue.expected_return_date &&
                    new Date(issue.expected_return_date).toISOString().split('T')[0] < todayStr;

                  const daysOverdue = isOverdue
                    ? calculateDaysOverdue(issue.expected_return_date!)
                    : 0;

                  return (
                    <tr key={issue.id} className="hover:bg-[#F6F6F3] transition-colors">
                      {/* Issue Number */}
                      <td className="py-3 px-4 font-mono font-medium text-[#202326]">
                        {issue.issue_number}
                      </td>

                      {/* Borrower */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#202326]">
                          {issue.person?.full_name || 'Borrower'}
                        </div>
                        <div className="text-[11px] text-[#697077]">
                          {issue.person?.admission_number || issue.person?.role}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <div className="text-[#202326]">
                          {issue.items.map((ii) => ii.item?.name || 'Item').join(', ')}
                        </div>
                        <div className="text-[11px] text-[#697077]">
                          {totalIssued} total units ({totalReturned} returned)
                        </div>
                      </td>

                      {/* Issued Date */}
                      <td className="py-3 px-4 text-[#697077]">
                        {formatDate(issue.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {issue.status === 'RETURNED' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#F2F8F4] text-[#3F7654] border border-[#D1E5D7]">
                            Returned
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#FDF3F3] text-[#B5524B] border border-[#F5D3D1]">
                            {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0F4F8] text-[#34495E] border border-[#E3E5E7]">
                            Out
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/issues/${issue.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-[#E3E5E7] rounded text-[#202326] hover:bg-[#F1F3F2]"
                        >
                          <span>View</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#878D96]" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
