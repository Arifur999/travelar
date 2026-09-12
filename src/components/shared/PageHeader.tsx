interface PageHeaderProps {
  title: string;
  description?: string;
  /** Usually a Create button or modal trigger. */
  action?: React.ReactNode;
}

const PageHeader = ({ title, description, action }: PageHeaderProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      {/* h2, not h1 — the navbar already renders the page h1 from the nav config. */}
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
