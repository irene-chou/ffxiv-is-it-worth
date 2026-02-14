import type { CraftingJob } from './types.js';

export const XIVAPI_BASE = 'https://v2.xivapi.com';
export const UNIVERSALIS_BASE = 'https://universalis.app/api/v2';
export const USER_AGENT = 'GilFinder/1.0 (FFXIV crafting profit analyzer)';

export const XIVAPI_DELAY_MS = 50;
export const UNIVERSALIS_BATCH_SIZE = 100;
export const MAX_RETRIES = 3;
export const INITIAL_BACKOFF_MS = 1000;

export const MARKET_TAX_RATE = 0.05;

export const CACHE_DIR = '.cache';
export const CACHE_TTL_RECIPES_MS = 7 * 24 * 60 * 60 * 1000;   // 配方: 7 天
export const CACHE_TTL_NAMES_MS = 7 * 24 * 60 * 60 * 1000;     // 繁中名稱: 7 天
export const CACHE_TTL_PRICES_MS = 30 * 60 * 1000;              // 市場價格: 30 分鐘

// CraftType IDs from CraftType.csv, display names in Traditional Chinese
export const CRAFTING_JOBS: CraftingJob[] = [
  { displayName: '木工', craftTypeId: 0 },
  { displayName: '鍛造', craftTypeId: 1 },
  { displayName: '甲冑', craftTypeId: 2 },
  { displayName: '金工', craftTypeId: 3 },
  { displayName: '皮革', craftTypeId: 4 },
  { displayName: '裁縫', craftTypeId: 5 },
  { displayName: '鍊金', craftTypeId: 6 },
  { displayName: '烹調', craftTypeId: 7 },
];

export const TOP_N = 5;
