import {
  XIVAPI_BASE,
  XIVAPI_DELAY_MS,
  MAX_RETRIES,
  INITIAL_BACKOFF_MS,
} from '@shared/constants.js';
import type { Recipe, RecipeIngredient } from '@shared/types.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry<T>(url: string, signal?: AbortSignal): Promise<T> {
  let backoff = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, { signal });
    if (res.ok) return res.json() as Promise<T>;

    if ((res.status === 429 || res.status === 503) && attempt < MAX_RETRIES) {
      console.warn(`Rate limited (${res.status}), retrying in ${backoff}ms...`);
      await sleep(backoff);
      backoff *= 2;
      continue;
    }

    throw new Error(`XIVAPI request failed: ${res.status}`);
  }

  throw new Error('Max retries exceeded');
}

// Matches actual XIVAPI v2 response (see docs/api-reference.md)
interface XIVAPIItemRef {
  value: number;
  sheet?: string;
  row_id?: number;
  fields?: { Name?: string };
}

interface XIVAPIRow {
  row_id: number;
  fields: {
    ItemResult?: XIVAPIItemRef;
    Ingredient?: XIVAPIItemRef[];
    AmountIngredient?: number[];
    AmountResult?: number;
    RecipeLevelTable?: { value: number; fields?: { ClassJobLevel?: number } };
    SecretRecipeBook?: { value: number };
  };
}

interface XIVAPISearchResponse {
  results: XIVAPIRow[];
  next?: string;
}

function parseRecipe(row: XIVAPIRow): Recipe | null {
  const { fields } = row;

  const resultItemId = fields.ItemResult?.value;
  if (!resultItemId) return null;

  const resultName = fields.ItemResult?.fields?.Name ?? `Item #${resultItemId}`;

  const ingredients: RecipeIngredient[] = [];
  const rawIngredients = fields.Ingredient ?? [];
  const rawAmounts = fields.AmountIngredient ?? [];

  for (let i = 0; i < rawIngredients.length; i++) {
    const ing = rawIngredients[i];
    const qty = rawAmounts[i] ?? 0;
    if (!ing.value || ing.value <= 0 || qty === 0) continue;
    ingredients.push({
      itemId: ing.value,
      name: ing.fields?.Name ?? `Item #${ing.value}`,
      quantity: qty,
    });
  }

  if (ingredients.length === 0) return null;

  return {
    rowId: row.row_id,
    name: resultName,
    resultItemId,
    amountResult: fields.AmountResult ?? 1,
    level: fields.RecipeLevelTable?.fields?.ClassJobLevel ?? 0,
    requiresBook: !!(fields.SecretRecipeBook && fields.SecretRecipeBook.value > 0),
    ingredients,
  };
}

export interface FetchProgress {
  phase: 'recipes' | 'prices';
  current: number;
  total: number;
  detail: string;
}

export async function fetchAllRecipes(
  craftTypeId: number,
  signal?: AbortSignal,
  onProgress?: (p: FetchProgress) => void,
): Promise<Recipe[]> {
  const recipes: Recipe[] = [];
  const fields = 'ItemResult.value,ItemResult.Name,Ingredient[].value,Ingredient[].Name,AmountIngredient,AmountResult,RecipeLevelTable.ClassJobLevel,SecretRecipeBook.value';
  const query = `CraftType=${craftTypeId}`;
  let url: string | null = `${XIVAPI_BASE}/api/search?sheets=Recipe&query=${encodeURIComponent(query)}&fields=${fields}&limit=500`;
  let page = 0;

  while (url) {
    const data: XIVAPISearchResponse = await fetchWithRetry<XIVAPISearchResponse>(url, signal);

    for (const row of data.results) {
      const recipe = parseRecipe(row);
      if (recipe) recipes.push(recipe);
    }

    page++;
    onProgress?.({
      phase: 'recipes',
      current: recipes.length,
      total: 0,
      detail: `已取得 ${recipes.length} 個配方（第 ${page} 頁）`,
    });

    if (data.next) {
      url = `${XIVAPI_BASE}/api/search?sheets=Recipe&query=${encodeURIComponent(query)}&fields=${fields}&limit=500&cursor=${data.next}`;
      await sleep(XIVAPI_DELAY_MS);
    } else {
      url = null;
    }
  }

  return recipes;
}
