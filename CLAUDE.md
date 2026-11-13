# FieldWise

Bilingual (EN/AR, full RTL) crop-rotation decision tool for Egyptian farms, built on NASA Earth observations for NASA Space Apps 2026 ("Field Shift: Adapting Farms with NASA Data"). Live at https://fieldwise.canarie.dev.

## Commands

```bash
npm ci
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm test           # vitest (engine, NASA parsers, geo)
npm run build      # next build
npm run preview    # build for Cloudflare and run locally in workerd (:8787)
npm run deploy     # build + deploy the Cloudflare Worker (needs Cloudflare auth)
```

Run `npm run typecheck && npm test` before every commit. Pushing to `main` deploys automatically (`.github/workflows/deploy.yml`), so `main` must always build. Every pull request from this repo uploads a preview version of the same Worker (`.github/workflows/preview.yml`, `wrangler versions upload --preview-alias pr-<n>`) at `https://pr-<n>-fieldwise.<account>.workers.dev` and comments the URL on the PR; it never takes production traffic.

## Stack

Next.js 15 App Router, React 19, TypeScript, Tailwind 3, react-leaflet 5, SheetJS (vendor CDN tarball), vitest. Deployed as a Cloudflare Worker through `@opennextjs/cloudflare` (`wrangler.jsonc`, `open-next.config.ts`). There is no database: crops come from `data/crops.json`, and everything else is computed per request.

## Layout

- `src/app/page.tsx`: app state and the 5-step flow (farm → climate → rotations → report → crop database).
- `src/app/api/{power,ndvi,geocode}/route.ts`: server proxies for NASA POWER, ORNL MODIS NDVI and Nominatim.
- `src/lib/nasa`: POWER parsing, FAO-56 Penman-Monteith ET₀ (Hargreaves fallback), MODIS NDVI summary.
- `src/lib/engine`: deterministic scoring. 8 dimensions weighted 15/15/15/15/15/10/10/5; strategies A (farmer's current) / B / C / D (custom).
- `src/lib/geo`: 27 governorates, reverse-geocode verification with bbox fallback.
- `src/lib/i18n.ts` + `src/lib/i18n-ui.ts`: every user-visible string, EN and AR. Add both languages for any new string.
- `src/components`: one component per step plus shared `ui.tsx`. Design tokens live in `tailwind.config.ts` and `src/app/globals.css` (`fw-*` classes).

## Rules

- **Data sources:** use only the resources listed on the Space Apps challenge Resources tab (NASA POWER, MODIS, SMAP, GPM IMERG, ECOSTRESS, SRTM, GLDAS, GRACE-FO, Landsat, Sentinel-2, ERA5, FAO GAEZ, etc.). Do not add other data providers.
- Every number shown to the user carries a provenance tier (T1–T5). Don't present an assumption as an observation.
- POWER climatology `T2M_MAX`/`T2M_MIN` are monthly extremes, not mean daily max/min. Use `T2M ± T2M_RANGE/2` for daily means.
- Agricultural year starts 1 October.
- Secrets (Earthdata, Copernicus, Cloudflare tokens) go in environment variables or GitHub secrets, never in the repo.

## Team docs

`CROP_DATABASE_SPEC.md` (crop columns and Egypt research values; `crops_database.xlsx` is the editable source, `npm run crops:import` rewrites `data/crops.json`), `DATA_REQUESTS.md` (values the team must supply, e.g. water budgets), `RESEARCH_PLAN.md`, `CLAUDE_DESIGN_PROMPT.md`.

## Known open issues

- Water dimension scores 0 for all options: `WATER_BUDGET_MM` in `src/lib/engine/dimensions.ts` (medium 1300 mm) is below gross irrigation need (~1,900 mm). Waiting on the team (DATA_REQUESTS item #4).
- Economic values in `data/crops.json` are placeholders for berseem, potato, onion, sorghum and rice; the other 6 crops use the team's workbook values.
- Pest dimension scores 0 for options A, B and C with the team's pathogen sheet (break years 2–3, broad Fusarium hosts, cereal `family_break_years` 1): penalties add up uncapped. Needs a team review of break years/severity or a per-pathogen cap in `pest()`.
- Fetch caching doesn't persist on Cloudflare yet (no incremental cache configured).
