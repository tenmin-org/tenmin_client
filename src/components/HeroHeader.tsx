import type { ReactNode } from 'react';

type HeroHeaderProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Уже выбран магазин — компактнее, без большой иконки */
  compact?: boolean;
};

export function HeroHeader({
  icon,
  title,
  description,
  compact,
}: HeroHeaderProps) {
  return (
    <div
      className={`text-center px-page ${compact ? 'pt-hero-safe pb-5' : 'pt-hero-safe pb-7'}`}
    >
      {!compact && icon ? (
        <div className="mb-5 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-sm ring-1 ring-black/[0.06]">
            <div className="text-green-600 [&>svg]:h-10 [&>svg]:w-10">{icon}</div>
          </div>
        </div>
      ) : null}
      {compact && icon ? (
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-50 to-emerald-50 ring-1 ring-black/[0.06]">
            <div className="text-green-600 [&>svg]:h-7 [&>svg]:w-7">{icon}</div>
          </div>
        </div>
      ) : null}

      <h1
        className={`font-bold tracking-tight text-gray-900 ${
          compact ? 'text-xl leading-snug' : 'text-[1.625rem] leading-tight'
        }`}
      >
        {title}
      </h1>
      {description ? (
        <p className="mx-auto mt-3 max-w-[20rem] text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}
