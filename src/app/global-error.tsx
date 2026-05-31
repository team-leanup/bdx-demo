'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fafafa' }}>
        <div
          style={{
            display: 'flex',
            minHeight: '100dvh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            padding: '0 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              height: '64px',
              width: '64px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              background: 'rgba(239,68,68,0.1)',
            }}
          >
            <svg
              style={{ height: '32px', width: '32px', color: '#ef4444' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111' }}>
              앱을 불러오지 못했어요
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#888' }}>
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={reset}
              style={{
                borderRadius: '12px',
                background: '#f3f4f6',
                border: 'none',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#111',
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            <button
              onClick={() => { window.location.reload(); }}
              style={{
                borderRadius: '12px',
                background: '#111',
                border: 'none',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              새로고침
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
