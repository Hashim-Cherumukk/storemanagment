'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Camera } from 'lucide-react';
import { QRScannerModal } from '@/components/inventory/QRScannerModal';

interface InventoryHeaderActionsProps {
  canManage: boolean;
}

export function InventoryHeaderActions({ canManage }: InventoryHeaderActionsProps) {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FFFFFF] hover:bg-[#F6F6F3] text-[#202326] text-xs font-semibold rounded-lg border border-[#E3E5E7] shadow-xs transition-colors"
        >
          <Camera className="w-4 h-4 text-[#34495E]" />
          <span>Scan QR</span>
        </button>

        {canManage && (
          <Link
            href="/inventory/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#34495E] hover:bg-[#2C3E50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </Link>
        )}
      </div>

      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
      />
    </>
  );
}
