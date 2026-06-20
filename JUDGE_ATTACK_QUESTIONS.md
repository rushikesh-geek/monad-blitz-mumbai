# Judge Attack Questions — Prepared Answers

Quick-reference for live Q&A. Full detail in `JUDGE_FAQ.md`.

---

### Why not use Chainlink?

Chainlink transmits data from approved sources. It has no autonomous agents, no per-vote staking, and no on-chain reputation that agents earn or lose. PoR agents **verify** claims with economic skin in the game — they don't just relay a feed.

---

### Why not use one oracle?

A single oracle is one failure point. One compromised operator corrupts all data. PoR uses 4 independent agents with separate wallets, separate AI reasoning, and separate stakes. Consensus requires agreement — one bad agent loses money, not the whole system.

---

### How do agents earn?

Correct votes: stake returned + share of losing side's pool + reputation +5. Formula: `payout = stake + (lostPool × stake / winningPool)`. Visible in Treasury tab — balances are live on Monad Testnet.

---

### How do agents lose?

Wrong votes: stake forfeited to winners, reputation −5, accuracy drops permanently. Agent-Skeptic is at 92% — one wrong vote is on-chain forever.

---

### What prevents collusion?

1. **Economic cost** — colluding agents risk stake on every vote
2. **Independent AI** — each agent has different persona/prompt (Flood, Grid, Crowd, Skeptic)
3. **Reputation damage** — wrong consensus permanently scars on-chain identity
4. **Future**: minimum reputation gates, random agent assignment at scale

---

### What happens if agents lie?

Lying agents vote against consensus → lose stake → lose reputation. The winning side absorbs their MON. Persistent lying drains wallet and reputation until the agent is economically useless.

---

### How does reputation work?

Starts at 100. +5 per correct vote, −5 per wrong vote. Stored on-chain in `agents[address].reputation`. Cannot be reset or bought. Production path: gate high-stakes observations behind reputation thresholds.

---

### Why Monad instead of Ethereum?

Each observation = isolated storage slot. 4 agent votes on obs #12 don't touch obs #13. Monad executes these concurrently. On Ethereum, N observations × 4 agents = 4N queued transactions. Monad parallelizes independent workloads — exactly this use case.

---

### What happens with 1000 agents?

Architecture scales horizontally: more agents per observation, or more observations in parallel. Monad handles concurrent `agentVote()` calls across observations. Bottleneck becomes AI latency (Claude), not block throughput. Agent assignment can be randomized/subset per observation.

---

### Why is this an Agent Economy?

Agents exhibit all economy properties:
- **Own assets** — real wallets with MON
- **Make decisions** — autonomous CONFIRM/DISPUTE
- **Earn money** — automatic on-chain payouts
- **Lose reputation** — permanent consequences
- **Specialize** — domain-specific personas
- **Compete** — leaderboard rankings

This is not simulated. These are real economic actors on a public blockchain.
