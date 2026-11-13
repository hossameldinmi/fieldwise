# FieldWise — Agricultural Decision Support System

Explainable crop-rotation decisions for Egyptian farms from NASA Earth observations. Built for NASA Space Apps 2026 (Field Shift: Adapting Farms with NASA Data).

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # engine unit tests (vitest)
npm run build
```

Set `NOMINATIM_USER_AGENT="FieldWise/0.1 (you@example.com)"` before deploying; Nominatim's usage policy requires an identifying user agent.

## How a report is produced

1. **Location check** (`src/lib/geo`). GPS is reverse-geocoded through `/api/geocode` (OpenStreetMap Nominatim). If that fails, offline governorate boxes are used and the report says so. GPS always overrides the typed governorate and the override is shown. Typed soil texture is cross-checked against the governorate's soil zone (alluvial Delta and Valley vs. desert reclamation).
2. **Climate** (`src/lib/nasa`). `/api/power` proxies the NASA POWER climatology endpoint (`community=AG`, 2001–2020): T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M, ALLSKY_SFC_SW_DWN. Reference ET₀ is Hargreaves–Samani with FAO-56 extraterrestrial radiation; effective rainfall uses the FAO/AGLW monthly formula.
3. **Schedule** (`engine/calendar.ts`). Agricultural year starts 1 October. Each crop is sown on its preferred date unless the previous harvest plus land preparation (≥ 14 days, or the crop's prep weeks) pushes it later; lateness past the sowing window is penalized.
4. **Scoring** (`engine/dimensions.ts`). Eight dimensions, 0–100 each, weighted 15/15/15/15/15/10/10/5. Every number in the report carries a provenance tier (T1–T5).
5. **Amendments & lab tests** (`engine/amendments.ts`). Lime is only ever suggested when pH < 6.0. Neutral/alkaline soils get gypsum (if sodic), elemental sulfur, or acidifying fertilizers.

## Crop knowledge base

The engine reads crops and pathogens from data, not code.

- `data/crops.json` is the canonical dataset bundled with the app.
- `npm run crops:export` writes `crops_database.xlsx` (sheets `crops`, `pathogens`, `about`).
- Edit the workbook, then `npm run crops:import` validates it (types, ranges, cardinal-temperature order, pathogen host references) and rewrites the JSON.
- The UI can also load an `.xlsx` at runtime and re-score instantly.

Pest breaks are modeled per pathogen (host list + break years), not only per family. That is why the report flags *Verticillium dahliae* in option C: sunflower is a host, so sunflower in year 4 summer immediately precedes year 5 potato.

## Known limitations

- Economic values in the dataset are illustrative placeholders in USD. Replace them before real use.
- Governorate boxes are coarse; they are a fallback only.
- POWER's meteorology grid is roughly 0.5° × 0.625° (MERRA-2); solar is 1° × 1°. That is regional climate, not field microclimate.
- Sentinel-2, GPM IMERG, SRTM, ECOSTRESS and SMAP are not yet wired in. Add each as a provider under `src/lib/` returning `Note`s tagged Tier 1, and a dimension can consume it without UI changes.
- SheetJS is pinned to the vendor CDN tarball (0.20.3) because the npm `xlsx` package stopped at 0.18.5, which has known advisories.
