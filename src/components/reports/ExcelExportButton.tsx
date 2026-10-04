'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

interface ExcelExportButtonProps {
  data: any;
  filename: string;
}

export function ExcelExportButton({ data, filename }: ExcelExportButtonProps) {
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Inventory Summary
    if (data.inventorySummary) {
      const invData = [
        { Metric: 'Total Item Types', Value: data.inventorySummary.totalItemTypes },
        { Metric: 'Total Quantity', Value: data.inventorySummary.totalQuantity },
        { Metric: 'Available Quantity', Value: data.inventorySummary.availableQuantity },
        { Metric: 'Currently Outside', Value: data.inventorySummary.currentlyOutQuantity },
        { Metric: 'Low Stock Count', Value: data.inventorySummary.lowStockCount },
        { Metric: 'Out of Stock Count', Value: data.inventorySummary.outOfStockCount },
      ];
      const wsInv = XLSX.utils.json_to_sheet(invData);
      XLSX.utils.book_append_sheet(wb, wsInv, 'Inventory Summary');
    }

    // Sheet 2: Most Borrowed Items
    if (data.mostBorrowed && data.mostBorrowed.length > 0) {
      const mbData = data.mostBorrowed.map((b: any) => ({
        'Item Name': b.item.name,
        'Item Code': b.item.item_code,
        'Category': b.item.category?.name || 'Uncategorized',
        'Times Issued': b.issueTimes,
        'Total Units Issued': b.totalIssued,
        'Available Stock': b.item.available_quantity,
        'Total Stock': b.item.total_quantity,
      }));
      const wsMb = XLSX.utils.json_to_sheet(mbData);
      XLSX.utils.book_append_sheet(wb, wsMb, 'Most Borrowed');
    }

    // Sheet 3: Frequent Borrowers
    if (data.frequentBorrowers && data.frequentBorrowers.length > 0) {
      const fbData = data.frequentBorrowers.map((fb: any) => ({
        'Person Name': fb.personName,
        'Role': fb.role,
        'Total Issues': fb.totalIssues,
        'Currently Out': fb.currentlyOut,
      }));
      const wsFb = XLSX.utils.json_to_sheet(fbData);
      XLSX.utils.book_append_sheet(wb, wsFb, 'Frequent Borrowers');
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#202326] bg-[#FFFFFF] border border-[#E3E5E7] hover:bg-[#F1F3F2] rounded transition-colors shrink-0"
    >
      <Download className="w-3.5 h-3.5 text-[#34495E]" />
      <span>Export Excel</span>
    </button>
  );
}
