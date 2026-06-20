import type { Observation } from '../api';

interface VoteRecord {
  agent: string;
  action: 'CONFIRM' | 'DISPUTE';
  confidence: number;
  stake: string;
  reasoning: string;
}

interface Props {
  observation: Observation;
  votes?: VoteRecord[];
  onClose: () => void;
}

const AGENT_COLORS: Record<string, string> = {
  'Agent-Flood': '#06b6d4',
  'Agent-Grid': '#f59e0b',
  'Agent-Crowd': '#10b981',
  'Agent-Skeptic': '#a78bfa',
};

function statusLabel(obs: Observation): string {
  if (!obs.finalized) return obs.voteCount > 0 ? 'VOTING' : 'PENDING';
  return obs.status === 1 ? 'CONFIRMED' : 'DISPUTED';
}

function statusColor(obs: Observation): string {
  if (!obs.finalized) return obs.voteCount > 0 ? '#f59e0b' : '#64748b';
  return obs.status === 1 ? '#10b981' : '#ef4444';
}

export default function ObservationInspector({ observation, votes, onClose }: Props) {
  const color = statusColor(observation);
  const label = statusLabel(observation);
  const confidence = observation.confidenceBps / 100;
  const totalStake = parseFloat(observation.confirmStake) + parseFloat(observation.disputeStake);
  const confirmPct = totalStake > 0
    ? Math.round((parseFloat(observation.confirmStake) / totalStake) * 100)
    : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        animation: 'fade-in 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 92vw)',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--bg-1)',
          border: '1px solid rgba(124,58,237,0.35)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.15)',
          padding: '20px 22px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: color, boxShadow: `0 0 12px ${color}`,
            marginTop: 4, flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
              OBSERVATION #{observation.id}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color }}>{label}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        {/* Claim */}
        <div style={{
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            {observation.claimType}
          </div>
          <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
            {observation.description}
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
            📍 {observation.lat.toFixed(4)}, {observation.lng.toFixed(4)}
          </div>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Confidence', value: observation.finalized ? `${confidence.toFixed(0)}%` : '—', color: '#67e8f9' },
            { label: 'Votes', value: `${observation.voteCount}/4`, color: '#a78bfa' },
            { label: 'Total Stake', value: `${totalStake.toFixed(3)} MON`, color: '#f59e0b' },
          ].map(({ label: l, value, color: c }) => (
            <div key={l} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '8px 10px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, color: '#64748b', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: 'var(--font-mono)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Consensus breakdown */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Consensus Breakdown
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: confirmPct, minWidth: 40 }}>
              <div style={{
                height: 8,
                borderRadius: 4,
                background: '#10b981',
                boxShadow: '0 0 8px rgba(16,185,129,0.4)',
              }} />
              <div style={{ fontSize: 10, color: '#6ee7b7', marginTop: 4 }}>
                CONFIRM {observation.confirmStake} MON ({confirmPct}%)
              </div>
            </div>
            <div style={{ flex: 100 - confirmPct, minWidth: 20 }}>
              <div style={{
                height: 8,
                borderRadius: 4,
                background: '#ef4444',
                opacity: parseFloat(observation.disputeStake) > 0 ? 1 : 0.2,
              }} />
              <div style={{ fontSize: 10, color: '#fca5a5', marginTop: 4 }}>
                DISPUTE {observation.disputeStake} MON ({100 - confirmPct}%)
              </div>
            </div>
          </div>
        </div>

        {/* Agent votes */}
        <div>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Agent Votes
          </div>
          {votes && votes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {votes.map((v) => {
                const ac = AGENT_COLORS[v.agent] || '#a78bfa';
                return (
                  <div key={v.agent} style={{
                    background: `${ac}08`,
                    border: `1px solid ${ac}22`,
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 11, color: ac }}>{v.agent}</span>
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: 10,
                        fontWeight: 700,
                        color: v.action === 'CONFIRM' ? '#6ee7b7' : '#fca5a5',
                      }}>
                        {v.action}
                      </span>
                      <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {v.stake} MON · {v.confidence}%
                      </span>
                    </div>
                    {v.reasoning && (
                      <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{v.reasoning}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              fontSize: 11,
              color: '#475569',
              padding: '10px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              {observation.finalized
                ? `${observation.voteCount} votes recorded on-chain. Live reasoning available for recent observations.`
                : 'Agents are voting — check Activity Feed for live updates.'}
            </div>
          )}
        </div>

        {/* Final outcome */}
        {observation.finalized && (
          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 8,
            background: `${color}12`,
            border: `1px solid ${color}44`,
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 700,
            color,
          }}>
            Final Outcome: {label} at {confidence.toFixed(0)}% confidence
          </div>
        )}
      </div>
    </div>
  );
}
