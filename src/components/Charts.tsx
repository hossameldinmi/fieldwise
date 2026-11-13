'use client';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ClimateProfile, Lang } from '@/lib/types';
import type { StrategyResult } from '@/lib/engine/evaluate';
import { DIMENSIONS } from '@/lib/engine/dimensions';
import { MONTH_DAYS, monthlyPET } from '@/lib/nasa/climate';
import { monthName, t } from '@/lib/i18n';
import { STRATEGY_COLORS } from '@/lib/ui';

export function ScoreRadar({ results, lang }: { results: StrategyResult[]; lang: Lang }) {
  const data = DIMENSIONS.map((d) => ({
    dim: t(lang, `dim_${d}`).split(/\s(&|and|و)\s|،|,/)[0],
    ...Object.fromEntries(results.map((r) => [r.id, Math.round(r.dims.find((x) => x.id === d)!.score)])),
  }));
  return (
    <div className="h-[360px] w-full print:h-[320px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={300}>
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="#D9DED3" />
          <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: '#33291F' }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6B5D4D' }} angle={90} />
          {results.map((r) => (
            <Radar key={r.id} name={`${t(lang, 'option', { id: r.id })}: ${t(lang, `strategy${r.id}`)}`} dataKey={r.id} stroke={STRATEGY_COLORS[r.id]} fill={STRATEGY_COLORS[r.id]} fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
          ))}
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ClimateChart({ climate, lang }: { climate: ClimateProfile; lang: Lang }) {
  const pet = monthlyPET(climate);
  const data = climate.months.map((m, i) => ({
    month: monthName(lang, i).slice(0, lang === 'ar' ? 6 : 3),
    t: Number(m.t2m.toFixed(1)),
    p: Number((m.precMmDay * MONTH_DAYS[i]).toFixed(1)),
    et: Number((pet[i] * MONTH_DAYS[i]).toFixed(0)),
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E4E8DF" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} reversed={lang === 'ar'} />
          <YAxis yAxisId="mm" tick={{ fontSize: 11 }} orientation={lang === 'ar' ? 'right' : 'left'} />
          <YAxis yAxisId="t" tick={{ fontSize: 11 }} orientation={lang === 'ar' ? 'left' : 'right'} />
          <Bar yAxisId="mm" dataKey="et" name={t(lang, 'pet')} fill="#C9D9E1" isAnimationActive={false} />
          <Bar yAxisId="mm" dataKey="p" name={t(lang, 'precip')} fill="#1E5A73" isAnimationActive={false} />
          <Line yAxisId="t" dataKey="t" name={t(lang, 'tMean')} stroke="#962F2F" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
