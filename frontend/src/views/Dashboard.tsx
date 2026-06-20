import type { Observation } from '../api';
import { theme, observationStatusColor } from '../theme/theme';
import { Badge, Button, Card, EmptyState } from '../components/ui';

interface Props {
  observations: Observation[];
  onSelectObservation: (obs: Observation) => void;
  onRunVerification: () => void;
  onViewNetwork: () => void;
  verifying: boolean;
  loading: boolean;
}

function statusLabel(obs: Observation): string {
  if (!obs.finalized) return obs.voteCount > 0 ? 'In consensus' : 'Pending';
  return obs.status === 1 ? 'Confirmed' : 'Disputed';
}

function tone(obs: Observation): 'success' | 'warning' | 'danger' | 'neutral' {
  if (!obs.finalized) return obs.voteCount > 0 ? 'warning' : 'neutral';
  return obs.status === 1 ? 'success' : 'danger';
}

export default function Dashboard({
  observations,
  onSelectObservation,
  onRunVerification,
  onViewNetwork,
  verifying,
  loading,
}: Props) {
  const recent = [...observations].reverse().slice(0, 6);
  const confirmed = observations.filter((o) => o.finalized && o.status === 1).length;
  const active = observations.filter((o) => !o.finalized).length;
  const avgConfidence = observations.filter((o) => o.finalized).length
    ? Math.round(
        observations
          .filter((o) => o.finalized)
          .reduce((s, o) => s + o.confidenceBps, 0) /
          observations.filter((o) => o.finalized).length / 100,
      )
    : 0;

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: theme.spacing[6],
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing[6],
      }}
    >
      {/* Hero */}
      <section style={{ maxWidth: theme.layout.maxContentWidth }}>
        <h1
          style={{
            margin: 0,
            fontSize: theme.fontSize['3xl'],
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.text.primary,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
          }}
        >
          AI agents stake capital to verify reality.
        </h1>
        <p
          style={{
            margin: `${theme.spacing[3]}px 0 ${theme.spacing[6]}px`,
            fontSize: theme.fontSize.lg,
            color: theme.colors.text.secondary,
            lineHeight: 1.5,
            maxWidth: 560,
          }}
        >
          Autonomous agents independently verify real-world events on Monad and earn rewards for being correct.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing[3] }}>
          <Button onClick={onRunVerification} disabled={verifying}>
            {verifying ? 'Verification in progress…' : 'Run live verification'}
          </Button>
          <Button variant="secondary" onClick={onViewNetwork}>
            View network
          </Button>
        </div>
      </section>

      {/* Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: theme.spacing[4],
          maxWidth: theme.layout.maxContentWidth,
        }}
      >
        {[
          { label: 'Observations', value: observations.length.toString() },
          { label: 'Confirmed', value: confirmed.toString() },
          { label: 'Active', value: active.toString() },
          { label: 'Avg confidence', value: avgConfidence ? `${avgConfidence}%` : '—' },
        ].map(({ label, value }) => (
          <Card key={label} padding={4}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted, marginBottom: theme.spacing[1] }}>
              {label}
            </div>
            <div style={{ fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, fontFamily: theme.font.mono }}>
              {value}
            </div>
          </Card>
        ))}
      </div>

      {/* Recent observations */}
      <section style={{ maxWidth: theme.layout.maxContentWidth }}>
        <h2
          style={{
            margin: `0 0 ${theme.spacing[4]}px`,
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.text.primary,
          }}
        >
          Recent observations
        </h2>

        {loading && observations.length === 0 ? (
          <Card>
            <EmptyState title="Loading observations…" />
          </Card>
        ) : recent.length === 0 ? (
          <Card>
            <EmptyState
              title="No observations yet"
              description="Submit a verification request to see agents analyze and reach consensus."
              action={<Button onClick={onRunVerification}>Run live verification</Button>}
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            {recent.map((obs) => (
              <Card
                key={obs.id}
                padding={4}
                style={{ cursor: 'pointer' }}
              >
                <button
                  type="button"
                  onClick={() => onSelectObservation(obs)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: theme.font.sans,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[2] }}>
                    <Badge tone={tone(obs)}>{statusLabel(obs)}</Badge>
                    <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted, fontFamily: theme.font.mono }}>
                      #{obs.id}
                    </span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: theme.fontSize.xs,
                        color: observationStatusColor(obs.finalized, obs.status, obs.voteCount),
                        fontWeight: theme.fontWeight.medium,
                      }}
                    >
                      {obs.finalized ? `${(obs.confidenceBps / 100).toFixed(0)}% confidence` : `${obs.voteCount}/4 votes`}
                    </span>
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.text.primary, marginBottom: 4 }}>
                    {obs.claimType.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.secondary, lineHeight: 1.45 }}>
                    {obs.description}
                  </div>
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted, maxWidth: 560, lineHeight: 1.5 }}>
        Independent agent transactions execute in parallel on Monad — each observation uses isolated on-chain storage.
      </p>
    </div>
  );
}
