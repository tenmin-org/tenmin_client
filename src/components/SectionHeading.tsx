type SectionHeadingProps = {
  children: string;
  className?: string;
};

/** Подпись секции в стиле «My bots» у BotFather (родитель задаёт px-page) */
export function SectionHeading({ children, className = '' }: SectionHeadingProps) {
  return (
    <h2
      className={`mb-3 text-left text-[17px] font-semibold tracking-tight text-gray-900 ${className}`}
    >
      {children}
    </h2>
  );
}
