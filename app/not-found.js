import Link from 'next/link';

export default function NotFound() {
  return (
    <div role="alert" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      zIndex: 1,
    }}>
      <div className="mesh-bg" aria-hidden="true" />
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div aria-hidden="true" style={{
          fontFamily: 'var(--font-outfit,Outfit),sans-serif',
          fontSize: 'clamp(6rem,20vw,9rem)',
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg,#6366f1,#d946ef)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          letterSpacing: '-0.04em',
        }}>
          404
        </div>

        <h1 style={{
          fontFamily: 'var(--font-outfit,Outfit),sans-serif',
          fontWeight: 800,
          fontSize: '1.75rem',
          marginBottom: '0.75rem',
          color: '#f0f0ff',
        }}>
          Page not found
        </h1>

        <p style={{
          color: '#a0a0c0',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          marginBottom: '2.5rem',
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.9rem' }}>
            <span>Go to Dashboard</span>
          </Link>
          <Link href="/" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.9rem' }}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
