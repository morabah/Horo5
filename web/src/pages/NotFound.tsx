import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem' }}>Page not found</h1>
      <p style={{ color: 'var(--warm-charcoal)' }}>That route doesn&apos;t exist yet.</p>
      <Link className="btn btn-primary" to="/" style={{ marginTop: '1rem' }}>
        Back home
      </Link>
    </div>
  );
}
