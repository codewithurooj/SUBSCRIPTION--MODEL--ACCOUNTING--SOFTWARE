interface PlaceholderPageProps {
  group: string;
  title: string;
}

export function PlaceholderPage({ group, title }: PlaceholderPageProps) {
  return (
    <div className="p-8">
      <p className="text-sm text-gray-500">{group}</p>
      <h1 data-testid="placeholder-heading" className="text-2xl font-semibold">
        {group} &gt; {title}
      </h1>
      <p className="mt-4 text-gray-600">
        This page is coming soon. Requirements for {title} have not been
        implemented yet.
      </p>
    </div>
  );
}
