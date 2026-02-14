import axios from 'axios';
import {
  UNIVERSALIS_BASE,
  UNIVERSALIS_BATCH_SIZE,
  USER_AGENT,
  MAX_RETRIES,
  INITIAL_BACKOFF_MS,
} from './constants.js';
import type { MarketPriceInfo } from './types.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry<T>(url: string): Promise<T> {
  let backoff = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await axios.get<T>(url, {
        headers: { 'User-Agent': USER_AGENT },
      });
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

// Matches the actual Universalis API response fields (see docs/api-reference.md)
interface UniversalisHistoryEntry {
  timestamp: number;          // seconds since epoch
  pricePerUnit: number;
  quantity: number;
}

interface UniversalisItemData {
  itemID: number;
  minPriceNQ: number;
  minPriceHQ: number;
  minPrice: number;           // API computes this correctly (handles 0s)
  lastUploadTime: number;
  listingsCount: number;
  hasData: boolean;           // API provides this directly
  recentHistory?: UniversalisHistoryEntry[];
}

interface UniversalisMultiResponse {
  items: Record<string, UniversalisItemData>;
  unresolvedItems: number[];
  worldID: number;
  worldName: string;
}

function toMarketPriceInfo(item: UniversalisItemData): MarketPriceInfo {
  // Use API-provided fields directly — do NOT recompute minPrice
  // lastSaleTime: first entry in recentHistory is the most recent sale (seconds)
  const lastSaleTime = item.recentHistory?.[0]?.timestamp ?? 0;
  return {
    minPriceNQ: item.minPriceNQ ?? 0,
    minPriceHQ: item.minPriceHQ ?? 0,
    minPrice: item.minPrice ?? 0,
    lastUploadTime: item.lastUploadTime ?? 0,
    lastSaleTime,
    hasData: item.hasData ?? false,
    listingsCount: item.listingsCount ?? 0,
  };
}

export async function fetchMarketPrices(
  world: string,
  itemIds: number[],
  onProgress?: (fetched: number, total: number) => void,
): Promise<Map<number, MarketPriceInfo>> {
  const priceMap = new Map<number, MarketPriceInfo>();
  // Filter out invalid IDs (0, negative) and deduplicate
  const uniqueIds = [...new Set(itemIds.filter(id => id > 0))];
  let fetched = 0;

  for (let i = 0; i < uniqueIds.length; i += UNIVERSALIS_BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + UNIVERSALIS_BATCH_SIZE);
    const idsParam = batch.join(',');
    const url = `${UNIVERSALIS_BASE}/${encodeURIComponent(world)}/${idsParam}?listings=0`;

    try {
      if (batch.length === 1) {
        // Single-item response is a flat object (no `items` wrapper)
        // 404 = untradable item → caught below
        const data = await fetchWithRetry<UniversalisItemData>(url);
        if (data.itemID) {
          priceMap.set(data.itemID, toMarketPriceInfo(data));
        }
      } else {
        // Multi-item response: { items: { "5487": {...}, ... }, unresolvedItems: [...] }
        const data = await fetchWithRetry<UniversalisMultiResponse>(url);
        for (const [idStr, item] of Object.entries(data.items)) {
          priceMap.set(Number(idStr), toMarketPriceInfo(item));
        }
        // unresolvedItems are untradable — silently skip them
      }
    } catch (err: unknown) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 404) {
        // 404 on single item = untradable; 404 on batch = invalid world
        // For single items this is expected, just skip
        if (batch.length > 1) {
          process.stderr.write(`  Warning: 404 for batch of ${batch.length} items (invalid world?)\n`);
        }
      } else {
        throw err;
      }
    }

    fetched += batch.length;
    onProgress?.(fetched, uniqueIds.length);
  }

  return priceMap;
}
