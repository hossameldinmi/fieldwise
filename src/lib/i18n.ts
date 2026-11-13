import type { CropDataset, Lang, Note, Tier } from './types';
import { GOVERNORATES } from './geo/regions';
import { UI_AR, UI_EN } from './i18n-ui';

type Dict = Record<string, string>;

const en: Dict = {
  bestFit: 'Best overall fit: option {id}, {name} ({score}/100)', option: 'Option {id}',
  appTitle: 'FieldWise', appTagline: 'Crop rotation decisions from NASA Earth data, with every number traced to its source.',
  farm: 'Farm', farmName: 'Farm name', location: 'Location', latitude: 'Latitude', longitude: 'Longitude',
  mapHint: 'Tap the map to place your field.', area: 'Area', governorate: 'Governorate', country: 'Country',
  soilType: 'Soil texture', soilPh: 'Soil pH', om: 'Organic matter (%)', ece: 'ECe (dS/m), from lab', eceHint: 'Leave empty if not measured',
  sodic: 'Sodic soil (ESP > 15) confirmed', irrigation: 'Irrigation system', waterSecurity: 'Water security', capital: 'Working capital available',
  run: 'Analyze rotations', running: 'Fetching NASA data…', print: 'Print or save PDF', language: 'العربية',
  dataset: 'Crop dataset', datasetLoad: 'Load crops_database.xlsx', datasetDownload: 'Download current dataset (.xlsx)', datasetLoaded: 'Loaded {n} crops, {p} pathogens (version {v})',
  feddan: 'feddan', hectare: 'hectare', acre: 'acre', equals: '= {ha} ha · {fd} feddan',
  sand: 'Sand', loamy_sand: 'Loamy sand', sandy_loam: 'Sandy loam', loam: 'Loam', clay_loam: 'Clay loam', clay: 'Clay',
  drip: 'Drip', sprinkler: 'Sprinkler', surface: 'Surface (improved furrow)', canal_flood: 'Canal / flood',
  low: 'Low', medium: 'Medium', high: 'High',
  winter: 'Winter', summer: 'Summer', nili: 'Nili', yearShort: 'Y',
  strategyA: 'Baseline farm rotation', strategyB: 'Food security & soil restoration', strategyC: 'High-value horticultural diversification',
  strategyAsub: 'Conventional 2-year cereal benchmark', strategyBsub: '2-year cycle with legume and oilseed break', strategyCsub: '4-year, 8-season cycle',
  dim_thermal: 'Climatic & thermal suitability', dim_water: 'Water balance & irrigation demand', dim_soil: 'Soil texture, pH & salinity',
  dim_nitrogen: 'Biological N fixation & fertility', dim_pest: 'Pest & pathogen break', dim_economic: 'Economic margin & capital risk',
  dim_calendar: 'Calendar & turnaround feasibility', dim_resilience: 'Long-term agrosystem resilience',
  dimension: 'Dimension', weight: 'Weight', total: 'Weighted total', comparison: 'Strategy comparison', profile: 'Score profile',
  rotations: 'Rotation timelines', details: 'Evidence by dimension', climate: 'Site climate', amendments: 'Soil amendments', diagnostics: 'Laboratory tests required',
  tiers: 'Where each number comes from', verification: 'Location check',
  tier1: 'Gridded satellite observations', tier2: 'Deterministic computed indices', tier3: 'Peer-reviewed agronomic literature', tier4: 'Expert and market assumptions', tier5: 'Requires laboratory diagnostics',
  tier1d: 'NASA POWER climatology at the farm’s grid cell; Sentinel-2/GPM/SRTM/SMAP when connected.', tier2d: 'GDD, Hargreaves ET₀, crop ETc, water deficit, scores — recomputable from inputs.',
  tier3d: 'BNF ranges, salinity thresholds, pathogen break intervals (FAO-56, Maas & Hoffman, Herridge et al.).', tier4d: 'Land-prep turnaround, prices, costs, risk aversion. Edit in the dataset.',
  tier5d: 'Values the engine cannot know without a soil sample.',
  climateSource: '{source}. {period} climatological mean (not live weather). Grid: {res}.',
  tMean: 'Mean temp (°C)', precip: 'Precipitation (mm/month)', pet: 'Reference ET₀ (mm/month)',
  errorPower: 'NASA POWER did not respond ({msg}). Check your connection and analyze again.', errorCoords: 'Enter valid coordinates or tap the map.',
  emptyReport: 'Place your field on the map, describe the soil, and analyze to compare three rotations.',
  months: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec', gap: 'prep',
  legendFallow: 'Fallow / land preparation',
  Poaceae: 'Cereals (Poaceae)', Fabaceae: 'Legumes (Fabaceae)', Solanaceae: 'Nightshades (Solanaceae)', Amaryllidaceae: 'Alliums (Amaryllidaceae)', Asteraceae: 'Composites (Asteraceae)',
  // engine notes
  'geo.override': 'GPS places this farm in {gps}; you entered “{typed}”. Using {gps}.',
  'geo.match': 'Location verified: {gov}.',
  'geo.outside': 'Coordinates are outside the Egyptian governorate reference. Climate uses GPS; regional soil checks are skipped.',
  'geo.countryMismatch': 'GPS country is {gps}; you entered {typed}. Using {gps}.',
  'geo.soilClayInSand': '{gov} is mostly sandy desert-reclamation land; “Clay” is unusual here. Confirm with a texture test.',
  'geo.soilSandInDelta': '{gov} lies on alluvial Nile clays; “Sand” is unusual here. Confirm with a texture test.',
  'geo.salinity': '{gov} has known salinity/sodicity hotspots. Measure ECe and ESP before planting sensitive crops.',
  'geo.unverified': 'Reverse geocoding unavailable; matched with offline governorate boxes (approximate near borders).',
  'thermal.crop': '{crop} ({season}): monthly means {tmin}–{tmax} °C; cardinal fit {fit}/100; GDD {gdd} of {req} needed.',
  'thermal.heat': '{crop}: mean temperature in {month} exceeds its {max} °C limit.',
  'water.gross': 'Gross irrigation ≈ {mm} mm/yr ({m3} m³/ha/yr) at {eff}% efficiency. Budget for {security} water security: {budget} mm/yr.',
  'water.crop': '{crop} ({season}): ETc ≈ {etc} mm (dataset reference {ref} mm).',
  'water.deficit': 'Climatic water deficit (P − ET₀) = {deficit} mm/yr (P {p}, ET₀ {pet}). Under irrigation, rainfall does not cap yield; water security does.',
  'soil.crop': '{crop} ({season}): texture {tex}, pH {ph}, salinity {sal} (each /100).',
  'soil.clayPenalty': '{crop}: heavy-clay penalty −16 (poor aeration and drainage, clod adhesion, deformed tubers/bulbs).',
  'soil.scab': 'Potato at pH {ph}: higher common scab risk. Do not lime. Keep soil moist during tuber initiation; use acidifying N sources.',
  'soil.ecMissing': 'ECe not measured: salinity is scored as non-saline until a lab result is entered.',
  'bnf.credit': 'Net legume N credit ≈ {low}–{high} kg N/ha/yr (midpoint {mid}).',
  'bnf.crop': '{crop}: fixes {tl}–{th} kg N/ha; net residual credit {nl}–{nh} kg N/ha ({u} uncertainty).',
  'bnf.none': 'No legume: 0 kg N/ha residual credit; nitrogen comes entirely from fertilizer.',
  'bnf.mono': 'Cereals occupy {pct}% of seasons: continuous-cereal penalty applied.',
  'pest.violation': '{pathogen}: {gap} non-host seasons from {from} to {to}; needs ≥ {req}.',
  'pest.ok': '{pathogen}: {gap} non-host seasons from {from} to {to} (≥ {req}).',
  'pest.partial': '{pathogen}: long-lived inoculum; rotation lowers but does not eliminate risk.',
  'pest.family': '{family}: {gap} seasons between {from} and {to}; family break needs ≥ {req}.',
  'pest.familyOk': '{family}: {gap} seasons between {from} and {to} (≥ {req}).',
  'pest.backToBack': '{family} in consecutive seasons ({from} → {to}).',
  'econ.margin': 'Gross margin ≈ ${margin}/ha/yr; price risk σ ≈ ${risk}/ha/yr; whole farm ≈ ${farm}/yr.',
  'econ.capital': 'Peak seasonal cost ≈ ${cap}/ha exceeds {level} working capital.',
  'econ.placeholder': 'Prices and costs are illustrative dataset values. Replace them with current local data.',
  'cal.gap': '{from} → {to}: {days} days for harvest, tillage and seedbed preparation.',
  'cal.wrap': 'Cycle restart {from} → {to}: {days} days.',
  'cal.short': '{from} → {to}: only {days} days for land preparation (needs 14–21).',
  'cal.late': '{crop} ({season}) sown {days} days after its sowing window closes.',
  'res.roots': 'Root depth alternates (taproot ↔ fibrous/tuber) in {pct}% of transitions.',
  'res.families': '{n} botanical families: {list}.',
  'amend.lime': 'pH {ph} is acidic: agricultural lime (CaCO₃) is appropriate; set the rate from a lime-requirement test.',
  'amend.noLime': 'pH {ph} is neutral to alkaline: do not apply agricultural lime.',
  'amend.gypsum': 'Sodic conditions: apply gypsum (CaSO₄·2H₂O) with a leaching irrigation; set the rate from ESP / gypsum requirement.',
  'amend.sulfur': 'Alkaline or calcareous soil: band elemental sulfur and use acidifying fertilizers (ammonium sulfate) to free P and micronutrients near roots. Bulk pH change is impractical in calcareous soil.',
  'amend.om': 'Organic matter {om}% is low: add compost or manure and retain residues.',
  'diag.ece': 'Soil salinity: ECe of the saturated paste (0–30 and 30–60 cm).',
  'diag.olsenP': 'Available phosphorus: Olsen-P (bicarbonate extract; suited to alkaline soils).',
  'diag.esp': 'Sodicity: exchangeable sodium percentage (ESP) or SAR.',
  'diag.caco3': 'Total and active CaCO₃ (calcareousness, lime-induced chlorosis risk).',
  'diag.rhizobia': 'Active rhizobia / nodulation check; inoculate legumes (especially soybean on new lands).',
  'diag.pcn': 'Potato cyst nematode cyst count before any potato planting.',
  'diag.orobanche': 'Broomrape (Orobanche) seedbank history of the field before faba bean.',
};

