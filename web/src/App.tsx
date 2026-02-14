import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CraftingJob } from '@shared/types.js';
import { CRAFTING_JOBS } from '@shared/constants.js';
import { JobSelector } from './components/JobSelector';
import { ResultsTable } from './components/ResultsTable';
import { LoadingState } from './components/LoadingState';
import { ErrorMessage } from './components/ErrorMessage';
import { useProfitAnalysis } from './hooks/useProfitAnalysis';

const queryClient = new QueryClient();
const DEFAULT_WORLD = '鳳凰';

function AppContent() {
  const [selectedJob, setSelectedJob] = useState<CraftingJob | null>(null);

  const { data, itemNames, isLoading, error, isLoadingRecipes, isLoadingPrices } =
    useProfitAnalysis(selectedJob?.craftTypeId ?? null, DEFAULT_WORLD);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">
        這個有賺頭！
      </h1>
      <p className="text-gray-500 mb-6">FFXIV 物品利潤分析器 - 繁中服</p>

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
          world={DEFAULT_WORLD}
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
