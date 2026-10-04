'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Person } from '@/types/database';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { togglePersonStatusAction } from '@/lib/actions/people-actions';
import { ExcelImportModal } from '@/components/people/ExcelImportModal';
import {
  Users,
  Eye,
  PowerOff,
  Power,
  Plus,
  FilterX,
  FileSpreadsheet,
} from 'lucide-react';

interface PeopleTableProps {
  initialPeople: Person[];
  canManage: boolean;
}

export function PeopleTable({ initialPeople, canManage }: PeopleTableProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [deactivatingPerson, setDeactivatingPerson] = useState<Person | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const filteredPeople = useMemo(() => {
    return initialPeople.filter((p) => {
      const q = search.toLowerCase().trim();

      if (
        q &&
        !p.full_name.toLowerCase().includes(q) &&
        !(p.admission_number && p.admission_number.toLowerCase().includes(q)) &&
        !(p.email && p.email.toLowerCase().includes(q)) &&
        !(p.phone && p.phone.toLowerCase().includes(q)) &&
        !(p.department && p.department.toLowerCase().includes(q)) &&
        !(p.class_name && p.class_name.toLowerCase().includes(q))
      ) {
        return false;
      }

      if (selectedRole && p.role !== selectedRole) {
        return false;
      }

      if (selectedStatus === 'Active' && !p.is_active) {
        return false;
      }
      if (selectedStatus === 'Inactive' && p.is_active) {
        return false;
      }

      return true;
    });
  }, [initialPeople, search, selectedRole, selectedStatus]);

  const handleToggleStatus = async () => {
    if (!deactivatingPerson) return;
    setIsDeactivating(true);

    try {
      const res = await togglePersonStatusAction(deactivatingPerson.id);
      if (res.success) {
        showToast(
          `${deactivatingPerson.full_name} was ${
            deactivatingPerson.is_active ? 'deactivated' : 'activated'
          } successfully.`,
          'success'
        );
        router.refresh();
      } else {
        showToast(res.error || 'Failed to update person status.', 'error');
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsDeactivating(false);
      setDeactivatingPerson(null);
    }
  };

  const hasFilters = Boolean(search || selectedRole || selectedStatus);

  const resetFilters = () => {
    setSearch('');
    setSelectedRole('');
    setSelectedStatus('');
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Search and Filters Bar */}
      <div className="bg-[#FFFFFF] p-3.5 rounded-md border border-[#E3E5E7] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search people..."
              id="people-search"
            />
          </div>

          <div className="flex items-center gap-2">
            <FilterDropdown
              label="Role"
              value={selectedRole}
              onChange={setSelectedRole}
              options={[
                { label: 'Student', value: 'STUDENT' },
                { label: 'Faculty / Teacher', value: 'TEACHER' },
                { label: 'Staff', value: 'STAFF' },
              ]}
              id="people-role-filter"
            />

            <FilterDropdown
              label="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
              id="people-status-filter"
            />

            {canManage && (
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#202326] bg-[#FFFFFF] border border-[#E3E5E7] hover:bg-[#F1F3F2] rounded transition-colors shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#34495E]" />
                <span>Import from Excel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count Meta */}
      <div className="flex items-center justify-between text-xs text-[#697077] px-1">
        <span>
          Showing <strong className="text-[#202326]">{filteredPeople.length}</strong> of{' '}
          <strong className="text-[#202326]">{initialPeople.length}</strong> registered persons
        </span>
      </div>

      {/* Table & Cards */}
      {filteredPeople.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No matching people found' : 'No borrowers added yet.'}
          description={
            hasFilters
              ? 'Try modifying your search query or reset active filters.'
              : 'Register your first student or staff member.'
          }
          action={
            hasFilters ? (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 bg-[#FFFFFF] text-[#202326] text-xs font-medium rounded border border-[#E3E5E7]"
              >
                Clear all filters
              </button>
            ) : canManage ? (
              <Link
                href="/people/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#34495E] text-white text-xs font-medium rounded"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Person</span>
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block bg-[#FFFFFF] rounded-md border border-[#E3E5E7] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E3E5E7] bg-[#F6F6F3] text-[11px] font-semibold text-[#697077] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">ID / Adm No</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Department / Class</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E5E7]">
                {filteredPeople.map((person) => (
                  <tr
                    key={person.id}
                    className={`hover:bg-[#F6F6F3] transition-colors ${
                      !person.is_active ? 'opacity-60 bg-[#F1F3F2]' : ''
                    }`}
                  >
                    {/* Name */}
                    <td className="py-3 px-4 font-semibold text-[#202326]">
                      <Link
                        href={`/people/${person.id}`}
                        className="hover:text-[#34495E] block"
                      >
                        {person.full_name}
                      </Link>
                      {person.email && (
                        <span className="font-normal text-[11px] text-[#697077] block mt-0.5">
                          {person.email}
                        </span>
                      )}
                    </td>

                    {/* Admission No */}
                    <td className="py-3 px-4 font-mono text-[#202326]">
                      {person.admission_number || '—'}
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4 text-[#697077]">
                      {person.role}
                    </td>

                    {/* Department / Class */}
                    <td className="py-3 px-4 text-[#202326]">
                      {person.department || person.class_name || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={person.is_active ? 'Active' : 'Inactive'}
                        size="sm"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/people/${person.id}`}
                          className="p-1 text-[#697077] hover:text-[#202326] hover:bg-[#EEF0F1] rounded"
                          title="View record"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setDeactivatingPerson(person)}
                            className="p-1 text-[#697077] hover:text-[#B5524B] hover:bg-[#FDF3F3] rounded"
                            title={person.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {person.is_active ? (
                              <PowerOff className="w-3.5 h-3.5" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="md:hidden space-y-2.5">
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                className="bg-[#FFFFFF] p-3.5 rounded-md border border-[#E3E5E7] space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/people/${person.id}`}
                      className="font-semibold text-xs text-[#202326] block"
                    >
                      {person.full_name}
                    </Link>
                    <span className="font-mono text-[11px] text-[#697077]">
                      {person.admission_number || person.role}
                    </span>
                  </div>
                  <StatusBadge status={person.is_active ? 'Active' : 'Inactive'} size="sm" />
                </div>

                <div className="pt-2 border-t border-[#E3E5E7] flex items-center justify-between text-[#697077]">
                  <span>{person.department || person.email || '—'}</span>
                  <Link
                    href={`/people/${person.id}`}
                    className="px-2.5 py-1 text-xs border border-[#E3E5E7] rounded text-[#202326] hover:bg-[#F1F3F2]"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deactivatingPerson)}
        onClose={() => setDeactivatingPerson(null)}
        onConfirm={handleToggleStatus}
        isLoading={isDeactivating}
        variant={deactivatingPerson?.is_active ? 'danger' : 'primary'}
        title={
          deactivatingPerson?.is_active
            ? `Deactivate ${deactivatingPerson?.full_name}?`
            : `Reactivate ${deactivatingPerson?.full_name}?`
        }
        description={
          deactivatingPerson?.is_active
            ? `Deactivating "${deactivatingPerson?.full_name}" will mark them inactive in store records.`
            : `Reactivating "${deactivatingPerson?.full_name}" will restore eligibility.`
        }
        confirmLabel={deactivatingPerson?.is_active ? 'Deactivate Person' : 'Activate Person'}
      />

      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
}
