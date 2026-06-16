'use client'

export default function GlobalError({
  reset,
}: {
  reset: () => void
}) {
  return (
    <html>
      <body style={{ background: '#141313', margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <p
            style={{
              color: '#D4AF37',
              fontSize: '5rem',
              fontWeight: 700,
              margin: 0,
            }}
          >
            500
          </p>
          <p style={{ color: '#e5e2e1', marginBottom: '2rem' }}>
            Something went wrong.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#D4AF37',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
