import { Link } from 'react-router-dom';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { useUiLocale } from '../i18n/ui-locale';
import { NAV_ROUTE } from '../lib/navLinks';

export function NotFound() {
  const { copy } = useUiLocale();

  return (
    <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
      <PageBreadcrumb className="mb-8 text-left" items={[{ label: copy.shell.home, to: '/' }, { label: copy.shell.pageNotFound }]} />
      <h1 style={{ fontSize: '1.5rem' }}>{copy.shell.pageNotFound}</h1>
      <p style={{ color: 'var(--warm-charcoal)' }}>That route doesn&apos;t exist yet.</p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '1.5rem',
        }}
      >
        <Link className="btn btn-primary" to="/">
          Back home
        </Link>
        <Link className="btn btn-secondary text-sm" to="/search">
          {copy.shell.search}
        </Link>
        <Link className="btn btn-secondary text-sm" to={NAV_ROUTE.collection.path}>
          {copy.shell.shopByFeeling}
        </Link>
      </div>
    </div>
  );
}
