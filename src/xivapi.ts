import axios from 'axios';
import { XIVAPI_BASE, XIVAPI_DELAY_MS, MAX_RETRIES, INITIAL_BACKOFF_MS } from './constants.js';
import type { Recipe, RecipeIngredient } from './types.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry<T>(url: string): Promise<T> {
  let backoff = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await axios.get<T>(url);
      return res.data;
    } catch (err: unknown) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if ((status === 429 || status === 503) && attempt < MAX_RETRIES) {
        process.stderr.write(`  Rate limited (${status}), retrying in ${backoff}ms...\n`);
        await sleep(backoff);
        backoff *= 2;
        continue;
      }
      throw err;
    }
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
    Ingredient?: XIVAPIItemRef[];         // 8 elements; last may be { value: -1 } with no fields
    AmountIngredient?: number[];           // 8 elements
    AmountResult?: number;
    RecipeLevelTable?: { value: number; fields?: { ClassJobLevel?: number } };
    SecretRecipeBook?: { value: number };  // 0 = no book required, >0 = requires specific book
  };
}

interface XIVAPISearchResponse {
  results: XIVAPIRow[];
  next?: string;
}

function parseRecipe(row: XIVAPIRow): Recipe | null {
  const { fields } = row;

  // Skip recipes that require a secret recipe book (秘笈)
  if (fields.SecretRecipeBook && fields.SecretRecipeBook.value > 0) return null;

  const resultItemId = fields.ItemResult?.value;
  if (!resultItemId) return null;

  // Use English name as fallback; will be replaced by TC name in display
  const resultName = fields.ItemResult?.fields?.Name ?? `Item #${resultItemId}`;

  const ingredients: RecipeIngredient[] = [];
  const rawIngredients = fields.Ingredient ?? [];
  const rawAmounts = fields.AmountIngredient ?? [];

  for (let i = 0; i < rawIngredients.length; i++) {
    const ing = rawIngredients[i];
    const qty = rawAmounts[i] ?? 0;
    // Skip empty slots (value=0), sentinel values (value=-1), and zero-qty
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
    ingredients,
  };
}

export async function fetchAllRecipes(
  craftTypeId: number,
  onProgress?: (count: number) => void,
): Promise<Recipe[]> {
  const recipes: Recipe[] = [];
  const fields = 'ItemResult.value,ItemResult.Name,Ingredient[].value,Ingredient[].Name,AmountIngredient,AmountResult,RecipeLevelTable.ClassJobLevel,SecretRecipeBook.value';
  // Query by CraftType row ID (language-independent)
  const query = `CraftType=${craftTypeId}`;
  let url = `${XIVAPI_BASE}/api/search?sheets=Recipe&query=${encodeURIComponent(query)}&fields=${fields}&limit=500`;

  while (url) {
    const data = await fetchWithRetry<XIVAPISearchResponse>(url);

    for (const row of data.results) {
      const recipe = parseRecipe(row);
      if (recipe) recipes.push(recipe);
    }

    onProgress?.(recipes.length);

    if (data.next) {
      // next is a cursor token, not a full URL
      url = `${XIVAPI_BASE}/api/search?sheets=Recipe&query=${encodeURIComponent(query)}&fields=${fields}&limit=500&cursor=${data.next}`;
      await sleep(XIVAPI_DELAY_MS);
    } else {
      url = '';
    }
  }

  return recipes;
}
