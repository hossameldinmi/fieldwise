# FieldWise crop database: specification for the agriculture team

**Scope:** MVP with 6 crops: Wheat, Faba Bean, Maize, Soybean, Sunflower, Barley.
**Audience:** the agriculture team filling the Google Sheet.
**Source of truth:** `src/lib/crops/schema.ts`. The column names below are exactly what the importer reads.

---

## 0. How to work with the sheet

1. **Start from the existing values.** All 6 MVP crops already exist in `data/crops.json` with literature values. Upload `crops_database.xlsx` (repo root) to Google Sheets and **review and correct** each value instead of starting from blank.
2. **Keep the sheet structure.** Tab names must stay `crops` and `pathogens`, and row 1 headers must match **exactly** (lowercase, underscores). A missing or misspelled required column fails the import; extra columns are ignored.
3. **Hand back to developers.** When done, use *File → Download → Microsoft Excel (.xlsx)*. A developer runs `npm run crops:import`, which validates every value and rewrites `data/crops.json`. Any error names the crop and the column.
4. **Use these exact crop ids:** `wheat`, `faba_bean`, `maize`, `soybean`, `sunflower`, `barley`. Other sheets reference crops by id.
5. **Number formats:** a plain dot decimal (`7.5`). No units inside cells, no thousands separators, no `%` sign.
6. **Cite everything.** Every row needs a citation in `sources`, separated by `;`, e.g. `FAO-56 Table 12; Maas & Hoffman 1977; ARC 2023 bulletin`.
7. **Start from the research draft.** Section 6 has Egypt-specific values researched from FAO and Egyptian sources (November 2026). Review those first; they replace the older placeholder values.

### Column priority

Not every column carries equal weight. Spend review time in this order:

| Priority | Columns | Why |
|---|---|---|
| **Scored** (fill carefully) | `family`, `season`, `sow_doy`, `sow_end_doy`, `duration_days`, `prep_weeks`, `t_*`, `gdd_req`, `kc_*`, `tex_*`, `ph_*`, `ece_*`, `bnf_net_*`, `root`, `family_break_years`, `yield_t_ha`, `price_usd_t`, `cost_usd_ha`, `price_cv`, and every `pathogens` column | The engine computes scores from these |
| **Display only** (best effort) | `water_ref_mm`, `bnf_total_low/high`, `bnf_uncertainty`, `name_en`, `name_ar`, `sources` | Shown in the report or kept for traceability; never change a score |
| **Unused, to be removed** | `capital`, `sow_start_doy`, `tuber_or_bulb` | No code reads them (`tuber_or_bulb` duplicates `root = tuber_bulb`). The importer still requires them until developers remove them, so enter any valid value for now |
| **Developer-owned** | `gaez_crop_code` | A fixed mapping to FAO's codes; developers add it in code |

---

## 1. Sheet `crops`: one row per crop

### 1.1 Identity

| Column | Type / format | Example | How the engine uses it |
|---|---|---|---|
| `id` | text, lowercase snake_case, unique | `faba_bean` | Key that links rotations, pathogens and the UI |
| `name_en` | text | `Faba bean` | English report label |
| `name_ar` | text | `فول بلدي` | Arabic report label |
| `family` | text, Latin botanical family, **exact spelling** | `Poaceae`, `Fabaceae`, `Asteraceae` | **Pest:** consecutive crops from the same family lose 8 points each time, and family break rules apply. **Nitrogen:** the engine detects cereals by the exact string `Poaceae`; a rotation that is ≥ 75% Poaceae gets a −25 monoculture penalty. **Resilience:** more distinct families score higher |
| `season` | category: `winter` / `summer` / `nili` | `winter` | Which rotation slot the crop can occupy |

### 1.2 Calendar

All dates are **day of year (1–365)**. The agricultural year starts 1 October (DOY 274).

| Column | Type | Rule | How the engine uses it |
|---|---|---|---|
| `sow_doy` | integer 1–365 | Preferred sowing date in Egypt | The scheduler sows on this date unless the previous crop's harvest plus land preparation pushes it later |
| `sow_start_doy` | integer 1–365 | Earliest acceptable sowing | **Unused** (to be removed). Nothing reads the start of the window |
| `sow_end_doy` | integer 1–365 | Latest acceptable sowing | Each day sown after this costs calendar points (up to −30 per crop) |
| `duration_days` | integer 30–330 | Sowing to harvest | Sets the harvest date. Also defines which climate months the crop "lives through" for the thermal and water calculations |
| `prep_weeks` | integer 0–8 | Land prep needed before this crop | Required gap = max(14 days, prep_weeks × 7). A gap ≥ 21 days scores 100, ≥ 14 days scores 80, shorter is a turnaround risk |

