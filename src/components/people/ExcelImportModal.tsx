'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertTriangle, FileSpreadsheet, Check, X, ArrowRight, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { batchImportPeopleAction } from '@/lib/actions/people-actions';
import { useToast } from '@/components/ui/Toast';

interface ExcelRow {
  [key: string]: any;
}

interface ParsedPersonRow {
  rowNumber: number;
  full_name: string;
  admission_number: string;
  role: 'STUDENT' | 'TEACHER' | 'STAFF' | 'OTHER';
  department: string;
  class_name: string;
  phone: string;
  email: string;
  isValid: boolean;
  errorReason?: string;
  isDuplicateInFile?: boolean;
}

export function ExcelImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<'upload' | 'preview' | 'summary'>('upload');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedPersonRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    addedCount: number;
    skippedCount: number;
    errors: Array<{ row: number; name: string; error: string }>;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: ExcelRow[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        processExcelData(rawData);
      } catch (err) {
        showToast('Failed to parse Excel file. Please verify the file format.', 'error');
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const processExcelData = (data: ExcelRow[]) => {
    const rows: ParsedPersonRow[] = [];
    const seenAdmNumbers = new Set<string>();
    const seenNames = new Set<string>();

    data.forEach((row, idx) => {
      const rowNumber = idx + 2; // Accounting for 1-indexed header

      // Column mapping auto-resolution
      const nameKey = Object.keys(row).find((k) =>
        /name|full name|student name|staff name/i.test(k)
      ) || Object.keys(row)[0];

      const admKey = Object.keys(row).find((k) =>
        /admission|adm|id|roll|student id/i.test(k)
      );

      const roleKey = Object.keys(row).find((k) =>
        /role|type|category/i.test(k)
      );

      const deptKey = Object.keys(row).find((k) =>
        /department|dept|faculty/i.test(k)
      );

      const classKey = Object.keys(row).find((k) =>
        /class|grade|section/i.test(k)
      );

      const phoneKey = Object.keys(row).find((k) =>
        /phone|mobile|contact/i.test(k)
      );

      const emailKey = Object.keys(row).find((k) =>
        /email|mail/i.test(k)
      );

      const full_name = String(row[nameKey] || '').trim();
      const admission_number = String(admKey ? row[admKey] : '').trim();
      const rawRole = String(roleKey ? row[roleKey] : '').toUpperCase();
      const department = String(deptKey ? row[deptKey] : '').trim();
      const class_name = String(classKey ? row[classKey] : '').trim();
      const phone = String(phoneKey ? row[phoneKey] : '').trim();
      const email = String(emailKey ? row[emailKey] : '').trim();

      let role: 'STUDENT' | 'TEACHER' | 'STAFF' | 'OTHER' = 'STUDENT';
      if (/teacher|faculty|professor/i.test(rawRole)) role = 'TEACHER';
      else if (/staff|employee|admin/i.test(rawRole)) role = 'STAFF';
      else if (/other/i.test(rawRole)) role = 'OTHER';

      let isValid = true;
      let errorReason: string | undefined = undefined;

      if (!full_name) {
        isValid = false;
        errorReason = 'Missing full name';
      }

      // Check file duplicates
      let isDuplicateInFile = false;
      if (admission_number) {
        if (seenAdmNumbers.has(admission_number.toLowerCase())) {
          isDuplicateInFile = true;
        } else {
          seenAdmNumbers.add(admission_number.toLowerCase());
        }
      } else if (full_name) {
        if (seenNames.has(full_name.toLowerCase())) {
          isDuplicateInFile = true;
        } else {
          seenNames.add(full_name.toLowerCase());
        }
      }

      rows.push({
        rowNumber,
        full_name,
        admission_number,
        role,
        department,
        class_name,
        phone,
        email,
        isValid,
        errorReason,
        isDuplicateInFile,
      });
    });

    setParsedRows(rows);
    setIsProcessing(false);
    setStep('preview');
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid && !r.isDuplicateInFile);
    if (validRows.length === 0) {
      showToast('No valid rows available to import.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await batchImportPeopleAction(
        validRows.map((r) => ({
          full_name: r.full_name,
          admission_number: r.admission_number || undefined,
          role: r.role,
          department: r.department || undefined,
          class_name: r.class_name || undefined,
          phone: r.phone || undefined,
          email: r.email || undefined,
        }))
      );

      if (res.success && res.result) {
        setImportResult(res.result);
        setStep('summary');
        router.refresh();
      } else {
        showToast(res.error || 'Failed to complete import.', 'error');
      }
    } catch {
      showToast('An unexpected error occurred during import.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid && !r.isDuplicateInFile).length;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicateInFile).length;
  const errorCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-[#FFFFFF] rounded-md border border-[#E3E5E7] shadow-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3E5E7]">
          <div>
            <h3 className="text-sm font-semibold text-[#202326]">Import People from Excel</h3>
            <p className="text-[11px] text-[#697077]">
              Step {step === 'upload' ? '1: Upload File' : step === 'preview' ? '2: Review Rows' : '3: Summary'}
            </p>
          </div>
          <button onClick={onClose} className="text-[#697077] hover:text-[#202326] p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div className="py-8 px-4 text-center border-2 border-dashed border-[#E3E5E7] rounded-md space-y-4">
              <FileSpreadsheet className="w-10 h-10 text-[#34495E] mx-auto opacity-70" />
              <div>
                <h4 className="text-xs font-semibold text-[#202326]">Upload Student or Staff List</h4>
                <p className="text-[11px] text-[#697077] mt-1">
                  Supported formats: .xlsx, .xls, .csv
                </p>
              </div>

              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#34495E] hover:bg-[#263746] text-white text-xs font-medium rounded cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Select Excel File</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-xs text-[#697077] pt-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing spreadsheet...</span>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Preview Stats Bar */}
              <div className="bg-[#F6F6F3] p-3 rounded border border-[#E3E5E7] flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="text-[#697077]">Total Rows: </span>
                  <strong className="text-[#202326]">{parsedRows.length}</strong>
                </div>
                <div>
                  <span className="text-[#697077]">Ready to Import: </span>
                  <strong className="text-[#3F7654]">{validCount}</strong>
                </div>
                {duplicateCount > 0 && (
                  <div>
                    <span className="text-[#697077]">Duplicates in File: </span>
                    <strong className="text-[#A87932]">{duplicateCount}</strong>
                  </div>
                )}
                {errorCount > 0 && (
                  <div>
                    <span className="text-[#697077]">Missing Name: </span>
                    <strong className="text-[#B5524B]">{errorCount}</strong>
                  </div>
                )}
              </div>

              {/* Table Preview */}
              <div className="border border-[#E3E5E7] rounded overflow-x-auto max-h-64">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E3E5E7] bg-[#F6F6F3] text-[11px] font-semibold text-[#697077] uppercase">
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Admission No</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Dept / Class</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E5E7]">
                    {parsedRows.map((r) => (
                      <tr key={r.rowNumber} className="hover:bg-[#F6F6F3]">
                        <td className="py-1.5 px-3 font-mono text-[#697077]">{r.rowNumber}</td>
                        <td className="py-1.5 px-3 font-medium text-[#202326]">
                          {r.full_name || <span className="italic text-[#B5524B]">Missing</span>}
                        </td>
                        <td className="py-1.5 px-3 font-mono text-[#697077]">
                          {r.admission_number || '—'}
                        </td>
                        <td className="py-1.5 px-3 text-[#697077]">{r.role}</td>
                        <td className="py-1.5 px-3 text-[#697077]">
                          {r.department || r.class_name || '—'}
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          {r.isValid && !r.isDuplicateInFile ? (
                            <span className="text-[#3F7654] font-medium inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Ready
                            </span>
                          ) : r.isDuplicateInFile ? (
                            <span className="text-[#A87932] font-medium inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Duplicate
                            </span>
                          ) : (
                            <span className="text-[#B5524B] font-medium">
                              {r.errorReason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-[#697077]">
                Existing individuals already registered in the system will be safely skipped automatically.
              </p>
            </div>
          )}

          {step === 'summary' && importResult && (
            <div className="py-6 px-4 space-y-4 text-center">
              <div className="w-10 h-10 rounded-full bg-[#F2F8F4] border border-[#D1E5D7] flex items-center justify-center mx-auto text-[#3F7654]">
                <Check className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#202326]">People Imported Successfully</h4>
                <p className="text-xs text-[#697077] mt-1">
                  <strong>{importResult.addedCount}</strong> people added to store directory.
                </p>
              </div>

              <div className="bg-[#F6F6F3] p-3 rounded border border-[#E3E5E7] inline-block text-left text-xs text-[#697077] space-y-1">
                <div>Added: <strong className="text-[#3F7654]">{importResult.addedCount}</strong></div>
                <div>Skipped (Already Existing): <strong className="text-[#697077]">{importResult.skippedCount}</strong></div>
                {importResult.errors.length > 0 && (
                  <div>Errors: <strong className="text-[#B5524B]">{importResult.errors.length}</strong></div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#E3E5E7] bg-[#F6F6F3] flex items-center justify-end gap-2">
          {step === 'upload' && (
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-[#202326] border border-[#E3E5E7] bg-[#FFFFFF] rounded"
            >
              Cancel
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                disabled={isProcessing}
                className="px-3.5 py-1.5 text-xs text-[#202326] border border-[#E3E5E7] bg-[#FFFFFF] rounded"
              >
                Choose Different File
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={isProcessing || validCount === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#34495E] hover:bg-[#263746] text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                <span>Import {validCount} People</span>
              </button>
            </>
          )}

          {step === 'summary' && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#34495E] text-white text-xs font-medium rounded"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
