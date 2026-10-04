import React from 'react';
import { Metadata } from 'next';
import { getCategories } from '@/lib/services/repository';
import { getCurrentUser } from '@/lib/actions/auth-actions';
import { canManageCategories } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { CategoryManager } from '@/components/categories/CategoryManager';

export const metadata: Metadata = {
  title: 'Category Management',
  description: 'Manage institutional resource classification categories.',
};

export default async function CategoriesPage() {
  const [categories, user] = await Promise.all([
    getCategories(),
    getCurrentUser(),
  ]);

  const canManage = canManageCategories(user?.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Categories"
        subtext="Classify and organize store equipment, laboratory supplies, electronic assets and teaching materials."
      />

      <CategoryManager categories={categories} canManage={canManage} />
    </div>
  );
}
