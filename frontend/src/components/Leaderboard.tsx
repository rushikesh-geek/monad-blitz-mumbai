import { useEffect, useRef, useState } from 'react';
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

function ReputationBar({ value, max = 150 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = value >= 100 ? '#10b981' : value >= 80 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: color,
        boxShadow: `0 0 8px ${color}`,
        transition: 'width 0.6s ease',
        borderRadius: 2,
      }} />
    </div>
  );
}

export default function Leaderboard({ agents }: Props) {
  const prevRepRef = useRef<Record<string, number>>({});
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newFlash = new Set<string>();
    for (const agent of agents) {
      const prev = prevRepRef.current[agent.persona];
      if (prev !== undefined && prev !== agent.reputation) {
        newFlash.add(agent.persona);
      }
      prevRepRef.current[agent.persona] = agent.reputation;
    }
    if (newFlash.size > 0) {
      setFlashIds(newFlash);
      setTimeout(() => setFlashIds(new Set()), 1500);
    }
  }, [agents]);

  const sorted = [...agents].sort((a, b) => b.reputation - a.reputation);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '0 2px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((agent, rank) => {
          const color = AGENT_COLORS[agent.persona] || '#a78bfa';
          const icon = AGENT_ICONS[agent.persona] || '🤖';
          const isFlashing = flashIds.has(agent.persona);

          return (
            <div
              key={agent.persona}
              style={{
                background: isFlashing
                  ? `rgba(124, 58, 237, 0.15)`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isFlashing ? 'rgba(124,58,237,0.4)' : 'rgba(100,120,200,0.12)'}`,
                borderRadius: 12,
                padding: '14px 16px',
                transition: 'all 0.4s ease',
                cursor: 'default',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                {/* Rank */}
                <div style={{
                  width: 24, height: 24,
                  borderRadius: 6,
                  background: rank === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: rank === 0 ? '#fcd34d' : '#64748b',
                  flexShrink: 0,
                }}>
                  {rank + 1}
                </div>

                {/* Icon */}
                <span style={{ fontSize: 18 }}>{icon}</span>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: color }}>{agent.persona}</div>
                  <div style={{
                    fontSize: 10,
                    color: '#475569',
                    fontFamily: 'var(--font-mono)',
                    marginTop: 1,
                  }}>
                    {agent.address.slice(0, 6)}…{agent.address.slice(-4)}
                  </div>
                </div>

                {/* Reputation badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: `${color}22`,
                    border: `1px solid ${color}44`,
                    fontSize: 13,
                    fontWeight: 800,
                    color: color,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {agent.reputation}
                  </div>
                </div>
              </div>

              {/* Rep bar */}
              <ReputationBar value={agent.reputation} />

              {/* Stats row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 6,
                marginTop: 10,
              }}>
                {[
                  { label: 'Votes', value: agent.totalVotes.toString() },
                  { label: 'Accuracy', value: `${agent.accuracy}%` },
                  { label: 'Balance', value: `${parseFloat(agent.balance).toFixed(2)}` },
                  { label: 'Correct', value: agent.correctVotes.toString() },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 6,
                    padding: '5px 7px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {agents.length === 0 && (
          <div style={{ textAlign: 'center', color: '#475569', padding: '32px 0', fontSize: 13 }}>
            Loading agents...
          </div>
        )}
      </div>
    </div>
  );
}
