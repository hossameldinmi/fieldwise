Design the UI for FieldWise, a crop-rotation decision-support web app for farms in Egypt. It is our entry for NASA Space Apps 2026, challenge "Field Shift: Adapting Farms with NASA Data".

## Users and tone
- Egyptian smallholder farmers and agricultural extension officers. Low technical and GIS literacy. Often on a phone in the field.
- Bilingual: Arabic (RTL, default) and English (LTR). Every screen must mirror correctly in RTL. Font: IBM Plex Sans Arabic / IBM Plex Sans.
- The tool supports farmer judgment and never replaces it. Show this as a short reminder wherever the stakes are highest (final recommendation, risk flags). No legal-disclaimer walls.

## Existing visual identity (keep it)
- silt #33291F text, siltSoft #6B5D4D secondary text, sheet #F5F7F2 background ("field-sheet paper"), line #D9DED3 borders
- berseem #2E6B3C primary action, canal #1E5A73 water/data, straw #B8921F caution, blight #962F2F risk
- Calm, paper-like, practical. Not a flashy SaaS dashboard.

## Core flow
1. Farm input: map pin (GPS or tap), area (feddan / hectare / acre), governorate, soil texture (sand → clay), pH, organic matter, ECe (optional), sodic yes/no, irrigation system (drip, sprinkler, surface, canal flood), water security and working capital (low/medium/high), and the farm's CURRENT rotation.
2. Location check: show whether GPS was reverse-geocoded or fell back to offline governorate boxes, and when GPS overrides the typed governorate. Flag a mismatch between the typed soil and the region's soil zone (Delta/Valley alluvial vs. desert reclamation).
3. Report: compare at least 3 rotation strategies, ALWAYS including the farmer's existing rotation as the baseline. For each strategy show:
   - a multi-year season strip (agricultural year starts 1 Oct; seasons: winter, summer, nili), with bare-field gaps and land-prep turnaround visible
   - an overall score plus 8 dimension scores (0–100), weighted 15/15/15/15/15/10/10/5: climatic & thermal suitability, water balance & irrigation demand, soil texture/pH/salinity, biological N fixation & fertility, pest & pathogen break, economic margin & capital risk, calendar & turnaround feasibility, long-term resilience
   - why it was suggested, the evidence, the benefits, the risks that need local review, and the information gaps
   - specific flags, e.g. "Verticillium dahliae: sunflower (year 4 summer) immediately precedes potato (year 5)"
   - soil amendments and lab tests to order (lime only when pH < 6.0; gypsum or sulfur for alkaline/sodic soils)
4. Farmer priorities: let farmers weight what matters (save water, extra income, improve soil structure, nitrogen, break pests) and re-rank the strategies live.
5. Crop dataset panel: load an .xlsx crop database and re-score instantly.

## Data provenance (central to the design)
Every number carries a tier badge (T1–T5) with a tooltip and a legend titled "Where each number comes from":
- T1 Gridded satellite observations
- T2 Deterministic computed indices (GDD, ET₀, ETc, water deficit, scores)
- T3 Peer-reviewed agronomic literature
- T4 Expert and market assumptions (editable)
- T5 Requires laboratory diagnostics (needs a soil sample)

## Allowed data sources: design ONLY around these
Use only sources from the challenge's official resource list. Do not invent or add others. Each source should have a visible place in the UI (a chart, map layer, indicator, or evidence line) and a source-and-resolution caption, e.g. "NASA POWER, ~0.5° grid, 2001–2020 climatology".

Connected now:
- NASA POWER (AG community): monthly temperature (mean/max/min), precipitation, humidity, solar radiation → climate chart, heat-stress months, frost risk, reference ET₀ and crop water demand

Planned (design the slots now and show a "not yet connected" state):
- GPM IMERG: rainfall reliability, extreme-storm frequency, erosion risk
- MODIS / VIIRS NDVI (250 m) and Landsat (30 m): seasonal NDVI curve showing bare-field periods, crop-stress periods, and current-rotation timing
- Copernicus Sentinel-2 (10 m): field-level NDVI / bare-soil map for small Delta fields
- SRTM: slope and runoff/erosion-risk zones (matters most on desert-reclamation land)
- SMAP (9 km): soil-moisture anomaly and drought signal, framed as regional context
- ECOSTRESS (70 m): land-surface temperature and ET hotspots, labeled "irregular overpasses: supporting evidence"
- GLDAS: continuous soil-moisture / ET time series that fills SMAP/ECOSTRESS gaps
- FAO GAEZ: crop suitability and soil constraints as a second opinion on each crop
- ERA5: cross-check of POWER climate values and soil temperature
- GRACE / GRACE-FO (named in the challenge objectives): long-term groundwater-storage trend for groundwater-irrigated desert farms

Not applicable to Egypt (US-only), so leave out of the UI: Web Soil Survey, SSURGO/STATSGO2, CropScape CDL, PRISM, NAIP, NLCD, NLDAS, CoCoRaHS, NWIS, USDA AMS, NASS QuickStats, OpenET, LANDFIRE, Ag Data Commons. Also skip GEDI (built for forest canopy).

## Information gaps must be explicit
The list has no global source for these, so show them honestly as gaps, not hidden:
- Detailed soil properties: use GAEZ soil constraints plus farmer input, and suggest a lab test (T5)
- Egyptian market prices: values are illustrative placeholders (T4), with a clear "replace with local prices" marker
- Field-scale microclimate: POWER is regional climate, not field microclimate

## Visualization ideas (optional add-ons from the challenge)
- Map with toggleable layers (NDVI, slope/erosion, soil-moisture anomaly, LST hotspots) and a timeline slider
- Scenario sliders: rainfall −30%…+30%, temperature +0…+3 °C, re-scoring strategies live
- Plain-language explainers (one tap) for ET, NDVI, soil-moisture anomaly, frost risk, water balance, and satellite vs. ground measurement

## Deliverables
Mobile-first screens (360 px) plus desktop: farm input, location check, strategy comparison, strategy detail, data-sources/provenance panel, and the empty/loading/error/not-connected states for each data source. Arabic RTL versions of the key screens.
