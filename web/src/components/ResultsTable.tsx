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
      <h2 className="text-lg font-bold mb-4 text-gray-200">
        {world} · {jobName} · 利潤 TOP {TOP_N} 🏆
      </h2>

      {top.length === 0 ? (
        <p className="text-gray-500 py-4">找不到有市場資料的可獲利配方 😢</p>
      ) : (
        <div className="space-y-3">
          {top.map((r, i) => {
            const displayName = resolveName(r.resultItemId, r.recipeName, itemNames);
            const isExpanded = expandedIndex === i;

            return (
              <div key={r.resultItemId} className="rounded-lg border border-dark-600 bg-dark-800 overflow-hidden">
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  className="w-full text-left px-4 py-3 hover:bg-dark-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-gray-200">
                      #{i + 1} {displayName}
                    </span>
                    <span className={`text-lg font-bold ${r.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {r.profit >= 0 ? '+' : ''}{formatGil(r.profit)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500 mt-1">
                    <span>售價: {formatGil(r.salePrice)}</span>
                    <span>成本: {formatGil(r.craftingCost)}</span>
                    <span className={r.profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}>
                      利率: {r.profitMargin}%
                    </span>
                    <span>更新: {r.dataFreshness}</span>
                  </div>
                </button>

                {isExpanded && r.ingredients.length > 0 && (
                  <div className="border-t border-dark-600 bg-dark-700/50 px-4 py-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">素材</p>
                    <div className="space-y-1">
                      {r.ingredients.map((ing) => (
                        <div key={ing.itemId} className="flex justify-between text-sm text-gray-400">
                          <span>
                            {ing.quantity}x {resolveName(ing.itemId, ing.name, itemNames)}
                          </span>
                          <span className="text-gray-500">
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

      <p className="text-sm text-gray-500 mt-4">
        共 {results.length} 個有市場資料的配方，其中 {profitable} 個可獲利
      </p>
    </div>
  );
}
