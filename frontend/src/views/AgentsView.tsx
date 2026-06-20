import type { Agent } from '../api';
import { theme, agentColor } from '../theme/theme';
import { Badge, Card, EmptyState } from '../components/ui';

interface Props {
  agents: Agent[];
  loading: boolean;
}

export default function AgentsView({ agents, loading }: Props) {
  const sorted = [...agents].sort((a, b) => b.reputation - a.reputation);

  if (loading && agents.length === 0) {
    return (
      <div style={{ padding: theme.spacing[6] }}>
        <Card><EmptyState title="Loading agents…" /></Card>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div style={{ padding: theme.spacing[6] }}>
        <Card>
          <EmptyState
            title="No agents on network"
            description="Agent profiles will appear when the backend connects to Monad."
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing[6], display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
      <div>
        <h1 style={{ margin: 0, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold }}>Agents</h1>
        <p style={{ margin: `${theme.spacing[2]}px 0 0`, color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
          Autonomous verifiers with independent wallets, reputation, and stake.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        {sorted.map((agent, rank) => {
          const accent = agentColor(agent.persona);
          const health = agent.reputation >= 100 ? 'Healthy' : agent.reputation >= 80 ? 'Moderate' : 'At risk';
          const healthTone = agent.reputation >= 100 ? 'success' : agent.reputation >= 80 ? 'warning' : 'danger';

          return (
            <Card key={agent.persona}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing[4], marginBottom: theme.spacing[4] }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: theme.radius.md,
                    background: theme.colors.bg.elevated,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.bold,
                    color: theme.colors.text.muted,
                    flexShrink: 0,
                  }}
                >
                  {rank + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: theme.fontWeight.semibold, color: accent }}>{agent.persona}</span>
                    <Badge tone={healthTone as 'success' | 'warning' | 'danger'}>{health}</Badge>
                  </div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted, fontFamily: theme.font.mono, marginTop: 4 }}>
                    {agent.address}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>Reputation</div>
                  <div style={{ fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, fontFamily: theme.font.mono, color: accent }}>
                    {agent.reputation}
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: 4,
                  background: theme.colors.bg.muted,
                  borderRadius: 2,
                  overflow: 'hidden',
                  marginBottom: theme.spacing[4],
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (agent.reputation / 200) * 100)}%`,
                    background: accent,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing[3] }}>
                {[
                  { label: 'Balance', value: `${parseFloat(agent.balance).toFixed(3)} MON` },
                  { label: 'Votes', value: agent.totalVotes.toString() },
                  { label: 'Accuracy', value: `${agent.accuracy}%` },
                  { label: 'Correct', value: agent.correctVotes.toString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>{label}</div>
                    <div style={{ fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, fontFamily: theme.font.mono, marginTop: 2 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
