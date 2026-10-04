'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createIssue, CreateIssueData } from '@/lib/services/repository';
import { getCurrentUser } from './auth-actions';

export async function createIssueAction(data: CreateIssueData): Promise<{
  success: boolean;
  error?: string;
  issueId?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to issue items.' };
  }

  if (data.items.length === 0) {
    return { success: false, error: 'Please select at least one item to issue.' };
  }

  try {
    const issue = await createIssue({
      ...data,
      issued_by: user.id,
    });

    revalidatePath('/issues');
    revalidatePath('/dashboard');
    revalidatePath('/inventory');
    revalidatePath('/audit');

    return { success: true, issueId: issue.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create issue.';
    return { success: false, error: message };
  }
}

export async function createIssueAndRedirect(data: CreateIssueData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const issue = await createIssue({
    ...data,
    issued_by: user.id,
  });

  revalidatePath('/issues');
  revalidatePath('/dashboard');
  revalidatePath('/inventory');

  redirect(`/issues/${issue.id}`);
}
