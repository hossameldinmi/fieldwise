# FieldWise: what Claude deep research can fill

Companion to `DATA_REQUESTS.md`. That file lists all 10 data items the team needs. This file sorts them by who can fill them:
- **Claude** can fill an item if the data is published (FAO tables, peer-reviewed papers, government statistics).
- **People** have to fill it if it needs fieldwork, real farmers or expert sign-off.

**Ground rules for any research output**
- Every value carries a citation: author, year, table or page, and a link.
- Values go into `crops_database.xlsx` and must pass `npm run crops:import` validation.
- Research output is a **draft**. An agronomist reviews it before it is treated as final (item 7b).
- Anything from a source outside the Space Apps challenge list is marked as such and needs team approval.

---

## A. Claude can fill it (high confidence)

| # | Item | Sources to use | Output |
|---|---|---|---|
| 2 | Missing crop parameters: cotton, sugar beet, groundnut, sesame, tomato, alfalfa, nili-season crops | FAO-56 (Kc, stage lengths), FAO Ecocrop (temperature, pH), FAO-29 / Maas & Hoffman (salinity), BNF syntheses for legumes, published Egyptian planting calendars | New rows in the `crops` sheet, all columns filled, citations in `sources` |
| 6 | Pests and diseases: root-knot nematode, Fusarium wilts, cotton pests, others common in Egypt | Plant-pathology literature, rotation-break studies | New rows in the `pathogens` sheet: hosts, break years, severity, control type |
| 7a | Check of the existing 11 crops against Egyptian practice | ARC publications, Egyptian agronomy papers | List of differences (field, current value, suggested value, citation). Does **not** replace the expert sign-off |
| 9 | Governorate boundaries | geoBoundaries / GADM (open license) | GeoJSON file plus a license note; code change in `src/lib/geo/regions.ts` |

## B. Claude can partly fill it (estimates; the team must confirm)

| # | Item | What research can find | What stays uncertain |
|---|---|---|---|
| 1 | Crop prices, yields, costs | Average yields (FAOSTAT), the official wheat procurement price, production cost per feddan from Egyptian agricultural-economics papers | Prices change fast, so estimates age quickly. Needs a local check before the demo |
| 4 | Water allocation per feddan | Published ministry allocations, research figures by region | Real canal shares differ by region and canal position |
| 5 | Irrigation efficiency in Egypt | Field studies measured in Egypt | Depends on how well each system is maintained |
| 10 | Groundwater trends | Published regional decline rates (e.g. Nubian Sandstone aquifer) | Well-level data is rarely public |

Output for B: a separate `estimates` sheet. Each row has the value, its range, its year, a citation and a confidence level (low / medium / high).

## C. People only: Claude cannot fill these

| # | Item | Why |
|---|---|---|
| 3 | Demo farms (×3) | Needs real farmers, their actual rotations and soil samples |
| 7b | Expert sign-off | Needs a named agronomist to review and take responsibility |
| 8 | Field-scale soil properties | Not a research task. SoilGrids answers location queries live, so this is a code integration, and it is outside the challenge list (team decision) |

---

## Order of work

1. **#2 + #6** in parallel: crop groups and pathogens. This unblocks the rotation scoring.
2. **#7a**: check the existing crops.
3. **#1**: economics estimates, after the currency decision (USD or EGP).
4. **#4, #5, #10**: water and groundwater estimates.
5. **#9**: governorate boundaries (can run any time; mostly code work).

## Ready-to-use research prompts

**#2 Crop parameters**
> For each crop [cotton, sugar beet, groundnut, sesame, tomato, alfalfa, nili maize, nili tomato] as grown in Egypt, find the values for every column of the FieldWise `crops` sheet (see `src/lib/crops/schema.ts` → `CROP_COLUMNS`). Temperature cardinals must refer to monthly mean air temperature. Sowing dates must be Egyptian practice (day of year). Use FAO-56, FAO Ecocrop, Maas & Hoffman, and Egyptian sources. Cite each value with its table or page. Mark any value that had to be estimated.

**#6 Pathogens**
> List the soil-borne pathogens and pests most relevant to crop rotation in Egypt for these crops: [current crop ids + new crops]. For each, give: host crop ids, minimum rotation break in years, severity (0–1, with reasoning), and whether rotation alone controls it (rotation_effective) or only partly (rotation_partial). Cite each value.

**#7a Check existing crops**
> Compare the sowing window, duration, prep weeks, and water requirement for each crop in `data/crops.json` against published Egyptian practice. Output a table: crop, field, current value, published value, source, and whether a change is recommended.

**#1 Economics**
> For each crop in the FieldWise dataset, find for Egypt in the latest available season: average yield (t/ha), farm-gate price, production cost per hectare, and the 5-year price coefficient of variation. State the currency, year, and exchange rate used. Give a confidence level for each value and cite the source.

---

## Status

| # | Item | Category | Owner | Status |
|---|---|---|---|---|
| 2 | Crop parameters | A: Claude | Claude | ☐ |
| 6 | Pathogens | A: Claude | Claude | ☐ |
| 7a | Check existing crops | A: Claude | Claude | ☐ |
| 9 | Governorate boundaries | A: Claude | Claude | ☐ |
| 1 | Economics | B: Claude + team | | ☐ |
| 4 | Water allocation | B: Claude + team | | ☐ |
| 5 | Irrigation efficiency | B: Claude + team | | ☐ |
| 10 | Groundwater | B: Claude + team | | ☐ |
| 3 | Demo farms | C: team | | ☐ |
| 7b | Expert sign-off | C: team | | ☐ |
| 8 | Soil properties | C: team decision | | ☐ |