### 1.3 Temperature: matched against NASA POWER `T2M`

> ⚠️ All temperatures are **monthly mean air temperature** (what POWER climatology provides), not daily extremes. A crop with a 30 °C daily maximum limit typically has a monthly-mean `t_max` of around 25–27 °C.

| Column | Type | Rule | How the engine uses it |
|---|---|---|---|
| `t_base` | number °C | Growth stops below this | Lower end of the fit curve, and the base for growing degree days (GDD) |
| `t_opt_min` | number °C | Start of the optimum range | **Fit = 100** inside [opt_min, opt_max], falling linearly to 0 at t_base and at t_max |
| `t_opt_max` | number °C | End of the optimum range | Same as above |
| `t_max` | number °C | Growth stops or damage above this | Any month whose mean exceeds it raises a **heat-risk flag**. It also caps GDD accumulation |
| `gdd_req` | number °C·days | GDD from sowing to maturity, base = t_base | Thermal score = 70% daily temperature fit + 30% (GDD achieved ÷ gdd_req) |

**Validation:** `t_base < t_opt_min ≤ t_opt_max < t_max`. Otherwise the import fails.

### 1.4 Water: matched against POWER-derived ET₀ and rainfall

| Column | Type | Rule | How the engine uses it |
|---|---|---|---|
| `kc_ini` | number 0–1.5 | FAO-56 crop coefficient, initial stage | Each day: ETc = Kc(stage) × ET₀ from POWER. Kc moves from ini (first 20% of season) up to mid (50–80%) and toward end |
| `kc_mid` | number 0–1.5 | Mid-season Kc | Same as above |
| `kc_end` | number 0–1.5 | Late-season Kc | Same as above |
| `water_ref_mm` | number mm | Typical seasonal water need from the literature | **Reference only:** shown beside the computed ETc in the report as a sanity check. Not used in scoring |

The water score works like this: seasonal irrigation need = ETc − effective rain, divided by irrigation efficiency, then compared with the farm's water budget. It is **lower** when the rotation's gross irrigation demand gets close to or exceeds the farm's water availability.

### 1.5 Soil: matched against farm-profile soil type, pH and ECe

| Column | Type | Rule | How the engine uses it |
|---|---|---|---|
| `tex_sand` | integer 0–100 | Suitability on this texture | The farm's soil type selects one column. Soil score = **50%** texture + **30%** pH + **20%** salinity |
| `tex_loamy_sand` | integer 0–100 | Same | Same |
| `tex_sandy_loam` | integer 0–100 | Same | Same |
| `tex_loam` | integer 0–100 | Same | Same |
| `tex_clay_loam` | integer 0–100 | Same | Same |
| `tex_clay` | integer 0–100 | Same | Same |
| `ph_min` | number | Tolerable minimum | pH fit = 100 inside the optimum range, 60–100 between the tolerable limit and the optimum, then drops steeply outside the tolerable range |
| `ph_opt_min` | number | Optimum lower bound | Same as above |
| `ph_opt_max` | number | Optimum upper bound | Same as above |
| `ph_max` | number | Tolerable maximum | Same as above |
| `ece_threshold` | number dS/m | Maas–Hoffman threshold: no yield loss below it | Salinity score = 100 − slope × (farm ECe − threshold) |
| `ece_slope` | number % per dS/m | Maas–Hoffman yield-loss slope | Same as above |

**Validation:** `ph_min ≤ ph_opt_min ≤ ph_opt_max ≤ ph_max`.

### 1.6 Nitrogen fixation: legumes only

**Leave all five cells empty for non-legumes.** An empty `bnf_total_low` marks the crop as non-fixing. We don't use a boolean column because the engine needs the *amount* of fixation, not just yes or no.

