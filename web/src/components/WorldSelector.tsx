import { TC_WORLDS } from '@shared/constants.js';

interface Props {
  selected: string;
  onSelect: (worldId: string) => void;
}

export function WorldSelector({ selected, onSelect }: Props) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <label className="text-sm text-gray-500">伺服器</label>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="appearance-none border border-dark-600 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-200 bg-dark-700 focus:border-gold-500 focus:outline-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.375rem_center] bg-no-repeat"
      >
        {TC_WORLDS.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}
