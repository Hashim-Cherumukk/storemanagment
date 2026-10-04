'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Person } from '@/types/database';
import { togglePersonStatusAction } from '@/lib/actions/people-actions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { PowerOff, Power } from 'lucide-react';

interface PersonDetailActionsProps {
  person: Person;
  canManage: boolean;
}

export function PersonDetailActions({ person, canManage }: PersonDetailActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!canManage) return null;

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const res = await togglePersonStatusAction(person.id);
      if (res.success) {
        showToast(
          `${person.full_name} was ${person.is_active ? 'deactivated' : 'activated'} successfully.`,
          'success'
        );
        router.refresh();
      } else {
        showToast(res.error || 'Failed to update person status.', 'error');
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
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors shadow-xs ${
          person.is_active
            ? 'bg-surface hover:bg-danger-bg text-danger border-border-subtle hover:border-[#F0C4C3]'
            : 'bg-surface hover:bg-success-bg text-success border-border-subtle hover:border-[#C6E2D1]'
        }`}
      >
        {person.is_active ? (
          <>
            <PowerOff className="w-4 h-4" />
            <span>Deactivate Person</span>
          </>
        ) : (
          <>
            <Power className="w-4 h-4" />
            <span>Reactivate Person</span>
          </>
        )}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleToggle}
        isLoading={isLoading}
        variant={person.is_active ? 'danger' : 'primary'}
        title={person.is_active ? `Deactivate ${person.full_name}?` : `Reactivate ${person.full_name}?`}
        description={
          person.is_active
            ? `Deactivating "${person.full_name}" will prevent this borrower from checking out equipment in Phase 2.`
            : `Reactivating "${person.full_name}" will restore their borrower eligibility.`
        }
        confirmLabel={person.is_active ? 'Deactivate Person' : 'Activate Person'}
      />
    </>
  );
}