| Column | Type | How the engine uses it |
|---|---|---|
| `bnf_total_low` | number kg N/ha | Shown in the report |
| `bnf_total_high` | number kg N/ha | Shown in the report |
| `bnf_net_low` | number kg N/ha | **Net** N left for the next crop after harvest removal. Nitrogen score = 35 + 2.5 × (average net credit per year) + 15 × (share of legume seasons) |
| `bnf_net_high` | number kg N/ha | Same as above |
| `bnf_uncertainty` | category: `low` / `medium` / `high` | Shown in the report so farmers see how firm the figure is |

### 1.7 Rotation biology

| Column | Type | How the engine uses it |
|---|---|---|
| `root` | category: `fibrous` / `taproot` / `tuber_bulb` | **Resilience:** alternating deep-rooted (`taproot`) and shallow crops scores higher (soil structure, nutrient pumping) |
| `tuber_or_bulb` | boolean `TRUE` / `FALSE` | On clay soil, tuber or bulb crops get a −16 soil penalty. **Duplicates `root = tuber_bulb`; to be removed** (`FALSE` for all 6 MVP crops) |
| `family_break_years` | integer 0–10 | Minimum years before the same family returns. Required non-host seasons = 2 × years; each shortfall costs up to −30 pest points |

### 1.8 Economics

| Column | Type | How the engine uses it |
|---|---|---|
| `yield_t_ha` | number t/ha (1 feddan = 0.42 ha) | Revenue = yield × price |
| `price_usd_t` | number USD/t | Same as above |
| `cost_usd_ha` | number USD/ha | Margin = revenue − cost. The most expensive single season is checked against the farm's working capital (low ≤ 2000, medium ≤ 4000 USD/ha) |
| `price_cv` | number 0–2 | Price volatility (std ÷ mean over ≥ 5 years). Risk-adjusted margin = margin − 0.5 × risk; strategies are scored relative to the best one |
| `capital` | category: `low` / `medium` / `high` | **Currently unused** (the capital check uses `cost_usd_ha`). Required by the importer only |
| `sources` | text, `;`-separated | Traceability for reviewers. Stored in the dataset, not shown in the report yet |

> Currency is USD today. If the team wants EGP, tell the developers first: the column names and labels need a code change. Record the exchange rate and date in `sources`.

---

## 2. New columns needed for SMAP, GAEZ and frost

The current engine uses only NASA POWER. To use the other inputs in the brief, please **also** collect these columns. They are **not yet read by the importer**; developers will add them. Add them at the end of the `crops` sheet.

| Column | Type | Source | Planned use |
|---|---|---|---|
| `root_depth_m` | number m (e.g. 1.0–1.7) | FAO-56 Table 22 (Zr, max effective rooting depth) | Match **SMAP** surface vs root-zone moisture to how deep the crop draws water. Deep-rooted crops tolerate a dry surface better |
| `depletion_p` | number 0–1 | FAO-56 Table 22 (p, depletion fraction before stress) | **Drought tolerance.** Combined with the SMAP soil-moisture anomaly: a low `p` means the crop is stressed sooner in dry years, lowering its water score |
| `frost_kill_c` | number °C (daily minimum) | Agronomy literature | Compared with **POWER daily `T2M_MIN`** to count frost-risk days during the season |
| `gaez_crop_code` | text, as listed in the GAEZ v4 data portal | FAO GAEZ v4 | Look up the GAEZ suitability index at the farm's coordinates as an independent second opinion. A large disagreement with our thermal/soil score is flagged for review. **Developer-owned:** the agriculture team can skip it |

---

## 3. Sheet `pathogens`: one row per pest or disease

| Column | Type | Example | How the engine uses it |
|---|---|---|---|
| `id` | text snake_case, unique | `orobanche` | Key |
| `name_en` | text | `Broomrape (Orobanche crenata)` | Report label |
| `name_ar` | text | `الهالوك` | Report label |
| `hosts` | crop ids separated by `;` | `faba_bean` | Which crops build up this pathogen |
| `break_years` | number 0–15 | `3` | Required non-host seasons between host crops = 2 × break_years |
| `severity` | number 0–1 | `0.7` | Penalty = severity × (shortfall ÷ required) × 40 pest points |
| `control` | category: `rotation_effective` / `rotation_partial` | `rotation_partial` | `rotation_partial` adds a report note that rotation alone won't control it |

