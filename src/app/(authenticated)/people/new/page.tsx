import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth-actions';
import { canManagePeople } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { PersonForm } from '@/components/people/PersonForm';

export const metadata: Metadata = {
  title: 'Add Person | Borrower Registry',
  description: 'Register a student, faculty member, or staff member in the institutional store system.',
};

export default async function NewPersonPage() {
  const user = await getCurrentUser();

  if (!canManagePeople(user?.role)) {
    redirect('/people');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register Borrower"
        subtext="Add a student, academic faculty member, or campus department staff to the store registry."
      />

      <PersonForm />
    </div>
  );
}
