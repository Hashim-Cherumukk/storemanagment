import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Package,
  ArrowDownLeft,
  FileText,
} from 'lucide-react';
import { getIssueById } from '@/lib/services/repository';
import { IssueStatus } from '@/types/database';
import { PrintableIssueReceipt } from '@/components/issues/PrintableIssueReceipt';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const issue = await getIssueById(id);
  return {
    title: issue ? `Issue ${issue.issue_number}` : 'Issue Not Found',
  };
}

const STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  ACTIVE: {
    label: 'Active — Items Out',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Clock,
  },
  PARTIALLY_RETURNED: {
    label: 'Partially Returned',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: AlertCircle,
  },
  RETURNED: {
    label: 'Fully Returned',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: CheckCircle2,
  },
  OVERDUE: {
    label: 'Overdue',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: AlertCircle,
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = await getIssueById(id);

  if (!issue) notFound();

  const config = STATUS_CONFIG[issue.status];
  const StatusIcon = config.icon;

  const totalIssued = issue.items.reduce((sum, ii) => sum + ii.quantity_issued, 0);
  const totalReturned = issue.items.reduce((sum, ii) => sum + ii.quantity_returned, 0);
  const canReturn = issue.status !== 'RETURNED' && totalReturned < totalIssued;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/issues"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-main font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Issues
      </Link>

      {/* Header */}
      <div className="bg-white border border-border-subtle rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold text-primary mb-1">{issue.issue_number}</div>
            <h1 className="text-xl font-bold text-text-main">Issue Record</h1>
            <p className="text-sm text-text-muted mt-1">{formatDateTime(issue.created_at)}</p>
          </div>

          <div className="flex flex-col items-end gap-2.5">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {config.label}
            </span>

            <div className="flex items-center gap-2">
              <PrintableIssueReceipt issue={issue} />

              {canReturn && (
                <Link
                  href={`/returns/new?issue_id=${issue.id}`}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#34495E] hover:bg-[#2C3E50] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Record Return</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar for returns */}
        {totalIssued > 0 && (
          <div className="mt-5 pt-5 border-t border-border-subtle">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-text-muted font-medium">Return progress</span>
              <span className="font-semibold text-text-main">
                {totalReturned} / {totalIssued} units returned
              </span>
            </div>
            <div className="h-2 bg-warm-bg rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${Math.round((totalReturned / totalIssued) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Two column: Borrower + Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Borrower */}
        <div className="bg-white border border-border-subtle rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              Borrower
            </span>
          </div>

          {issue.person ? (
            <Link href={`/people/${issue.person.id}`} className="group flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-surface border border-primary-border flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {issue.person.full_name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-text-main text-sm group-hover:text-primary transition-colors">
                  {issue.person.full_name}
                </div>
                {issue.person.admission_number && (
                  <div className="text-xs text-text-muted font-mono">
                    {issue.person.admission_number}
                  </div>
                )}
                {issue.person.department && (
                  <div className="text-xs text-text-muted">{issue.person.department}</div>
                )}
              </div>
            </Link>
          ) : (
            <span className="text-sm text-text-muted">Unknown borrower</span>
          )}
        </div>

        {/* Issue Details */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              Details
            </span>
          </div>

          {issue.purpose && (
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-wide font-semibold mb-0.5">
                Purpose
              </div>
              <div className="text-sm text-text-main">{issue.purpose}</div>
            </div>
          )}

          {issue.expected_return_date && (
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-wide font-semibold mb-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Expected Return
              </div>
              <div className="text-sm text-text-main">{formatDate(issue.expected_return_date)}</div>
            </div>
          )}

          {issue.notes && (
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-wide font-semibold mb-0.5">
                Notes
              </div>
              <div className="text-sm text-text-main">{issue.notes}</div>
            </div>
          )}

          {!issue.purpose && !issue.expected_return_date && !issue.notes && (
            <p className="text-sm text-text-muted">No additional details recorded.</p>
          )}
        </div>
      </div>

      {/* Items Issued */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-2">
          <Package className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-main">Items Issued</span>
          <span className="ml-auto text-xs text-text-muted">
            {issue.items.length} item type{issue.items.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="divide-y divide-border-subtle">
          {issue.items.map((issueItem) => {
            const remaining = issueItem.quantity_issued - issueItem.quantity_returned;
            const fullyReturned = remaining === 0;

            return (
              <div key={issueItem.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-main">
                    {issueItem.item?.name || 'Unknown Item'}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                    {issueItem.item && (
                      <span className="font-mono">{issueItem.item.item_code}</span>
                    )}
                    {issueItem.item?.category && (
                      <>
                        <span>·</span>
                        <span>{issueItem.item.category.name}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-text-main">
                    {issueItem.quantity_issued} {issueItem.item?.unit || 'unit'}
                    {issueItem.quantity_issued !== 1 ? 's' : ''}
                  </div>
                  {issueItem.quantity_returned > 0 ? (
                    <div
                      className={`text-xs mt-0.5 font-medium ${
                        fullyReturned ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      {fullyReturned ? '✓ Returned' : `${issueItem.quantity_returned} returned`}
                    </div>
                  ) : (
                    <div className="text-xs text-text-muted mt-0.5">Not yet returned</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {canReturn && (
          <div className="px-5 py-4 bg-warm-bg border-t border-border-subtle">
            <Link
              href={`/returns/new?issue_id=${issue.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Record a return for this issue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
