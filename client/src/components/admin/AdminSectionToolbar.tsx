import { Link } from 'react-router-dom';

export type Crumb = {
  label: string;
  to?: string;
};

type AdminSectionToolbarProps = {
  breadcrumbs: Crumb[];
  actions?: React.ReactNode;
};

/** Breadcrumbs + page actions shown inside the content section (not the top bar). */
export default function AdminSectionToolbar({
  breadcrumbs,
  actions,
}: AdminSectionToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1 text-sm text-stone-500"
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <span className="text-stone-300">/</span>}
              {crumb.to && !isLast ? (
                <Link to={crumb.to} className="hover:text-ink">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-ink' : undefined}>
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
