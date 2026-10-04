'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Item } from '@/types/database';
import { toggleItemStatusAction } from '@/lib/actions/inventory-actions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';
import { ItemQRCodeModal } from '@/components/inventory/ItemQRCodeModal';
import { useToast } from '@/components/ui/Toast';
import { Edit2, PowerOff, Power, PackageCheck, QrCode } from 'lucide-react';

interface ItemDetailActionsProps {
  item: Item;
  canManage: boolean;
}

export function ItemDetailActions({ item, canManage }: ItemDetailActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      const res = await toggleItemStatusAction(item.id);
      if (res.success) {
        showToast(
          `Item ${item.item_code} was ${item.is_active ? 'deactivated' : 'activated'} successfully.`,
          'success'
        );
        router.refresh();
      } else {
        showToast(res.error || 'Failed to update item status.', 'error');
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* QR Code Action */}
        <button
          type="button"
          onClick={() => setShowQRModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F6F6F3] text-[#202326] text-xs font-semibold rounded-md border border-[#E3E5E7] shadow-xs transition-colors"
        >
          <QrCode className="w-3.5 h-3.5 text-[#34495E]" />
          <span>Generate QR Code</span>
        </button>

        {canManage && (
          <>
            {/* Safe Stock Adjustment Action */}
            <button
              type="button"
              onClick={() => setShowStockModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F6F6F3] text-[#202326] text-xs font-semibold rounded-md border border-[#E3E5E7] shadow-xs transition-colors"
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#34495E]" />
              <span>Adjust Stock</span>
            </button>

            {/* Edit Item */}
            <Link
              href={`/inventory/${item.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F6F6F3] text-[#202326] text-xs font-semibold rounded-md border border-[#E3E5E7] shadow-xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#697077]" />
              <span>Edit Item</span>
            </Link>

            {/* Deactivate/Activate */}
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors shadow-xs ${
                item.is_active
                  ? 'bg-[#FFFFFF] hover:bg-red-50 text-red-700 border-[#E3E5E7] hover:border-red-200'
                  : 'bg-[#FFFFFF] hover:bg-green-50 text-green-700 border-[#E3E5E7] hover:border-green-200'
              }`}
            >
              {item.is_active ? (
                <>
                  <PowerOff className="w-3.5 h-3.5" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <Power className="w-3.5 h-3.5" />
                  <span>Activate</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        item={item}
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
      />

      {/* QR Code Modal */}
      <ItemQRCodeModal
        item={item}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />

      {/* Status Confirmation Modal */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleToggleStatus}
        isLoading={isLoading}
        variant={item.is_active ? 'danger' : 'primary'}
        title={item.is_active ? `Deactivate ${item.item_code}?` : `Reactivate ${item.item_code}?`}
        description={
          item.is_active
            ? `Deactivating "${item.name}" marks it inactive in the catalog. It will not be eligible for issuing transactions.`
            : `Reactivating "${item.name}" restores it to active store status.`
        }
        confirmLabel={item.is_active ? 'Deactivate Item' : 'Activate Item'}
      />
    </>
  );
}
