import type { FetchProgress } from '../lib/xivapi';

interface Props {
  isLoadingRecipes: boolean;
  isLoadingPrices: boolean;
  progress: FetchProgress | null;
}

function StepIndicator({ step, active, done, label }: {
  step: number;
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`
        w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
        ${done
          ? 'bg-gold-500 border-gold-500 text-dark-900'
          : active
            ? 'border-gold-400 text-gold-400 shadow-[0_0_10px_rgba(246,196,69,0.3)]'
            : 'border-dark-600 text-gray-600'
        }
      `}>
        {done ? '✓' : step}
      </div>
      <span className={`text-sm transition-colors duration-300 ${
        active ? 'text-gray-200' : done ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {label}
      </span>
    </div>
  );
}

export function LoadingState({ isLoadingRecipes, isLoadingPrices, progress }: Props) {
  const recipeDone = !isLoadingRecipes && isLoadingPrices;
  const percent = progress?.total
    ? Math.round((progress.current / progress.total) * 100)
    : null;

  return (
    <div className="py-10 flex flex-col items-center gap-5">
      {/* Steps */}
      <div className="flex items-center gap-6">
        <StepIndicator step={1} active={isLoadingRecipes} done={recipeDone} label="取得配方" />
        <div className={`w-8 h-px transition-colors duration-300 ${recipeDone ? 'bg-gold-500' : 'bg-dark-600'}`} />
        <StepIndicator step={2} active={isLoadingPrices} done={false} label="查詢板子" />
      </div>

      {/* Progress bar */}
      <div className="w-72">
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          {percent !== null ? (
            <div
              className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-300 relative overflow-hidden progress-bar-glow progress-shimmer"
              style={{ width: `${percent}%` }}
            />
          ) : (
            <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full animate-pulse w-full opacity-25" />
          )}
        </div>

        {/* Detail text */}
        {progress && (
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">{progress.detail}</span>
            {percent !== null && (
              <span className="text-xs text-gold-500 font-mono">{percent}%</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
