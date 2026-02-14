import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import { CACHE_DIR, CACHE_TTL_NAMES_MS } from './constants.js';

const ITEM_CSV_URL = 'https://raw.githubusercontent.com/thewakingsands/ffxiv-datamining-tc/master/Item.csv';
const NAMES_CACHE_FILE = path.join(CACHE_DIR, 'item-names-tc.json');

interface CachedNames {
  fetchedAt: string;
  names: Record<string, string>;
}

function loadCachedNames(): Map<number, string> | null {
  try {
    if (!fs.existsSync(NAMES_CACHE_FILE)) return null;

    const raw = fs.readFileSync(NAMES_CACHE_FILE, 'utf-8');
    const data: CachedNames = JSON.parse(raw);

    const age = Date.now() - new Date(data.fetchedAt).getTime();
    if (age > CACHE_TTL_NAMES_MS) return null;

    const map = new Map<number, string>();
    for (const [id, name] of Object.entries(data.names)) {
      map.set(Number(id), name);
    }
    return map;
  } catch {
    return null;
  }
}

function saveCachedNames(names: Map<number, string>): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const obj: Record<string, string> = {};
    for (const [id, name] of names) {
      obj[String(id)] = name;
    }

    const data: CachedNames = {
      fetchedAt: new Date().toISOString(),
      names: obj,
    };

    fs.writeFileSync(NAMES_CACHE_FILE, JSON.stringify(data));
  } catch {
    // Non-fatal
  }
}

/**
 * Parse Item.csv — extract key (col 0) and Name (col 10).
 * The CSV has 3 header rows before data starts.
 */
function parseItemCsv(csv: string): Map<number, string> {
  const names = new Map<number, string>();
  const lines = csv.split('\n');

  // Skip 3 header rows: column indices, column names, column types
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV respecting quoted fields — we only need columns 0 (key) and 10 (Name)
    const fields = parseCsvLine(line);
    if (fields.length < 11) continue;

    const id = parseInt(fields[0], 10);
    const name = fields[10].replace(/^"|"$/g, '');

    if (!isNaN(id) && id > 0 && name) {
      names.set(id, name);
    }
  }

  return names;
}

/** Simple CSV line parser that handles quoted fields with commas inside */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
        // Early exit: we only need first 11 columns (0..10)
        if (fields.length >= 11) return fields;
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

export async function loadItemNames(
  onProgress?: (msg: string) => void,
): Promise<Map<number, string>> {
  const cached = loadCachedNames();
  if (cached) {
    onProgress?.(`Using cached Traditional Chinese item names (${cached.size} items)`);
    return cached;
  }

  onProgress?.('Downloading Traditional Chinese item names from ffxiv-datamining-tc...');

  const res = await axios.get<string>(ITEM_CSV_URL, {
    responseType: 'text',
    headers: { 'User-Agent': 'GilFinder/1.0' },
  });

  const names = parseItemCsv(res.data);
  onProgress?.(`Parsed ${names.size} Traditional Chinese item names`);

  saveCachedNames(names);
  return names;
}
