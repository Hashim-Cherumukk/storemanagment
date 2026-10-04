'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createReturn, CreateReturnData } from '@/lib/services/repository';
import { getCurrentUser } from './auth-actions';

export async function createReturnAction(data: CreateReturnData): Promise<{
  success: boolean;
  error?: string;
  returnId?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to record returns.' };
  }

  if (data.items.length === 0) {
    return { success: false, error: 'Please select at least one item to return.' };
  }

  try {
    const ret = await createReturn({
      ...data,
      received_by: user.id,
    });

    revalidatePath('/returns');
    revalidatePath('/issues');
    revalidatePath('/dashboard');
    revalidatePath('/inventory');
    revalidatePath('/audit');

    return { success: true, returnId: ret.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record return.';
    return { success: false, error: message };
  }
}

export async function createReturnAndRedirect(data: CreateReturnData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const ret = await createReturn({
    ...data,
    received_by: user.id,
  });

  revalidatePath('/returns');
  revalidatePath('/issues');
  revalidatePath('/dashboard');
  revalidatePath('/inventory');

  redirect(`/returns/${ret.id}`);
}
