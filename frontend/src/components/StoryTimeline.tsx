export type StoryStep =
  | 'idle'
  | 'submitted'
  | 'analyzing'
  | 'staking'
  | 'consensus'
  | 'rewards'
  | 'reputation';

interface Props {
  activeStep: StoryStep;
  obsId?: string;
  highlight?: boolean;
}

const STEPS: { id: StoryStep; label: string; icon: string }[] = [
  { id: 'submitted', label: 'Observation Submitted', icon: '📡' },
  { id: 'analyzing', label: '4 Agents Analyze', icon: '🤖' },
  { id: 'staking', label: 'Agents Stake MON', icon: '💎' },
  { id: 'consensus', label: 'Consensus Reached', icon: '⚖️' },
  { id: 'rewards', label: 'Rewards Distributed', icon: '💰' },
  { id: 'reputation', label: 'Reputation Updated', icon: '📈' },
];

const ORDER: StoryStep[] = ['submitted', 'analyzing', 'staking', 'consensus', 'rewards', 'reputation'];

function stepIndex(step: StoryStep): number {
  if (step === 'idle') return -1;
  return ORDER.indexOf(step);
}

export default function StoryTimeline({ activeStep, obsId, highlight }: Props) {
  const current = stepIndex(activeStep);

  return (
    <div
      id="story-timeline"
      style={{
        background: highlight
          ? 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.08) 100%)'
          : 'rgba(255,255,255,0.02)',
        border: highlight
          ? '1px solid rgba(124,58,237,0.5)'
          : '1px solid rgba(100,120,200,0.12)',
        borderRadius: 12,
        padding: '14px 16px',
        boxShadow: highlight ? '0 0 24px rgba(124,58,237,0.25)' : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>📖</span>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#a78bfa' }}>Story Mode</div>
        {obsId && (
          <div style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: '#64748b',
            fontFamily: 'var(--font-mono)',
          }}>
            #{obsId}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STEPS.map((step, i) => {
          const done = current >= i;
          const active = current === i;
          const isLast = i === STEPS.length - 1;

          return (
            <div key={step.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  left: 13,
                  top: 28,
                  width: 2,
                  height: 'calc(100% - 8px)',
                  background: done
                    ? 'linear-gradient(180deg, #7c3aed, #06b6d4)'
                    : 'rgba(255,255,255,0.06)',
                  transition: 'background 0.5s ease',
                }} />
              )}

              {/* Node */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                background: done
                  ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                  : 'rgba(255,255,255,0.04)',
                border: active
                  ? '2px solid #a78bfa'
                  : done
                    ? '2px solid transparent'
                    : '2px solid rgba(255,255,255,0.08)',
                boxShadow: active ? '0 0 16px rgba(124,58,237,0.6)' : done ? '0 0 8px rgba(124,58,237,0.3)' : 'none',
                transform: active ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.4s ease',
                zIndex: 1,
                animation: active ? 'pulse-step 1.5s ease-in-out infinite' : 'none',
              }}>
                {done ? step.icon : '○'}
              </div>

              {/* Label */}
              <div style={{
                paddingBottom: isLast ? 0 : 16,
                paddingTop: 4,
                flex: 1,
              }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: active ? 700 : done ? 600 : 400,
                  color: active ? '#a78bfa' : done ? '#e2e8f0' : '#475569',
                  transition: 'color 0.3s ease',
                }}>
                  {step.label}
                </div>
                {active && (
                  <div style={{
                    fontSize: 10,
                    color: '#06b6d4',
                    marginTop: 2,
                    animation: 'fade-in 0.3s ease',
                  }}>
                    In progress...
                  </div>
                )}
                {done && !active && (
                  <div style={{ fontSize: 10, color: '#10b981', marginTop: 2 }}>✓ Complete</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse-step {
          0%, 100% { box-shadow: 0 0 16px rgba(124,58,237,0.6); }
          50% { box-shadow: 0 0 28px rgba(124,58,237,0.9); }
        }
      `}</style>
    </div>
  );
}

// This pure state adapter intentionally shares a module with the timeline component.
// eslint-disable-next-line react-refresh/only-export-components
export function deriveStoryStep(
  obs: { votes: unknown[]; result?: string } | null,
  demoStep?: StoryStep,
): StoryStep {
  if (demoStep && demoStep !== 'idle') return demoStep;
  if (!obs) return 'idle';
  if (obs.result) return 'reputation';
  if (obs.votes.length >= 4) return 'consensus';
  if (obs.votes.length > 0) return 'staking';
  return 'analyzing';
}
