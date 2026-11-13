/**
 * Egyptian governorate reference used for offline verification.
 * Bounding boxes are deliberately coarse (agricultural cores) and only a fallback:
 * the primary check is reverse geocoding. Smallest containing box wins.
 */
export type SoilZone = 'delta_alluvial' | 'valley_alluvial' | 'desert_reclaimed' | 'mixed' | 'oasis';

export interface Governorate {
  id: string;
  name: { en: string; ar: string };
  aliases: string[];
  bbox: [number, number, number, number]; // [latMin, latMax, lngMin, lngMax]
  zone: SoilZone;
  salinityRisk: boolean;
}

export const EGYPT_BBOX: [number, number, number, number] = [22.0, 31.7, 24.7, 36.9];

export const GOVERNORATES: Governorate[] = [
  { id: 'kafr_el_sheikh', name: { en: 'Kafr El Sheikh', ar: 'كفر الشيخ' }, aliases: ['kafr el-sheikh', 'kafr elsheikh', 'kafrelsheikh', 'كفر الشيخ'], bbox: [30.95, 31.6, 30.35, 31.3], zone: 'delta_alluvial', salinityRisk: true },
  { id: 'damietta', name: { en: 'Damietta', ar: 'دمياط' }, aliases: ['dumyat', 'دمياط'], bbox: [31.2, 31.55, 31.55, 32.05], zone: 'delta_alluvial', salinityRisk: true },
  { id: 'dakahlia', name: { en: 'Dakahlia', ar: 'الدقهلية' }, aliases: ['dakahliya', 'ad daqahliyah', 'mansoura', 'الدقهلية'], bbox: [30.75, 31.55, 31.3, 32.1], zone: 'delta_alluvial', salinityRisk: true },
  { id: 'gharbia', name: { en: 'Gharbia', ar: 'الغربية' }, aliases: ['gharbiya', 'al gharbiyah', 'tanta', 'الغربية'], bbox: [30.55, 31.05, 30.8, 31.3], zone: 'delta_alluvial', salinityRisk: false },
  { id: 'menoufia', name: { en: 'Menoufia', ar: 'المنوفية' }, aliases: ['monufia', 'al minufiyah', 'المنوفية'], bbox: [30.25, 30.75, 30.7, 31.2], zone: 'delta_alluvial', salinityRisk: false },
  { id: 'qalyubia', name: { en: 'Qalyubia', ar: 'القليوبية' }, aliases: ['qalyubiyah', 'al qalyubiyah', 'القليوبية'], bbox: [30.1, 30.55, 31.05, 31.45], zone: 'delta_alluvial', salinityRisk: false },
  { id: 'sharqia', name: { en: 'Sharqia', ar: 'الشرقية' }, aliases: ['sharkia', 'ash sharqiyah', 'zagazig', 'الشرقية'], bbox: [30.25, 31.1, 31.3, 32.1], zone: 'mixed', salinityRisk: false },
  { id: 'beheira', name: { en: 'Beheira', ar: 'البحيرة' }, aliases: ['buhayrah', 'al buhayrah', 'damanhur', 'البحيرة'], bbox: [30.15, 31.4, 29.7, 30.8], zone: 'mixed', salinityRisk: true },
  { id: 'alexandria', name: { en: 'Alexandria', ar: 'الإسكندرية' }, aliases: ['al iskandariyah', 'الاسكندرية', 'الإسكندرية'], bbox: [30.8, 31.35, 29.4, 30.1], zone: 'mixed', salinityRisk: true },
  { id: 'ismailia', name: { en: 'Ismailia', ar: 'الإسماعيلية' }, aliases: ['al ismailiyah', 'ismailiya', 'الاسماعيلية', 'الإسماعيلية'], bbox: [30.25, 30.95, 31.75, 32.4], zone: 'desert_reclaimed', salinityRisk: false },
  { id: 'port_said', name: { en: 'Port Said', ar: 'بورسعيد' }, aliases: ['bur said', 'بور سعيد', 'بورسعيد'], bbox: [31.0, 31.35, 32.05, 32.4], zone: 'delta_alluvial', salinityRisk: true },
  { id: 'suez', name: { en: 'Suez', ar: 'السويس' }, aliases: ['as suways', 'السويس'], bbox: [29.7, 30.25, 32.2, 32.7], zone: 'desert_reclaimed', salinityRisk: false },
  { id: 'cairo', name: { en: 'Cairo', ar: 'القاهرة' }, aliases: ['al qahirah', 'القاهرة'], bbox: [29.9, 30.2, 31.2, 31.5], zone: 'mixed', salinityRisk: false },
  { id: 'giza', name: { en: 'Giza', ar: 'الجيزة' }, aliases: ['al jizah', 'الجيزة'], bbox: [29.4, 30.15, 30.85, 31.3], zone: 'valley_alluvial', salinityRisk: false },
  { id: 'faiyum', name: { en: 'Faiyum', ar: 'الفيوم' }, aliases: ['fayoum', 'al fayyum', 'الفيوم'], bbox: [29.0, 29.6, 30.4, 31.15], zone: 'valley_alluvial', salinityRisk: true },
  { id: 'beni_suef', name: { en: 'Beni Suef', ar: 'بني سويف' }, aliases: ['bani suwayf', 'بني سويف'], bbox: [28.7, 29.4, 30.7, 31.4], zone: 'valley_alluvial', salinityRisk: false },
  { id: 'minya', name: { en: 'Minya', ar: 'المنيا' }, aliases: ['al minya', 'المنيا'], bbox: [27.6, 28.75, 30.4, 31.2], zone: 'valley_alluvial', salinityRisk: false },
  { id: 'asyut', name: { en: 'Asyut', ar: 'أسيوط' }, aliases: ['assiut', 'asyut', 'اسيوط', 'أسيوط'], bbox: [26.8, 27.6, 30.8, 31.5], zone: 'valley_alluvial', salinityRisk: false },
  { id: 'sohag', name: { en: 'Sohag', ar: 'سوهاج' }, aliases: ['suhaj', 'سوهاج'], bbox: [26.2, 26.9, 31.3, 32.0], zone: 'valley_alluvial', salinityRisk: false },
  { id: 'qena', name: { en: 'Qena', ar: 'قنا' }, aliases: ['qina', 'قنا'], bbox: [25.8, 26.3, 32.2, 33.0], zone: 'valley_alluvial', salinityRisk: false },
  { id: 'luxor', name: { en: 'Luxor', ar: 'الأقصر' }, aliases: ['al uqsur', 'الاقصر', 'الأقصر'], bbox: [25.4, 25.9, 32.3, 32.9], zone: 'valley_alluvial', salinityRisk: false },
  { id: 'aswan', name: { en: 'Aswan', ar: 'أسوان' }, aliases: ['aswan', 'اسوان', 'أسوان'], bbox: [23.9, 25.4, 32.6, 33.1], zone: 'mixed', salinityRisk: false },
  { id: 'new_valley', name: { en: 'New Valley', ar: 'الوادي الجديد' }, aliases: ['al wadi al jadid', 'kharga', 'dakhla', 'الوادي الجديد'], bbox: [24.5, 26.5, 27.5, 31.0], zone: 'oasis', salinityRisk: true },
  { id: 'matrouh', name: { en: 'Matrouh', ar: 'مطروح' }, aliases: ['marsa matruh', 'matruh', 'مطروح'], bbox: [30.5, 31.7, 25.0, 29.4], zone: 'desert_reclaimed', salinityRisk: false },
];

const norm = (s: string) =>
  s.toLowerCase().replace(/governorate|محافظة/g, '').replace(/[ـ\-_'’.]/g, ' ').replace(/[أإآ]/g, 'ا').replace(/\s+/g, ' ').trim();

export function findGovernorateByName(text: string): Governorate | undefined {
  const n = norm(text);
  if (!n) return undefined;
  return GOVERNORATES.find((g) => [g.id.replace(/_/g, ' '), g.name.en, g.name.ar, ...g.aliases].some((a) => norm(a) === n));
}

export function findGovernorateByPoint(lat: number, lng: number): Governorate | undefined {
  const hits = GOVERNORATES.filter(({ bbox: [a, b, c, d] }) => lat >= a && lat <= b && lng >= c && lng <= d);
  const area = (g: Governorate) => (g.bbox[1] - g.bbox[0]) * (g.bbox[3] - g.bbox[2]);
  return hits.sort((x, y) => area(x) - area(y))[0];
}

export const inEgypt = (lat: number, lng: number) =>
  lat >= EGYPT_BBOX[0] && lat <= EGYPT_BBOX[1] && lng >= EGYPT_BBOX[2] && lng <= EGYPT_BBOX[3];
