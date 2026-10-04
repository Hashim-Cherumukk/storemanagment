'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createItem,
  updateItem,
  toggleItemStatus,
  checkItemCodeExists,
} from '@/lib/services/repository';
import { itemSchema, ItemFormValues } from '@/lib/validations';
import { getCurrentUser } from './auth-actions';
import { canManageInventory } from '@/lib/auth/permissions';

export interface ActionResponse {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createItemAction(
  values: ItemFormValues
): Promise<{ success: boolean; error?: string; itemId?: string }> {
  const user = await getCurrentUser();
  if (!user || !canManageInventory(user.role)) {
    return { success: false, error: 'Unauthorized: insufficient institutional permissions.' };
  }

  const validated = itemSchema.safeParse(values);
  if (!validated.success) {
    const errorMsg = validated.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  const codeExists = await checkItemCodeExists(validated.data.item_code);
  if (codeExists) {
    return {
      success: false,
      error: `An item with item code "${validated.data.item_code}" already exists in the store.`,
    };
  }

  try {
    const created = await createItem({
      name: validated.data.name,
      item_code: validated.data.item_code,
      category_id: validated.data.category_id,
      description: validated.data.description || null,
      tracking_type: validated.data.tracking_type,
      unit: validated.data.unit,
      total_quantity: validated.data.total_quantity,
      minimum_quantity: validated.data.minimum_quantity,
      location: validated.data.location,
      condition: validated.data.condition,
      image_url: validated.data.image_url || null,
      is_active: validated.data.is_active,
    });

    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true, itemId: created.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save inventory item.';
    return { success: false, error: message };
  }
}

export async function updateItemAction(
  id: string,
  values: Partial<ItemFormValues>
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canManageInventory(user.role)) {
    return { success: false, error: 'Unauthorized: insufficient institutional permissions.' };
  }

  try {
    if (values.item_code) {
      const codeExists = await checkItemCodeExists(values.item_code, id);
      if (codeExists) {
        return {
          success: false,
          error: `Item code "${values.item_code}" is already in use by another item.`,
        };
      }
    }

    await updateItem(id, {
      ...(values.name ? { name: values.name } : {}),
      ...(values.item_code ? { item_code: values.item_code } : {}),
      ...(values.category_id ? { category_id: values.category_id } : {}),
      ...(values.description !== undefined ? { description: values.description || null } : {}),
      ...(values.tracking_type ? { tracking_type: values.tracking_type } : {}),
      ...(values.unit ? { unit: values.unit } : {}),
      ...(values.total_quantity !== undefined ? { total_quantity: values.total_quantity } : {}),
      ...(values.minimum_quantity !== undefined
        ? { minimum_quantity: values.minimum_quantity }
        : {}),
      ...(values.location ? { location: values.location } : {}),
      ...(values.condition ? { condition: values.condition } : {}),
      ...(values.image_url !== undefined ? { image_url: values.image_url || null } : {}),
      ...(values.is_active !== undefined ? { is_active: values.is_active } : {}),
    });

    revalidatePath('/inventory');
    revalidatePath(`/inventory/${id}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update item.';
    return { success: false, error: message };
  }
}

export async function toggleItemStatusAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canManageInventory(user.role)) {
    return { success: false, error: 'Unauthorized: insufficient institutional permissions.' };
  }

  try {
    await toggleItemStatus(id);
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${id}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle item status.';
    return { success: false, error: message };
  }
}
