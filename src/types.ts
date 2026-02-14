export interface CraftingJob {
  displayName: string;
  craftTypeId: number;
}

export interface RecipeIngredient {
  itemId: number;
  name: string;
  quantity: number;
}

export interface Recipe {
  rowId: number;
  name: string;
  resultItemId: number;
  amountResult: number;
  level: number;
  ingredients: RecipeIngredient[];
}

export interface CachedRecipeData {
  craftTypeId: number;
  fetchedAt: string;
  recipes: Recipe[];
}

export interface MarketPriceInfo {
  minPriceNQ: number;
  minPriceHQ: number;
  minPrice: number;
  lastUploadTime: number;
  lastSaleTime: number;         // recentHistory[0].timestamp (seconds), 0 if no sales
  hasData: boolean;
  listingsCount: number;
}

export interface ProfitResult {
  recipeName: string;
  resultItemId: number;
  salePrice: number;
  craftingCost: number;
  profit: number;
  profitMargin: number;
  dataFreshness: string;
  ingredients: Array<{
    name: string;
    itemId: number;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}