**Already in the dataset for the MVP crops:**
- take-all (wheat, barley)
- cereal cyst nematode (wheat, barley)
- *Verticillium dahliae* (sunflower; potato is outside the MVP)
- broomrape (faba bean)

Section 6.4 proposes revised values for these and 5 new Egypt-relevant entries.

**Only include a pest or disease if crop rotation meaningfully controls it.** Airborne diseases (wheat rusts, faba bean rust, chocolate spot) spread from neighbouring fields, so rotation doesn't help and they are excluded.

---

## 4. Farm-profile inputs (not in the sheet; for reference)

The brief lists **current crop** as a farm input. It isn't in the app form yet; developers will add it, and it becomes the baseline strategy (Option A). The other farm inputs already exist: latitude/longitude, soil texture, pH, ECe, organic matter, irrigation system, water availability (low/medium/high) and working capital.

---

## 5. Summary: how one strategy gets its score

| Dimension | Weight | Crop columns it reads | NASA data it reads |
|---|---|---|---|
| Thermal suitability | 15% | t_base, t_opt_min, t_opt_max, t_max, gdd_req, duration_days | POWER T2M |
| Water balance | 15% | kc_ini, kc_mid, kc_end, duration_days (+ root_depth_m, depletion_p planned) | POWER T2M_MAX/MIN, radiation, PRECTOTCORR (+ SMAP planned) |
| Soil | 15% | tex_*, ph_*, ece_threshold, ece_slope, tuber_or_bulb | (+ GAEZ planned) |
| Nitrogen | 15% | bnf_*, family | none |
| Pest break | 15% | family, family_break_years + pathogens sheet | none |
| Economics | 10% | yield_t_ha, price_usd_t, cost_usd_ha, price_cv | none |
| Calendar | 10% | sow_doy, sow_start_doy, sow_end_doy, duration_days, prep_weeks | none |
| Resilience | 5% | root, family | none |

**Total score** = weighted sum, 0–100. Strategies are ranked by total score. Every number in the report shows its source tier (T1 satellite … T5 needs a lab test).

---

## 6. Research draft: Egypt values (November 2026)

These values were researched from FAO sources (FAOSTAT, FAO GIEWS, FAO-56) and Egyptian sources (Ministry of Agriculture, ARC, Egyptian journals, MWRI/JICA water tables). Use them as the **starting point for team review**. They are not final until an Egyptian agronomist signs off.

**Legend:** **bold** = changed from the current dataset. *(est.)* = estimated, with no direct source; verify first.

### 6.1 Calendar and water

| Crop | `sow_doy` | `sow_end_doy` | `duration_days` | `prep_weeks` | `water_ref_mm` |
|---|---|---|---|---|---|
| wheat | **324** (20 Nov) | **344** | 160 | 2 | **520** |
| barley | **324** (20 Nov) | 349 | **140** | 2 | **400** *(est.)* |
| faba_bean | 305 (1 Nov) | **319** | **160** | **1** | **480** *(est.)* |
| maize | **135** (15 May) | **166** | 120 | 2 | **670** *(est.)* |
| soybean | **130** (10 May) | **151** | 120 | 2 | **650** |
| sunflower | 140 (20 May) | **166** | 105 | 2 | 500 |

- **Regional differences:** wheat's best window is 10–25 Nov in Upper Egypt and 15–30 Nov in the Delta. Faba bean is sown about 1–20 Oct in Upper Egypt and 25 Oct–15 Nov in the Delta.
- **Nili maize:** maize is also grown as a nili crop, sown about 1 Jul–15 Aug in Middle and Upper Egypt, taking roughly 100–110 days. If the team wants it, add a separate `maize_nili` row.
- **Water:** values are m³/feddan ÷ 4.2. The sources (JICA Upper Egypt table, Egyptian journal papers) mix crop water use with applied irrigation.
- **Needs checking:** the sowing windows, durations and prep weeks came from the researcher's knowledge of ARC recommendations; no ARC bulletin was opened. **Please check them against current ARC leaflets.**

### 6.2 Economics

