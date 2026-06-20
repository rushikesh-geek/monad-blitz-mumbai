interface Props {
  highlight?: boolean;
}

export default function MonadWinPanel({ highlight }: Props) {
  return (
    <div
      id="monad-win-panel"
      style={{
        background: highlight
          ? 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.12) 100%)'
          : 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.04) 100%)',
        border: highlight
          ? '1px solid rgba(124,58,237,0.55)'
          : '1px solid rgba(124,58,237,0.25)',
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: highlight ? '0 0 32px rgba(124,58,237,0.3)' : 'none',
        transition: 'all 0.5s ease',
      }}
    >
      <div style={{
        fontSize: 13,
        fontWeight: 800,
        color: '#a78bfa',
        marginBottom: 14,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        ⚡ Why Monad?
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'stretch' }}>
        {/* Traditional Oracle */}
        <div style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10,
          padding: '12px 14px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', marginBottom: 10 }}>
            Traditional Oracle
          </div>
          {[
            { icon: '1️⃣', text: '1 data source' },
            { icon: '🏢', text: 'Centralized operator' },
            { icon: '💥', text: 'Single failure point' },
            { icon: '📋', text: 'No skin in the game' },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              color: '#94a3b8',
              marginBottom: 6,
            }}>
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* VS */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 800,
          color: '#475569',
        }}>
          VS
        </div>

        {/* Proof of Reality */}
        <div style={{
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 10,
          padding: '12px 14px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6ee7b7', marginBottom: 10 }}>
            Proof of Reality
          </div>
          {[
            { icon: '🤖', text: '4 autonomous agents' },
            { icon: '👛', text: 'Independent wallets' },
            { icon: '💎', text: 'Independent stakes' },
            { icon: '⚡', text: 'Parallel verification' },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              color: '#e2e8f0',
              marginBottom: 6,
            }}>
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 14,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(124,58,237,0.12)',
        border: '1px solid rgba(124,58,237,0.3)',
        fontSize: 12,
        color: '#c4b5fd',
        textAlign: 'center',
        fontWeight: 600,
        lineHeight: 1.5,
      }}>
        Monad executes these independent transactions <span style={{ color: '#67e8f9' }}>concurrently</span> —
        not in a queue. Each observation is storage-isolated. Scale to 1,000 agents without bottlenecking.
      </div>
    </div>
  );
}
