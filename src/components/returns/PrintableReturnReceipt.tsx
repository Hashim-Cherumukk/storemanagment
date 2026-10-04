'use client';

import React from 'react';
import { Return } from '@/types/database';
import { Printer } from 'lucide-react';

interface PrintableReturnReceiptProps {
  returnRecord: Return;
  institutionName?: string;
  storekeeperName?: string;
}

export function PrintableReturnReceipt({
  returnRecord,
  institutionName = 'CENTRAL INSTITUTION STORE',
  storekeeperName = 'Storekeeper',
}: PrintableReturnReceiptProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) return;

    const formattedDate = new Date(returnRecord.created_at).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemsRows = returnRecord.items
      .map(
        (ri, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">
          <strong>${ri.item?.name || 'Item'}</strong>
          <div style="font-family: monospace; font-size: 11px; color: #555;">${ri.item?.item_code || ''}</div>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold;">${ri.quantity_returned}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${ri.condition}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Return Receipt - ${returnRecord.return_number}</title>
          <style>
            @page { size: portrait; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #222;
              margin: 0;
              padding: 20px;
              background: #fff;
              font-size: 13px;
            }
            .receipt-box {
              max-width: 600px;
              margin: 0 auto;
              border: 1px solid #000;
              padding: 24px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .institution-name {
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .receipt-title {
              font-size: 18px;
              font-weight: bold;
              margin-top: 4px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 20px;
              font-size: 12px;
            }
            .meta-item strong {
              display: block;
              color: #555;
              font-size: 10px;
              text-transform: uppercase;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #f0f0f0;
              padding: 8px;
              border-bottom: 2px solid #000;
              font-size: 11px;
              text-transform: uppercase;
            }
            .signatures {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding-top: 20px;
            }
            .sig-block {
              width: 200px;
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 4px;
              font-size: 11px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div class="institution-name">${institutionName}</div>
              <div class="receipt-title">EQUIPMENT RETURN RECEIPT</div>
              <div style="font-family: monospace; font-size: 13px; font-weight: bold; margin-top: 4px;"># ${returnRecord.return_number}</div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <strong>Returned By</strong>
                ${returnRecord.person?.full_name || 'Borrower'} (${returnRecord.person?.role || 'STUDENT'})
              </div>
              <div class="meta-item">
                <strong>Original Issue Reference</strong>
                ${returnRecord.issue?.issue_number || 'N/A'}
              </div>
              <div class="meta-item">
                <strong>Return Date & Time</strong>
                ${formattedDate}
              </div>
              <div class="meta-item">
                <strong>Received By</strong>
                Storekeeper (${storekeeperName})
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th style="text-align: left;">Item & Description</th>
                  <th style="width: 80px; text-align: center;">Qty Returned</th>
                  <th style="width: 100px; text-align: center;">Condition</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            ${returnRecord.notes ? `<div style="font-size: 11px; color: #555; margin-bottom: 20px;"><strong>Return Notes:</strong> ${returnRecord.notes}</div>` : ''}

            <div class="signatures">
              <div class="sig-block">
                Returned By Signature
              </div>
              <div class="sig-block">
                Received By Storekeeper
              </div>
            </div>
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

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F6F6F3] text-[#202326] text-xs font-semibold rounded-md border border-[#E3E5E7] shadow-xs transition-colors"
    >
      <Printer className="w-3.5 h-3.5 text-[#34495E]" />
      <span>Print Return Receipt</span>
    </button>
  );
}