| Crop | `yield_t_ha` | `price_usd_t` | `price_cv` | `cost_usd_ha` |
|---|---|---|---|---|
| wheat | **6.69** | 300 | **0.21** | **1290** |
| barley | **4.01** | **407** ⚠️ | **0.23** | **900** *(est.)* |
| faba_bean | **4.04** | **827** ⚠️ | **0.23** | **1160** *(est.)* |
| maize | **7.66** | **390** *(est.)* | **0.33** | **1480** *(est.)* |
| soybean | **3.01** | **870** ⚠️ | **0.47** | **1290** *(est.)* |
| sunflower | **2.81** | **600** *(est.)* | **0.25** *(est.)* | **1090** *(est.)* |

**What each column is based on**
- **Yield:** FAOSTAT average for Egypt, 2020–2024.
- **Price:**
  - Wheat: the 2026 government procurement price, EGP 2,500 per ardeb (150 kg) = 16,667 EGP/t.
  - Barley, faba bean and soybean: FAOSTAT 2023 producer prices.
  - Maize: the 2024 FAOSTAT monthly average.
  - Sunflower: estimated, because FAOSTAT's 2022–2023 sunflower prices are inconsistent.
- **Price CV:** variation of the USD producer price over 2014–2023. Most crops are missing 2019–2021.
- **Cost:** EGP per feddan, **excluding land rent**, converted at 55.5 EGP/USD (Central Bank of Egypt, 2 Nov 2026).
  - Only wheat has a dated source: LE 30,000 per feddan for landowners (Farmers' Syndicate, via Al-Ahram Weekly, Apr 2026).
  - The other five are estimated as a share of wheat's cost.

> ⚠️ **One exchange rate for everything.** The ⚠️ prices are 2023 EGP prices converted at the 2023 official rate (about 30.6 EGP/USD), while costs use the 2026 rate (55.5). That mismatch makes barley, faba bean and soybean look more profitable than they are. At today's rate, faba bean is about 456 USD/t and barley about 225 USD/t.
>
> **Rule:** record every price and cost in EGP, with its year, then convert **all of them at the same rate and date**.
>
> **Team task:** get current 2026 farm-gate prices in EGP and Ministry of Agriculture cost-per-feddan figures for barley, faba bean, maize, soybean and sunflower.

**Land rent:** rent of LE 20,000–125,000 per feddan per year is excluded. It would dominate costs. A tenant's wheat cost works out to about 2,145 USD/ha. Decide whether the app should offer an "owner vs tenant" option.

### 6.3 Nitrogen fixation and family breaks

| Crop | `bnf_total` low–high | `bnf_net` low–high | `bnf_uncertainty` | `family_break_years` |
|---|---|---|---|---|
| wheat | n/a | n/a | n/a | 0 |
| barley | n/a | n/a | n/a | 0 |
| maize | n/a | n/a | n/a | 0 |
| faba_bean | **90–200** | **20–60** | medium | **3** *(est.)* |
| soybean | **80–200** | **−30 to +20** | high | **2** *(est.)* |
| sunflower | n/a | n/a | n/a | **4** *(est.)* |

- **No Egyptian field study gives kg N/ha.** Values come from international syntheses (Peoples et al. 2009; Herridge et al. 2008; Salvagiotti et al. 2008), adjusted for Egyptian yields and starter-N practice.
- **Faba bean net credit** is supported by an Egyptian rotation trial: crops after faba bean needed about 30 kg N/feddan (~70 kg N/ha) less fertiliser than after wheat.
- **Soybean net** is often negative, because grain removes more N than the plant fixes. Negative values are allowed.
- **Cereals are 0** on purpose. Any value above 0 would penalise Egypt's standard wheat–maize rotation, and the cereal pests are already covered by take-all, cyst nematode and late wilt.
- **Side effect:** faba bean and soybean are the same family (Fabaceae), so faba bean followed by soybean is now penalised.

### 6.4 Pathogens

| `id` | `name_ar` | `hosts` (MVP) | `break_years` | `severity` | `control` |
|---|---|---|---|---|---|
| orobanche | الهالوك | faba_bean | **4** | **0.9** | rotation_partial |
| late_wilt **(new)** | الذبول المتأخر في الذرة الشامية | maize | 2 *(est.)* | 0.8 *(est.)* | rotation_partial |
| faba_root_rot **(new)** | أعفان الجذور والذبول في الفول البلدي | faba_bean; soybean | 2 *(est.)* | 0.6 *(est.)* | rotation_partial |
| charcoal_rot **(new)** | العفن الفحمي | sunflower; soybean; maize; faba_bean | 2 *(est.)* | 0.5 *(est.)* | rotation_partial |
| root_knot **(new)** | نيماتودا تعقد الجذور | soybean; sunflower; faba_bean | 1 *(est.)* | 0.5 *(est.)* | rotation_partial |
| sclerotinia **(new)** | العفن الأبيض الاسكليروتيني | sunflower; soybean; faba_bean | 4 | 0.3 *(est.)* | rotation_partial |
| ccn | نيماتودا الحوصلات في القمح والشعير | wheat; barley | 1 | **0.4** | rotation_effective |
| take_all | مرض الإصابة الكاملة | wheat; barley | 1 | **0.4** | rotation_effective |

- **Broomrape:** losses in Egypt reach 40–100%, and the seed lives more than 10 years in soil.
- **Late wilt:** a major maize disease in Egypt (up to 40% loss).
- **Cereal cyst nematode:** confirmed mainly on light soils (Ismailia), so severity was lowered.
- **Take-all:** little Egyptian evidence that it matters, so severity was lowered.
- **Verticillium:** no Egyptian reports on sunflower. Lower its severity to about 0.3 or remove sunflower from its hosts.
- **Potato cyst nematode, white rot:** unchanged. Their hosts are outside the MVP.
- **Weakest values:** all new break years and severity scores are estimates. They need an Egyptian plant pathologist's review (ARC Plant Pathology Research Institute).

### 6.5 Temperature, Kc, soil, salinity, root depth

**Sources checked directly:**
- FAO-56 Tables 11, 12 and 22
- FAO-29 Table 4
- the full FAO Ecocrop database
- GAEZ v4 model documentation
- NASA POWER climatology for Sakha, Giza, Assiut and Aswan

**Temperature and heat units**

| Crop | `t_base` / `t_opt_min` / `t_opt_max` / `t_max` | `gdd_req` |
|---|---|---|
| wheat | 0 / **12** / 22 / **27** | **2500** |
| barley | 0 / 12 / **21** / **28** | **2200** |
| faba_bean | **0** / **12** / 20 / **26** | **2300** |
| maize | 10 / **20** / 30 / **33** | **2250** |
| soybean | 10 / **20** / 30 / **33** | **2250** |
| sunflower | 6 / **18** / 28 / **34** | **2400** |

- **How temperatures were set:** Ecocrop's minimum and optimum values already refer to monthly means, so they were used with small Egypt adjustments. `t_max` was set from the daily-maximum heat-stress threshold minus about 6–7 °C (half of Egypt's daily temperature range). All `t_max` values *(est.)*.
- **`gdd_req` was far too low** (was 1400–1800). With Egyptian sowing dates and NASA POWER monthly means, the engine's own method accumulates about 2200–3100 °C·days, so the heat-unit score maxed out too early. The new values are computed with that same method, not taken from Egyptian cultivar trials *(est.)*.
- **Faba bean optimum (12–20 °C)** comes from pod-set studies. Ecocrop's 18–28 °C is too warm for this crop.

