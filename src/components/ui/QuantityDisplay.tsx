import React from 'react';

interface QuantityDisplayProps {
  quantity: number;
  minimum?: number;
  unit?: string;
  showMinSubtext?: boolean;
}

export function QuantityDisplay({
  quantity,
  minimum,
  unit = 'pcs',
  showMinSubtext = false,
}: QuantityDisplayProps) {
  const isOutOfStock = quantity === 0;
  const isLowStock = minimum !== undefined && quantity <= minimum && quantity > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-1">
        <span
          className={`font-semibold tabular-nums text-sm ${
            isOutOfStock
              ? 'text-danger'
              : isLowStock
              ? 'text-warning'
              : 'text-text-main'
          }`}
        >
          {quantity}
        </span>
        <span className="text-xs text-text-muted">{unit}</span>
      </div>

      {showMinSubtext && minimum !== undefined && (
        <span className="text-[11px] text-text-muted">
          Min: <span className="tabular-nums font-medium">{minimum}</span>
        </span>
      )}
    </div>
  );
}
