export async function loadItemNames(): Promise<Map<number, string>> {
  const res = await fetch('/item-names-tc.json');
  if (!res.ok) throw new Error(`Failed to load item names: ${res.status}`);
  const data: Record<string, string> = await res.json();
  const map = new Map<number, string>();
  for (const [id, name] of Object.entries(data)) {
    map.set(Number(id), name);
  }
  return map;
}
