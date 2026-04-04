import { Link } from 'react-router-dom';

export type PageBreadcrumbItem = {
  label: string;
  to?: string;
};

type PageBreadcrumbProps = {
  items: PageBreadcrumbItem[];
  className?: string;
};

/**
 * Shared trail: last item is current page (no link). Matches policy/PDP breadcrumb tone.
 */
export function PageBreadcrumb({ items, className = '' }: PageBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      className={`font-body text-sm text-clay ${className}`.trim()}
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-h-11 items-center gap-x-2">
              {index > 0 ? (
                <span className="text-clay/50" aria-hidden>
                  /
                </span>
              ) : null}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="inline-flex items-center rounded-sm px-0.5 transition-colors hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={`px-0.5 ${isLast ? 'text-warm-charcoal' : ''}`}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
