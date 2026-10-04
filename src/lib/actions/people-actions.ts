'use server';

import { revalidatePath } from 'next/cache';
import { createPerson, togglePersonStatus, batchImportPeople } from '@/lib/services/repository';
import { personSchema, PersonFormValues } from '@/lib/validations';
import { getCurrentUser } from './auth-actions';
import { canManagePeople } from '@/lib/auth/permissions';

export async function createPersonAction(
  values: PersonFormValues
): Promise<{ success: boolean; error?: string; personId?: string }> {
  const user = await getCurrentUser();
  if (!user || !canManagePeople(user.role)) {
    return { success: false, error: 'Unauthorized: insufficient institutional permissions.' };
  }

  const validated = personSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.issues.map((i) => i.message).join(', ') };
  }

  try {
    const created = await createPerson({
      full_name: validated.data.full_name,
      admission_number: validated.data.admission_number || null,
      role: validated.data.role,
      department: validated.data.department || null,
      class_name: validated.data.class_name || null,
      phone: validated.data.phone || null,
      email: validated.data.email || null,
      photo_url: validated.data.photo_url || null,
      is_active: validated.data.is_active,
    });

    revalidatePath('/people');
    return { success: true, personId: created.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register person.';
    return { success: false, error: message };
  }
}

export async function togglePersonStatusAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canManagePeople(user.role)) {
    return { success: false, error: 'Unauthorized: insufficient institutional permissions.' };
  }

  try {
    await togglePersonStatus(id);
    revalidatePath('/people');
    revalidatePath(`/people/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle status.';
    return { success: false, error: message };
  }
}

export async function batchImportPeopleAction(
  records: Array<{
    full_name: string;
    admission_number?: string | null;
    role: 'STUDENT' | 'TEACHER' | 'STAFF' | 'OTHER';
    department?: string | null;
    class_name?: string | null;
    phone?: string | null;
    email?: string | null;
  }>
) {
  const user = await getCurrentUser();
  if (!user || !canManagePeople(user.role)) {
    return { success: false, error: 'Unauthorized: insufficient permissions.' };
  }

  try {
    const formattedRecords = records.map((r) => ({
      ...r,
      is_active: true,
    }));
    const result = await batchImportPeople(formattedRecords, { skipDuplicates: true });
    revalidatePath('/people');
    return { success: true, result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to import people.';
    return { success: false, error: message };
  }
}
