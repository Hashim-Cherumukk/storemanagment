import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Plus, ArrowUpRight } from 'lucide-react';
import { getReturns } from '@/lib/services/repository';

export const metadata: Metadata = {
  title: 'Returns',
  description: 'View all item returns to the institutional store.',
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function ReturnsPage() {
  const returns = await getReturns();

  const totalUnitsReturned = returns.reduce(
    (sum, r) => sum + r.items.reduce((s, ri) => s + ri.quantity_returned, 0),
    0
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E5E7] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#202326]">Returns</h1>
          <p className="text-xs text-[#697077] mt-0.5">
            Log of all items returned to store inventory by borrowers.
          </p>
        </div>

        <Link
          href="/returns/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#34495E] hover:bg-[#263746] text-white text-xs font-medium rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Return</span>
        </Link>
      </div>

      {/* Restrained Stats Summary */}
      <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md divide-x divide-[#E3E5E7] grid grid-cols-2">
        <div className="p-3.5">
          <div className="text-[11px] text-[#697077]">Total Return Records</div>
          <div className="text-lg font-semibold text-[#202326] mt-0.5 tabular-nums">
            {returns.length}
          </div>
        </div>
        <div className="p-3.5">
          <div className="text-[11px] text-[#697077]">Units Returned to Stock</div>
          <div className="text-lg font-semibold text-[#3F7654] mt-0.5 tabular-nums">
            {totalUnitsReturned}
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
        {returns.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-xs text-[#697077]">No item return records recorded yet.</p>
            <Link
              href="/returns/new"
              className="inline-block mt-2 text-xs font-medium text-[#34495E] hover:underline"
            >
              + Record item return
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E3E5E7] bg-[#F6F6F3] text-[11px] font-semibold text-[#697077] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Return No.</th>
                  <th className="py-2.5 px-4">Borrower</th>
                  <th className="py-2.5 px-4">Issue Reference</th>
                  <th className="py-2.5 px-4">Returned Items</th>
                  <th className="py-2.5 px-4">Returned Date</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E5E7]">
                {returns.map((ret) => {
                  const totalUnits = ret.items.reduce((s, ri) => s + ri.quantity_returned, 0);

                  return (
                    <tr key={ret.id} className="hover:bg-[#F6F6F3] transition-colors">
                      {/* Return Number */}
                      <td className="py-3 px-4 font-mono font-medium text-[#202326]">
                        {ret.return_number}
                      </td>

                      {/* Borrower */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#202326]">
                          {ret.person?.full_name || 'Borrower'}
                        </div>
                        <div className="text-[11px] text-[#697077]">
                          {ret.person?.admission_number || ret.person?.role}
                        </div>
                      </td>

                      {/* Issue Ref */}
                      <td className="py-3 px-4 font-mono text-[#697077]">
                        {ret.issue ? (
                          <Link href={`/issues/${ret.issue_id}`} className="hover:underline text-[#34495E]">
                            {ret.issue.issue_number}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <div className="text-[#202326]">
                          {ret.items.map((ri) => ri.item?.name || 'Item').join(', ')}
                        </div>
                        <div className="text-[11px] text-[#697077]">
                          {totalUnits} total unit{totalUnits > 1 ? 's' : ''} returned
                        </div>
                      </td>

                      {/* Returned Date */}
                      <td className="py-3 px-4 text-[#697077]">
                        {formatDateTime(ret.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/returns/${ret.id}`}
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
