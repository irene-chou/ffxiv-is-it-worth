import fs from 'node:fs';
import path from 'node:path';
import { CACHE_DIR, CACHE_TTL_RECIPES_MS, CACHE_TTL_PRICES_MS } from './constants.js';
import type { CachedRecipeData, MarketPriceInfo, Recipe } from './types.js';

// ── Helpers ──

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readJsonSafe<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function isExpired(fetchedAt: string, ttlMs: number): boolean {
  return Date.now() - new Date(fetchedAt).getTime() > ttlMs;
}

// ── Recipe Cache (TTL: 7 days) ──

function getRecipeCachePath(craftTypeId: number): string {
  return path.join(CACHE_DIR, `recipes-${craftTypeId}.json`);
}

export function loadCachedRecipes(craftTypeId: number): Recipe[] | null {
  const data = readJsonSafe<CachedRecipeData>(getRecipeCachePath(craftTypeId));
  if (!data || isExpired(data.fetchedAt, CACHE_TTL_RECIPES_MS)) return null;
  return data.recipes;
}

export function saveRecipesToCache(craftTypeId: number, recipes: Recipe[]): void {
  try {
    ensureCacheDir();
    const data: CachedRecipeData = {
      craftTypeId,
      fetchedAt: new Date().toISOString(),
      recipes,
    };
    fs.writeFileSync(getRecipeCachePath(craftTypeId), JSON.stringify(data, null, 2));
  } catch {
    // Non-fatal
  }
}

// ── Price Cache (TTL: 30 minutes, per-item) ──

interface CachedPriceEntry {
  fetchedAt: string;
  info: MarketPriceInfo;
}

interface CachedPriceData {
  world: string;
  prices: Record<string, CachedPriceEntry>;   // key = item ID as string
}

function getPriceCachePath(world: string): string {
  return path.join(CACHE_DIR, `prices-${world}.json`);
}

/**
 * Load cached prices for the requested item IDs.
 * Returns { cached: Map of valid (non-expired) prices, missing: IDs that need fetching }.
 */
export function loadCachedPrices(
  world: string,
  requestedIds: number[],
): { cached: Map<number, MarketPriceInfo>; missing: number[] } {
  const cached = new Map<number, MarketPriceInfo>();
  const missing: number[] = [];

  const data = readJsonSafe<CachedPriceData>(getPriceCachePath(world));

  for (const id of requestedIds) {
    const entry = data?.prices[String(id)];
    if (entry && !isExpired(entry.fetchedAt, CACHE_TTL_PRICES_MS)) {
      cached.set(id, entry.info);
    } else {
      missing.push(id);
    }
  }

  return { cached, missing };
}

/**
 * Merge freshly fetched prices into the cache file.
 * Existing entries for other items are preserved; only touched items are updated.
 */
export function savePricesToCache(world: string, freshPrices: Map<number, MarketPriceInfo>): void {
  try {
    ensureCacheDir();
    const filePath = getPriceCachePath(world);

    // Load existing cache to merge
    const existing = readJsonSafe<CachedPriceData>(filePath);
    const prices: Record<string, CachedPriceEntry> = existing?.prices ?? {};

    const now = new Date().toISOString();
    for (const [id, info] of freshPrices) {
      prices[String(id)] = { fetchedAt: now, info };
    }

    const data: CachedPriceData = { world, prices };
    fs.writeFileSync(filePath, JSON.stringify(data));
  } catch {
    // Non-fatal
  }
}
