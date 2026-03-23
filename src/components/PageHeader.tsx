import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function PageHeader({ title, subtitle, onBack, right }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="pt-content-safe">
        <div className="flex items-center gap-2 px-page pb-3 pt-1 min-h-[52px]">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Назад"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-[17px] leading-snug tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{subtitle}</p>
            ) : null}
          </div>
          {right ? <div className="flex-shrink-0 flex items-center">{right}</div> : null}
        </div>
      </div>
    </header>
  );
}