const ar: Dict = {
  bestFit: 'الأنسب إجمالًا: الخيار {id}، {name} ({score}/100)', option: 'الخيار {id}',
  appTitle: 'فيلدوايز', appTagline: 'قرارات الدورة الزراعية من بيانات ناسا لرصد الأرض، وكل رقم مرتبط بمصدره.',
  farm: 'المزرعة', farmName: 'اسم المزرعة', location: 'الموقع', latitude: 'خط العرض', longitude: 'خط الطول',
  mapHint: 'اضغط على الخريطة لتحديد موقع الحقل.', area: 'المساحة', governorate: 'المحافظة', country: 'الدولة',
  soilType: 'قوام التربة', soilPh: 'رقم الحموضة (pH)', om: 'المادة العضوية (%)', ece: 'الملوحة ECe (ديسيسيمنز/م) من المعمل', eceHint: 'اتركه فارغًا إن لم يُقَس',
  sodic: 'تربة صودية مؤكدة (ESP > 15)', irrigation: 'نظام الري', waterSecurity: 'الأمن المائي', capital: 'رأس المال العامل المتاح',
  run: 'حلّل الدورات', running: 'جارٍ جلب بيانات ناسا…', print: 'طباعة أو حفظ PDF', language: 'English',
  dataset: 'قاعدة بيانات المحاصيل', datasetLoad: 'تحميل crops_database.xlsx', datasetDownload: 'تنزيل قاعدة البيانات الحالية (.xlsx)', datasetLoaded: 'تم تحميل {n} محصولًا و{p} من الآفات (الإصدار {v})',
  feddan: 'فدان', hectare: 'هكتار', acre: 'إيكر', equals: '= {ha} هكتار · {fd} فدان',
  sand: 'رملية', loamy_sand: 'رملية طميية', sandy_loam: 'طميية رملية', loam: 'طميية (لومية)', clay_loam: 'طميية طينية', clay: 'طينية',
  drip: 'تنقيط', sprinkler: 'رش', surface: 'سطحي (خطوط محسّنة)', canal_flood: 'غمر من الترعة',
  low: 'منخفض', medium: 'متوسط', high: 'مرتفع',
  winter: 'شتوية', summer: 'صيفية', nili: 'نيلية', yearShort: 'س',
  strategyA: 'الدورة التقليدية للمزرعة', strategyB: 'الأمن الغذائي واستعادة خصوبة التربة', strategyC: 'التنويع البستاني عالي القيمة',
  strategyAsub: 'معيار حبوب تقليدي لعامين', strategyBsub: 'دورة عامين بكسر بقولي وزيتي', strategyCsub: 'دورة 4 سنوات و8 عروات',
  dim_thermal: 'الملاءمة المناخية والحرارية', dim_water: 'الميزان المائي واحتياج الري', dim_soil: 'قوام التربة والحموضة والملوحة',
  dim_nitrogen: 'التثبيت الحيوي للنيتروجين والخصوبة', dim_pest: 'كسر دورة الآفات والممرضات', dim_economic: 'العائد الاقتصادي ومخاطر رأس المال',
  dim_calendar: 'جدوى التقويم وفترات التجهيز', dim_resilience: 'المرونة طويلة المدى للنظام الزراعي',
  dimension: 'البُعد', weight: 'الوزن', total: 'المجموع المرجّح', comparison: 'مقارنة الاستراتيجيات', profile: 'ملف الدرجات',
  rotations: 'الجداول الزمنية للدورات', details: 'الأدلة لكل بُعد', climate: 'مناخ الموقع', amendments: 'محسّنات التربة', diagnostics: 'تحاليل معملية مطلوبة',
  tiers: 'مصدر كل رقم', verification: 'التحقق من الموقع',
  tier1: 'أرصاد الأقمار الصناعية الشبكية', tier2: 'مؤشرات محسوبة حتميًا', tier3: 'أدبيات زراعية محكّمة', tier4: 'افتراضات الخبراء والسوق', tier5: 'يتطلب تحاليل معملية',
  tier1d: 'المتوسطات المناخية من NASA POWER لخلية الشبكة الخاصة بالمزرعة؛ وSentinel-2 وGPM وSRTM وSMAP عند الربط.', tier2d: 'الوحدات الحرارية وET₀ بطريقة هارجريفز واستهلاك المحصول والعجز المائي والدرجات، ويمكن إعادة حسابها.',
  tier3d: 'نطاقات التثبيت الحيوي وحدود تحمل الملوحة وفترات كسر الآفات (FAO-56، ماس وهوفمان، هيريدج وآخرون).', tier4d: 'فترة تجهيز الأرض والأسعار والتكاليف ودرجة تجنب المخاطرة، ويمكن تعديلها في قاعدة البيانات.',
  tier5d: 'قيم لا يمكن معرفتها دون عينة تربة.',
  climateSource: '{source}. المتوسط المناخي {period} (وليس طقسًا لحظيًا). الشبكة: {res}.',
  tMean: 'متوسط الحرارة (°م)', precip: 'الأمطار (مم/شهر)', pet: 'البخر-نتح المرجعي ET₀ (مم/شهر)',
  errorPower: 'لم تستجب خدمة NASA POWER ({msg}). تحقق من الاتصال وأعد التحليل.', errorCoords: 'أدخل إحداثيات صحيحة أو اضغط على الخريطة.',
  emptyReport: 'حدّد الحقل على الخريطة وصِف التربة ثم حلّل لمقارنة ثلاث دورات.',
  months: 'يناير,فبراير,مارس,أبريل,مايو,يونيو,يوليو,أغسطس,سبتمبر,أكتوبر,نوفمبر,ديسمبر', gap: 'تجهيز',
  legendFallow: 'بور / تجهيز الأرض',
  Poaceae: 'النجيلية (الحبوب)', Fabaceae: 'البقولية', Solanaceae: 'الباذنجانية', Amaryllidaceae: 'الثومية (البصليات)', Asteraceae: 'المركّبة',
  'geo.override': 'يضع نظام GPS هذه المزرعة في {gps}، بينما أدخلت «{typed}». سيتم اعتماد {gps}.',
  'geo.match': 'تم التحقق من الموقع: {gov}.',
  'geo.outside': 'الإحداثيات خارج المرجع الجغرافي للمحافظات المصرية. يُستخدم GPS للمناخ وتُتخطى فحوص التربة الإقليمية.',
  'geo.countryMismatch': 'دولة GPS هي {gps}، بينما أدخلت {typed}. سيتم اعتماد {gps}.',
  'geo.soilClayInSand': 'معظم أراضي {gov} رملية مستصلحة؛ إدخال «طينية» غير معتاد هنا. أكّد بتحليل القوام.',
  'geo.soilSandInDelta': 'تقع {gov} على طمي النيل الطيني؛ إدخال «رملية» غير معتاد هنا. أكّد بتحليل القوام.',
  'geo.salinity': 'في {gov} بؤر معروفة للملوحة والصودية. قِس ECe وESP قبل زراعة المحاصيل الحساسة.',
  'geo.unverified': 'التحديد العكسي للعنوان غير متاح؛ تمت المطابقة بحدود المحافظات التقريبية دون اتصال.',
  'thermal.crop': '{crop} ({season}): المتوسطات الشهرية {tmin}–{tmax} °م؛ الملاءمة الحرارية {fit}/100؛ الوحدات الحرارية {gdd} من {req} مطلوبة.',
  'thermal.heat': '{crop}: متوسط الحرارة في {month} يتجاوز حده الأقصى {max} °م.',
  'water.gross': 'الري الإجمالي ≈ {mm} مم/سنة ({m3} م³/هكتار/سنة) بكفاءة {eff}%. الحصة لأمن مائي {security}: {budget} مم/سنة.',
  'water.crop': '{crop} ({season}): الاستهلاك المائي ETc ≈ {etc} مم (المرجع {ref} مم).',
  'water.deficit': 'العجز المائي المناخي (المطر − ET₀) = {deficit} مم/سنة (مطر {p}، ET₀ {pet}). مع الري لا يحدد المطرُ الإنتاجَ، بل الأمن المائي.',
  'soil.crop': '{crop} ({season}): القوام {tex}، الحموضة {ph}، الملوحة {sal} (كلٌّ من 100).',
  'soil.clayPenalty': '{crop}: خصم التربة الطينية الثقيلة −16 (ضعف التهوية والصرف، التصاق الكتل، تشوه الدرنات والأبصال).',
  'soil.scab': 'البطاطس عند pH {ph}: خطر أعلى للإصابة بجرب البطاطس العادي. لا تضف الجير؛ حافظ على رطوبة التربة أثناء تكوين الدرنات واستخدم أسمدة نيتروجينية حامضية.',
  'soil.ecMissing': 'لم تُقَس الملوحة ECe: تُحسب التربة غير ملحية حتى إدخال نتيجة المعمل.',
  'bnf.credit': 'الرصيد الصافي للنيتروجين من البقوليات ≈ {low}–{high} كجم ن/هكتار/سنة (المتوسط {mid}).',
  'bnf.crop': '{crop}: يثبّت {tl}–{th} كجم ن/هكتار؛ الرصيد المتبقي الصافي {nl}–{nh} كجم ن/هكتار (عدم يقين {u}).',
  'bnf.none': 'لا توجد بقوليات: صفر كجم ن/هكتار متبقٍ؛ النيتروجين كله من الأسمدة.',
  'bnf.mono': 'الحبوب تشغل {pct}% من العروات: طُبّق خصم الزراعة المتواصلة للحبوب.',
  'pest.violation': '{pathogen}: {gap} عروات خالية من العائل بين {from} و{to}؛ المطلوب ≥ {req}.',
  'pest.ok': '{pathogen}: {gap} عروات خالية من العائل بين {from} و{to} (≥ {req}).',
  'pest.partial': '{pathogen}: لقاح طويل البقاء؛ الدورة تخفّض الخطر ولا تزيله.',
  'pest.family': '{family}: {gap} عروات بين {from} و{to}؛ كسر العائلة يتطلب ≥ {req}.',
  'pest.familyOk': '{family}: {gap} عروات بين {from} و{to} (≥ {req}).',
  'pest.backToBack': '{family} في عروتين متتاليتين ({from} ← {to}).',
  'econ.margin': 'الهامش الإجمالي ≈ {margin}$/هكتار/سنة؛ مخاطر السعر σ ≈ {risk}$/هكتار/سنة؛ للمزرعة كلها ≈ {farm}$/سنة.',
  'econ.capital': 'أعلى تكلفة موسمية ≈ {cap}$/هكتار تتجاوز رأس مال عامل {level}.',
  'econ.placeholder': 'الأسعار والتكاليف قيم توضيحية في قاعدة البيانات؛ استبدلها ببيانات السوق المحلية الحالية.',
  'cal.gap': '{from} ← {to}: {days} يومًا للحصاد والحرث وتجهيز مهد البذرة.',
  'cal.wrap': 'إعادة الدورة {from} ← {to}: {days} يومًا.',
  'cal.short': '{from} ← {to}: {days} يومًا فقط لتجهيز الأرض (المطلوب 14–21).',
  'cal.late': '{crop} ({season}) زُرع بعد انتهاء موعد زراعته بـ {days} يومًا.',
  'res.roots': 'يتناوب عمق الجذور (وتدي ↔ ليفي/درني) في {pct}% من الانتقالات.',
  'res.families': '{n} عائلات نباتية: {list}.',
  'amend.lime': 'pH {ph} حامضي: الجير الزراعي (CaCO₃) مناسب؛ حدّد المعدل من اختبار احتياج الجير.',
  'amend.noLime': 'pH {ph} متعادل إلى قلوي: لا تضف الجير الزراعي.',
  'amend.gypsum': 'ظروف صودية: أضف الجبس الزراعي (CaSO₄·2H₂O) مع ريّة غسيل؛ حدّد المعدل من ESP / احتياج الجبس.',
  'amend.sulfur': 'تربة قلوية أو جيرية: أضف الكبريت الزراعي تلقيمًا واستخدم أسمدة حامضية (سلفات النشادر) لإتاحة الفوسفور والعناصر الصغرى حول الجذور. تغيير pH التربة كلها غير عملي في الأراضي الجيرية.',
  'amend.om': 'المادة العضوية {om}% منخفضة: أضف السماد العضوي (الكمبوست أو البلدي) واحتفظ بالمخلفات.',
  'diag.ece': 'الملوحة: ECe لمستخلص العجينة المشبعة (0–30 و30–60 سم).',
  'diag.olsenP': 'الفوسفور الميسّر: طريقة أولسن (مستخلص البيكربونات المناسب للأراضي القلوية).',
  'diag.esp': 'الصودية: نسبة الصوديوم المتبادل (ESP) أو SAR.',
  'diag.caco3': 'كربونات الكالسيوم الكلية والنشطة (الجيرية وخطر الاصفرار).',
  'diag.rhizobia': 'فحص الريزوبيا النشطة والعقد الجذرية؛ لقّح البقوليات (خاصة فول الصويا في الأراضي الجديدة).',
  'diag.pcn': 'عدّ حوصلات نيماتودا البطاطس قبل أي زراعة بطاطس.',
  'diag.orobanche': 'تاريخ بذور الهالوك في الحقل قبل زراعة الفول.',
};

