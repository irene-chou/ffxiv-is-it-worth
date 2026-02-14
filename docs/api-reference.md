# GilFinder API Reference

Tested on 2025-02-15. This document records the actual API response formats
so the code can be written and debugged confidently.

---

## 1. XIVAPI v2 — Recipe Search

**Base URL:** `https://v2.xivapi.com`

### 1.1 Search Endpoint

```
GET /api/search?sheets=Recipe&query=CraftType={id}&fields={fields}&limit=500
```

- `query`: use `CraftType={id}` (e.g. `CraftType=4` for Leatherworking). Language-independent.
  - Do NOT use `CraftType.Name="Alchemy"` — this only works in English and breaks when language changes.
- `fields`: comma-separated. Array fields MUST use `[]` syntax.
  - Correct: `Ingredient[].value,Ingredient[].Name`
  - Wrong:  `Ingredient.value,Ingredient.Name` → 400 error "expected array filter"
- `limit`: max 500
- `language`: supports `en`, `ja`, `fr`, `de` only. NO Chinese (`chs`, `cht`, `zh` → 400 error).

### 1.2 Response Format (success)

```json
{
  "next": "fb900601-0676-49e7-84bd-dc0dfe826662",   // cursor UUID token, or ABSENT on last page
  "schema": "exdschema@2:rev:...",
  "version": "98ec9341db247bc3",
  "results": [
    {
      "score": 1.0,
      "sheet": "Recipe",
      "row_id": 302,
      "fields": {
        "ItemResult": {
          "value": 5275,            // Item ID
          "sheet": "Item",
          "row_id": 5275,
          "fields": { "Name": "Leather" }
        },
        "AmountResult": 1,
        "AmountIngredient": [1, 0, 0, 0, 0, 0, 1, 0],   // always 8 elements
        "Ingredient": [                                    // always 8 elements
          { "value": 5291, "sheet": "Item", "row_id": 5291, "fields": { "Name": "Animal Skin" } },
          { "value": 0, "sheet": "Item", "row_id": 0, "fields": { "Name": "" } },
          // ... 4 more empty slots ...
          { "value": 5, "sheet": "Item", "row_id": 5, "fields": { "Name": "Earth Shard" } },
          { "value": -1 }           // ← last slot can be { value: -1 } with NO other fields
        ]
      }
    }
  ]
}
```

### 1.3 Pagination

- `next` is a **UUID cursor token** (e.g. `"fb900601-..."`), NOT a full URL.
- Build next page URL: `{base_url}&cursor={next_token}`
- Last page: `next` key is **absent** from the response (not null, not empty string).
- Typical page sizes: 500, 500, 500, ..., N (where N < 500 on last page).
- Example: CraftType=4 (Leatherworking) → 4 pages, ~1997 total recipes.

### 1.4 Ingredient Array Notes

- Always 8 elements (indices 0-7). Typically indices 0-5 are materials, 6-7 are crystals.
- Empty slots: `{ value: 0, fields: { Name: "" } }` with `AmountIngredient[i] = 0`.
- Last slot may be `{ value: -1 }` with no `sheet`/`row_id`/`fields` — must handle gracefully.
- Filter: skip ingredients where `value <= 0` or `AmountIngredient[i] === 0`.

### 1.5 Error Responses

```json
{ "code": 400, "message": "invalid request: ..." }
```

Common errors:
- Wrong array syntax: `"expected array filter, got Struct(...)"`
- Unsupported language: `"invalid or unsupported language \"chs\""`
- Missing query: `"search queries must contain a query or cursor"`

---

## 2. Universalis — Market Prices

**Base URL:** `https://universalis.app/api/v2`

### 2.1 Price Endpoint

```
GET /{world}/{itemId}              # single item
GET /{world}/{id1},{id2},{id3}     # multi-item (max 100 per request)
```

- `world`: supports 繁中服 world names directly (e.g. `鳳凰`, URL-encoded as `%E9%B3%B3%E5%87%B0`).
- Must include `User-Agent` header.

### 2.2 Single-Item Response (flat)

