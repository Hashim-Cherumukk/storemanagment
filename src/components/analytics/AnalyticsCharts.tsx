'use client';

import React from 'react';
import {
  TrendingUp,
  BarChart2,
  PieChart as PieChartIcon,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';

interface AnalyticsChartsProps {
  data: any;
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const {
    inventorySummary,
    borrowingSummary,
    mostBorrowed,
    frequentBorrowers,
    conditionSummary,
    categoryActivity,
  } = data;

  // Maximum value for scaling horizontal progress bars
  const maxCategoryQty = Math.max(
    ...categoryActivity.map((c: any) => c.totalQuantity),
    1
  );

  const maxBorrowedQty = Math.max(
    ...mostBorrowed.map((b: any) => b.totalIssued),
    1
  );

  const maxBorrowerIssues = Math.max(
    ...frequentBorrowers.map((fb: any) => fb.totalIssues),
    1
  );

  // Condition proportions
  const totalConditionItems =
    inventorySummary.totalQuantity -
    (conditionSummary.damagedCount + conditionSummary.needsRepairCount);

  return (
    <div className="space-y-6">
      {/* Top Financial & Asset Valuation Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-lg p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#F0F4F8] flex items-center justify-center text-[#34495E] shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#697077]">
              Total Asset Valuation
            </div>
            <div className="text-xl font-bold font-mono text-[#202326] mt-0.5">
              ₹{(inventorySummary.totalValuation || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-[#697077] mt-0.5">
              Cumulative catalog store value
            </div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-lg p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#F2F8F4] flex items-center justify-center text-[#3F7654] shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#697077]">
              Active Store Circulation
            </div>
            <div className="text-xl font-bold font-mono text-[#3F7654] mt-0.5">
              {inventorySummary.currentlyOutQuantity} / {inventorySummary.totalQuantity} units
            </div>
            <div className="text-[10px] text-[#697077] mt-0.5">
              {((inventorySummary.currentlyOutQuantity / (inventorySummary.totalQuantity || 1)) * 100).toFixed(1)}% outside store
            </div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-lg p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#FFFBEB] flex items-center justify-center text-[#B45309] shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#697077]">
              Fulfillment Rate
            </div>
            <div className="text-xl font-bold font-mono text-[#202326] mt-0.5">
              {borrowingSummary.itemsReturnedCount} / {borrowingSummary.itemsIssuedCount} units
            </div>
            <div className="text-[10px] text-[#697077] mt-0.5">
              Returned vs Issued in period
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Visual Bar Chart - Category Quantity Distribution */}
      <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3E5E7] pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#34495E]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#202326]">
              Inventory Volume by Category
            </h2>
          </div>
          <span className="text-[11px] text-[#697077] font-mono">
            {categoryActivity.length} Categories
          </span>
        </div>

        <div className="space-y-3.5">
          {categoryActivity.map((cat: any, idx: number) => {
            const percentage = Math.round((cat.totalQuantity / maxCategoryQty) * 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#202326]">{cat.name}</span>
                  <span className="text-[#697077] font-mono">
                    <strong className="text-[#202326]">{cat.totalQuantity}</strong> units ({cat.issueCount} issues)
                  </span>
                </div>
                <div className="w-full bg-[#F6F6F3] rounded-full h-3 overflow-hidden border border-[#E3E5E7] p-0.5">
                  <div
                    className="bg-[#34495E] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(percentage, 3)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Two Column Charts - Most Issued Items & Top Borrower Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Issued Equipment Chart */}
        <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-lg p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[#E3E5E7] pb-3 mb-4">
              <ArrowUpRight className="w-4 h-4 text-[#3F7654]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#202326]">
                Top Equipment Demand
              </h2>
            </div>

            {mostBorrowed.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#697077]">
                No borrowing activity recorded for this date range.
              </div>
            ) : (
              <div className="space-y-3">
                {mostBorrowed.slice(0, 5).map(({ item, totalIssued, issueTimes }: any) => {
                  const widthPct = Math.round((totalIssued / maxBorrowedQty) * 100);
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-[#202326] truncate max-w-[200px]">
                          {item.name} <span className="font-mono text-[10px] text-[#697077]">({item.item_code})</span>
                        </span>
                        <span className="font-mono text-[#3F7654] font-semibold">
                          {totalIssued} {item.unit}
                        </span>
                      </div>
                      <div className="w-full bg-[#F6F6F3] rounded-md h-2.5 overflow-hidden border border-[#E3E5E7]">
                        <div
                          className="bg-[#3F7654] h-full rounded-md transition-all duration-500"
                          style={{ width: `${Math.max(widthPct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Borrower Ranking Chart */}
        <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-lg p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[#E3E5E7] pb-3 mb-4">
              <PieChartIcon className="w-4 h-4 text-[#B45309]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#202326]">
                Borrower Frequency Ranking
              </h2>
            </div>

            {frequentBorrowers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#697077]">
                No active borrowers found for this period.
              </div>
            ) : (
              <div className="space-y-3">
                {frequentBorrowers.slice(0, 5).map((fb: any, idx: number) => {
                  const widthPct = Math.round((fb.totalIssues / maxBorrowerIssues) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-[#202326]">
                          {fb.personName} <span className="text-[10px] text-[#697077]">({fb.role})</span>
                        </span>
                        <span className="font-mono text-[#B45309] font-semibold">
                          {fb.totalIssues} issue{fb.totalIssues > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-[#F6F6F3] rounded-md h-2.5 overflow-hidden border border-[#E3E5E7]">
                        <div
                          className="bg-[#B45309] h-full rounded-md transition-all duration-500"
                          style={{ width: `${Math.max(widthPct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Equipment Health & Condition Segmented Breakdown */}
      <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3E5E7] pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B5524B]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#202326]">
              Store Equipment Health Breakdown
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold text-[#202326]">
            {inventorySummary.totalQuantity} Total Units
          </span>
        </div>

        {/* Stacked Proportional Bar Chart */}
        <div className="space-y-2">
          <div className="w-full h-5 rounded-md bg-[#E3E5E7] overflow-hidden flex border border-[#E3E5E7]">
            <div
              className="bg-[#3F7654] h-full text-[10px] text-white font-bold flex items-center justify-center transition-all duration-500"
              style={{
                width: `${Math.max(
                  ((totalConditionItems / (inventorySummary.totalQuantity || 1)) * 100),
                  0
                )}%`,
              }}
              title="Good / Fair Operational Condition"
            />
            <div
              className="bg-[#A87932] h-full text-[10px] text-white font-bold flex items-center justify-center transition-all duration-500"
              style={{
                width: `${Math.max(
                  ((conditionSummary.needsRepairCount / (inventorySummary.totalQuantity || 1)) * 100),
                  0
                )}%`,
              }}
              title="Under Maintenance / Repair"
            />
            <div
              className="bg-[#B5524B] h-full text-[10px] text-white font-bold flex items-center justify-center transition-all duration-500"
              style={{
                width: `${Math.max(
                  ((conditionSummary.damagedCount / (inventorySummary.totalQuantity || 1)) * 100),
                  0
                )}%`,
              }}
              title="Damaged Equipment"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs pt-2 text-[#697077]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#3F7654] inline-block" />
              <span>Operational ({totalConditionItems} units)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#A87932] inline-block" />
              <span>Needs Maintenance ({conditionSummary.needsRepairCount} units)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#B5524B] inline-block" />
              <span>Damaged ({conditionSummary.damagedCount} units)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
