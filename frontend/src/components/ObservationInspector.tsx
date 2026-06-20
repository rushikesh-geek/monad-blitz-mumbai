import type { Observation } from '../api';
import type { VoteRecord } from '../hooks/useNetworkState';
import { theme, observationStatusColor } from '../theme/theme';
import { agentColor } from '../theme/theme';
import { Badge, Button } from './ui';

interface Props {
  observation: Observation;
  votes?: VoteRecord[];
  onClose: () => void;
}

function statusLabel(obs: Observation): string {
  if (!obs.finalized) return obs.voteCount > 0 ? 'In consensus' : 'Pending';
  return obs.status === 1 ? 'Confirmed' : 'Disputed';
}

function tone(obs: Observation): 'success' | 'warning' | 'danger' | 'neutral' {
  if (!obs.finalized) return obs.voteCount > 0 ? 'warning' : 'neutral';
  return obs.status === 1 ? 'success' : 'danger';
}

export default function ObservationInspector({ observation, votes, onClose }: Props) {
  const confidence = observation.confidenceBps / 100;
  const totalStake = parseFloat(observation.confirmStake) + parseFloat(observation.disputeStake);
  const confirmPct = totalStake > 0 ? Math.round((parseFloat(observation.confirmStake) / totalStake) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        padding: theme.spacing[4],
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(480px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: theme.colors.bg.surface,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: theme.radius.md,
          boxShadow: theme.shadow.lg,
          padding: theme.spacing[6],
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: theme.spacing[4] }}>
          <div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted, fontFamily: theme.font.mono, marginBottom: theme.spacing[1] }}>
              Observation #{observation.id}
            </div>
            <Badge tone={tone(observation)}>{statusLabel(observation)}</Badge>
          </div>
          <Button variant="ghost" onClick={onClose} style={{ padding: '4px 10px' }} aria-label="Close">
            Close
          </Button>
        </div>

        <h2 style={{ margin: `0 0 ${theme.spacing[2]}px`, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, textTransform: 'capitalize' }}>
          {observation.claimType.replace(/_/g, ' ')}
        </h2>
        <p style={{ margin: `0 0 ${theme.spacing[4]}px`, color: theme.colors.text.secondary, lineHeight: 1.5, fontSize: theme.fontSize.sm }}>
          {observation.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
          {[
            { label: 'Confidence', value: observation.finalized ? `${confidence.toFixed(0)}%` : '—' },
            { label: 'Votes', value: `${observation.voteCount}/4` },
            { label: 'Stake', value: `${totalStake.toFixed(3)} MON` },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: theme.spacing[3], background: theme.colors.bg.elevated, borderRadius: theme.radius.md }}>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>{label}</div>
              <div style={{ fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.semibold, fontFamily: theme.font.mono, marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: theme.spacing[4] }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted, marginBottom: theme.spacing[2] }}>Consensus breakdown</div>
          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: theme.colors.bg.muted }}>
            <div style={{ flex: confirmPct, background: theme.colors.status.success }} />
            <div style={{ flex: 100 - confirmPct, background: theme.colors.status.danger, opacity: parseFloat(observation.disputeStake) > 0 ? 1 : 0.3 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: theme.spacing[2], fontSize: theme.fontSize.xs, color: theme.colors.text.secondary }}>
            <span>Confirm {observation.confirmStake} MON</span>
            <span>Dispute {observation.disputeStake} MON</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted, marginBottom: theme.spacing[2] }}>Agent votes</div>
          {votes && votes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
              {votes.map((v) => (
                <div key={v.agent} style={{ padding: theme.spacing[3], background: theme.colors.bg.elevated, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border.default}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: theme.fontWeight.medium, color: agentColor(v.agent), fontSize: theme.fontSize.sm }}>{v.agent}</span>
                    <span style={{ fontSize: theme.fontSize.xs, fontFamily: theme.font.mono, color: v.action === 'CONFIRM' ? theme.colors.status.success : theme.colors.status.danger }}>
                      {v.action} · {v.stake} MON
                    </span>
                  </div>
                  {v.reasoning && (
                    <p style={{ margin: 0, fontSize: theme.fontSize.xs, color: theme.colors.text.secondary, lineHeight: 1.45 }}>
                      {v.reasoning}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.muted, margin: 0 }}>
              {observation.finalized
                ? `${observation.voteCount} votes recorded on-chain.`
                : 'Agents are voting — check activity for updates.'}
            </p>
          )}
        </div>

        {observation.finalized && (
          <div
            style={{
              marginTop: theme.spacing[4],
              padding: theme.spacing[3],
              borderRadius: theme.radius.md,
              background: `${observationStatusColor(observation.finalized, observation.status, observation.voteCount)}14`,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: observationStatusColor(observation.finalized, observation.status, observation.voteCount),
              textAlign: 'center',
            }}
          >
            {statusLabel(observation)} at {confidence.toFixed(0)}% confidence
          </div>
        )}
      </div>
    </div>
  );
}
