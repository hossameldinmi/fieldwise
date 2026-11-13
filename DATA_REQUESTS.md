# FieldWise: data the team needs to find

NASA satellite data covers climate, rain, vegetation, terrain and soil moisture. It does **not** cover the items below. For each one, please find a provider, check the license allows use in a public hackathon app, and fill in the tracking table at the end.

**Rules**
- **Source boundary.** We prefer the official Space Apps "Field Shift" resource list. Items marked **(outside list)** have no global source on that list. Before we use one, the team must agree on it and record it in the README.
- **Where data goes.** Crop and pathogen data goes into `crops_database.xlsx` (sheets `crops` and `pathogens`). Run `npm run crops:import`, which validates the workbook and rewrites `data/crops.json`.
- **Citations.** Every value needs a citation. It goes in the `sources` column for crops, or in the tracking table.

---

## Priority 1: the report is wrong or empty without these

### 1. Crop economics for Egypt
All economic values in `data/crops.json` are illustrative USD placeholders. The economic dimension (10% weight) and the report's margin figures depend on them.

| Field (xlsx column) | Unit | Notes |
|---|---|---|
| `yield_t_ha` | t/ha | Average farm yield. If the source reports t/feddan, convert: 1 feddan = 0.42 ha |
| `price_usd_t` | USD/t (or EGP/t, see note) | Farm-gate price for the latest season |
| `cost_usd_ha` | USD/ha (or EGP/ha) | Total production cost: seed, fertilizer, labor, irrigation, rent if relevant |
| `price_cv` | 0–1 | Price volatility: coefficient of variation over the last 5+ years |
| `capital` | low / medium / high | Working capital needed before harvest |

- **Needed for:** wheat, barley, berseem, faba bean, potato, onion, maize, sorghum, sunflower, soybean, rice, plus the new crops in item 2.
- **Currency:** we need to decide whether to stay in USD or switch to EGP. Switching means a code change to labels and fields. Record the exchange rate and date used.
- **Leads:** Ministry of Agriculture and Land Reclamation (MALR) Economic Affairs Sector statistics bulletins; CAPMAS; the official wheat procurement price; FAOSTAT producer prices **(outside list)**.

### 2. Missing major Egyptian crops
The crop list has no cotton, sugar beet, groundnut, sesame, tomato or alfalfa, and no **nili**-season crops, although the app supports that season. Every crop needs every column of the `crops` sheet:

| Group | Columns |
|---|---|
| Identity | `id`, `name_en`, `name_ar`, `family`, `season` (winter / summer / nili) |
| Calendar | `sow_doy`, `sow_start_doy`, `sow_end_doy` (day of year), `duration_days`, `prep_weeks` |
| Temperature | `t_base`, `t_opt_min`, `t_opt_max`, `t_max` (°C, **monthly mean air temperature**), `gdd_req` |
| Water | `water_ref_mm`, `kc_ini`, `kc_mid`, `kc_end` |
| Soil | `tex_sand`, `tex_loamy_sand`, `tex_sandy_loam`, `tex_loam`, `tex_clay_loam`, `tex_clay` (suitability 0–100), `ph_min`, `ph_opt_min`, `ph_opt_max`, `ph_max`, `ece_threshold`, `ece_slope` |
| N fixation (legumes only) | `bnf_total_low/high`, `bnf_net_low/high` (kg N/ha), `bnf_uncertainty` |
| Rotation | `root` (fibrous / taproot / tuber_bulb), `tuber_or_bulb`, `family_break_years` |
| Economics | as in item 1 |

- **Leads:** FAO-56 tables (Kc, season lengths); FAO-29 / Maas & Hoffman (salinity); FAO Ecocrop (temperature, pH); Agricultural Research Center (ARC) Field Crops Research Institute for Egyptian planting dates.

### 3. The farmer's current rotation (from demo farms)
The challenge requires comparing strategies against the **existing** rotation. We need 2–3 real farms covering:
- Delta clay (e.g. Kafr El Sheikh or Dakahlia)
- Upper Egypt (e.g. Minya or Assiut)
- Desert reclamation on sandy soil (e.g. Nubaria or Ismailia)

For each farm, collect:
- GPS location and area
- What was planted each season for the last 3–5 years, with yields if known
- A soil test if available: pH, ECe, organic matter, texture, ESP
- Irrigation system and water source (canal, groundwater, mixed)

**Leads:** team contacts, farmers' families, agricultural extension officers, ARC research stations.

---

