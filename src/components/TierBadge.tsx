'use client';
import type { Lang, Tier } from '@/lib/types';
import { t } from '@/lib/i18n';

const TIER_STYLE: Record<Tier, string> = {
  1: 'bg-blue-deep text-white',
  2: 'bg-green-tint text-green-dark',
  3: 'bg-plum-band text-plum',
  4: 'bg-amber-tint text-amber',
  5: 'bg-white text-red ring-1 ring-red',
};

export function TierBadge({ tier, lang }: { tier: Tier; lang: Lang }) {
  return (
    <span
      title={t(lang, `tier${tier}`)}
      aria-label={t(lang, `tier${tier}`)}
      className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${TIER_STYLE[tier]}`}
    >
      T{tier}
    </span>
  );
}
