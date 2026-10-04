import React from 'react';
import { Metadata } from 'next';
import { getItems, getPeople } from '@/lib/services/repository';
import { NewIssueForm } from '@/components/issues/NewIssueForm';

export const metadata: Metadata = {
  title: 'Issue Items – New',
  description: 'Issue store items to a student or staff member.',
};

export default async function NewIssuePage() {
  const [availableItems, people] = await Promise.all([
    getItems({ status: 'Available' }).then((items) =>
      // Also include Low Stock items — storekeeper should still be able to issue
      items.filter((i) => i.available_quantity > 0 && i.is_active && i.condition !== 'MAINTENANCE')
    ),
    getPeople({ status: 'active' }),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <NewIssueForm items={availableItems} people={people} />
    </div>
  );
}
