import readline from 'node:readline';
import { CRAFTING_JOBS, TOP_N } from './constants.js';
import { loadCachedRecipes, saveRecipesToCache, loadCachedPrices, savePricesToCache } from './cache.js';
import { fetchAllRecipes } from './xivapi.js';
import { fetchMarketPrices } from './universalis.js';
import { calculateProfits } from './calculator.js';
import { loadItemNames } from './translations.js';
import type { Recipe, ProfitResult, MarketPriceInfo } from './types.js';

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

function progress(message: string): void {
  process.stdout.write(`\r\x1b[K${message}`);
}

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function formatGil(amount: number): string {
  return amount.toLocaleString('en-US') + 'g';
}

/** Resolve item name: prefer TC name from dictionary, fall back to recipe's English name */
function resolveItemName(itemId: number, fallback: string, itemNames: Map<number, string>): string {
  return itemNames.get(itemId) ?? fallback;
}

function displayResults(
  results: ProfitResult[],
  jobName: string,
  world: string,
  itemNames: Map<number, string>,
): void {
  const top = results.slice(0, TOP_N);

  console.log('\n' + bold(`═══ ${world} ${jobName} 利潤最高的 ${TOP_N} 個配方 ═══`) + '\n');

  if (top.length === 0) {
    console.log('  找不到有市場資料的可獲利配方。');
    return;
  }

  for (let i = 0; i < top.length; i++) {
    const r = top[i];
    const displayName = resolveItemName(r.resultItemId, r.recipeName, itemNames);
    const profitStr = r.profit >= 0 ? green(`+${formatGil(r.profit)}`) : red(formatGil(r.profit));
    const marginStr = r.profitMargin >= 0 ? green(`${r.profitMargin}%`) : red(`${r.profitMargin}%`);

    console.log(bold(`  #${i + 1} ${displayName}`));
    console.log(`     售價: ${formatGil(r.salePrice)}  |  成本: ${formatGil(r.craftingCost)}  |  利潤: ${profitStr}  |  利率: ${marginStr}`);
    console.log(dim(`     資料更新: ${r.dataFreshness}`));

    if (r.ingredients.length > 0) {
      console.log(dim('     素材:'));
      for (const ing of r.ingredients) {
        const ingName = resolveItemName(ing.itemId, ing.name, itemNames);
        console.log(dim(`       ${ing.quantity}x ${ingName} @ ${formatGil(ing.unitPrice)} = ${formatGil(ing.subtotal)}`));
      }
    }
    console.log();
  }

  const profitable = results.filter(r => r.profit > 0).length;
  console.log(dim(`  共 ${results.length} 個有市場資料的配方，其中 ${profitable} 個可獲利\n`));
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log(bold('\n  這個有賺頭！ - FFXIV 製作利潤分析器\n'));

    // Load Traditional Chinese item names
    const itemNames = await loadItemNames((msg) => {
      progress(`  ${msg}`);
    });
    progress('');

    console.log('  選擇製作職業:');
    for (let i = 0; i < CRAFTING_JOBS.length; i++) {
      console.log(`    ${i + 1}. ${CRAFTING_JOBS[i].displayName}`);
    }

    const jobInput = await prompt(rl, '\n  輸入職業編號 (1-8): ');
    const jobIndex = parseInt(jobInput, 10) - 1;
    if (isNaN(jobIndex) || jobIndex < 0 || jobIndex >= CRAFTING_JOBS.length) {
      console.error('\n  無效的職業編號，請輸入 1-8。');
      return;
    }

    const job = CRAFTING_JOBS[jobIndex];
    const worldInput = (await prompt(rl, '  輸入伺服器名稱 [鳳凰]: ')).trim();
    const world = worldInput || '鳳凰';

    const levelInput = (await prompt(rl, '  輸入最高等級 (1-100) [全部]: ')).trim();
    const maxLevel = levelInput ? parseInt(levelInput, 10) : null;
    if (maxLevel !== null && (isNaN(maxLevel) || maxLevel < 1 || maxLevel > 100)) {
      console.error('\n  無效的等級，請輸入 1-100。');
      return;
    }

    // Fetch recipes (with cache)
    let recipes: Recipe[];
    const cachedRecipes = loadCachedRecipes(job.craftTypeId);
    if (cachedRecipes) {
      recipes = cachedRecipes;
      console.log(`\n  使用快取的${job.displayName}配方 (${recipes.length} 個配方)`);
    } else {
      progress(`  正在從 XIVAPI 抓取${job.displayName}配方...`);
      recipes = await fetchAllRecipes(job.craftTypeId, (count) => {
        progress(`  正在從 XIVAPI 抓取${job.displayName}配方... 已找到 ${count} 個`);
      });
      progress('');
      console.log(`  已從 XIVAPI 抓取 ${recipes.length} 個${job.displayName}配方`);
      saveRecipesToCache(job.craftTypeId, recipes);
    }

    if (recipes.length === 0) {
      console.log('\n  此職業沒有找到配方。');
      return;
    }

    // Filter by max level
    if (maxLevel !== null) {
      const before = recipes.length;
      recipes = recipes.filter(r => r.level <= maxLevel);
      console.log(`  等級過濾: ${before} → ${recipes.length} 個配方 (≤ Lv.${maxLevel})`);
      if (recipes.length === 0) {
        console.log('\n  過濾後沒有配方。');
        return;
      }
    }

    // Collect all unique item IDs (results + ingredients)
    const itemIds = new Set<number>();
    for (const recipe of recipes) {
      itemIds.add(recipe.resultItemId);
      for (const ing of recipe.ingredients) {
        itemIds.add(ing.itemId);
      }
    }

    // Fetch market prices (incremental cache, per-item TTL: 30 min)
    const { cached, missing } = loadCachedPrices(world, [...itemIds]);
    let priceMap: Map<number, MarketPriceInfo>;

    if (missing.length === 0) {
      priceMap = cached;
      console.log(`\n  使用快取的${world}市場價格 (${priceMap.size} 個物品)`);
    } else {
      if (cached.size > 0) {
        console.log(`\n  快取命中 ${cached.size} 個物品，需抓取 ${missing.length} 個`);
      }
      progress(`  正在從 Universalis 抓取 ${missing.length} 個物品在${world}的市場價格...`);
      const freshPrices = await fetchMarketPrices(world, missing, (fetched, total) => {
        progress(`  正在抓取市場價格... ${fetched}/${total} 個物品`);
      });
      progress('');
      console.log(`  已抓取 ${freshPrices.size} 個物品在${world}的價格`);
      savePricesToCache(world, freshPrices);

      // Merge cached + fresh
      priceMap = cached;
      for (const [id, info] of freshPrices) {
        priceMap.set(id, info);
      }
    }

    // Calculate and display
    const results = calculateProfits(recipes, priceMap);
    displayResults(results, job.displayName, world, itemNames);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error('\n  錯誤:', err instanceof Error ? err.message : err);
  process.exit(1);
});
