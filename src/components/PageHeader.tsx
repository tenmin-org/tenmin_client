import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
};

const sideSlotClass = 'flex w-11 flex-shrink-0 items-center justify-center';

/** Шапка второго уровня: заголовок по центру, «Назад» не перекрывает текст (как в нативных мини-приложениях). */
export function PageHeader({ title, subtitle, onBack, right }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-[52px] items-center gap-1 px-page pb-3 pt-hero-safe">
        <div className={`${sideSlotClass} justify-start`}>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100/90 active:scale-90 transition-transform"
              aria-label="Назад"
            >
              <ArrowLeft size={20} strokeWidth={2} className="text-gray-800" />
            </button>
          ) : (
            <span className="h-10 w-10" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 px-1 text-center">
          <h1 className="truncate text-[17px] font-semibold leading-snug tracking-tight text-gray-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs leading-snug text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        <div className={`${sideSlotClass} justify-end`}>{right ?? <span className="h-10 w-10" aria-hidden />}</div>
      </div>
    </header>
  );
}
