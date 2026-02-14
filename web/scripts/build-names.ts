/**
 * Build script: downloads Item.csv from ffxiv-datamining-tc and outputs
 * a flat JSON dictionary { "itemId": "繁中名稱" } to public/item-names-tc.json.
 *
 * Run: npx tsx scripts/build-names.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ITEM_CSV_URL = 'https://raw.githubusercontent.com/thewakingsands/ffxiv-datamining-tc/master/Item.csv';
const OUTPUT_PATH = path.resolve(__dirname, '../public/item-names-tc.json');

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
        if (fields.length >= 11) return fields;
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

async function main() {
  console.log('Downloading Item.csv from ffxiv-datamining-tc...');
  const res = await fetch(ITEM_CSV_URL);
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  const csv = await res.text();

  console.log('Parsing CSV...');
  const names: Record<string, string> = {};
  const lines = csv.split('\n');
  let count = 0;

  // Skip 3 header rows
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const fields = parseCsvLine(line);
    if (fields.length < 11) continue;

    const id = parseInt(fields[0], 10);
    const name = fields[10].replace(/^"|"$/g, '');

    if (!isNaN(id) && id > 0 && name) {
      names[String(id)] = name;
      count++;
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(names));

  const sizeKB = Math.round(fs.statSync(OUTPUT_PATH).size / 1024);
  console.log(`Done: ${count} items, ${sizeKB} KB → ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
