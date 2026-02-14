import type { CraftingJob } from './types.js';

export const XIVAPI_BASE = 'https://v2.xivapi.com';
export const UNIVERSALIS_BASE = 'https://universalis.app/api/v2';
export const USER_AGENT = 'ffxiv-is-it-worth/1.0 (FFXIV crafting profit analyzer)';

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

// 繁中服（陸行鳥）伺服器列表 + Universalis world IDs
export const TC_WORLDS = [
  { id: '4028', name: '伊弗利特' },
  { id: '4029', name: '迦樓羅' },
  { id: '4030', name: '利維坦' },
  { id: '4031', name: '鳳凰' },
  { id: '4032', name: '奧汀' },
  { id: '4033', name: '巴哈姆特' },
  { id: '4034', name: '拉姆' },
  { id: '4035', name: '泰坦' },
] as const;

export const WORLD_NAME: Record<string, string> = Object.fromEntries(
  TC_WORLDS.map((w) => [w.id, w.name]),
);

export const DEFAULT_WORLD = '4031';
