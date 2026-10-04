'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Camera, AlertCircle, X, Search } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const router = useRouter();
  const [manualCode, setManualCode] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let scanner: Html5QrcodeScanner | null = null;

    try {
      scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Check if decoded text is a URL or item code
          if (decodedText.includes('/inventory/')) {
            const parts = decodedText.split('/inventory/');
            const itemId = parts[parts.length - 1];
            if (scanner) scanner.clear();
            onClose();
            router.push(`/inventory/${itemId}`);
          } else {
            // Direct item code search fallback
            if (scanner) scanner.clear();
            onClose();
            router.push(`/inventory?search=${encodeURIComponent(decodedText)}`);
          }
        },
        (error) => {
          // Gentle scan frame warnings ignored
        }
      );
    } catch (err) {
      setScanError('Camera permission not granted or device camera unavailable.');
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [isOpen, router, onClose]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onClose();
    router.push(`/inventory?search=${encodeURIComponent(manualCode.trim())}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3E5E7] bg-[#FAFBFB]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#34495E]" />
            <h3 className="text-xs font-semibold text-[#202326]">Scan Item QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#697077] hover:text-[#202326] p-1 rounded transition-colors"
            aria-label="Close scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {scanError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{scanError} Use manual item lookup below.</span>
            </div>
          )}

          {/* Camera Container */}
          <div className="bg-[#F6F6F3] border border-[#E3E5E7] rounded p-2 overflow-hidden min-h-[260px] flex items-center justify-center">
            <div id="reader" className="w-full text-xs" />
          </div>

          <p className="text-[11px] text-[#697077] text-center">
            Point camera at the printable QR label on an item to immediately view its status.
          </p>

          {/* Fallback Manual Item Lookup */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-[#E3E5E7] space-y-2">
            <label htmlFor="manual-code" className="block text-xs font-medium text-[#202326]">
              Or type item code manually:
            </label>
            <div className="flex gap-2">
              <input
                id="manual-code"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. ELEC-PRJ-001"
                className="flex-1 px-3 py-1.5 text-xs border border-[#E3E5E7] rounded focus:outline-none focus:border-[#34495E]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-[#34495E] text-white rounded hover:bg-[#2C3E50] transition-colors inline-flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
