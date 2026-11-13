'use client';
import type { CropDataset, Lang } from '@/lib/types';
import type { StrategyResult } from '@/lib/engine/evaluate';
import { monthName, t } from '@/lib/i18n';
import { familyColor, familyInk } from '@/lib/ui';
import { agDayToDoy } from '@/lib/engine/calendar';
import { doyToDate } from '@/lib/nasa/climate';

const W = 1000, H = 74, BAR_Y = 22, BAR_H = 34;

/** One furrow band per strategy: plantings as colored blocks on a months axis, fallow shown as bare soil. */
export function RotationStrip({ result, lang, ds }: { result: StrategyResult; lang: Lang; ds: CropDataset }) {
  const rtl = lang === 'ar';
  const total = result.strategy.years * 365;
  const X = (day: number, w = 0) => { const x = (day / total) * W; return rtl ? W - x - w : x; };
  const date = (agDay: number) => { const { month, day } = doyToDate(agDayToDoy(agDay)); return `${day} ${monthName(lang, month)}`; };

  const ticks: { x: number; label: string; major: boolean }[] = [];
  for (let y = 0; y < result.strategy.years; y++)
    [0, 92, 182, 273].forEach((d, i) => {
      const m = [9, 0, 3, 6][i];
      ticks.push({ x: X(y * 365 + d), label: i === 0 ? `${t(lang, 'yearShort')}${y + 1}` : monthName(lang, m), major: i === 0 });
    });

  return (
    <figure className="break-inside-avoid">
      <svg viewBox={`-14 0 ${W + 28} ${H}`} direction={rtl ? "rtl" : "ltr"} className="w-full" role="img" aria-label={t(lang, `strategy${result.id}`)}>
        <defs>
          <pattern id="fallow" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#EDE6DA" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#D6CBB8" strokeWidth="3" />
          </pattern>
        </defs>
        <rect x={0} y={BAR_Y} width={W} height={BAR_H} fill="url(#fallow)" rx={3} />
        {ticks.map((tk, i) => (
          <g key={i}>
            <line x1={tk.x} x2={tk.x} y1={BAR_Y - (tk.major ? 10 : 4)} y2={BAR_Y + BAR_H} stroke={tk.major ? '#33291F' : '#B9B2A6'} strokeWidth={tk.major ? 1.2 : 0.6} />
            <text x={tk.x + (rtl ? -3 : 3)} y={BAR_Y - (tk.major ? 12 : 6)} fontSize={tk.major ? 12 : 10} fontWeight={tk.major ? 600 : 400} fill="#6B5D4D" textAnchor={rtl ? 'end' : 'start'}>{tk.label}</text>
          </g>
        ))}
        {result.plantings.map((p) => {
          const segs: [number, number][] = p.harvest <= total ? [[p.sow, p.harvest]] : [[p.sow, total], [0, p.harvest - total]];
          return segs.map(([a, b], k) => {
            const w = ((b - a) / total) * W;
            const x = X(a, w);
            return (
              <g key={`${p.index}-${k}`}>
                <title>{`${p.crop.name[lang]}: ${date(p.sow)} → ${date(p.harvest)} (${p.crop.durationDays}d)`}</title>
                <rect x={x} y={BAR_Y} width={w} height={BAR_H} fill={familyColor(p.crop.family)} stroke="#F5F7F2" strokeWidth={1.5} rx={3} />
                {w > 52 && (
                  <text x={x + w / 2} y={BAR_Y + BAR_H / 2 + 4} fontSize={12} fontWeight={600} fill={familyInk(p.crop.family)} textAnchor="middle">
                    {p.crop.name[lang].replace(/\s*\(.*\)$/, '')}
                  </text>
                )}
              </g>
            );
          });
        })}
        <text x={rtl ? W : 0} y={H - 2} fontSize={10} fill="#6B5D4D" textAnchor={rtl ? 'end' : 'start'}>
          {result.plantings.map((p) => `${p.crop.name[lang].replace(/\s*\(.*\)$/, '')} ${date(p.sow)}–${date(p.harvest)}`).join(rtl ? ' ؛ ' : ' ; ')}
        </text>
      </svg>
    </figure>
  );
}

export function FamilyLegend({ lang, families }: { lang: Lang; families: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-siltSoft">
      {families.map((f) => (
        <li key={f} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: familyColor(f) }} />{t(lang, f)}</li>
      ))}
      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-[#D6CBB8] bg-[#EDE6DA]" />{t(lang, 'legendFallow')}</li>
    </ul>
  );
}
