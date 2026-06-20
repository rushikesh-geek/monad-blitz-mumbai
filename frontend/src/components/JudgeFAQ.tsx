const SECTIONS = [
  {
    q: 'Why Monad?',
    a: 'Each observation is storage-isolated. Agent votes on different observations execute concurrently — matching Monad\'s parallel execution. Sequential chains bottleneck at scale.',
  },
  {
    q: 'Why not Chainlink?',
    a: 'Chainlink transmits data. PoR agents verify with staked MON, on-chain reputation, and autonomous AI decisions. Skin in the game vs. subscription feeds.',
  },
  {
    q: 'Why is this an Agent Economy?',
    a: 'Agents own wallets, stake MON, earn rewards, lose reputation, and decide autonomously. Real economic actors — not simulated.',
  },
  {
    q: 'What happens if agents lie?',
    a: 'Wrong votes lose stake to winners and reputation drops permanently. Economic cost grows with each incorrect vote.',
  },
  {
    q: 'How do agents earn?',
    a: 'Correct votes: stake returned + share of losing pool + reputation +5. Payout = stake + (lostPool × stake / winningPool).',
  },
  {
    q: 'What prevents collusion?',
    a: 'Independent wallets, separate AI personas, stake at risk, permanent reputation damage. Production: random assignment + reputation gates.',
  },
  {
    q: 'Why Monad vs Ethereum?',
    a: '4 agents × N observations = parallel independent transactions. Monad executes concurrently; Ethereum queues sequentially.',
  },
  {
    q: 'Scale to 1000 agents?',
    a: 'Monad parallelizes across observations. Bottleneck becomes AI latency, not block throughput. Agent subsets per observation.',
  },
];

export default function JudgeFAQ() {
  return (
    <div style={{ padding: '4px 2px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.06))',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 4,
      }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#a78bfa', marginBottom: 4 }}>🏆 Judge FAQ</div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
          Quick answers for demo Q&A. Full detail in <code style={{ color: '#67e8f9' }}>JUDGE_FAQ.md</code> and <code style={{ color: '#67e8f9' }}>JUDGE_ATTACK_QUESTIONS.md</code>.
        </div>
      </div>

      {SECTIONS.map(({ q, a }) => (
        <details key={q} style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(100,120,200,0.12)',
          borderRadius: 10,
          padding: '10px 14px',
        }}>
          <summary style={{
            fontWeight: 700,
            fontSize: 12,
            color: '#e2e8f0',
            cursor: 'pointer',
            listStyle: 'none',
          }}>
            {q}
          </summary>
          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6, marginTop: 8, paddingLeft: 2 }}>
            {a}
          </div>
        </details>
      ))}

      <div style={{
        marginTop: 8,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.2)',
        fontSize: 11,
        color: '#6ee7b7',
      }}>
        Contract: 0x85c1C9CB97438DDE2E680804a7A6Dbff68F2bB38 · Monad Testnet (10143)
      </div>
    </div>
  );
}
