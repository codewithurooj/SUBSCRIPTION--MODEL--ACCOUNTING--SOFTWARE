interface PlaceholderPageProps {
  group: string;
  title: string;
}

export function PlaceholderPage({ group, title }: PlaceholderPageProps) {
  return (
    <div className="p-8">
      <div className="rounded-lg border border-paper-300 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-gold-600 uppercase">{group}</p>
        <h1 data-testid="placeholder-heading" className="mt-2 text-2xl font-semibold">
          {group} &gt; {title}
        </h1>
        <p className="mt-3 text-ink-500">
          This page is coming soon. Requirements for {title} have not been
          implemented yet.
        </p>
      </div>
    </div>
  );
}
