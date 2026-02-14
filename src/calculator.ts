import { MARKET_TAX_RATE } from './constants.js';
import type { MarketPriceInfo, ProfitResult, Recipe } from './types.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Format lastSaleTime (seconds) as relative time string */
function formatFreshness(timestampSec: number): string {
  if (!timestampSec) return '無交易紀錄';
  const ageMs = Date.now() - timestampSec * 1000;
  const hours = Math.floor(ageMs / (1000 * 60 * 60));
  if (hours < 1) return '<1 小時前';
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export function calculateProfits(
  recipes: Recipe[],
  priceMap: Map<number, MarketPriceInfo>,
): ProfitResult[] {
  const results: ProfitResult[] = [];
  const now = Date.now();

  for (const recipe of recipes) {
    const resultPrice = priceMap.get(recipe.resultItemId);
    if (!resultPrice || !resultPrice.hasData || resultPrice.minPrice === 0) continue;

    // Skip if the crafted item has no recent sale within 1 day
    if (!resultPrice.lastSaleTime) continue;
    const saleAgeMs = now - resultPrice.lastSaleTime * 1000;
    if (saleAgeMs > ONE_DAY_MS) continue;

    let craftingCost = 0;
    let skipRecipe = false;
    const ingredientDetails: ProfitResult['ingredients'] = [];

    for (const ing of recipe.ingredients) {
      const ingPrice = priceMap.get(ing.itemId);
      if (!ingPrice || !ingPrice.hasData || ingPrice.minPrice === 0) {
        skipRecipe = true;
        break;
      }
      const subtotal = ingPrice.minPrice * ing.quantity;
      craftingCost += subtotal;
      ingredientDetails.push({
        name: ing.name,
        itemId: ing.itemId,
        quantity: ing.quantity,
        unitPrice: ingPrice.minPrice,
        subtotal,
      });
    }

    if (skipRecipe) continue;

    const salePrice = resultPrice.minPrice;
    const netSale = salePrice * (1 - MARKET_TAX_RATE);
    const profit = netSale - craftingCost;
    const profitMargin = craftingCost > 0 ? (profit / craftingCost) * 100 : 0;

    results.push({
      recipeName: recipe.name,
      resultItemId: recipe.resultItemId,
      salePrice,
      craftingCost,
      profit: Math.round(profit),
      profitMargin: Math.round(profitMargin * 10) / 10,
      dataFreshness: formatFreshness(resultPrice.lastSaleTime),
      ingredients: ingredientDetails,
    });
  }

  results.sort((a, b) => b.profit - a.profit);
  return results;
}
