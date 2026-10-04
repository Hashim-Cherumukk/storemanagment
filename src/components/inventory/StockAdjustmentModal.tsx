'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Item, StockAdjustmentReason } from '@/types/database';
import { createStockAdjustmentAction } from '@/lib/actions/stock-actions';
import { useToast } from '@/components/ui/Toast';
import { PackageCheck, AlertCircle, X, Plus, Minus } from 'lucide-react';

interface StockAdjustmentModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
}

const REASON_LABELS: Record<StockAdjustmentReason, string> = {
  NEW_STOCK_RECEIVED: 'New stock received',
  PHYSICAL_COUNT_CORRECTION: 'Physical count correction',
  DAMAGED: 'Damaged item',
  LOST: 'Lost item',
  OTHER: 'Other reason',
};

export function StockAdjustmentModal({ item, isOpen, onClose }: StockAdjustmentModalProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<StockAdjustmentReason>('NEW_STOCK_RECEIVED');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const signedQuantityChange = mode === 'add' ? quantity : -quantity;
  const newTotalQuantity = item.total_quantity + signedQuantityChange;
  const newAvailableQuantity = item.available_quantity + signedQuantityChange;
  const currentlyIssued = item.total_quantity - item.available_quantity;

  const isInvalid = newTotalQuantity < 0 || newAvailableQuantity < 0 || quantity <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (quantity <= 0) {
      setErrorMessage('Please enter a valid quantity change.');
      return;
    }

    if (newAvailableQuantity < 0) {
      setErrorMessage(
        `You cannot remove ${quantity} unit${quantity > 1 ? 's' : ''} because only ${item.available_quantity} unit${item.available_quantity === 1 ? '' : 's'} are currently available in store (${currentlyIssued} unit${currentlyIssued === 1 ? '' : 's'} currently issued).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createStockAdjustmentAction({
        itemId: item.id,
        quantityChange: signedQuantityChange,
        reason,
        notes: notes.trim() || null,
      });

      if (res.success) {
        showToast(`Stock for ${item.item_code} adjusted successfully.`, 'success');
        router.refresh();
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to record stock adjustment.');
      }
    } catch {
      setErrorMessage('An unexpected system error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E5E7] bg-[#FAFBFB]">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="w-5 h-5 text-[#34495E]" />
            <div>
              <h3 className="text-sm font-semibold text-[#202326]">Adjust Stock</h3>
              <p className="text-xs text-[#697077] font-mono">{item.name} ({item.item_code})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#697077] hover:text-[#202326] p-1 rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Status Overview */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-[#F6F6F3] rounded border border-[#E3E5E7] text-xs">
            <div>
              <span className="block text-[#697077]">Total Stock</span>
              <span className="font-semibold text-[#202326] text-sm">{item.total_quantity} {item.unit}</span>
            </div>
            <div>
              <span className="block text-[#697077]">In Store</span>
              <span className="font-semibold text-[#202326] text-sm">{item.available_quantity} {item.unit}</span>
            </div>
            <div>
              <span className="block text-[#697077]">Issued Out</span>
              <span className="font-semibold text-[#202326] text-sm">{currentlyIssued} {item.unit}</span>
            </div>
          </div>

          {/* Adjustment Mode Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#202326] mb-1.5">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('add')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded border transition-colors ${
                  mode === 'add'
                    ? 'bg-[#34495E] text-white border-[#34495E]'
                    : 'bg-white text-[#202326] border-[#E3E5E7] hover:bg-[#F6F6F3]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stock (+ Units)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('remove')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded border transition-colors ${
                  mode === 'remove'
                    ? 'bg-[#34495E] text-white border-[#34495E]'
                    : 'bg-white text-[#202326] border-[#E3E5E7] hover:bg-[#F6F6F3]'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Remove Stock (- Units)</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label htmlFor="adjust-qty" className="block text-xs font-semibold text-[#202326] mb-1">
              Quantity to {mode === 'add' ? 'Add' : 'Remove'}
            </label>
            <input
              id="adjust-qty"
              type="number"
              min="1"
              max={mode === 'remove' ? item.available_quantity : 9999}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E3E5E7] rounded focus:outline-none focus:border-[#34495E]"
              required
            />
          </div>

          {/* Reason Selection */}
          <div>
            <label htmlFor="adjust-reason" className="block text-xs font-semibold text-[#202326] mb-1">
              Reason for Adjustment
            </label>
            <select
              id="adjust-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E3E5E7] rounded focus:outline-none focus:border-[#34495E]"
            >
              {Object.entries(REASON_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes Input */}
          <div>
            <label htmlFor="adjust-notes" className="block text-xs font-semibold text-[#202326] mb-1">
              Notes / Reference (Optional)
            </label>
            <textarea
              id="adjust-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Shipment invoice #4920 or annual inventory audit count"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E3E5E7] rounded focus:outline-none focus:border-[#34495E]"
            />
          </div>

          {/* Result Calculation Preview */}
          <div className="p-3 bg-[#FAFBFB] rounded border border-[#E3E5E7] space-y-1 text-xs">
            <div className="flex justify-between text-[#697077]">
              <span>Current Total Stock:</span>
              <span className="font-mono text-[#202326]">{item.total_quantity} {item.unit}</span>
            </div>
            <div className="flex justify-between text-[#697077]">
              <span>Adjustment:</span>
              <span className={`font-mono font-semibold ${mode === 'add' ? 'text-green-700' : 'text-red-700'}`}>
                {signedQuantityChange > 0 ? `+${signedQuantityChange}` : signedQuantityChange} {item.unit}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#E3E5E7] font-semibold text-[#202326]">
              <span>New Total Stock:</span>
              <span className="font-mono text-sm">{newTotalQuantity} {item.unit}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E3E5E7]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#697077] hover:text-[#202326] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInvalid}
              className="px-4 py-2 text-xs font-semibold bg-[#34495E] hover:bg-[#2C3E50] text-white rounded shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving Adjustment...' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
