'use client';
import type { Lang } from '@/lib/types';
import { t } from '@/lib/i18n';

export type Step = 1 | 2 | 3 | 4 | 5;

interface Props { lang: Lang; step: Step; canAnalyze: boolean; onStep: (s: Step) => void; onLang: (l: Lang) => void }

export function AppHeader({ lang, step, canAnalyze, onStep, onLang }: Props) {
  return (
    <header className="no-print border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
            <rect width="36" height="36" rx="8" fill="#1D6B47" />
            <path d="M8 26h20M8 20h20M8 14h20" stroke="#E3EFE7" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="10" r="3" fill="#F2B544" />
          </svg>
          <div>
            <div className="text-lg font-bold">{t(lang, 'appName')}</div>
            <div className="text-xs text-muted">{t(lang, 'appSub')}</div>
          </div>
        </div>
        <nav aria-label={t(lang, 'workflow')} className="flex flex-wrap gap-0.5">
          {([1, 2, 3, 4, 5] as Step[]).map((n) => {
            const cur = n === step;
            const locked = n >= 2 && n <= 4 && !canAnalyze;
            return (
              <button key={n} type="button" onClick={() => onStep(n)} disabled={locked} title={locked ? t(lang, 'needClimate') : undefined}
                aria-current={cur ? 'step' : undefined}
                className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${cur ? 'bg-green-tint font-semibold text-green-dark' : 'font-medium text-sub hover:bg-paper'}`}>
                <span className="font-mono">{n}</span>{t(lang, `nav${n}`)}
              </button>
            );
          })}
        </nav>
        <div className="fw-seg" role="group" aria-label={t(lang, 'langGroup')}>
          <button type="button" lang="en" className="fw-seg-btn" aria-pressed={lang === 'en'} onClick={() => onLang('en')}>EN</button>
          <button type="button" lang="ar" className="fw-seg-btn" aria-pressed={lang === 'ar'} onClick={() => onLang('ar')}>العربية</button>
        </div>
      </div>
    </header>
  );
}
