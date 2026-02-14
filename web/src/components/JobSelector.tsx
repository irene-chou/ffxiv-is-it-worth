import type { CraftingJob } from '@shared/types.js';

interface Props {
  jobs: CraftingJob[];
  selected: CraftingJob | null;
  onSelect: (job: CraftingJob) => void;
}

export function JobSelector({ jobs, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
      {jobs.map((job) => (
        <button
          key={job.craftTypeId}
          onClick={() => onSelect(job)}
          className={`px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer
            ${selected?.craftTypeId === job.craftTypeId
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
        >
          {job.displayName}
        </button>
      ))}
    </div>
  );
}
