'use server';

import { revalidatePath } from 'next/cache';
import { createStockAdjustment } from '@/lib/services/repository';
import { StockAdjustmentReason } from '@/types/database';
import { getCurrentUser } from './auth-actions';
import { canManageInventory } from '@/lib/auth/permissions';

export async function createStockAdjustmentAction(data: {
  itemId: string;
  quantityChange: number;
  reason: StockAdjustmentReason;
  notes?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canManageInventory(user.role)) {
    return { success: false, error: 'Unauthorized: only storekeepers and admins can adjust stock.' };
  }

  if (!data.itemId) {
    return { success: false, error: 'Item ID is required.' };
  }

  if (data.quantityChange === 0) {
    return { success: false, error: 'Adjustment quantity cannot be zero.' };
  }

  if (!data.reason) {
    return { success: false, error: 'Please select a reason for this stock adjustment.' };
  }

  try {
    await createStockAdjustment({
      item_id: data.itemId,
      quantity_change: data.quantityChange,
      reason: data.reason,
      notes: data.notes || null,
      performed_by: user.full_name || 'Storekeeper',
    });

    revalidatePath('/inventory');
    revalidatePath(`/inventory/${data.itemId}`);
    revalidatePath('/dashboard');
    revalidatePath('/reports');
    revalidatePath('/audit');

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save stock adjustment.';
    return { success: false, error: message };
  }
}
