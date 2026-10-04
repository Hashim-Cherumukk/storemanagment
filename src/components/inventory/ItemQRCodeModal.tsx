'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Item } from '@/types/database';
import { QrCode, Printer, Download, X } from 'lucide-react';

interface ItemQRCodeModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  institutionName?: string;
}

export function ItemQRCodeModal({
  item,
  isOpen,
  onClose,
  institutionName = 'INSTITUTION STORE',
}: ItemQRCodeModalProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Encoded URL pointing directly to the item details page
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const itemUrl = `${origin}/inventory/${item.id}`;

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Item Label - ${item.item_code}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .label-card {
              width: 240px;
              border: 2px solid #000;
              padding: 16px;
              text-align: center;
              background: #fff;
              box-sizing: border-box;
            }
            .institution-title {
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #444;
              margin-bottom: 12px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 6px;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              margin: 12px 0;
            }
            .item-name {
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              color: #000;
              margin-top: 8px;
              margin-bottom: 2px;
            }
            .item-code {
              font-family: monospace;
              font-size: 12px;
              font-weight: bold;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="institution-title">${institutionName}</div>
            <div class="qr-container">
              ${labelRef.current?.querySelector('svg')?.outerHTML || ''}
            </div>
            <div class="item-name">${item.name}</div>
            <div class="item-code">${item.item_code}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQR = () => {
    const svgElement = labelRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR-${item.item_code}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-lg shadow-lg w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3E5E7] bg-[#FAFBFB]">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#34495E]" />
            <h3 className="text-xs font-semibold text-[#202326]">Item Identification QR</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#697077] hover:text-[#202326] p-1 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex flex-col items-center">
          {/* Minimal Institutional Label Card */}
          <div
            ref={labelRef}
            className="w-56 border-2 border-[#202326] bg-white p-4 text-center rounded-sm shadow-xs space-y-3"
          >
            <div className="text-[10px] font-bold text-[#697077] tracking-wider uppercase border-b border-[#E3E5E7] pb-1.5">
              {institutionName}
            </div>

            <div className="flex justify-center p-2 bg-white">
              <QRCodeSVG
                value={itemUrl}
                size={140}
                level="H"
                includeMargin={false}
              />
            </div>

            <div>
              <div className="text-sm font-bold text-[#202326] uppercase tracking-tight truncate">
                {item.name}
              </div>
              <div className="text-xs font-mono font-bold text-[#34495E] mt-0.5">
                {item.item_code}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#697077] text-center max-w-xs">
            Scanning this QR code opens the item record and current store status.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={handlePrintLabel}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-[#34495E] hover:bg-[#2C3E50] text-white rounded shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Label</span>
            </button>

            <button
              onClick={handleDownloadQR}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-white hover:bg-[#F6F6F3] text-[#202326] border border-[#E3E5E7] rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#697077]" />
              <span>Download QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
