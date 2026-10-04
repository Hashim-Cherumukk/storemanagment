'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import imageCompression from 'browser-image-compression';
import { itemSchema, ItemFormValues } from '@/lib/validations';
import { Category, Item } from '@/types/database';
import { createItemAction, updateItemAction } from '@/lib/actions/inventory-actions';
import { useToast } from '@/components/ui/Toast';
import {
  AlertCircle,
  Save,
  ArrowLeft,
  Upload,
  X,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';

interface ItemFormProps {
  categories: Category[];
  initialData?: Item | null;
  isEdit?: boolean;
}

export function ItemForm({
  categories,
  initialData,
  isEdit = false,
}: ItemFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  // Image Upload & Compression state
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
  const [isCompressing, setIsCompressing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: initialData?.name || '',
      item_code: initialData?.item_code || '',
      category_id: initialData?.category_id || (categories[0]?.id || ''),
      description: initialData?.description || '',
      tracking_type: initialData?.tracking_type || 'ASSET',
      unit: initialData?.unit || 'piece',
      total_quantity: initialData?.total_quantity ?? 1,
      minimum_quantity: initialData?.minimum_quantity ?? 1,
      location: initialData?.location || 'Main Store',
      condition: initialData?.condition || 'GOOD',
      image_url: initialData?.image_url || '',
      is_active: initialData?.is_active ?? true,
    },
  });

  const selectedTrackingType = watch('tracking_type');

  // Automatic Client-Side Image Compression & Preview
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 0.5, // Target max compressed size: ~500 KB
        maxWidthOrHeight: 1200, // Max dimension: 1200px
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // Convert to Data URL for instant storage preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setImagePreview(resultStr);
        setValue('image_url', resultStr);
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      showToast('Failed to compress image file.', 'error');
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setValue('image_url', '');
  };

  const onSubmit = async (values: ItemFormValues) => {
    setServerError(null);

    // Keep location default if not supplied
    if (!values.location) {
      values.location = 'Main Store';
    }

    try {
      if (isEdit && initialData) {
        const res = await updateItemAction(initialData.id, values);
        if (res.success) {
          showToast(`Item "${values.name}" updated successfully.`, 'success');
          router.push(`/inventory/${initialData.id}`);
          router.refresh();
        } else {
          setServerError(res.error || 'Failed to update item.');
          showToast(res.error || 'Failed to update item.', 'error');
        }
      } else {
        const res = await createItemAction(values);
        if (res.success && res.itemId) {
          showToast(`Item "${values.name}" created successfully.`, 'success');
          router.push(`/inventory/${res.itemId}`);
          router.refresh();
        } else {
          setServerError(res.error || 'Failed to create item.');
          showToast(res.error || 'Failed to create item.', 'error');
        }
      }
    } catch {
      setServerError('An unexpected network or server error occurred.');
      showToast('An unexpected error occurred.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {/* Top back navigation */}
      <div>
        <Link
          href={isEdit && initialData ? `/inventory/${initialData.id}` : '/inventory'}
          className="inline-flex items-center gap-1 text-xs text-[#697077] hover:text-[#202326]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {isEdit ? 'Item Details' : 'Inventory'}</span>
        </Link>
      </div>

      {serverError && (
        <div className="p-3 rounded bg-[#FDF3F3] border border-[#F5D3D1] text-[#B5524B] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Item Details Card */}
      <div className="bg-[#FFFFFF] p-5 rounded-md border border-[#E3E5E7] space-y-4">
        <div className="border-b border-[#E3E5E7] pb-3">
          <h2 className="text-sm font-semibold text-[#202326]">Item Details</h2>
          <p className="text-xs text-[#697077]">
            Core item information, item code, category, and photo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-xs text-[#697077] mb-1">
              Item Name <span className="text-[#B5524B]">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="e.g. Epson Projector, Football, Air Blower"
              className="w-full px-3 py-1.5 bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden"
            />
            {errors.name && <p className="text-xs text-[#B5524B] mt-0.5">{errors.name.message}</p>}
          </div>

          {/* Item Code */}
          <div>
            <label htmlFor="item_code" className="block text-xs text-[#697077] mb-1">
              Item Code / Tag <span className="text-[#B5524B]">*</span>
            </label>
            <input
              id="item_code"
              type="text"
              {...register('item_code')}
              placeholder="e.g. ELEC-PRJ-001"
              className="w-full font-mono uppercase px-3 py-1.5 bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden"
            />
            {errors.item_code && <p className="text-xs text-[#B5524B] mt-0.5">{errors.item_code.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category_id" className="block text-xs text-[#697077] mb-1">
              Category <span className="text-[#B5524B]">*</span>
            </label>
            <select
              id="category_id"
              {...register('category_id')}
              className="w-full px-3 py-1.5 bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden cursor-pointer"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-[#B5524B] mt-0.5">{errors.category_id.message}</p>}
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-xs text-[#697077] mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={2}
              {...register('description')}
              placeholder="Item specification or accessories included..."
              className="w-full px-3 py-1.5 bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden"
            />
          </div>

          {/* Item Image Upload with Automatic Compression (Section 16 & 17) */}
          <div className="sm:col-span-2 pt-2 border-t border-[#E3E5E7]">
            <label className="block text-xs text-[#697077] mb-1.5">
              Item Image (Automatic Optimization)
            </label>

            {imagePreview ? (
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded border border-[#E3E5E7] overflow-hidden bg-[#F6F6F3] flex items-center justify-center shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#B5524B] border border-[#F5D3D1] bg-[#FDF3F3] rounded hover:bg-[#FBE8E8]"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                  <p className="text-[11px] text-[#697077]">
                    Image compressed automatically for fast storekeeper loading.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#E3E5E7] hover:bg-[#F1F3F2] text-[#202326] text-xs font-medium rounded cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#34495E]" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                {isCompressing && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#697077]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Optimizing...
                  </span>
                )}
                {!isCompressing && (
                  <span className="text-[11px] text-[#697077]">JPG, PNG, or WEBP supported</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Quantities & Condition */}
      <div className="bg-[#FFFFFF] p-5 rounded-md border border-[#E3E5E7] space-y-4">
        <div className="border-b border-[#E3E5E7] pb-3">
          <h2 className="text-sm font-semibold text-[#202326]">Stock & Condition</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Unit */}
          <div>
            <label htmlFor="unit" className="block text-xs text-[#697077] mb-1">
              Unit <span className="text-[#B5524B]">*</span>
            </label>
            <select
              id="unit"
              {...register('unit')}
              className="w-full px-3 py-1.5 bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden cursor-pointer"
            >
              <option value="piece">piece</option>
              <option value="set">set</option>
              <option value="pair">pair</option>
              <option value="box">box</option>
              <option value="bottle">bottle</option>
              <option value="litre">litre</option>
              <option value="kg">kg</option>
              <option value="pack">pack</option>
            </select>
          </div>

          {/* Unit Price */}
          <div>
            <label htmlFor="unit_price" className="block text-xs text-[#697077] mb-1">
              Unit Price (₹ / Price)
            </label>
            <input
              id="unit_price"
              type="number"
              step="0.01"
              min="0"
              {...register('unit_price')}
              placeholder="e.g. 150.00"
              className="w-full px-3 py-1.5 bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden"
            />
            {errors.unit_price && <p className="text-xs text-[#B5524B] mt-0.5">{errors.unit_price.message}</p>}
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="total_quantity" className="block text-xs text-[#697077] mb-1">
              Total Quantity <span className="text-[#B5524B]">*</span>
            </label>
            <input
              id="total_quantity"
              type="number"
              min="0"
              {...register('total_quantity')}
              className="w-full px-3 py-1.5 tabular-nums bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden"
            />
          </div>

          {/* Minimum */}
          <div>
            <label htmlFor="minimum_quantity" className="block text-xs text-[#697077] mb-1">
              Minimum Threshold <span className="text-[#B5524B]">*</span>
            </label>
            <input
              id="minimum_quantity"
              type="number"
              min="0"
              {...register('minimum_quantity')}
              className="w-full px-3 py-1.5 tabular-nums bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden"
            />
          </div>

          {/* Condition */}
          <div>
            <label htmlFor="condition" className="block text-xs text-[#697077] mb-1">
              Condition <span className="text-[#B5524B]">*</span>
            </label>
            <select
              id="condition"
              {...register('condition')}
              className="w-full px-3 py-1.5 bg-[#FFFFFF] text-[#202326] text-xs rounded border border-[#E3E5E7] focus:border-[#34495E] outline-hidden cursor-pointer"
            >
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="DAMAGED">Damaged</option>
              <option value="MAINTENANCE">Needs Repair</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Link
          href={isEdit && initialData ? `/inventory/${initialData.id}` : '/inventory'}
          className="px-3.5 py-1.5 text-xs text-[#202326] bg-[#FFFFFF] border border-[#E3E5E7] rounded hover:bg-[#F1F3F2]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || isCompressing}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#34495E] hover:bg-[#263746] text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isEdit ? 'Save Changes' : 'Save Item'}</span>
        </button>
      </div>
    </form>
  );
}
