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

  const { data, itemNames, isLoading, error, isLoadingRecipes, isLoadingPrices } =
    useProfitAnalysis(selectedJob?.craftTypeId ?? null, world);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">
        這個有賺頭！
      </h1>
      <p className="text-gray-500 mb-6">FFXIV 物品利潤分析器 - 繁中服</p>

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
        <p className="text-gray-400 text-center py-8">選擇一個製作職業開始分析</p>
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
