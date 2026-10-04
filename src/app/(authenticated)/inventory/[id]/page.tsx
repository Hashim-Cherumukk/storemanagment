import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getItemById, getItemHistory } from '@/lib/services/repository';
import { getCurrentUser } from '@/lib/actions/auth-actions';
import { canManageInventory } from '@/lib/auth/permissions';
import { getItemDisplayStatus } from '@/types/database';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ItemDetailActions } from '@/components/inventory/ItemDetailActions';
import { ArrowLeft, MapPin } from 'lucide-react';

interface ItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ItemDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getItemById(id);
  return {
    title: item ? `${item.name} (${item.item_code})` : 'Item Details',
  };
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params;
  const [item, history, user] = await Promise.all([
    getItemById(id),
    getItemHistory(id),
    getCurrentUser(),
  ]);

  if (!item) {
    notFound();
  }

  const canManage = canManageInventory(user?.role);
  const status = getItemDisplayStatus(item);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Navigation & Header */}
      <div className="space-y-3">
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-xs text-[#697077] hover:text-[#202326] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Inventory</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E5E7] pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-[#202326]">{item.name}</h1>
              <StatusBadge status={status} size="sm" />
            </div>
            <p className="text-xs text-[#697077] font-mono mt-1">
              Code: {item.item_code} · {item.available_quantity} of {item.total_quantity} {item.unit} available
            </p>
          </div>

          <ItemDetailActions item={item} canManage={canManage} />
        </div>
      </div>

      {/* Main Item Record */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (Details + Currently Out + History Timeline) */}
        <div className="md:col-span-2 space-y-6">
          {/* Item Specification Details */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326] border-b border-[#E3E5E7] pb-2">
              Details
            </h2>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[#697077]">Category</dt>
                <dd className="font-medium text-[#202326] mt-0.5">
                  {item.category?.name || 'Uncategorized'}
                </dd>
              </div>

              <div>
                <dt className="text-[#697077]">Item Code</dt>
                <dd className="font-mono text-[#202326] mt-0.5">{item.item_code}</dd>
              </div>

              <div>
                <dt className="text-[#697077]">Condition</dt>
                <dd className="font-medium text-[#202326] mt-0.5">{item.condition}</dd>
              </div>

              <div>
                <dt className="text-[#697077]">Unit Price</dt>
                <dd className="font-mono font-medium text-[#202326] mt-0.5">
                  {item.unit_price ? `₹${item.unit_price.toLocaleString('en-IN')}` : 'Not set'}
                </dd>
              </div>

              {item.description && (
                <div className="col-span-2 pt-2 border-t border-[#E3E5E7]">
                  <dt className="text-[#697077]">Description</dt>
                  <dd className="text-[#202326] mt-0.5 leading-relaxed">{item.description}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Currently Out Section */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                Currently Out ({history.activeLoans.reduce((sum, l) => sum + l.quantity, 0)})
              </h2>
            </div>

            {history.activeLoans.length === 0 ? (
              <div className="px-4 py-5 text-xs text-[#697077] text-center">
                All units are currently inside the store.
              </div>
            ) : (
              <div className="divide-y divide-[#E3E5E7]">
                {history.activeLoans.map((loan) => (
                  <div
                    key={loan.issueId}
                    className="px-4 py-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#202326]">
                        {loan.borrowerName}
                        <span className="text-[#697077] font-normal ml-1.5">
                          ({loan.borrowerType})
                        </span>
                      </div>
                      <div className="text-[#697077]">
                        {loan.quantity} unit{loan.quantity > 1 ? 's' : ''} · Due:{' '}
                        {loan.expectedReturnDate
                          ? new Date(loan.expectedReturnDate).toLocaleDateString()
                          : 'No date set'}
                      </div>
                    </div>

                    <Link
                      href={`/issues/${loan.issueId}`}
                      className="px-2.5 py-1 border border-[#E3E5E7] rounded text-[#202326] hover:bg-[#F1F3F2]"
                    >
                      View Issue
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Item Timeline History */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                Item History
              </h2>
            </div>

            {history.timeline.length === 0 ? (
              <div className="px-4 py-5 text-xs text-[#697077] text-center">
                No borrowing or return activity recorded for this item yet.
              </div>
            ) : (
              <div className="divide-y divide-[#E3E5E7]">
                {history.timeline.map((event) => (
                  <div key={event.id} className="px-4 py-3 text-xs flex justify-between items-start">
                    <div>
                      <span className="text-[#697077]">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      <div className="font-medium text-[#202326] mt-0.5">
                        {event.type === 'ISSUE'
                          ? `Issued ${event.quantity} unit(s) to ${event.personName}`
                          : event.type === 'RETURN'
                          ? `Returned ${event.quantity} unit(s) by ${event.personName}`
                          : `Stock adjusted by ${event.quantity > 0 ? `+${event.quantity}` : event.quantity} (${event.reason || 'Manual Correction'})`}
                      </div>
                      {event.notes && (
                        <div className="text-[#697077] text-[11px] mt-0.5">Note: {event.notes}</div>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                        event.type === 'ISSUE'
                          ? 'bg-[#F0F4F8] text-[#34495E] border-[#E3E5E7]'
                          : event.type === 'RETURN'
                          ? 'bg-[#F2F8F4] text-[#3F7654] border-[#D1E5D7]'
                          : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                      }`}
                    >
                      {event.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quantities */}
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326] border-b border-[#E3E5E7] pb-2">
              Quantity Summary
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#697077]">Total Store Units:</span>
                <span className="font-semibold text-[#202326] tabular-nums">
                  {item.total_quantity} {item.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#697077]">Available inside:</span>
                <span className="font-semibold text-[#3F7654] tabular-nums">
                  {item.available_quantity} {item.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#697077]">Minimum Threshold:</span>
                <span className="font-semibold text-[#202326] tabular-nums">
                  {item.minimum_quantity} {item.unit}
                </span>
              </div>
              {item.unit_price ? (
                <>
                  <div className="flex justify-between border-t border-[#E3E5E7] pt-2">
                    <span className="text-[#697077]">Unit Price:</span>
                    <span className="font-semibold text-[#202326] font-mono">
                      ₹{item.unit_price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#697077]">Total Inventory Value:</span>
                    <span className="font-bold text-[#34495E] font-mono">
                      ₹{(item.unit_price * item.total_quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
