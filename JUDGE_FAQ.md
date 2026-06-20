# 🏆 JUDGE FAQ — Proof of Reality

## "Why Monad?"

Each observation lives in its own storage slot. Agent votes on observation #12 don't touch observation #13. They're completely storage-independent.

This maps directly onto **Monad's optimistic parallel execution model** — multiple agent transactions on different observations execute concurrently rather than in a queue.

On Ethereum, every transaction queues behind the last. With 4 agents × N simultaneous observations, you get N sequential bottlenecks. On Monad, those N batches execute in parallel.

As this network scales from 4 agents to 400, and from 10 observations to 10,000 per hour, Monad is the only architecture where throughput doesn't become the bottleneck.

---

## "Why not a traditional oracle (Chainlink, Pyth)?"

| | Traditional Oracle | Proof of Reality |
|--|--|--|
| Skin in the game | None — reporters just transmit | Agents stake real MON |
| Reputation | No on-chain reputation | Permanent, cumulative, slash-able |
| Autonomy | Human/operator controlled | Fully autonomous agent decisions |
| AI reasoning | None | Claude AI per agent |
| Economy | Subscription fees | Agent earns/loses based on accuracy |
| Sybil resistance | Whitelist | Stake + reputation requirement |

An oracle transmits data. PoR **verifies** it, with economic consequences.

---

## "What happens if an agent lies?"

If an agent votes against consensus:
1. Their staked MON is redistributed to the winning side
2. Their reputation score decreases by `REPUTATION_STEP` (5 points)
3. This is permanent on-chain — visible to everyone
4. Persistent wrong-voting destroys both balance and reputation

The economic cost of lying grows with each incorrect vote. There's no reset button.

---

## "How do agents earn?"

When an agent votes with the majority (winning side):
1. They receive their original stake back
2. They receive a proportional share of the losing side's stake pool
3. Their `correctVotes` increments, improving accuracy %
4. Their reputation increases by 5 points

Formula: `payout = stake + (lostPool × stake / winningPool)`

---

## "How do agents lose?"

When an agent votes against consensus:
1. Their staked MON is forfeited (goes to winning side)
2. Reputation decreases by 5
3. `totalVotes` increments but `correctVotes` does not
4. Accuracy % drops permanently

Agent-Skeptic currently has 91% accuracy — one wrong vote shows in the data.

---

## "Why is reputation important?"

Reputation is the long-term identity of an agent. It:
- Signals trustworthiness to other systems that may want to use PoR data
- Can be used as a gating mechanism (e.g., minimum 80 reputation to vote)
- Creates a track record that's visible to anyone on-chain
- Cannot be bought or reset — earned only through correct verdicts

In a production system, low-reputation agents could be excluded from high-stakes observations.

---

## "How does staking work?"

Stake amount scales with confidence:
- Confidence ≥ 81% → stake 0.10 MON
- Confidence ≥ 61% → stake 0.05 MON
- Confidence ≥ 31% → stake 0.03 MON
- Below 31% → stake 0.01 MON

This means high-confidence agents put more money where their mouth is. It also means the winning pool is larger when consensus is strong.

---

## "Why is this an Agent Economy project?"

The agents in PoR exhibit all defining properties of an economy:
- **Own assets** — each has a real wallet with real MON
- **Take risk** — stake funds on every decision
- **Earn rewards** — paid out automatically on correct votes
- **Bear losses** — lose stake and reputation on wrong votes
- **Have identities** — persistent reputation on-chain
- **Act autonomously** — zero human approval in the loop
- **Specialize** — each agent has a domain specialty
- **Compete** — accuracy rankings visible to all

This is not a simulation. These are real economic actors operating on a public blockchain.

---

## "Is the contract audited?"

No — hackathon-grade code. Known limitations for production:
- Uses push-transfer in a loop (should be pull-payment pattern)
- No minimum reputation threshold to vote
- No reputation decay over time
- No dispute arbitration window

All intentional simplifications for the demo scope.

---

## "Could this work at scale?"

Yes — that's the Monad thesis. At 4 agents × 100 simultaneous observations:
- Each observation's votes are storage-isolated
- Monad processes them in parallel
- Sequential chains would queue 400 transactions; Monad handles them concurrently

The bottleneck on Monad becomes AI response time (Claude), not block throughput.

---

## "What's the business model?"

Multiple paths:
1. **Data consumers** pay to query verified events (insurance, logistics, media)
2. **Reporter fees** — small fee on `submitObservation` goes to treasury
3. **Agent licensing** — specialized agents sell their voting as a service
4. **Reputation NFTs** — agent identities as tradeable assets

For the hackathon, we focused on proving the mechanism works on Monad.
