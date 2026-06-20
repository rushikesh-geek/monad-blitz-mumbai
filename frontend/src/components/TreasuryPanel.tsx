import type { Agent } from '../api';

interface Props {
  agents: Agent[];
}

const AGENT_COLORS: Record<string, string> = {
  'Agent-Flood': '#06b6d4',
  'Agent-Grid': '#f59e0b',
  'Agent-Crowd': '#10b981',
  'Agent-Skeptic': '#a78bfa',
};

const AGENT_ICONS: Record<string, string> = {
  'Agent-Flood': '🌊',
  'Agent-Grid': '⚡',
  'Agent-Crowd': '👥',
  'Agent-Skeptic': '🔍',
};

function TreasuryStat({ label, value, sub, color }: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 8,
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: 10, color: '#475569', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: color || '#e2e8f0',
        fontFamily: 'var(--font-mono)',
        lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function TreasuryPanel({ agents }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflowY: 'auto' }}>
      {agents.map((agent) => {
        const color = AGENT_COLORS[agent.persona] || '#a78bfa';
        const icon = AGENT_ICONS[agent.persona] || '🤖';
        const bal = parseFloat(agent.balance);
        const repStatus = agent.reputation >= 100 ? 'Healthy' : agent.reputation >= 80 ? 'Caution' : 'Penalized';
        const repColor = agent.reputation >= 100 ? '#10b981' : agent.reputation >= 80 ? '#f59e0b' : '#ef4444';

        return (
          <div
            key={agent.persona}
            style={{
              background: `linear-gradient(135deg, rgba(${
                color === '#06b6d4' ? '6,182,212' :
                color === '#f59e0b' ? '245,158,11' :
                color === '#10b981' ? '16,185,129' :
                '167,139,250'
              },0.06) 0%, rgba(13,20,36,0.8) 100%)`,
              border: `1px solid ${color}22`,
              borderRadius: 14,
              padding: '14px 16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gradient accent top-left */}
            <div style={{
              position: 'absolute',
              top: -20,
              left: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `${color}18`,
              filter: 'blur(20px)',
              pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative' }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: color, fontSize: 14 }}>{agent.persona}</div>
                <div style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-mono)' }}>
                  {agent.address.slice(0, 8)}…{agent.address.slice(-6)}
                </div>
              </div>
              <div style={{
                padding: '3px 8px',
                borderRadius: 20,
                background: `${repColor}20`,
                border: `1px solid ${repColor}44`,
                fontSize: 10,
                fontWeight: 700,
                color: repColor,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {repStatus}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, position: 'relative' }}>
              <TreasuryStat
                label="Balance"
                value={`${bal.toFixed(3)}`}
                sub="MON"
                color="#67e8f9"
              />
              <TreasuryStat
                label="Reputation"
                value={agent.reputation.toString()}
                sub={`${agent.accuracy}% accuracy`}
                color={repColor}
              />
              <TreasuryStat
                label="Total Votes"
                value={agent.totalVotes.toString()}
                sub={`${agent.correctVotes} correct`}
                color="#a78bfa"
              />
            </div>

            {/* Balance bar */}
            <div style={{ marginTop: 10, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10, color: '#475569' }}>
                <span>Wallet balance</span>
                <span style={{ color: '#67e8f9', fontFamily: 'var(--font-mono)' }}>{bal.toFixed(4)} MON</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (bal / 1) * 100)}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  borderRadius: 2,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          </div>
        );
      })}

      {agents.length === 0 && (
        <div style={{ textAlign: 'center', color: '#475569', padding: '32px 0', fontSize: 13 }}>
          Loading treasury data...
        </div>
      )}

      {/* Economy narrative */}
      <div style={{
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 10,
        padding: '10px 14px',
        marginTop: 4,
      }}>
        <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>🤖 Agent Economy</div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
          Each agent owns a wallet, holds MON, stakes on votes, and earns rewards for correct verdicts. 
          Wrong votes lose stake. No human approval required.
        </div>
      </div>
    </div>
  );
}
