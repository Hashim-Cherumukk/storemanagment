import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  User,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { getReturnById } from '@/lib/services/repository';
import { ReturnCondition } from '@/types/database';
import { PrintableReturnReceipt } from '@/components/returns/PrintableReturnReceipt';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ret = await getReturnById(id);
  return {
    title: ret ? `Return ${ret.return_number}` : 'Return Not Found',
  };
}

const CONDITION_LABELS: Record<ReturnCondition, { label: string; color: string }> = {
  GOOD: { label: 'Good', color: 'text-green-700' },
  FAIR: { label: 'Fair', color: 'text-blue-700' },
  DAMAGED: { label: 'Damaged', color: 'text-amber-700' },
  NEEDS_REPAIR: { label: 'Needs Repair', color: 'text-red-700' },
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ret = await getReturnById(id);

  if (!ret) notFound();

  const totalUnits = ret.items.reduce((s, ri) => s + ri.quantity_returned, 0);
  const hasDamaged = ret.items.some(
    (ri) => ri.condition === 'DAMAGED' || ri.condition === 'NEEDS_REPAIR'
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/returns"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-main font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Returns
      </Link>

      {/* Header */}
      <div className="bg-white border border-border-subtle rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs font-bold text-green-700 mb-1">
              {ret.return_number}
            </div>
            <h1 className="text-xl font-bold text-text-main">Return Record</h1>
            <p className="text-sm text-text-muted mt-1">{formatDateTime(ret.created_at)}</p>
          </div>

          <div className="flex flex-col items-end gap-2.5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recorded
            </span>

            <div className="flex items-center gap-2">
              <PrintableReturnReceipt returnRecord={ret} />

              {hasDamaged && (
                <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                  ⚠ Items Damaged
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-6 text-xs text-text-muted">
          <span>
            <strong className="text-text-main text-sm">{totalUnits}</strong>{' '}
            unit{totalUnits !== 1 ? 's' : ''} returned
          </span>
          <span>
            <strong className="text-text-main text-sm">{ret.items.length}</strong>{' '}
            item type{ret.items.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Two column: Borrower + Issue Ref */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Borrower */}
        <div className="bg-white border border-border-subtle rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              Returned By
            </span>
          </div>
          {ret.person ? (
            <Link href={`/people/${ret.person.id}`} className="group flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-surface border border-primary-border flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {ret.person.full_name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-sm text-text-main group-hover:text-primary transition-colors">
                  {ret.person.full_name}
                </div>
                {ret.person.admission_number && (
                  <div className="text-xs text-text-muted font-mono">
                    {ret.person.admission_number}
                  </div>
                )}
                {ret.person.department && (
                  <div className="text-xs text-text-muted">{ret.person.department}</div>
                )}
              </div>
            </Link>
          ) : (
            <span className="text-sm text-text-muted">Unknown borrower</span>
          )}
        </div>

        {/* Issue Reference */}
        <div className="bg-white border border-border-subtle rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              Related Issue
            </span>
          </div>
          {ret.issue ? (
            <Link
              href={`/issues/${ret.issue_id}`}
              className="group flex items-center justify-between"
            >
              <div>
                <div className="font-mono text-sm font-bold text-primary group-hover:text-primary-hover transition-colors">
                  {ret.issue.issue_number}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Issued on{' '}
                  {new Date(ret.issue.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </Link>
          ) : (
            <span className="text-sm text-text-muted">—</span>
          )}

          {ret.notes && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">
                Notes
              </div>
              <div className="text-sm text-text-main">{ret.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Items Returned */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-2">
          <Package className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-main">Items Returned</span>
        </div>

        <div className="divide-y divide-border-subtle">
          {ret.items.map((returnItem) => {
            const conditionInfo = CONDITION_LABELS[returnItem.condition];

            return (
              <div key={returnItem.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-main">
                      {returnItem.item?.name || 'Unknown Item'}
                    </div>
                    {returnItem.item && (
                      <div className="text-xs text-text-muted mt-0.5">
                        <span className="font-mono">{returnItem.item.item_code}</span>
                        {returnItem.item.category && (
                          <>
                            {' · '}
                            {returnItem.item.category.name}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-text-main">
                      {returnItem.quantity_returned}{' '}
                      {returnItem.item?.unit || 'unit'}
                      {returnItem.quantity_returned !== 1 ? 's' : ''}
                    </div>
                    <div className={`text-xs font-semibold mt-0.5 ${conditionInfo.color}`}>
                      {conditionInfo.label}
                    </div>
                  </div>
                </div>

                {returnItem.notes && (
                  <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-800">{returnItem.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
