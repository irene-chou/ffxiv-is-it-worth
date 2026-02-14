import {
  UNIVERSALIS_BASE,
  UNIVERSALIS_BATCH_SIZE,
  MAX_RETRIES,
  INITIAL_BACKOFF_MS,
} from '@shared/constants.js';
import type { MarketPriceInfo } from '@shared/types.js';
import type { FetchProgress } from './xivapi';

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

    // 404 on single item = untradable, return null signal
    if (res.status === 404) return null as T;

    throw new Error(`Universalis request failed: ${res.status}`);
  }

  throw new Error('Max retries exceeded');
}

interface UniversalisHistoryEntry {
  timestamp: number;
  pricePerUnit: number;
  quantity: number;
}

interface UniversalisItemData {
  itemID: number;
  minPriceNQ: number;
  minPriceHQ: number;
  minPrice: number;
  lastUploadTime: number;
  listingsCount: number;
  hasData: boolean;
  recentHistory?: UniversalisHistoryEntry[];
}

interface UniversalisMultiResponse {
  items: Record<string, UniversalisItemData>;
  unresolvedItems: number[];
  worldID: number;
  worldName: string;
}

function toMarketPriceInfo(item: UniversalisItemData): MarketPriceInfo {
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
  signal?: AbortSignal,
  onProgress?: (p: FetchProgress) => void,
): Promise<Map<number, MarketPriceInfo>> {
  const priceMap = new Map<number, MarketPriceInfo>();
  const uniqueIds = [...new Set(itemIds.filter(id => id > 0))];
  const total = uniqueIds.length;

  for (let i = 0; i < uniqueIds.length; i += UNIVERSALIS_BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + UNIVERSALIS_BATCH_SIZE);
    const idsParam = batch.join(',');
    const url = `${UNIVERSALIS_BASE}/${world}/${idsParam}?listings=0`;

    if (batch.length === 1) {
      const data = await fetchWithRetry<UniversalisItemData | null>(url, signal);
      if (data?.itemID) {
        priceMap.set(data.itemID, toMarketPriceInfo(data));
      }
    } else {
      const data = await fetchWithRetry<UniversalisMultiResponse | null>(url, signal);
      if (data?.items) {
        for (const [idStr, item] of Object.entries(data.items)) {
          priceMap.set(Number(idStr), toMarketPriceInfo(item));
        }
      }
    }

    const fetched = Math.min(i + UNIVERSALIS_BATCH_SIZE, total);
    onProgress?.({
      phase: 'prices',
      current: fetched,
      total,
      detail: `市場價格 ${fetched}/${total} 個物品`,
    });
  }

  return priceMap;
}
