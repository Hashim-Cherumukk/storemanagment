import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getReportsData } from '@/lib/services/repository';
import { PageHeader } from '@/components/ui/PageHeader';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';

export const metadata: Metadata = {
  title: 'Store Analytics & Charts | Institutional Store',
  description: 'Visual analytics, equipment demand charts, borrower rankings, and store health graphics.',
};

interface AnalyticsPageProps {
  searchParams: Promise<{ range?: 'today' | 'week' | 'month' | 'all' }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { range = 'month' } = await searchParams;
  const data = await getReportsData(range);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E5E7] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#202326]">Analytics & Charts</h1>
          <p className="text-xs text-[#697077] mt-0.5">
            Visual graphs, asset valuation, equipment demand, and borrower rankings.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="inline-flex items-center rounded-md border border-[#E3E5E7] bg-[#FFFFFF] p-0.5 text-xs">
          {[
            { label: 'Today', value: 'today' },
            { label: 'This Week', value: 'week' },
            { label: 'This Month', value: 'month' },
            { label: 'All Time', value: 'all' },
          ].map((r) => {
            const isActive = range === r.value;
            return (
              <Link
                key={r.value}
                href={`/analytics?range=${r.value}`}
                className={`px-3 py-1 font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-[#EEF0F1] text-[#202326]'
                    : 'text-[#697077] hover:text-[#202326]'
                }`}
              >
                {r.label}
              </Link>
            );
          })}
        </div>
      </div>

      <AnalyticsCharts data={data} />
    </div>
  );
}
