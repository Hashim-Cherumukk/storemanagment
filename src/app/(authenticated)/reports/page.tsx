import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getReportsData } from '@/lib/services/repository';
import { ExcelExportButton } from '@/components/reports/ExcelExportButton';

export const metadata: Metadata = {
  title: 'Reports & Analytics',
  description: 'Institutional store inventory, borrowing analytics, and condition reports.',
};

interface ReportsPageProps {
  searchParams: Promise<{ range?: 'today' | 'week' | 'month' | 'all'; tab?: 'overview' | 'analytics' }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { range = 'month', tab = 'overview' } = await searchParams;
  const data = await getReportsData(range);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header & Date Range Filter & Excel Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E5E7] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#202326]">Reports</h1>
          <p className="text-xs text-[#697077] mt-0.5">
            Operational summaries, borrowing analytics, and stock reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Filter Bar */}
          <div className="inline-flex items-center rounded-md border border-[#E3E5E7] bg-[#FFFFFF] p-0.5 text-xs">
            {[
              { label: 'Today', value: 'today' },
              { label: 'This Week', value: 'week' },
              { label: 'This Month', value: 'month' },
              { label: 'All Time', value: 'all' },
            ].map((r) => {
              const isActive = range === r.value;
              return (
                <Link
                  key={r.value}
                  href={`/reports?tab=${tab}&range=${r.value}`}
                  className={`px-3 py-1 font-medium rounded transition-colors ${
                    isActive
                      ? 'bg-[#EEF0F1] text-[#202326]'
                      : 'text-[#697077] hover:text-[#202326]'
                  }`}
                >
                  {r.label}
                </Link>
              );
            })}
          </div>

          <ExcelExportButton data={data} filename={`store-report-${range}`} />
        </div>
      </div>

      {/* Clean Header Area */}
      <div className="text-xs font-semibold text-[#697077] uppercase tracking-wider border-b border-[#E3E5E7] pb-2">
        Operational Summary & Data Export
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Section 1: Inventory Summary */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                Inventory Summary
              </h2>
            </div>

            <div className="divide-y divide-[#E3E5E7] text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-5 p-4 gap-4">
                <div>
                  <div className="text-[#697077]">Total item types</div>
                  <div className="text-lg font-semibold text-[#202326] mt-0.5">
                    {data.inventorySummary.totalItemTypes}
                  </div>
                </div>
                <div>
                  <div className="text-[#697077]">Total quantity</div>
                  <div className="text-lg font-semibold text-[#202326] mt-0.5">
                    {data.inventorySummary.totalQuantity}
                  </div>
                </div>
                <div>
                  <div className="text-[#697077]">Available inside</div>
                  <div className="text-lg font-semibold text-[#3F7654] mt-0.5">
                    {data.inventorySummary.availableQuantity}
                  </div>
                </div>
                <div>
                  <div className="text-[#697077]">Currently outside</div>
                  <div className="text-lg font-semibold text-[#202326] mt-0.5">
                    {data.inventorySummary.currentlyOutQuantity}
                  </div>
                </div>
                <div>
                  <div className="text-[#697077]">Total Catalog Value</div>
                  <div className="text-lg font-bold font-mono text-[#34495E] mt-0.5">
                    ₹{(data.inventorySummary.totalValuation || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 p-4 gap-4 bg-[#F6F6F3]">
                <div>
                  <span className="text-[#697077]">Low stock items: </span>
                  <strong className="text-[#A87932] font-semibold">
                    {data.inventorySummary.lowStockCount}
                  </strong>
                </div>
                <div>
                  <span className="text-[#697077]">Out of stock items: </span>
                  <strong className="text-[#B5524B] font-semibold">
                    {data.inventorySummary.outOfStockCount}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Borrowing Summary */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                Borrowing Summary ({range === 'today' ? 'Today' : range === 'week' ? 'Past 7 Days' : range === 'month' ? 'Past 30 Days' : 'All Time'})
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 p-4 gap-4 text-xs divide-y sm:divide-y-0 sm:divide-x divide-[#E3E5E7]">
              <div>
                <div className="text-[#697077]">Issue Transactions</div>
                <div className="text-lg font-semibold text-[#202326] mt-0.5">
                  {data.borrowingSummary.totalIssuesCount}
                </div>
                <div className="text-[11px] text-[#697077] mt-0.5">
                  {data.borrowingSummary.itemsIssuedCount} total units issued
                </div>
              </div>

              <div className="sm:pl-4">
                <div className="text-[#697077]">Return Records</div>
                <div className="text-lg font-semibold text-[#3F7654] mt-0.5">
                  {data.borrowingSummary.totalReturnsCount}
                </div>
                <div className="text-[11px] text-[#697077] mt-0.5">
                  {data.borrowingSummary.itemsReturnedCount} total units returned
                </div>
              </div>

              <div className="sm:pl-4 pt-4 sm:pt-0">
                <div className="text-[#697077]">Active Out Issues</div>
                <div className="text-lg font-semibold text-[#202326] mt-0.5">
                  {data.borrowingSummary.currentlyOutCount}
                </div>
                <div className="text-[11px] text-[#697077] mt-0.5">Currently unreturned</div>
              </div>

              <div className="sm:pl-4 pt-4 sm:pt-0">
                <div className="text-[#697077]">Overdue Issues</div>
                <div
                  className={`text-lg font-semibold mt-0.5 ${
                    data.borrowingSummary.overdueCount > 0
                      ? 'text-[#B5524B]'
                      : 'text-[#202326]'
                  }`}
                >
                  {data.borrowingSummary.overdueCount}
                </div>
                <div className="text-[11px] text-[#697077] mt-0.5 font-medium">Past return date</div>
              </div>
            </div>
          </div>

          {/* Section 3: Most Borrowed Items Table */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                Most Borrowed Items
              </h2>
            </div>

            {data.mostBorrowed.length === 0 ? (
              <div className="px-4 py-6 text-xs text-[#697077] text-center">
                No item borrowing records exist for the selected date range.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E3E5E7] bg-[#F6F6F3] text-[11px] font-semibold text-[#697077] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Item</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Times Issued</th>
                    <th className="py-2.5 px-4">Total Units Issued</th>
                    <th className="py-2.5 px-4 text-right">Current Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E5E7]">
                  {data.mostBorrowed.map(({ item, totalIssued, issueTimes }: { item: any; totalIssued: number; issueTimes: number }) => (
                    <tr key={item.id} className="hover:bg-[#F6F6F3] transition-colors">
                      <td className="py-2.5 px-4 font-medium text-[#202326]">
                        <Link
                          href={`/inventory/${item.id}`}
                          className="hover:text-[#34495E]"
                        >
                          {item.name}
                        </Link>
                        <span className="block text-[11px] font-mono text-[#697077]">
                          {item.item_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#697077]">
                        {item.category?.name || 'Uncategorized'}
                      </td>
                      <td className="py-2.5 px-4 text-[#202326] tabular-nums">
                        {issueTimes} time{issueTimes > 1 ? 's' : ''}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#202326] tabular-nums">
                        {totalIssued} {item.unit}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-[#697077]">
                        {item.available_quantity} of {item.total_quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics: Most Frequent Borrowers */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                Most Frequent Borrowers
              </h2>
            </div>

            {data.frequentBorrowers.length === 0 ? (
              <div className="px-4 py-6 text-xs text-[#697077] text-center">
                No borrowing activity for the selected time range.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E3E5E7] bg-[#F6F6F3] text-[11px] font-semibold text-[#697077] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Person</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Total Issues</th>
                    <th className="py-2.5 px-4 text-right">Currently Holding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E5E7]">
                  {data.frequentBorrowers.map((fb, idx) => (
                    <tr key={idx} className="hover:bg-[#F6F6F3]">
                      <td className="py-2.5 px-4 font-medium text-[#202326]">
                        {fb.personName}
                      </td>
                      <td className="py-2.5 px-4 text-[#697077]">{fb.role}</td>
                      <td className="py-2.5 px-4 font-semibold text-[#202326] tabular-nums">
                        {fb.totalIssues} issue{fb.totalIssues > 1 ? 's' : ''}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-[#697077]">
                        {fb.currentlyOut} active
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Condition & Damage Analytics */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                Equipment Condition Summary
              </h2>
            </div>

            <div className="grid grid-cols-2 p-4 gap-4 text-xs divide-x divide-[#E3E5E7]">
              <div>
                <div className="text-[#697077]">Damaged Items</div>
                <div className="text-lg font-semibold text-[#B5524B] mt-0.5">
                  {data.conditionSummary.damagedCount}
                </div>
                <div className="text-[11px] text-[#697077] mt-0.5">Flagged during return</div>
              </div>

              <div className="pl-4">
                <div className="text-[#697077]">Needs Repair / Servicing</div>
                <div className="text-lg font-semibold text-[#A87932] mt-0.5">
                  {data.conditionSummary.needsRepairCount}
                </div>
                <div className="text-[11px] text-[#697077] mt-0.5">Under maintenance</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
