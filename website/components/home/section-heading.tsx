import type { ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[680px] text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-fd-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
        {title}
      </h2>
      {children && (
        <p className="mt-4 text-lg text-fd-muted-foreground">{children}</p>
      )}
    </div>
  );
}
