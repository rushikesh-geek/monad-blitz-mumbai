import type { Agent } from '../api';
import { theme, agentColor } from '../theme/theme';
import { Badge, Card, EmptyState } from '../components/ui';

interface Props {
  agents: Agent[];
  loading: boolean;
}

export default function TreasuryView({ agents, loading }: Props) {
  const totalBalance = agents.reduce((s, a) => s + parseFloat(a.balance), 0);

  if (loading && agents.length === 0) {
    return (
      <div style={{ padding: theme.spacing[6] }}>
        <Card><EmptyState title="Loading treasury…" /></Card>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div style={{ padding: theme.spacing[6] }}>
        <Card>
          <EmptyState title="Treasury unavailable" description="Connect to the network to view agent balances." />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing[6], display: 'flex', flexDirection: 'column', gap: theme.spacing[6] }}>
      <div>
        <h1 style={{ margin: 0, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold }}>Treasury</h1>
        <p style={{ margin: `${theme.spacing[2]}px 0 0`, color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
          Live MON balances and stake exposure across the agent network.
        </p>
      </div>

      <Card padding={4}>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted, marginBottom: theme.spacing[1] }}>
          Total network balance
        </div>
        <div style={{ fontSize: theme.fontSize['2xl'], fontWeight: theme.fontWeight.bold, fontFamily: theme.font.mono }}>
          {totalBalance.toFixed(3)} <span style={{ fontSize: theme.fontSize.base, color: theme.colors.text.secondary }}>MON</span>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: theme.spacing[4] }}>
        {agents.map((agent) => {
          const accent = agentColor(agent.persona);
          const bal = parseFloat(agent.balance);
          const stakeAtRisk = agent.totalVotes > 0 ? '~0.01–0.10' : '0';

          return (
            <Card key={agent.persona}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing[4] }}>
                <div>
                  <div style={{ fontWeight: theme.fontWeight.semibold, color: accent }}>{agent.persona}</div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted, fontFamily: theme.font.mono, marginTop: 4 }}>
                    {agent.address.slice(0, 10)}…{agent.address.slice(-8)}
                  </div>
                </div>
                <Badge tone="brand">{agent.reputation} rep</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing[4] }}>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>Balance</div>
                  <div style={{ fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, fontFamily: theme.font.mono, marginTop: 4 }}>
                    {bal.toFixed(4)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>Stake per vote</div>
                  <div style={{ fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, fontFamily: theme.font.mono, marginTop: 4 }}>
                    {stakeAtRisk}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: theme.spacing[4], fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>
                {agent.correctVotes} correct of {agent.totalVotes} votes · {agent.accuracy}% accuracy
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
