'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowDownLeft,
  Package,
} from 'lucide-react';
import { Issue, ReturnCondition } from '@/types/database';
import { createReturnAction } from '@/lib/actions/return-actions';

interface ReturnLineItem {
  issue_item_id: string;
  item_id: string;
  item_name: string;
  item_code: string;
  unit: string;
  quantity_issued: number;
  quantity_already_returned: number;
  quantity_to_return: number;
  condition: ReturnCondition;
  notes: string;
  checked: boolean; // whether user wants to include this item in return
}

interface NewReturnFormProps {
  activeIssues: Issue[];
  preloadedIssue: Issue | null;
}

const CONDITION_OPTIONS: { value: ReturnCondition; label: string; desc: string; color: string }[] =
  [
    { value: 'GOOD', label: 'Good', desc: 'No damage, clean', color: 'text-green-700' },
    { value: 'FAIR', label: 'Fair', desc: 'Minor wear, still usable', color: 'text-blue-700' },
    { value: 'DAMAGED', label: 'Damaged', desc: 'Needs repair', color: 'text-amber-700' },
    { value: 'NEEDS_REPAIR', label: 'Needs Repair', desc: 'Significant damage', color: 'text-red-700' },
  ];

export function NewReturnForm({ activeIssues, preloadedIssue }: NewReturnFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [issueSearch, setIssueSearch] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(preloadedIssue);
  const [lineItems, setLineItems] = useState<ReturnLineItem[]>([]);
  const [globalNotes, setGlobalNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(preloadedIssue ? 2 : 1);

  // When issue is selected, build the line items
  useEffect(() => {
    if (!selectedIssue) {
      setLineItems([]);
      return;
    }

    const items: ReturnLineItem[] = selectedIssue.items
      .filter((ii) => ii.quantity_issued > ii.quantity_returned)
      .map((ii) => ({
        issue_item_id: ii.id,
        item_id: ii.item_id,
        item_name: ii.item?.name || 'Unknown Item',
        item_code: ii.item?.item_code || '',
        unit: ii.item?.unit || 'piece',
        quantity_issued: ii.quantity_issued,
        quantity_already_returned: ii.quantity_returned,
        quantity_to_return: ii.quantity_issued - ii.quantity_returned,
        condition: 'GOOD',
        notes: '',
        checked: true,
      }));

    setLineItems(items);
  }, [selectedIssue]);

  const filteredIssues = activeIssues.filter((issue) => {
    if (!issueSearch.trim()) return true;
    const q = issueSearch.toLowerCase();
    return (
      issue.issue_number.toLowerCase().includes(q) ||
      issue.person?.full_name.toLowerCase().includes(q) ||
      (issue.person?.admission_number &&
        issue.person.admission_number.toLowerCase().includes(q))
    );
  });

  const updateLineItem = <K extends keyof ReturnLineItem>(
    issueItemId: string,
    key: K,
    value: ReturnLineItem[K]
  ) => {
    setLineItems((prev) =>
      prev.map((li) => (li.issue_item_id === issueItemId ? { ...li, [key]: value } : li))
    );
  };

  const checkedItems = lineItems.filter((li) => li.checked);

  const handleSubmit = () => {
    if (!selectedIssue) return;

    const itemsToReturn = checkedItems;

    if (itemsToReturn.length === 0) {
      setError('Please select at least one item to return.');
      return;
    }

    for (const li of itemsToReturn) {
      const maxCanReturn = li.quantity_issued - li.quantity_already_returned;
      if (li.quantity_to_return <= 0 || li.quantity_to_return > maxCanReturn) {
        setError(
          `Invalid quantity for "${li.item_name}". Max returnable: ${maxCanReturn}`
        );
        return;
      }
    }

    setError(null);

    startTransition(async () => {
      const result = await createReturnAction({
        issue_id: selectedIssue.id,
        received_by: '',
        notes: globalNotes || null,
        items: itemsToReturn.map((li) => ({
          issue_item_id: li.issue_item_id,
          item_id: li.item_id,
          quantity_returned: li.quantity_to_return,
          condition: li.condition,
          notes: li.notes || null,
        })),
      });

      if (result.success && result.returnId) {
        router.push(`/returns/${result.returnId}`);
      } else {
        setError(result.error || 'Failed to record return.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() =>
            step === 2 && !preloadedIssue ? setStep(1) : router.back()
          }
          className="p-2 text-text-muted hover:text-text-main hover:bg-surface-raised rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-main">Record Return</h1>
          <p className="text-sm text-text-muted">
            {step === 1 ? 'Step 1 of 2 — Select issue' : 'Step 2 of 2 — Confirm items returned'}
          </p>
        </div>
      </div>

      {/* ===== STEP 1: Select Issue ===== */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border-subtle">
              <h2 className="text-sm font-semibold text-text-main">Which issue is being returned?</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Search by issue number or borrower name
              </p>
            </div>

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-warm-bg border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="divide-y divide-border-subtle max-h-96 overflow-y-auto">
              {filteredIssues.length === 0 ? (
                <div className="py-10 text-center text-sm text-text-muted">
                  {activeIssues.length === 0
                    ? 'No active issues found. All items may have been returned.'
                    : `No issues matching "${issueSearch}"`}
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  const outstanding = issue.items.reduce(
                    (sum, ii) => sum + (ii.quantity_issued - ii.quantity_returned),
                    0
                  );

                  return (
                    <button
                      key={issue.id}
                      onClick={() => {
                        setSelectedIssue(issue);
                        setStep(2);
                      }}
                      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-primary-surface text-left transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary-surface border border-primary-border flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {issue.person?.full_name.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">
                            {issue.issue_number}
                          </span>
                          {issue.status === 'PARTIALLY_RETURNED' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-semibold border border-amber-200">
                              Partial
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-text-main">
                          {issue.person?.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-text-muted">
                          {outstanding} unit{outstanding !== 1 ? 's' : ''} outstanding
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 rotate-180 text-text-muted shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 2: Select Items to Return ===== */}
      {step === 2 && selectedIssue && (
        <div className="space-y-4">
          {/* Issue summary pill */}
          <div className="flex items-center justify-between bg-primary-surface border border-primary-border rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <ArrowDownLeft className="w-5 h-5 text-primary" />
              <div>
                <div className="font-mono text-xs font-bold text-primary">
                  {selectedIssue.issue_number}
                </div>
                <div className="text-sm font-semibold text-text-main">
                  {selectedIssue.person?.full_name || 'Unknown'}
                </div>
              </div>
            </div>
            {!preloadedIssue && (
              <button
                onClick={() => {
                  setSelectedIssue(null);
                  setStep(1);
                }}
                className="text-xs text-text-muted hover:text-text-main font-medium"
              >
                Change
              </button>
            )}
          </div>

          {/* Items */}
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-2">
              <Package className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-semibold text-text-main">Items to Return</span>
              <span className="ml-auto text-xs text-text-muted">
                Check items being returned now
              </span>
            </div>

            {lineItems.length === 0 ? (
              <div className="py-10 text-center text-sm text-text-muted">
                All items from this issue have been returned.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {lineItems.map((li) => {
                  const maxReturn = li.quantity_issued - li.quantity_already_returned;

                  return (
                    <div key={li.issue_item_id} className="p-5 space-y-3">
                      {/* Item header with checkbox */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`check-${li.issue_item_id}`}
                          checked={li.checked}
                          onChange={(e) =>
                            updateLineItem(li.issue_item_id, 'checked', e.target.checked)
                          }
                          className="mt-0.5 w-4 h-4 rounded border-border accent-primary"
                        />
                        <label
                          htmlFor={`check-${li.issue_item_id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="text-sm font-semibold text-text-main">{li.item_name}</div>
                          <div className="text-xs text-text-muted mt-0.5">
                            <span className="font-mono">{li.item_code}</span>
                            {li.quantity_already_returned > 0 && (
                              <span className="ml-2 text-amber-600 font-medium">
                                ({li.quantity_already_returned} already returned)
                              </span>
                            )}
                          </div>
                        </label>
                      </div>

                      {li.checked && (
                        <div className="ml-7 space-y-3">
                          {/* Quantity */}
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                                Quantity Returning
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={maxReturn}
                                  value={li.quantity_to_return}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      updateLineItem(
                                        li.issue_item_id,
                                        'quantity_to_return',
                                        Math.min(Math.max(1, val), maxReturn)
                                      );
                                    }
                                  }}
                                  className="w-20 px-3 py-2 text-sm font-semibold text-center border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <span className="text-xs text-text-muted">
                                  of {maxReturn} {li.unit}(s) outstanding
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Condition */}
                          <div>
                            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                              Condition on Return
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {CONDITION_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    updateLineItem(li.issue_item_id, 'condition', opt.value)
                                  }
                                  className={`flex flex-col text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                                    li.condition === opt.value
                                      ? 'border-primary bg-primary-surface'
                                      : 'border-border-subtle bg-white hover:bg-warm-bg'
                                  }`}
                                >
                                  <span
                                    className={`font-semibold ${
                                      li.condition === opt.value ? 'text-primary' : opt.color
                                    }`}
                                  >
                                    {opt.label}
                                  </span>
                                  <span className="text-text-muted text-[11px]">{opt.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Notes for item */}
                          {(li.condition === 'DAMAGED' || li.condition === 'NEEDS_REPAIR') && (
                            <div>
                              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                                Damage Notes
                              </label>
                              <textarea
                                value={li.notes}
                                onChange={(e) =>
                                  updateLineItem(li.issue_item_id, 'notes', e.target.value)
                                }
                                rows={2}
                                placeholder="Describe the damage..."
                                className="w-full px-3 py-2 text-sm bg-warm-bg border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Global Notes */}
          <div className="bg-white border border-border-subtle rounded-xl p-5">
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              General Notes (Optional)
            </label>
            <textarea
              value={globalNotes}
              onChange={(e) => setGlobalNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this return..."
              className="w-full px-3 py-2.5 text-sm bg-warm-bg border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-danger-bg border border-danger-border rounded-xl">
              <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between pt-2 pb-6">
            {!preloadedIssue && (
              <button
                onClick={() => setStep(1)}
                className="text-sm text-text-muted hover:text-text-main font-medium transition-colors"
              >
                ← Back
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending || checkedItems.length === 0}
              className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Return
                  {checkedItems.length > 0 &&
                    ` (${checkedItems.length} item${checkedItems.length !== 1 ? 's' : ''})`}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
