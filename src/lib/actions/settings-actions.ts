'use server';

import { revalidatePath } from 'next/cache';
import { updateInstitutionSettings } from '@/lib/services/repository';
import { institutionSettingsSchema, InstitutionSettingsFormValues } from '@/lib/validations';
import { getCurrentUser } from './auth-actions';
import { canManageSettings } from '@/lib/auth/permissions';

export async function updateInstitutionSettingsAction(
  values: InstitutionSettingsFormValues
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canManageSettings(user.role)) {
    return {
      success: false,
      error: 'Unauthorized: only Administrators can update institution profile settings.',
    };
  }

  const validated = institutionSettingsSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues.map((i) => i.message).join(', '),
    };
  }

  try {
    await updateInstitutionSettings({
      institution_name: validated.data.institution_name,
      address: validated.data.address || null,
      phone: validated.data.phone || null,
      email: validated.data.email || null,
      logo_url: validated.data.logo_url || null,
    });

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update institution settings.';
    return { success: false, error: message };
  }
}