**Crop water coefficient (Kc, FAO-56 Table 12)**

| Crop | `kc_ini` / `kc_mid` / `kc_end` |
|---|---|
| wheat | 0.4 / 1.15 / **0.25** |
| barley | 0.3 / 1.15 / 0.25 |
| faba_bean | 0.5 / 1.15 / 0.3 |
| maize | 0.3 / 1.2 / 0.35 |
| soybean | 0.4 / 1.15 / 0.5 |
| sunflower | 0.35 / **1.10** / 0.35 |

- **Wheat `kc_ini`:** kept at 0.4, not FAO's 0.7. Egypt irrigates winter wheat about every 3–4 weeks, and FAO-56 Figures 29–30 give about 0.4–0.5 for that interval.
- **Mid- and late-season Kc** are not adjusted for climate. FAO-56 Eq. 62 would add 0.10–0.16 for tall summer crops in Upper Egypt, so summer water use there is underestimated by about 10%.

**Soil texture suitability (0–100)**

| Crop | sand | loamy_sand | sandy_loam | loam | clay_loam | clay |
|---|---|---|---|---|---|---|
| wheat | **35** | **55** | 80 | 100 | **95** | **85** |
| barley | 55 | 70 | 90 | 100 | **90** | **80** |
| faba_bean | **35** | **50** | **75** | 100 | 100 | **95** |
| maize | 45 | **60** | **80** | 100 | **95** | **85** |
| soybean | 40 | **55** | **75** | 100 | **95** | 85 |
| sunflower | **65** | **80** | **95** | 100 | **85** | **75** |