```json
{
  "itemID": 5487,
  "worldID": 4031,
  "worldName": "鳳凰",
  "minPriceNQ": 10,
  "minPriceHQ": 17,
  "minPrice": 10,              // ← Universalis computes this correctly
  "maxPrice": 100,
  "lastUploadTime": 1771032247351,
  "listingsCount": 18,
  "hasData": true,              // ← NOTE: this is a top-level field, NOT inside listings
  "listings": [ ... ],
  "recentHistory": [ ... ],
  "currentAveragePrice": 36.44,
  "regularSaleVelocity": 3.14,
  // ... more stats
}
```

**Key point:** NO `items` wrapper, NO `unresolvedItems`. Response is flat.

### 2.3 Multi-Item Response (wrapped)

```json
{
  "itemIDs": [5487, 1, 9999999],
  "items": {
    "5487": {                      // keys are STRING item IDs
      "itemID": 5487,
      "minPriceNQ": 10,
      "minPriceHQ": 17,
      "minPrice": 10,
      "lastUploadTime": 1771032247351,
      "listingsCount": 18,
      "hasData": true,             // ← NOTE: this is NOT a top-level field in multi-item
      "listings": [ ... ],
      // ... same fields as single-item
    }
  },
  "unresolvedItems": [1, 9999999],   // items that are untradable or don't exist
  "worldID": 4031,
  "worldName": "鳳凰"
}
```

### 2.4 minPrice Behavior

Universalis provides `minPrice` directly — **use it as-is**, do NOT compute it yourself.

| minPriceNQ | minPriceHQ | minPrice | Meaning                          |
|-----------|-----------|---------|----------------------------------|
| 10        | 17        | 10      | Both NQ+HQ available, NQ cheaper |
| 6         | 0         | 6       | NQ only, no HQ listings          |
| 0         | 50        | 50      | HQ only (rare)                   |
| 0         | 0         | 0       | No listings at all               |

**Bug to avoid:** `Math.min(minPriceNQ, minPriceHQ)` returns 0 when one is 0. Use `minPrice` from the API instead.

### 2.5 Error Responses

**Untradable single item (e.g. item 1, Gil):**
```json
{ "status": 404, "title": "Not Found", "type": "https://...", "traceId": "..." }
```
No `itemID`, `minPrice`, etc. fields. Must catch this.

**Invalid world name:**
```json
{ "status": 404, "title": "Not Found", "type": "https://...", "traceId": "..." }
```
Same 404 format.

**Multi-item with some untradable:** returns 200 with valid items in `items` and invalid IDs in `unresolvedItems`.

### 2.6 繁中服 Server Info

| Data Center | World   | World ID |
|------------|---------|----------|
| 陸行鳥      | 伊弗利特 | 4028     |
| 陸行鳥      | 迦樓羅   | 4029     |
| 陸行鳥      | 利維坦   | 4030     |
| 陸行鳥      | 鳳凰    | 4031     |
| 陸行鳥      | 奧汀    | 4032     |
| 陸行鳥      | 巴哈姆特 | 4033     |
| 陸行鳥      | 拉姆    | 4034     |
| 陸行鳥      | 泰坦    | 4035     |

---

## 3. Traditional Chinese Item Names

**Source:** `https://github.com/thewakingsands/ffxiv-datamining-tc`
(submodule of `xivapi/ffxiv-datamining` at `csv/tc`)

**Raw URL:** `https://raw.githubusercontent.com/thewakingsands/ffxiv-datamining-tc/master/Item.csv`

### 3.1 Item.csv Format

- Size: ~17MB
- Encoding: UTF-8 with BOM
- 3 header rows, then data rows
- Column 0 = key (item ID), Column 10 = Name (繁體中文)

```csv
﻿key,0,1,2,3,4,5,6,7,8,9,10,...
#,Singular,Adjective,Plural,...,Name,...
int32,str,...
1,...,"","","","","","","","","","格爾幣",...
2,...,"","","","","","","","","","火之碎晶",...
```

### 3.2 CraftType.csv

| ID | 繁中名稱 |
|----|---------|
| 0  | 木工    |
| 1  | 鍛造    |
| 2  | 甲冑    |
| 3  | 金工    |
| 4  | 皮革    |
| 5  | 裁縫    |
| 6  | 鍊金    |
| 7  | 烹調    |
