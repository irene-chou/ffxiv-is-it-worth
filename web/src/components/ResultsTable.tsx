import { useState } from 'react';
import type { ProfitResult } from '@shared/types.js';
import { TOP_N } from '@shared/constants.js';

interface Props {
  results: ProfitResult[];
  world: string;
  jobName: string;
  itemNames?: Map<number, string>;
}

function formatGil(amount: number): string {
  return amount.toLocaleString('en-US') + 'g';
}

function resolveName(itemId: number, fallback: string, itemNames?: Map<number, string>): string {
  return itemNames?.get(itemId) ?? fallback;
}

export function ResultsTable({ results, world, jobName, itemNames }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const top = results.slice(0, TOP_N);

  const profitable = results.filter(r => r.profit > 0).length;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        {world} {jobName} 利潤最高的 {TOP_N} 個配方
      </h2>

      {top.length === 0 ? (
        <p className="text-gray-500 py-4">找不到有市場資料的可獲利配方。</p>
      ) : (
        <div className="space-y-3">
          {top.map((r, i) => {
            const displayName = resolveName(r.resultItemId, r.recipeName, itemNames);
            const isExpanded = expandedIndex === i;

            return (
              <div key={r.resultItemId} className="rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">
                      #{i + 1} {displayName}
                    </span>
                    <span className={`text-lg font-bold ${r.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {r.profit >= 0 ? '+' : ''}{formatGil(r.profit)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500 mt-1">
                    <span>售價: {formatGil(r.salePrice)}</span>
                    <span>成本: {formatGil(r.craftingCost)}</span>
                    <span className={r.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      利率: {r.profitMargin}%
                    </span>
                    <span>更新: {r.dataFreshness}</span>
                  </div>
                </button>

                {isExpanded && r.ingredients.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">素材</p>
                    <div className="space-y-1">
                      {r.ingredients.map((ing) => (
                        <div key={ing.itemId} className="flex justify-between text-sm text-gray-600">
                          <span>
                            {ing.quantity}x {resolveName(ing.itemId, ing.name, itemNames)}
                          </span>
                          <span>
                            @ {formatGil(ing.unitPrice)} = {formatGil(ing.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-sm text-gray-400 mt-4">
        共 {results.length} 個有市場資料的配方，其中 {profitable} 個可獲利
      </p>
    </div>
  );
}