All texture scores are judgement scores, built from Ecocrop's texture classes plus Egyptian practice *(est.)*.

**pH (FAO Ecocrop)**

| Crop | `ph_min` / `ph_opt_min` / `ph_opt_max` / `ph_max` |
|---|---|
| wheat | 5.5 / 6.0 / 7.0 / 8.5 |
| barley | 6.0 / 6.5 / 7.5 / 8.0 |
| faba_bean | 4.5 / 6.0 / 7.0 / 8.6 |
| maize | 4.5 / 5.0 / 7.0 / 8.5 |
| soybean | 4.5 / 5.5 / 6.5 / 8.4 |
| sunflower | 5.5 / 6.0 / 7.5 / 8.0 |

> ⚠️ **Decision needed on pH.** Nile soils are typically pH 7.8–8.3, above most Ecocrop optima, so almost no Egyptian farm would score 100 on pH. Ecocrop also gives barley `ph_max` 8.0, which contradicts barley's known tolerance of alkaline soil. **Options:**
> - (a) keep Ecocrop as-is and accept lower pH scores everywhere; or
> - (b) widen `ph_opt_max` and `ph_max` from Egyptian field evidence (e.g. barley `ph_max` 8.8).
>
> An agronomist should decide.

**Salinity (FAO-29 Table 4 / Maas & Hoffman)**

All current values are confirmed. Sunflower 4.8 / 5.0 is from Maas & Grattan 1999 (not in FAO-29; not checked online).

| Crop | `ece_threshold` (dS/m) | `ece_slope` (%/dS/m) |
|---|---|---|
| wheat | 6.0 | 7.1 |
| barley | 8.0 | 5.0 |
| faba_bean | 1.6 | 9.6 |
| maize | 1.7 | 12 |
| soybean | 5.0 | 20 |
| sunflower | 4.8 | 5.0 |

**New columns (section 2)**

| Crop | `root` | `root_depth_m` | `depletion_p` | `frost_kill_c` | `gaez_crop_code` |
|---|---|---|---|---|---|
| wheat | fibrous | 1.5 | 0.55 | −2 | whe |
| barley | fibrous | 1.5 | 0.55 | −2 *(est.)* | brl |
| faba_bean | taproot | 0.7 | 0.45 | −2 | pea *(proxy: faba is not in GAEZ v4)* |
| maize | fibrous | 1.7 | 0.55 | −2 | mze |
| soybean | taproot | 1.3 | 0.50 | −2 | soy |
| sunflower | taproot | 1.5 | 0.45 | −1 | sfl |

- **Root depth and depletion fraction:** from FAO-56 Table 22.
- **Frost thresholds** are flowering-stage values. Applying them to the whole season overstates December–January frost risk for wheat, barley and faba bean, which are hardier while vegetative. Developers should apply them only around flowering.
- **Season lengths:** FAO-56 Table 11 has no Egypt rows; the nearest arid or Mediterranean rows run longer than the current durations, because Egyptian cultivars are shorter-season. The current durations are kept.

### 6.6 Review checklist for the team

- [ ] Sowing windows, durations and prep weeks against current ARC leaflets (6.1)
- [ ] 2026 farm-gate prices in EGP for all 6 crops (6.2)
- [ ] Ministry of Agriculture cost-per-feddan figures for the 5 estimated crops (6.2)
- [ ] Decide: one exchange rate and date for all money values (6.2)
- [ ] Decide: include land rent / owner vs tenant? (6.2)
- [ ] Decide: add a `maize_nili` row? (6.1)
- [ ] Plant pathologist review of new pathogens' break years and severity (6.4)
- [ ] Decide: pH ranges, Ecocrop as-is or widened for alkaline Nile soils (6.5)
- [ ] Check `t_max` and `gdd_req` against Egyptian cultivar data if available (6.5)
- [ ] Review texture suitability scores (6.5)
- [ ] Agronomist sign-off on the whole sheet
