'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category } from '@/types/database';
import {
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryStatusAction,
} from '@/lib/actions/category-actions';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { useToast } from '@/components/ui/Toast';
import {
  Plus,
  Edit2,
  PowerOff,
  Power,
  FolderTree,
  X,
  Save,
} from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  canManage: boolean;
}

export function CategoryManager({ categories, canManage }: CategoryManagerProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deactivation confirmation
  const [deactivatingCategory, setDeactivatingCategory] = useState<Category | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const filteredCategories = categories.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
  });

  const openCreateModal = () => {
    setModalMode('create');
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormError(null);
  };

  const openEditModal = (cat: Category) => {
    setModalMode('edit');
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingCategory(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'create') {
        const res = await createCategoryAction({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          color: '#34495E',
          icon: 'box',
          is_active: true,
        });

        if (res.success) {
          showToast(`Category "${formName}" created successfully.`, 'success');
          closeModal();
          router.refresh();
        } else {
          setFormError(res.error || 'Failed to create category.');
        }
      } else if (modalMode === 'edit' && editingCategory) {
        const res = await updateCategoryAction(editingCategory.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        });

        if (res.success) {
          showToast(`Category "${formName}" updated successfully.`, 'success');
          closeModal();
          router.refresh();
        } else {
          setFormError(res.error || 'Failed to update category.');
        }
      }
    } catch {
      setFormError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!deactivatingCategory) return;
    setIsDeactivating(true);
    try {
      const res = await toggleCategoryStatusAction(deactivatingCategory.id);
      if (res.success) {
        showToast(
          `Category "${deactivatingCategory.name}" was ${
            deactivatingCategory.is_active ? 'deactivated' : 'activated'
          } successfully.`,
          'success'
        );
        router.refresh();
      } else {
        showToast(res.error || 'Failed to update category status.', 'error');
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsDeactivating(false);
      setDeactivatingCategory(null);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFFFF] p-3.5 rounded-md border border-[#E3E5E7]">
        <div className="w-full sm:max-w-xs">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search categories..."
            id="category-search"
          />
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#34495E] hover:bg-[#263746] text-white text-xs font-medium rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {/* Simple Category List / Table (Section 17 specification) */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories found"
          description={
            search
              ? 'No categories match your search.'
              : 'Add your first category to classify store items.'
          }
        />
      ) : (
        <div className="bg-[#FFFFFF] rounded-md border border-[#E3E5E7] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3E5E7] bg-[#F6F6F3] text-[11px] font-semibold text-[#697077] uppercase tracking-wider">
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Number of items</th>
                <th className="py-2.5 px-4">Status</th>
                {canManage && <th className="py-2.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E5E7] text-xs">
              {filteredCategories.map((cat) => (
                <tr
                  key={cat.id}
                  className={`hover:bg-[#F6F6F3] transition-colors ${
                    !cat.is_active ? 'opacity-60 bg-[#F1F3F2]' : ''
                  }`}
                >
                  {/* Category Name & Filter Link */}
                  <td className="py-3 px-4 font-semibold text-[#202326]">
                    <Link
                      href={`/inventory?category_id=${cat.id}`}
                      className="hover:text-[#34495E] transition-colors"
                    >
                      {cat.name}
                    </Link>
                    {cat.description && (
                      <span className="block text-[11px] font-normal text-[#697077] mt-0.5">
                        {cat.description}
                      </span>
                    )}
                  </td>

                  {/* Number of Items */}
                  <td className="py-3 px-4 text-[#202326] tabular-nums">
                    <Link
                      href={`/inventory?category_id=${cat.id}`}
                      className="hover:underline text-[#697077]"
                    >
                      <strong className="text-[#202326] font-semibold">{cat.item_count ?? 0}</strong> items
                    </Link>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge
                      status={cat.is_active ? 'Active' : 'Inactive'}
                      size="sm"
                    />
                  </td>

                  {/* Actions */}
                  {canManage && (
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1 text-[#697077] hover:text-[#202326] hover:bg-[#EEF0F1] rounded"
                          title="Edit category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeactivatingCategory(cat)}
                          className="p-1 text-[#697077] hover:text-[#B5524B] hover:bg-[#FDF3F3] rounded"
                          title={cat.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {cat.is_active ? (
                            <PowerOff className="w-3.5 h-3.5" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add / Edit Category */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-md border border-[#E3E5E7] shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3E5E7]">
              <h3 className="text-sm font-semibold text-[#202326]">
                {modalMode === 'create' ? 'Add Category' : `Edit: ${editingCategory?.name}`}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-[#697077] hover:text-[#202326] p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {formError && (
                <div className="p-2.5 rounded bg-[#FDF3F3] border border-[#F5D3D1] text-[#B5524B] text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="cat-name"
                  className="block text-xs text-[#697077] mb-1"
                >
                  Category Name <span className="text-[#B5524B]">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sports Equipment, Electronics"
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="cat-desc"
                  className="block text-xs text-[#697077] mb-1"
                >
                  Description
                </label>
                <textarea
                  id="cat-desc"
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Category description..."
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E3E5E7]">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs text-[#202326] hover:bg-[#F1F3F2] rounded border border-[#E3E5E7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#34495E] hover:bg-[#263746] text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{modalMode === 'create' ? 'Create Category' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deactivatingCategory)}
        onClose={() => setDeactivatingCategory(null)}
        onConfirm={handleToggleStatus}
        isLoading={isDeactivating}
        variant={deactivatingCategory?.is_active ? 'danger' : 'primary'}
        title={
          deactivatingCategory?.is_active
            ? `Deactivate category "${deactivatingCategory?.name}"?`
            : `Reactivate category "${deactivatingCategory?.name}"?`
        }
        description={
          deactivatingCategory?.is_active
            ? `Deactivating this category will keep existing items linked (${deactivatingCategory?.item_count ?? 0} items currently assigned) while preventing selection for new items.`
            : `Reactivating this category will make it available for all store operations.`
        }
        confirmLabel={deactivatingCategory?.is_active ? 'Deactivate Category' : 'Activate Category'}
      />
    </div>
  );
}
