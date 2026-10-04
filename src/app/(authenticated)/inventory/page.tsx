import React from 'react';
import { Metadata } from 'next';
import { getItems, getCategories } from '@/lib/services/repository';
import { PageHeader } from '@/components/ui/PageHeader';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { InventoryHeaderActions } from '@/components/inventory/InventoryHeaderActions';
import { getCurrentUser } from '@/lib/actions/auth-actions';
import { canManageInventory } from '@/lib/auth/permissions';

export const metadata: Metadata = {
  title: 'Inventory Catalog',
  description: 'Manage institutional equipment, stock materials, conditions, and storage locations.',
};

interface InventoryPageProps {
  searchParams: Promise<{ category_id?: string }>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialCategoryId = resolvedSearchParams.category_id || '';

  const [items, categories, user] = await Promise.all([
    getItems(),
    getCategories(),
    getCurrentUser(),
  ]);

  const canManage = canManageInventory(user?.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        subtext="Manage all equipment, materials and reusable resources."
        actions={<InventoryHeaderActions canManage={canManage} />}
      />

      <InventoryTable
        initialItems={items}
        categories={categories}
        canManage={canManage}
        initialCategoryId={initialCategoryId}
      />
    </div>
  );
}
