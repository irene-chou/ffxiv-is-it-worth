import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CraftingJob } from '@shared/types.js';
import { CRAFTING_JOBS, DEFAULT_WORLD } from '@shared/constants.js';
import { WorldSelector } from './components/WorldSelector';
import { JobSelector } from './components/JobSelector';
import { ResultsTable } from './components/ResultsTable';
import { LoadingState } from './components/LoadingState';
import { ErrorMessage } from './components/ErrorMessage';
import { useProfitAnalysis } from './hooks/useProfitAnalysis';
import { useUrlState } from './hooks/useUrlState';

const queryClient = new QueryClient();

function findJob(idStr: string | null): CraftingJob | null {
  if (idStr === null) return null;
  const id = Number(idStr);
  return CRAFTING_JOBS.find((j) => j.craftTypeId === id) ?? null;
}

function AppContent() {
  const [world, setWorld] = useUrlState('world', DEFAULT_WORLD);
  const [jobParam, setJobParam] = useUrlState('job', '');
  const [selectedJob, setSelectedJobInternal] = useState<CraftingJob | null>(
    () => findJob(jobParam || null),
  );

  const setSelectedJob = useCallback(
    (job: CraftingJob) => {
      setSelectedJobInternal(job);
      setJobParam(String(job.craftTypeId));
    },
    [setJobParam],
  );

  const { data, itemNames, isLoading, error, isLoadingRecipes, isLoadingPrices, progress } =
    useProfitAnalysis(selectedJob?.craftTypeId ?? null, world);

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

      {error && <ErrorMessage error={error} />}

      {isLoading && selectedJob && (
        <LoadingState
          isLoadingRecipes={isLoadingRecipes}
          isLoadingPrices={isLoadingPrices}
          progress={progress}
        />
      )}

      {data && selectedJob && (
        <ResultsTable
          results={data}
          world={world}
          jobName={selectedJob.displayName}
          itemNames={itemNames}
        />
      )}

      {!selectedJob && (
        <p className="text-gray-500 text-center py-8">👆 選一個職業，讓我幫你算算看</p>
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
