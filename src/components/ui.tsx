'use client';
import type { Lang, Tier } from '@/lib/types';
import { t } from '@/lib/i18n';
import { STATUS_STYLE, type Status } from '@/lib/ui';

export function PageHead({ eyebrow, title, lead, aside }: { eyebrow: string; title: string; lead?: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="fw-eye">{eyebrow}</div>
        <h1 className="fw-h1">{title}</h1>
        {lead && <p className="fw-lead">{lead}</p>}
      </div>
      {aside}
    </div>
  );
}

export function StatusBadge({ status, lang }: { status: Status; lang: Lang }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="min-w-[52px] flex-none rounded-md border px-2 py-[3px] text-center text-xs font-bold" style={{ background: s.badge, color: s.head, borderColor: s.line }}>
      {t(lang, status)}
    </span>
  );
}

/** One evidence line: status badge, rendered text, and its dimension/tier. */
export function RuleItem({ status, text, meta, lang, boxed }: { status: Status; text: string; meta: string; lang: Lang; boxed?: boolean }) {
  return (
    <li className={`flex items-start gap-3 ${boxed ? 'rounded-[10px] border border-soft px-3 py-2.5' : ''}`}>
      <StatusBadge status={status} lang={lang} />
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-relaxed">{text}</div>
        <div className="mt-1 font-mono text-[11px] text-muted">{meta}</div>
      </div>
    </li>
  );
}

const TIER_BORDER: Record<Tier, string> = { 1: '#1F5F99', 2: '#1D6B47', 3: '#5B2F7A', 4: '#C2630A', 5: '#9B2C1F' };
const TIER_INK: Record<Tier, string> = { 1: '#174A78', 2: '#134A31', 3: '#5B2F7A', 4: '#8A4205', 5: '#9B2C1F' };

export function TierLegend({ lang }: { lang: Lang }) {
  return (
    <section className="mt-6" aria-label={t(lang, 'tiers')}>
      <h2 className="fw-h2 text-lg">{t(lang, 'tiers')}</h2>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3">
        {([1, 2, 3, 4, 5] as Tier[]).map((k) => (
          <div key={k} className="fw-card px-4 py-3.5" style={{ borderTop: `4px solid ${TIER_BORDER[k]}` }}>
            <div className="text-xs font-bold" style={{ color: TIER_INK[k] }}>{t(lang, 'tierWord')} {k}</div>
            <div className="mt-1 text-[15px] font-semibold">{t(lang, `tier${k}`)}</div>
            <div className="mt-1.5 text-[13px] leading-relaxed text-muted">{t(lang, `tier${k}d`)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GapsBox({ lang }: { lang: Lang }) {
  return (
    <section aria-label={t(lang, 'gapsTitle')} className="mt-6 rounded-[14px] border border-amber-line bg-amber-tint px-[22px] py-[18px]">
      <h2 className="fw-h2 text-amber-ink">{t(lang, 'gapsTitle')}</h2>
      <ul className="mt-2.5 list-disc space-y-0.5 ps-5 text-sm leading-relaxed text-amber-ink">
        {[1, 2, 3, 4].map((i) => <li key={i}>{t(lang, `gap${i}`)}</li>)}
      </ul>
    </section>
  );
}

export function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="rtl:-scale-x-100">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Bar({ value, color }: { value: number; color: string }) {
  return (
    <span className="h-2 flex-1 overflow-hidden rounded bg-track">
      <span className="block h-full rounded" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </span>
  );
}
