'use client';
import type { Lang, Tier } from '@/lib/types';
import { t } from '@/lib/i18n';

const TIER_STYLE: Record<Tier, string> = {
  1: 'bg-canal text-white',
  2: 'bg-[#DCE8EE] text-canal',
  3: 'bg-[#E1ECDF] text-berseem',
  4: 'bg-[#F3EBD3] text-[#6F5612]',
  5: 'bg-white text-blight ring-1 ring-blight',
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
