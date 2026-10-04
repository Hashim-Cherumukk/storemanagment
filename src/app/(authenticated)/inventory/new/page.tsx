import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCategories } from '@/lib/services/repository';
import { getCurrentUser } from '@/lib/actions/auth-actions';
import { canManageInventory } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { ItemForm } from '@/components/inventory/ItemForm';

export const metadata: Metadata = {
  title: 'Add Inventory Item',
  description: 'Add new equipment or stock materials to institutional inventory.',
};

export default async function NewItemPage() {
  const [categories, user] = await Promise.all([
    getCategories(),
    getCurrentUser(),
  ]);

  if (!canManageInventory(user?.role)) {
    redirect('/inventory');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Inventory Item"
        subtext="Register a new reusable institutional asset or consumable stock batch into the store catalogue."
      />

      <ItemForm categories={categories} />
    </div>
  );
}
