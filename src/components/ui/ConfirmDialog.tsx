'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const confirmBtnStyles =
    variant === 'danger'
      ? 'bg-danger hover:bg-[#A33C3A] text-white'
      : variant === 'warning'
      ? 'bg-warning hover:bg-[#B07B2D] text-white'
      : 'bg-primary hover:bg-primary-hover text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[1px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-surface rounded-xl border border-border-subtle shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-2.5 rounded-full shrink-0 ${
                variant === 'danger'
                  ? 'bg-danger-bg text-danger'
                  : 'bg-warning-bg text-warning'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <h3
                id="confirm-dialog-title"
                className="text-base font-semibold text-text-main leading-6"
              >
                {title}
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                {description}
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-text-muted hover:text-text-main p-1 rounded-md transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-text-main hover:bg-warm-bg rounded-lg border border-border-subtle transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 ${confirmBtnStyles}`}
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
