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
          className={`px-4 py-3 rounded-lg font-medium transition-all cursor-pointer border
            ${selected?.craftTypeId === job.craftTypeId
              ? 'bg-gold-500/20 text-gold-400 border-gold-500 shadow-[0_0_8px_rgba(246,196,69,0.15)]'
              : 'bg-dark-700 hover:bg-dark-600 text-gray-300 border-dark-600'
            }`}
        >
          {job.displayName}
        </button>
      ))}
    </div>
  );
}
