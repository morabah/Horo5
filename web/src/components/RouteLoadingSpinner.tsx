/**
 * Branded loading fallback for lazy-loaded routes.
 * Shows the HORO logo mark with a subtle pulse animation
 * instead of plain "Loading..." text.
 */
export function RouteLoadingSpinner() {
  return (
    <div className="route-loading-spinner" role="status" aria-label="Loading page">
      <div className="route-loading-mark" aria-hidden>
        <svg
          viewBox="0 0 40 40"
          width="40"
          height="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Simplified HORO "H" mark */}
          <line x1="12" y1="10" x2="12" y2="30" />
          <line x1="28" y1="10" x2="28" y2="30" />
          <line x1="12" y1="20" x2="28" y2="20" />
        </svg>
      </div>
    </div>
  );
}
