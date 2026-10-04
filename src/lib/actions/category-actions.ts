'use server';

import { revalidatePath } from 'next/cache';
import {
  createCategory,
  updateCategory,
  toggleCategoryStatus,
} from '@/lib/services/repository';
import { categorySchema, CategoryFormValues } from '@/lib/validations';
import { getCurrentUser } from './auth-actions';
import { canManageCategories } from '@/lib/auth/permissions';

export async function createCategoryAction(
  values: CategoryFormValues
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canManageCategories(user.role)) {
    return { success: false, error: 'Unauthorized: only Administrators and Storekeepers can add categories.' };
  }

  const validated = categorySchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.issues.map((i) => i.message).join(', ') };
  }

  try {
    await createCategory(validated.data);
    revalidatePath('/categories');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create category.';
    return { success: false, error: message };
  }
}

export async function updateCategoryAction(
  id: string,
  values: Partial<CategoryFormValues>
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canManageCategories(user.role)) {
    return { success: false, error: 'Unauthorized: insufficient institutional permissions.' };
  }

  try {
    await updateCategory(id, values);
    revalidatePath('/categories');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update category.';
    return { success: false, error: message };
  }
}

export async function toggleCategoryStatusAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canManageCategories(user.role)) {
    return { success: false, error: 'Unauthorized: insufficient institutional permissions.' };
  }

  try {
    await toggleCategoryStatus(id);
    revalidatePath('/categories');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle category status.';
    return { success: false, error: message };
  }
}
