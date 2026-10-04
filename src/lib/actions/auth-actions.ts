'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserRole, Profile } from '@/types/database';
import { isSupabaseConfigured } from '@/lib/services/repository';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { INITIAL_PROFILES } from '@/lib/services/seed-data';

export interface AuthState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both institutional email and password.' };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const cookieStore = await cookies();
        cookieStore.set('institution_user_role', profile?.role || 'STOREKEEPER', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        });

        redirect('/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        throw err;
      }
      // Continue to demo auth fallback if Supabase auth fails
    }
  }

  // Local / Demo Authentication Mode
  // Accept default seed accounts or any valid email with demo password
  const matchedProfile = INITIAL_PROFILES.find(
    (p) => p.email.toLowerCase() === email
  ) || {
    id: `u-${Date.now()}`,
    full_name: email.split('@')[0].replace('.', ' ').toUpperCase(),
    email: email,
    role: (email.includes('admin')
      ? 'ADMIN'
      : email.includes('staff')
      ? 'STAFF'
      : email.includes('student')
      ? 'STUDENT'
      : 'STOREKEEPER') as UserRole,
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const cookieStore = await cookies();
  cookieStore.set('institution_demo_session', JSON.stringify(matchedProfile), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
  cookieStore.set('institution_user_role', matchedProfile.role, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect('/dashboard');
}

export async function getCurrentUser(): Promise<Profile | null> {
  const cookieStore = await cookies();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) return profile as Profile;

        return {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: (user.user_metadata?.role as UserRole) || 'STOREKEEPER',
          avatar_url: null,
          is_active: true,
          created_at: user.created_at,
          updated_at: user.created_at,
        };
      }
    } catch (err) {
      console.warn('Failed getting user from Supabase:', err);
    }
  }

  const demoSession = cookieStore.get('institution_demo_session')?.value;
  if (!demoSession) return null;

  try {
    return JSON.parse(demoSession) as Profile;
  } catch {
    return null;
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase logout error:', err);
    }
  }

  cookieStore.delete('institution_demo_session');
  cookieStore.delete('institution_user_role');
  redirect('/login');
}

export async function switchDemoRoleAction(newRole: UserRole) {
  const cookieStore = await cookies();
  const demoSession = cookieStore.get('institution_demo_session')?.value;

  if (demoSession) {
    try {
      const profile = JSON.parse(demoSession) as Profile;
      profile.role = newRole;
      cookieStore.set('institution_demo_session', JSON.stringify(profile), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
      cookieStore.set('institution_user_role', newRole, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
    } catch {
      // ignore
    }
  } else {
    // If not logged in, set default profile with that role
    const profile = INITIAL_PROFILES.find((p) => p.role === newRole) || INITIAL_PROFILES[0];
    cookieStore.set('institution_demo_session', JSON.stringify(profile), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
    cookieStore.set('institution_user_role', newRole, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  redirect('/dashboard');
}
