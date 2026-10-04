import React from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getItemById, getCategories } from '@/lib/services/repository';
import { getCurrentUser } from '@/lib/actions/auth-actions';
import { canManageInventory } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { ItemForm } from '@/components/inventory/ItemForm';

interface EditItemPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditItemPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getItemById(id);
  return {
    title: item ? `Edit ${item.name}` : 'Edit Item',
  };
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { id } = await params;
  const [item, categories, user] = await Promise.all([
    getItemById(id),
    getCategories(),
    getCurrentUser(),
  ]);

  if (!item) {
    notFound();
  }

  if (!canManageInventory(user?.role)) {
    redirect(`/inventory/${id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${item.name}`}
        subtext={`Update catalogue specifications, location, and parameters for ${item.item_code}.`}
      />

      <ItemForm categories={categories} initialData={item} isEdit={true} />
    </div>
  );
}
