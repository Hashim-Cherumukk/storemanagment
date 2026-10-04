'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  User,
  Package,
  Plus,
  Minus,
  X,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Item, Person } from '@/types/database';
import { createIssueAction } from '@/lib/actions/issue-actions';

interface NewIssueFormProps {
  items: Item[];
  people: Person[];
}

interface SelectedItem {
  item: Item;
  quantity: number;
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student',
  STAFF: 'Staff',
  TEACHER: 'Teacher',
  OTHER: 'Other',
};

export function NewIssueForm({ items, people }: NewIssueFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Step state: 1 = select borrower, 2 = select items + confirm
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [personSearch, setPersonSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Step 2
  const [itemSearch, setItemSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [purpose, setPurpose] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');

  // Error / success state
  const [error, setError] = useState<string | null>(null);

  // --- Filtered people ---
  const filteredPeople = useMemo(() => {
    if (!personSearch.trim()) return people;
    const q = personSearch.toLowerCase();
    return people.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.admission_number && p.admission_number.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [people, personSearch]);

  // --- Filtered items ---
  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase();
    return items.filter(
      (item) =>
        !selectedItems.find((si) => si.item.id === item.id) &&
        (item.name.toLowerCase().includes(q) ||
          item.item_code.toLowerCase().includes(q) ||
          item.category?.name.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q))
    );
  }, [items, selectedItems, itemSearch]);

  // --- Add item ---
  const addItem = (item: Item) => {
    setSelectedItems((prev) => [...prev, { item, quantity: 1 }]);
    setItemSearch('');
  };

  // --- Remove item ---
  const removeItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((si) => si.item.id !== itemId));
  };

  // --- Change quantity ---
  const changeQuantity = (itemId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((si) => {
          if (si.item.id !== itemId) return si;
          const newQty = si.quantity + delta;
          if (newQty < 1) return si;
          if (newQty > si.item.available_quantity) return si;
          return { ...si, quantity: newQty };
        })
    );
  };

  const setQuantityDirect = (itemId: string, value: number) => {
    setSelectedItems((prev) =>
      prev.map((si) => {
        if (si.item.id !== itemId) return si;
        const clamped = Math.min(Math.max(1, value), si.item.available_quantity);
        return { ...si, quantity: isNaN(clamped) ? 1 : clamped };
      })
    );
  };

  // --- Submit ---
  const handleSubmit = () => {
    if (!selectedPerson) return;
    if (selectedItems.length === 0) {
      setError('Please add at least one item to issue.');
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await createIssueAction({
        person_id: selectedPerson.id,
        issued_by: '',
        purpose: purpose || null,
        expected_return_date: expectedReturnDate || null,
        notes: notes || null,
        items: selectedItems.map((si) => ({
          item_id: si.item.id,
          quantity_issued: si.quantity,
        })),
      });

      if (result.success && result.issueId) {
        router.push(`/issues/${result.issueId}`);
      } else {
        setError(result.error || 'Something went wrong.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => (step === 2 ? setStep(1) : router.back())}
          className="p-2 text-text-muted hover:text-text-main hover:bg-surface-raised rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-main">Issue Items</h1>
          <p className="text-sm text-text-muted">
            {step === 1 ? 'Step 1 of 2 — Select borrower' : 'Step 2 of 2 — Select items'}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            step === 1
              ? 'bg-primary text-white'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {step > 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          Borrower
        </div>
        <div className="w-8 h-px bg-border" />
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            step === 2
              ? 'bg-primary text-white'
              : 'bg-surface-raised text-text-muted border border-border'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Items
        </div>
      </div>

      {/* ===================== STEP 1: Select Borrower ===================== */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border-subtle">
              <h2 className="text-sm font-semibold text-text-main">Who is borrowing?</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Search by name, admission number, or phone
              </p>
            </div>

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={personSearch}
                  onChange={(e) => setPersonSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-warm-bg border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="divide-y divide-border-subtle max-h-96 overflow-y-auto">
              {filteredPeople.length === 0 ? (
                <div className="py-10 text-center text-sm text-text-muted">
                  No people found matching "{personSearch}"
                </div>
              ) : (
                filteredPeople.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => {
                      setSelectedPerson(person);
                      setStep(2);
                    }}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-primary-surface text-left transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-surface border border-primary-border flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {person.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text-main">{person.full_name}</div>
                      <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                        <span>{ROLE_LABELS[person.role] || person.role}</span>
                        {person.admission_number && (
                          <>
                            <span className="text-border">·</span>
                            <span className="font-mono">{person.admission_number}</span>
                          </>
                        )}
                        {person.department && (
                          <>
                            <span className="text-border">·</span>
                            <span className="truncate">{person.department}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 rotate-180 text-text-muted shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          <p className="text-xs text-text-muted text-center">
            Person not registered?{' '}
            <a href="/people/new" className="text-primary font-medium hover:underline">
              Add them first
            </a>
          </p>
        </div>
      )}

      {/* ===================== STEP 2: Select Items ===================== */}
      {step === 2 && selectedPerson && (
        <div className="space-y-4">
          {/* Selected borrower pill */}
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 border border-green-300 flex items-center justify-center text-sm font-bold text-green-700">
                {selectedPerson.full_name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold text-text-main">{selectedPerson.full_name}</div>
                <div className="text-xs text-text-muted">
                  {ROLE_LABELS[selectedPerson.role]}{' '}
                  {selectedPerson.admission_number && `· ${selectedPerson.admission_number}`}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedPerson(null);
                setStep(1);
              }}
              className="text-xs text-text-muted hover:text-text-main font-medium"
            >
              Change
            </button>
          </div>

          {/* Item Search + Add */}
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border-subtle">
              <h2 className="text-sm font-semibold text-text-main">Add items to issue</h2>
              <p className="text-xs text-text-muted mt-0.5">Search for items from the inventory</p>
            </div>

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search items by name, code, or category..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-warm-bg border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Item dropdown */}
            {itemSearch && (
              <div className="border-t border-border-subtle divide-y divide-border-subtle max-h-64 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="py-6 text-center text-sm text-text-muted">
                    No available items matching "{itemSearch}"
                  </div>
                ) : (
                  filteredItems.slice(0, 10).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-primary-surface text-left transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-text-main">{item.name}</div>
                        <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{item.item_code}</span>
                          <span>·</span>
                          <span>{item.category?.name}</span>
                          <span>·</span>
                          <span
                            className={`font-semibold ${
                              item.available_quantity <= item.minimum_quantity
                                ? 'text-amber-600'
                                : 'text-green-600'
                            }`}
                          >
                            {item.available_quantity} available
                          </span>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-primary shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Items List */}
          {selectedItems.length > 0 && (
            <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
                <span className="text-sm font-semibold text-text-main">
                  Items to Issue ({selectedItems.length})
                </span>
                <span className="text-xs text-text-muted">
                  {selectedItems.reduce((s, si) => s + si.quantity, 0)} total units
                </span>
              </div>

              <div className="divide-y divide-border-subtle">
                {selectedItems.map(({ item, quantity }) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-main truncate">{item.name}</div>
                      <div className="text-xs text-text-muted mt-0.5">
                        <span className="font-mono">{item.item_code}</span> · {item.unit}
                        {' · '}
                        <span className="text-green-600 font-medium">
                          {item.available_quantity} available
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => changeQuantity(item.id, -1)}
                        disabled={quantity <= 1}
                        className="w-7 h-7 rounded-lg border border-border-subtle flex items-center justify-center text-text-muted hover:bg-warm-bg disabled:opacity-40 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={item.available_quantity}
                        value={quantity}
                        onChange={(e) => setQuantityDirect(item.id, parseInt(e.target.value))}
                        className="w-12 text-center text-sm font-semibold text-text-main border border-border-subtle rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <button
                        onClick={() => changeQuantity(item.id, 1)}
                        disabled={quantity >= item.available_quantity}
                        className="w-7 h-7 rounded-lg border border-border-subtle flex items-center justify-center text-text-muted hover:bg-warm-bg disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="bg-white border border-border-subtle rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-main">Issue Details (Optional)</h2>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                Purpose / Occasion
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Annual Sports Day, Lab Practical, Campus Event..."
                className="w-full px-3 py-2.5 text-sm bg-warm-bg border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Expected Return Date
                </span>
              </label>
              <input
                type="date"
                value={expectedReturnDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-warm-bg border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any notes for this issue record..."
                className="w-full px-3 py-2.5 text-sm bg-warm-bg border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
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
            <button
              onClick={() => setStep(1)}
              className="text-sm text-text-muted hover:text-text-main font-medium transition-colors"
            >
              ← Back
            </button>

            <button
              onClick={handleSubmit}
              disabled={isPending || selectedItems.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Issue{selectedItems.length > 0 ? ` (${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