## Priority 2: makes scores credible

### 4. Water allocation per feddan
`WATER_BUDGET_MM` in `src/lib/engine/dimensions.ts` is an assumption: high 1800, medium 1300, low 900 mm/yr.

- **Need:** typical annual irrigation water available per feddan (m³/feddan/yr), by region (Delta, Valley, reclaimed desert) and by water source. Also the canal rotation schedule if available.
- **Leads:** Ministry of Water Resources and Irrigation (MWRI); National Water Research Center; FAO AQUASTAT **(outside list)**.

### 5. Irrigation efficiency in Egypt
`IRRIGATION_EFFICIENCY` in `dimensions.ts` uses generic values: drip 0.875, sprinkler 0.75, surface 0.6, canal flood 0.55.

- **Need:** field application efficiency measured in Egypt for each system.
- **Leads:** MWRI / National Water Research Center reports, peer-reviewed studies.

### 6. Pests and diseases
The `pathogens` sheet has only 6 entries: take-all, cereal cyst nematode, potato cyst nematode, Verticillium, broomrape, onion white rot. Each new entry needs `id`, `name_en`, `name_ar`, `hosts` (crop ids), `break_years`, `severity` (0–1) and `control` (rotation_effective / rotation_partial).

- **Suggested additions:** root-knot nematode (many hosts), Fusarium wilts, pests of cotton (if cotton is added), and any soil-borne problem the agronomist flags as common.
- **Leads:** ARC Plant Pathology Research Institute; published rotation-break studies.

### 7. Review of the existing 11 crops
The dataset version is `2026.11-draft`. Sowing windows, durations and land-prep weeks need a check against Egyptian practice by an agronomist.

- **Need:** one named reviewer (agronomist or extension officer) who signs off on the crop and pathogen sheets.
- **Lead:** ARC.

---

## Priority 3: improves precision (optional)

### 8. Detailed soil properties **(outside list)**
No source on the challenge list gives field-scale soil data for Egypt. Today the app uses the farmer's inputs plus coarse regional soil zones.

- **Need:** pH, texture, organic carbon and salinity at ≤ 1 km resolution.
- **Leads:** ISRIC SoilGrids (250 m, global); HWSD v2; ARC Soils, Water and Environment Research Institute.
- **Decision needed:** use one of these, or keep this as a stated information gap.

### 9. Governorate boundaries
`src/lib/geo/regions.ts` uses rough rectangles for 25 governorates as the offline fallback.

- **Need:** real admin-1 boundary polygons for Egypt, with an open license.
- **Leads:** geoBoundaries, GADM, HDX.

### 10. Local groundwater levels
Only needed for desert-reclamation farms. GRACE-FO is far too coarse (~300 km) for a single farm.

- **Need:** well depth or water-table trend data.
- **Lead:** MWRI Research Institute for Groundwater.

---

## Already covered: access only, no provider search needed

The satellite sources below are already named on the challenge list. The team only needs:
- a free **NASA Earthdata login**
- a **Copernicus Data Space** account for Sentinel-2

| Source | What we use it for |
|---|---|
| NASA POWER | Climate (already connected); add wind speed and soil wetness |
| GPM IMERG | Rain reliability, storm frequency |
| MODIS / VIIRS, Landsat | NDVI time series, bare-field periods |
| Sentinel-2 | Field-level NDVI |
| SRTM | Slope, erosion |
| SMAP, GLDAS | Soil moisture |
| ECOSTRESS | Land-surface temperature, evapotranspiration |
| FAO GAEZ | Crop suitability check |
| ERA5 | Climate cross-check |
| GRACE-FO | Groundwater trend (regional) |

---

## Tracking table

| # | Item | Owner | Provider found | Link | License OK? | Format | Status |
|---|---|---|---|---|---|---|---|
| 1 | Crop economics (Egypt) | | | | | | ☐ |
| 2 | Missing crops parameters | | | | | | ☐ |
| 3 | Demo farms (×3) | | | | | | ☐ |
| 4 | Water allocation per feddan | | | | | | ☐ |
| 5 | Irrigation efficiency | | | | | | ☐ |
| 6 | Pests and diseases | | | | | | ☐ |
| 7 | Agronomist review | | | | | | ☐ |
| 8 | Soil properties | | | | | | ☐ |
| 9 | Governorate boundaries | | | | | | ☐ |
| 10 | Groundwater levels | | | | | | ☐ |
| — | Earthdata + Copernicus accounts | | n/a | | | | ☐ |
