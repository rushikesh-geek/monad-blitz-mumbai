import type { Agent } from '../api';
import StoryTimeline, { deriveStoryStep, type StoryStep } from './StoryTimeline';
import MonadWinPanel from './MonadWinPanel';

interface VoteRecord {
  agent: string;
  action: 'CONFIRM' | 'DISPUTE';
  confidence: number;
  stake: string;
  reasoning: string;
  source: string;
  timestamp: number;
}

interface ObsVotes {
  obsId: string;
  claimType: string;
  description: string;
  votes: VoteRecord[];
  result?: string;
  confidenceBps?: number;
  timestamp: number;
}

interface Props {
  agents: Agent[];
  recentVotes?: VoteRecord[];
  recentObs: ObsVotes[];
  demoStep?: StoryStep;
  highlightMonad?: boolean;
  highlightStory?: boolean;
  highlightEconomy?: boolean;
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

// ── Confidence Ring ──────────────────────────────────────────────────────────
function ConfidenceRing({ bps, result }: { bps: number; result?: string }) {
  const pct = bps / 100;
  const confirmed = result === 'CONFIRMED';
  const color = confirmed ? '#10b981' : result === 'DISPUTED' ? '#ef4444' : '#f59e0b';
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="55" cy="55" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 2,
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {pct.toFixed(0)}%
          </div>
          <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            confidence
          </div>
        </div>
      </div>
      {result && (
        <div style={{
          padding: '3px 12px',
          borderRadius: 20,
          background: `${color}20`,
          border: `1px solid ${color}55`,
          fontSize: 11,
          fontWeight: 800,
          color,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {result}
        </div>
      )}
    </div>
  );
}

// ── Parallelism Visualizer ────────────────────────────────────────────────────
function ParallelismPanel({ obs }: { obs: ObsVotes | null }) {
  const ALL_AGENTS = ['Agent-Flood', 'Agent-Grid', 'Agent-Crowd', 'Agent-Skeptic'];

  return (
    <div style={{
      background: 'rgba(124,58,237,0.06)',
      border: '1px solid rgba(124,58,237,0.2)',
      borderRadius: 12,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>⚡</span>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#a78bfa' }}>Monad Parallel Execution</div>
      </div>

      {!obs ? (
        <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: '10px 0' }}>
          Waiting for next observation...
        </div>
      ) : (
        <>
          <div style={{
            fontSize: 10,
            color: '#64748b',
            fontFamily: 'var(--font-mono)',
            marginBottom: 8,
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 6,
          }}>
            Observation #{obs.obsId} — {obs.claimType.toUpperCase()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ALL_AGENTS.map((name) => {
              const vote = obs.votes.find(v => v.agent === name);
              const color = AGENT_COLORS[name] || '#a78bfa';
              const icon = AGENT_ICONS[name] || '🤖';
              const hasVoted = !!vote;

              return (
                <div key={name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 8px',
                  borderRadius: 6,
                  background: hasVoted ? `${color}0e` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${hasVoted ? color + '33' : 'rgba(255,255,255,0.04)'}`,
                  transition: 'all 0.3s ease',
                }}>
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: hasVoted ? color : '#334155', flex: 1 }}>
                    {name}
                  </span>
                  {hasVoted ? (
                    <>
                      <span style={{
                        fontSize: 10,
                        color: vote.action === 'CONFIRM' ? '#10b981' : '#ef4444',
                        fontWeight: 700,
                      }}>
                        {vote.action}
                      </span>
                      <span style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-mono)' }}>
                        {vote.stake} MON
                      </span>
                      <span style={{ fontSize: 12, color: '#10b981' }}>✓</span>
                    </>
                  ) : (
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.1)',
                      borderTopColor: '#7c3aed',
                      animation: 'spin 1s linear infinite',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {obs.votes.length === 4 && (
            <div style={{
              marginTop: 8,
              padding: '5px 8px',
              borderRadius: 6,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)',
              fontSize: 10,
              color: '#6ee7b7',
              textAlign: 'center',
              fontWeight: 600,
            }}>
              4 independent txns executed simultaneously on Monad ✓
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Agent Reasoning Panel ─────────────────────────────────────────────────────
function ReasoningPanel({ obs }: { obs: ObsVotes | null }) {
  if (!obs || obs.votes.length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(100,120,200,0.1)',
        borderRadius: 12,
        padding: '16px',
        textAlign: 'center',
        color: '#334155',
        fontSize: 12,
      }}>
        🤖 Agent reasoning will appear here when voting starts
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 2 }}>
        Agent Reasoning — #{obs.obsId}
      </div>
      {obs.votes.map((vote) => {
        const color = AGENT_COLORS[vote.agent] || '#a78bfa';
        const icon = AGENT_ICONS[vote.agent] || '🤖';
        const isConfirm = vote.action === 'CONFIRM';

        return (
          <div key={vote.agent} style={{
            background: `${color}08`,
            border: `1px solid ${color}22`,
            borderRadius: 10,
            padding: '10px 12px',
            animation: 'fade-in 0.4s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontWeight: 700, fontSize: 12, color }}>{vote.agent}</span>
              <div style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{
                  padding: '2px 7px',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  background: isConfirm ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: isConfirm ? '#6ee7b7' : '#fca5a5',
                  border: `1px solid ${isConfirm ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                  {vote.action}
                </span>
                <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  {vote.confidence}%
                </span>
              </div>
            </div>
            <div style={{
              fontSize: 11,
              color: '#94a3b8',
              fontStyle: 'italic',
              lineHeight: 1.4,
              paddingLeft: 22,
            }}>
              "{vote.reasoning || 'Processing...'}"
            </div>
            <div style={{
              marginTop: 5,
              paddingLeft: 22,
              fontSize: 10,
              color: '#475569',
              display: 'flex',
              gap: 10,
            }}>
              <span>Stake: <span style={{ color, fontFamily: 'var(--font-mono)' }}>{vote.stake} MON</span></span>
              <span style={{ color: '#334155' }}>{vote.source}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Why Agent Economy ─────────────────────────────────────────────────────────
function WhyAgentEconomy({ agents, highlight }: { agents: Agent[]; highlight?: boolean }) {
  const flow = ['Agent', 'Wallet', 'MON', 'Reputation', 'Votes', 'Rewards', 'Stake', 'Decision', 'Reasoning', 'Outcome'];
  const icons: Record<string, string> = {
    Agent: '🤖', Wallet: '👛', MON: '💰', Reputation: '📈', Votes: '🗳️',
    Rewards: '🏆', Stake: '💎', Decision: '⚖️', Reasoning: '🧠', Outcome: '✅',
  };

  return (
    <div
      id="why-agent-economy"
      style={{
        background: highlight
          ? 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(124,58,237,0.12) 100%)'
          : 'rgba(6,182,212,0.04)',
        border: highlight
          ? '1px solid rgba(6,182,212,0.5)'
          : '1px solid rgba(6,182,212,0.2)',
        borderRadius: 14,
        padding: '14px 16px',
        boxShadow: highlight ? '0 0 28px rgba(6,182,212,0.2)' : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      <div style={{
        fontSize: 12,
        fontWeight: 800,
        color: '#67e8f9',
        marginBottom: 4,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        Why This Is An Agent Economy
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>
        Not an oracle. Autonomous agents with wallets, stakes, and consequences.
      </div>

      {/* Flow pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, alignItems: 'center' }}>
        {flow.map((item, i) => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              padding: '4px 8px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 10,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span>{icons[item]}</span>
              <span>{item}</span>
            </div>
            {i < flow.length - 1 && (
              <span style={{ color: '#334155', fontSize: 10 }}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Agent cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {agents.map((agent) => {
          const color = AGENT_COLORS[agent.persona] || '#a78bfa';
          const icon = AGENT_ICONS[agent.persona] || '🤖';
          const rewards = (agent.correctVotes * 0.005).toFixed(3);
          return (
            <div key={agent.persona} style={{
              background: `${color}08`,
              border: `1px solid ${color}25`,
              borderRadius: 10,
              padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontWeight: 700, fontSize: 11, color }}>{agent.persona}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 10 }}>
                <div><span style={{ color: '#475569' }}>Wallet</span><br /><span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{agent.address.slice(0, 8)}…</span></div>
                <div><span style={{ color: '#475569' }}>MON Balance</span><br /><span style={{ color: '#67e8f9', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{parseFloat(agent.balance).toFixed(2)}</span></div>
                <div><span style={{ color: '#475569' }}>Reputation</span><br /><span style={{ color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{agent.reputation}</span></div>
                <div><span style={{ color: '#475569' }}>Votes</span><br /><span style={{ color: '#f1f5f9', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{agent.totalVotes}</span></div>
                <div><span style={{ color: '#475569' }}>Rewards Earned</span><br /><span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>~{rewards}</span></div>
                <div><span style={{ color: '#475569' }}>Stake Locked</span><br /><span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>per vote</span></div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 12,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: 700,
        color: '#6ee7b7',
        padding: '8px',
        background: 'rgba(16,185,129,0.08)',
        borderRadius: 8,
        border: '1px solid rgba(16,185,129,0.2)',
      }}>
        Agents own assets · Agents make decisions · Agents earn money · Agents lose reputation
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AgentEconomyPanel({
  agents,
  recentObs,
  demoStep,
  highlightMonad,
  highlightStory,
  highlightEconomy,
}: Props) {
  const latestObs = recentObs.length > 0 ? recentObs[recentObs.length - 1] : null;
  const storyStep = demoStep && demoStep !== 'idle'
    ? demoStep
    : deriveStoryStep(latestObs);

  // Compute totals
  const totalRewardsEarned = agents.reduce((sum, a) =>
    sum + (a.correctVotes * 0.005), 0
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, padding: '2px 2px 16px' }}>

      <WhyAgentEconomy agents={agents} highlight={highlightEconomy} />

      <StoryTimeline
        activeStep={storyStep}
        obsId={latestObs?.obsId}
        highlight={highlightStory}
      />

      {/* Economy Summary Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
      }}>
        {[
          { label: 'Total Votes', value: agents.reduce((s, a) => s + a.totalVotes, 0).toString(), color: '#a78bfa', icon: '🗳️' },
          { label: 'Observations', value: recentObs.length.toString(), color: '#06b6d4', icon: '📡' },
          { label: 'Rewards', value: `${totalRewardsEarned.toFixed(3)}`, sub: 'MON est.', color: '#10b981', icon: '💰' },
          { label: 'Accuracy', value: `${Math.round(agents.reduce((s, a) => s + a.accuracy, 0) / Math.max(agents.length, 1))}%`, color: '#f59e0b', icon: '🎯' },
        ].map(({ label, value, sub, color, icon }) => (
          <div key={label} style={{
            background: `${color}0a`,
            border: `1px solid ${color}22`,
            borderRadius: 10,
            padding: '10px 8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{sub}</div>}
            <div style={{ fontSize: 9, color: '#475569', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Latest Confidence Ring + Parallelism side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, alignItems: 'start' }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(100,120,200,0.1)',
          borderRadius: 12,
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Latest
          </div>
          {latestObs ? (
            <ConfidenceRing
              bps={latestObs.confidenceBps ?? 10000}
              result={latestObs.result}
            />
          ) : (
            <div style={{ color: '#334155', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>
              No data yet
            </div>
          )}
        </div>

        <ParallelismPanel obs={latestObs} />
      </div>

      {/* Agent Reasoning */}
      <ReasoningPanel obs={latestObs} />

      {/* Per-Agent Economy Table */}
      <div>
        <div style={{
          fontSize: 11,
          color: '#475569',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>Agent Economy</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(100,120,200,0.1)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {agents.map((agent) => {
            const color = AGENT_COLORS[agent.persona] || '#a78bfa';
            const icon = AGENT_ICONS[agent.persona] || '🤖';
            const bal = parseFloat(agent.balance);

            return (
              <div key={agent.persona} style={{
                display: 'grid',
                gridTemplateColumns: '26px 1fr 60px 55px 55px 55px',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                background: `${color}06`,
                border: `1px solid ${color}18`,
              }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, lineHeight: 1 }}>{agent.persona}</div>
                  <div style={{ fontSize: 9, color: '#475569', lineHeight: 1.3 }}>
                    {agent.address.slice(0, 6)}…{agent.address.slice(-4)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#475569' }}>Balance</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#67e8f9', fontFamily: 'var(--font-mono)' }}>{bal.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#475569' }}>Rep</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{agent.reputation}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#475569' }}>Votes</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9', fontFamily: 'var(--font-mono)' }}>{agent.totalVotes}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#475569' }}>Acc.</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: agent.accuracy >= 90 ? '#10b981' : '#f59e0b', fontFamily: 'var(--font-mono)' }}>{agent.accuracy}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MonadWinPanel highlight={highlightMonad} />
    </div>
  );
}
