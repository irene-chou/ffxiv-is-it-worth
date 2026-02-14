# GilFinder

FFXIV crafting profit analyzer — find the most profitable recipes to craft and sell on the market board.

GilFinder fetches recipe data from [XIVAPI](https://xivapi.com/) and market prices from [Universalis](https://universalis.app/), calculates production costs and sale prices (including market tax), and ranks recipes by profit margin. It supports all 8 crafting jobs and displays results with Traditional Chinese item names.

## Features

- Analyzes all recipes for a given crafting job and server
- Fetches real-time market board prices via Universalis
- Calculates profit after 5% market tax
- Filters out recipes with no recent sales (>24h) or missing prices
- Caches recipes (7 days), item names (7 days), and market prices (30 min)
- Available as both a CLI tool and a React web app

## Crafting Jobs

| ID | Job |
|----|-----|
| 0 | 木工 (Carpenter) |
| 1 | 鍛造 (Blacksmith) |
| 2 | 甲冑 (Armorer) |
| 3 | 金工 (Goldsmith) |
| 4 | 皮革 (Leatherworker) |
| 5 | 裁縫 (Weaver) |
| 6 | 鍊金 (Alchemist) |
| 7 | 烹調 (Culinarian) |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

## CLI Usage

```bash
# Install dependencies
npm install

# Run the analyzer
npm start
```

The CLI will prompt you to select a crafting job, server name (default: 鳳凰), and optional max recipe level, then display the top 5 most profitable recipes.

## Web App

```bash
cd web

# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
src/               # Shared backend / CLI code
  index.ts         # CLI entry point
  calculator.ts    # Profit calculation logic
  xivapi.ts        # XIVAPI v2 client (recipes)
  universalis.ts   # Universalis client (market prices)
  cache.ts         # File-based caching
  translations.ts  # Traditional Chinese item names
  types.ts         # TypeScript interfaces
  constants.ts     # Configuration constants
web/               # React web frontend
  src/
    App.tsx        # Main React component
    components/    # UI components
    hooks/         # Custom React hooks
    lib/           # Web API client wrappers
docs/
  api-reference.md # API documentation and notes
```

## Tech Stack

**CLI:** TypeScript, Node.js, Axios

**Web:** React 19, Vite, TailwindCSS, React Query

## APIs

- [XIVAPI v2](https://v2.xivapi.com) — game data (recipes, items)
- [Universalis](https://universalis.app/api/v2) — market board prices