export const DICTS: Record<Lang, Dict> = { en: { ...en, ...UI_EN }, ar: { ...ar, ...UI_AR } };

export function t(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export const monthName = (lang: Lang, m: number) => t(lang, 'months').split(',')[m];

/** "2|summer" -> "Y2 Summer" / "س2 صيفية" */
export const seasonText = (lang: Lang, label: string) => {
  const [y, s] = label.split('|');
  return `${t(lang, 'yearShort')}${y} ${t(lang, s)}`;
};

const fmtNum = (lang: Lang, v: number) => v.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');

export function renderNote(note: Note, lang: Lang, ds: CropDataset): string {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(note.params ?? {})) {
    if (k === 'crop') out[k] = ds.crops.find((c) => c.id === v)?.name[lang] ?? String(v);
    else if (k === 'pathogen') out[k] = ds.pathogens.find((p) => p.id === v)?.name[lang] ?? String(v);
    else if (k === 'gov' || (k === 'gps' && note.key === 'geo.override')) out[k] = GOVERNORATES.find((g) => g.id === v)?.name[lang] ?? String(v);
    else if (k === 'season' || k === 'from' || k === 'to') out[k] = seasonText(lang, String(v));
    else if (k === 'month') out[k] = monthName(lang, Number(v));
    else if (k === 'family') out[k] = t(lang, String(v));
    else if (k === 'list') out[k] = String(v).split(', ').map((f) => t(lang, f)).join(lang === 'ar' ? '، ' : ', ');
    else if (k === 'security' || k === 'level' || k === 'u') out[k] = t(lang, String(v));
    else out[k] = typeof v === 'number' ? fmtNum(lang, v) : String(v);
  }
  return t(lang, note.key, out);
}

export const TIER_KEYS: Tier[] = [1, 2, 3, 4, 5];
