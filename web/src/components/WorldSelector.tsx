import { TC_WORLDS } from '@shared/constants.js';

interface Props {
  selected: string;
  onSelect: (world: string) => void;
}

export function WorldSelector({ selected, onSelect }: Props) {
  return (
    <div className="mb-6">
      <label className="text-sm text-gray-500 mr-2">伺服器</label>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="border border-dark-600 rounded-lg px-3 py-2 text-gray-200 bg-dark-700 focus:border-gold-500 focus:outline-none"
      >
        {TC_WORLDS.map((world) => (
          <option key={world} value={world}>
            {world}
          </option>
        ))}
      </select>
    </div>
  );
}
