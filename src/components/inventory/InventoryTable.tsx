'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Item,
  Category,
  getItemDisplayStatus,
} from '@/types/database';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { toggleItemStatusAction } from '@/lib/actions/inventory-actions';
import {
  Eye,
  Edit2,
  PowerOff,
  Power,
  PackageOpen,
  MapPin,
  ArrowUpDown,
  FilterX,
  Plus,
} from 'lucide-react';

interface InventoryTableProps {
  initialItems: Item[];
  categories: Category[];
  canManage: boolean;
  initialCategoryId?: string;
}

export function InventoryTable({
  initialItems,
  categories,
  canManage,
  initialCategoryId = '',
}: InventoryTableProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');

  // Item deactivation modal state
  const [deactivatingItem, setDeactivatingItem] = useState<Item | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'code' | 'quantity'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (field: 'name' | 'code' | 'quantity') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredItems = useMemo(() => {
    return initialItems
      .filter((item) => {
        const q = search.toLowerCase().trim();
        const status = getItemDisplayStatus(item);

        if (
          q &&
          !item.name.toLowerCase().includes(q) &&
          !item.item_code.toLowerCase().includes(q) &&
          !item.location.toLowerCase().includes(q) &&
          !(item.category?.name && item.category.name.toLowerCase().includes(q))
        ) {
          return false;
        }

        if (selectedCategory && item.category_id !== selectedCategory) {
          return false;
        }

        if (selectedAvailability && status !== selectedAvailability) {
          return false;
        }

        if (selectedCondition && item.condition !== selectedCondition) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === 'code') {
          comparison = a.item_code.localeCompare(b.item_code);
        } else if (sortField === 'quantity') {
          comparison = a.available_quantity - b.available_quantity;
        }
        return sortAsc ? comparison : -comparison;
      });
  }, [
    initialItems,
    search,
    selectedCategory,
    selectedAvailability,
    selectedCondition,
    sortField,
    sortAsc,
  ]);

  const handleToggleStatus = async () => {
    if (!deactivatingItem) return;
    setIsDeactivating(true);
    try {
      const res = await toggleItemStatusAction(deactivatingItem.id);
      if (res.success) {
        showToast(
          `Item ${deactivatingItem.item_code} was ${
            deactivatingItem.is_active ? 'deactivated' : 'activated'
          } successfully.`,
          'success'
        );
        router.refresh();
      } else {
        showToast(res.error || 'Failed to update item status', 'error');
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsDeactivating(false);
      setDeactivatingItem(null);
    }
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedAvailability || selectedCondition);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedAvailability('');
    setSelectedCondition('');
  };

  return (
    <div className="space-y-4">
      {/* Clean Institutional Filters Bar */}
      <div className="bg-[#FFFFFF] p-3.5 rounded-md border border-[#E3E5E7] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search items..."
              id="inventory-search"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-[#697077] hover:text-[#202326] rounded border border-[#E3E5E7] hover:bg-[#F1F3F2] transition-colors"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Simple Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <FilterDropdown
            label="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
            id="filter-category"
          />

          <FilterDropdown
            label="Availability"
            value={selectedAvailability}
            onChange={setSelectedAvailability}
            options={[
              { label: 'Available', value: 'Available' },
              { label: 'Low Stock', value: 'Low Stock' },
              { label: 'Out of Stock', value: 'Out of Stock' },
            ]}
            id="filter-availability"
          />

          <FilterDropdown
            label="Condition"
            value={selectedCondition}
            onChange={setSelectedCondition}
            options={[
              { label: 'Good', value: 'GOOD' },
              { label: 'Fair', value: 'FAIR' },
              { label: 'Damaged', value: 'DAMAGED' },
              { label: 'Needs Repair', value: 'MAINTENANCE' },
            ]}
            id="filter-condition"
          />
        </div>
      </div>

      {/* Results Count Meta */}
      <div className="flex items-center justify-between text-xs text-[#697077] px-1">
        <span>
          Showing <strong className="text-[#202326]">{filteredItems.length}</strong> of{' '}
          <strong className="text-[#202326]">{initialItems.length}</strong> items in store
        </span>
      </div>

      {/* Inventory Table */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={hasActiveFilters ? 'No matching items found' : 'No items in store'}
          description={
            hasActiveFilters
              ? 'Try modifying your search or resetting filters.'
              : 'Add your first item to store inventory.'
          }
          action={
            hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="px-3.5 py-1.5 bg-[#FFFFFF] text-[#202326] hover:bg-[#F1F3F2] text-xs font-medium rounded border border-[#E3E5E7] transition-colors"
              >
                Clear filters
              </button>
            ) : canManage ? (
              <Link
                href="/inventory/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#34495E] hover:bg-[#263746] text-white text-xs font-medium rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block bg-[#FFFFFF] rounded-md border border-[#E3E5E7] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3E5E7] bg-[#F6F6F3] text-[11px] font-semibold text-[#697077] uppercase tracking-wider">
                  <th className="py-2.5 px-4">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 hover:text-[#202326] transition-colors"
                    >
                      <span>Item</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">
                    <button
                      onClick={() => toggleSort('quantity')}
                      className="flex items-center gap-1 hover:text-[#202326] transition-colors"
                    >
                      <span>Available</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-4">Unit Price</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E5E7] text-xs">
                {filteredItems.map((item) => {
                  const status = getItemDisplayStatus(item);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#F6F6F3] transition-colors ${
                        !item.is_active ? 'opacity-60 bg-[#F1F3F2]' : ''
                      }`}
                    >
                      {/* Item Name & Code */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/inventory/${item.id}`}
                          className="font-semibold text-[#202326] hover:text-[#34495E] block"
                        >
                          {item.name}
                        </Link>
                        <span className="text-[11px] font-mono text-[#697077]">
                          {item.item_code}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-[#697077]">
                        {item.category?.name || 'Uncategorized'}
                      </td>

                      {/* Available (e.g. 3 of 5) */}
                      <td className="py-3 px-4 tabular-nums text-[#202326]">
                        <span className="font-semibold">{item.available_quantity}</span> of{' '}
                        {item.total_quantity} {item.unit}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-4 tabular-nums font-mono text-[#202326]">
                        {item.unit_price ? `₹${item.unit_price.toLocaleString('en-IN')}` : '—'}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <StatusBadge status={status} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/inventory/${item.id}`}
                            className="p-1 text-[#697077] hover:text-[#202326] hover:bg-[#EEF0F1] rounded"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {canManage && (
                            <>
                              <Link
                                href={`/inventory/${item.id}/edit`}
                                className="p-1 text-[#697077] hover:text-[#202326] hover:bg-[#EEF0F1] rounded"
                                title="Edit item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                onClick={() => setDeactivatingItem(item)}
                                className="p-1 text-[#697077] hover:text-[#B5524B] hover:bg-[#FDF3F3] rounded"
                                title={item.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {item.is_active ? (
                                  <PowerOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Power className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View (< 768px) */}
          <div className="md:hidden space-y-2.5">
            {filteredItems.map((item) => {
              const status = getItemDisplayStatus(item);

              return (
                <div
                  key={item.id}
                  className="bg-[#FFFFFF] p-3.5 rounded-md border border-[#E3E5E7] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/inventory/${item.id}`}
                        className="font-semibold text-xs text-[#202326] block"
                      >
                        {item.name}
                      </Link>
                      <span className="font-mono text-[11px] text-[#697077]">
                        {item.item_code}
                      </span>
                    </div>
                    <StatusBadge status={status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#697077] pt-2 border-t border-[#E3E5E7]">
                    <span>{item.category?.name}</span>
                    <span className="text-[#202326]">
                      <strong>{item.available_quantity}</strong> of {item.total_quantity} {item.unit}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E3E5E7] flex items-center justify-end gap-2">
                    <Link
                      href={`/inventory/${item.id}`}
                      className="px-2.5 py-1 text-xs border border-[#E3E5E7] rounded text-[#202326] hover:bg-[#F1F3F2]"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Confirmation Dialog for Item Status */}
      <ConfirmDialog
        isOpen={Boolean(deactivatingItem)}
        onClose={() => setDeactivatingItem(null)}
        onConfirm={handleToggleStatus}
        isLoading={isDeactivating}
        variant={deactivatingItem?.is_active ? 'danger' : 'primary'}
        title={
          deactivatingItem?.is_active
            ? `Deactivate ${deactivatingItem?.item_code}?`
            : `Reactivate ${deactivatingItem?.item_code}?`
        }
        description={
          deactivatingItem?.is_active
            ? `Deactivating "${deactivatingItem?.name}" will mark it inactive in store records.`
            : `Reactivating "${deactivatingItem?.name}" will return it to active store inventory status.`
        }
        confirmLabel={deactivatingItem?.is_active ? 'Deactivate Item' : 'Activate Item'}
      />
    </div>
  );
}
