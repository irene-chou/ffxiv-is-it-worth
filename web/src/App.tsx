import { useState, useCallback, useMemo } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { CraftingJob, ProfitFilters } from '@shared/types.js';
import { CRAFTING_JOBS, DEFAULT_WORLD, WORLD_NAME } from '@shared/constants.js';
import { createIDBPersister } from './lib/idb-persister';
import { WorldSelector } from './components/WorldSelector';
import { JobSelector } from './components/JobSelector';
import { FilterPanel } from './components/FilterPanel';
import { ResultsTable } from './components/ResultsTable';
import { LoadingState } from './components/LoadingState';
import { ErrorMessage } from './components/ErrorMessage';
import { useProfitAnalysis } from './hooks/useProfitAnalysis';
import { useUrlState } from './hooks/useUrlState';

const queryClient = new QueryClient();
const persister = createIDBPersister();
const PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function AppContent() {
  const [world, setWorld] = useUrlState('world', DEFAULT_WORLD);
  const [selectedJob, setSelectedJob] = useState<CraftingJob | null>(null);

  // Filters with URL persistence
  const [maxLevelParam, setMaxLevelParam] = useUrlState('maxLv', '');
  const [skipBookParam, setSkipBookParam] = useUrlState('skipBook', '1');
  const [saleDaysParam, setSaleDaysParam] = useUrlState('saleDays', '1');

  const filters: ProfitFilters = useMemo(() => ({
    maxLevel: maxLevelParam ? Number(maxLevelParam) : null,
    skipBook: skipBookParam !== '0',
    saleDays: Number(saleDaysParam) || 1,
  }), [maxLevelParam, skipBookParam, saleDaysParam]);

  const setFilters = useCallback((f: ProfitFilters) => {
    setMaxLevelParam(f.maxLevel !== null ? String(f.maxLevel) : '');
    setSkipBookParam(f.skipBook ? '1' : '0');
    setSaleDaysParam(String(f.saleDays));
  }, [setMaxLevelParam, setSkipBookParam, setSaleDaysParam]);

  const { data, itemNames, isLoading, error, isLoadingRecipes, isLoadingPrices, progress } =
    useProfitAnalysis(selectedJob?.craftTypeId ?? null, world, filters);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-black mb-1 text-gold-400 tracking-tight">
        這個有賺頭！💰
      </h1>
      <p className="text-sm text-gray-400 mb-1">FFXIV 物品利潤分析器 - 繁中服</p>
      <p className="text-xs text-gray-500 mb-6">查了才知道是不是在浪費水晶 · <span className="text-gray-600">板子價格每秒都在變，僅供參考</span></p>

      <WorldSelector selected={world} onSelect={setWorld} />

      <JobSelector
        jobs={CRAFTING_JOBS}
        selected={selectedJob}
        onSelect={setSelectedJob}
      />

      <FilterPanel filters={filters} onChange={setFilters} />

      {error && <ErrorMessage error={error} />}

      {isLoading && selectedJob !== null && (
        <LoadingState
          isLoadingRecipes={isLoadingRecipes}
          isLoadingPrices={isLoadingPrices}
          progress={progress}
        />
      )}

      {data && selectedJob !== null && (
        <ResultsTable
          results={data}
          world={WORLD_NAME[world] ?? world}
          jobName={selectedJob.displayName}
          itemNames={itemNames}
        />
      )}

      {selectedJob === null && (
        <p className="text-gray-500 text-center py-8">👆 選一個職業，讓我幫你算！</p>
      )}

      <footer className="mt-16 pt-6 border-t border-dark-700 text-xs text-gray-600 space-y-2">
        <p>
          市場資料由{' '}
          <a href="https://universalis.app" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gold-400 transition-colors">Universalis</a>
          {' '}提供，配方資料由{' '}
          <a href="https://xivapi.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gold-400 transition-colors">XIVAPI</a>
          {' '}提供，繁中翻譯由{' '}
          <a href="https://github.com/thewakingsands/ffxiv-datamining-tc" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gold-400 transition-colors">The Waking Sands</a>
          {' '}提供。感謝以上專案的開源貢獻。
        </p>
        <p>
          價格為玩家上傳的板子快照，非即時資料，實際交易價格可能有落差。本站不保證資料正確性，利潤僅供參考。
        </p>
        <p className="text-gray-700">
          FINAL FANTASY XIV &copy; SQUARE ENIX CO., LTD. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE }}
    >
      <AppContent />
    </PersistQueryClientProvider>
  );
}
