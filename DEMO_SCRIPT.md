# 🎬 DEMO SCRIPT — Proof of Reality
## Monad Blitz Mumbai V3

**Presenter:** Keep this doc open. Read the bold parts out loud.

---

## PRE-DEMO CHECKLIST

Before you walk on stage:

- [ ] `node server/index.mjs` running in Terminal 1
- [ ] `cd frontend && npm run dev` running in Terminal 2
- [ ] Browser open at http://localhost:5173
- [ ] Activity feed visible (right panel)
- [ ] Sidebar showing Simulate Event buttons
- [ ] Terminal 1 shows: `✓ Agent-Flood online`, `✓ Agent-Grid online`, etc.
- [ ] WiFi connected to hotspot (not venue WiFi)
- [ ] Backup recording ready (screen recording of a successful flow)

---

## OPENING LINE (30 seconds)

> **"Google Maps tells you WHERE things are. But who tells you what's ACTUALLY happening right now?"**

> **"We built Proof of Reality — a network of autonomous AI agents that independently verify real-world events, stake their own money on-chain, and get rewarded for being right."**

> **"No oracle. No human approval. Just agents, stakes, and consensus on Monad."**

---

## LIVE DEMO (2-3 minutes)

### Step 1 — Show the map
> **"This is Mumbai. Each marker is a real-world claim that's been submitted to our smart contract on Monad Testnet."**

Point to green markers.
> **"Green means confirmed. The agents reached consensus."**

---

### Step 2 — Show the leaderboard
Click **Leaderboard** tab.
> **"Each agent has a reputation score and a real wallet with real MON tokens. This is not simulated. These balances are live."**

---

### Step 3 — Show the treasury
Click **Treasury** tab.
> **"Agent-Flood has 4.37 MON. Agent-Grid has 4.50 MON. They earned this by being correct. They lose it when they're wrong."**

---

### Step 4 — TRIGGER THE DEMO (PRIMARY)

Click the big **"Run Live Demo"** button in the header.

> **"One click. Watch the entire agent economy unfold."**

The app automatically:
1. Submits a flood observation to Monad
2. Switches to Agent Economy tab
3. Animates Story Mode timeline
4. Shows agent reasoning as votes land
5. Fills confidence ring
6. Highlights rewards and reputation
7. Scrolls to Monad Win panel

> **"15 seconds. No navigation. The whole flow."**

**Backup:** Click **"Flood near Andheri"** in the sidebar if the header button fails.

---

### Step 5 — SHOW THE AGENT ECONOMY
Point to **Agent Economy** tab (auto-selected during demo).

> **"This is NOT an oracle. Each agent owns a wallet, stakes MON, earns rewards, and loses reputation. See the 'Why This Is An Agent Economy' section."**

Click a map marker → **Inspect Observation** for full vote breakdown.

---

### Step 6 — WHY MONAD
Point to **Monad Win panel** (highlighted at end of demo).
> **"Why does this need Monad?"**

> **"Each observation is independent. Agent votes on observation 9 don't touch observation 10. They execute in parallel."**

> **"On Ethereum, every transaction queues. On Monad, observations run concurrently. As the network scales from 4 agents to 4000, Monad's parallel execution is the only architecture that doesn't become the bottleneck."**

---

## CLOSING (15 seconds)

> **"This is the agent economy. Agents that own wallets, stake funds, earn rewards, and lose when they're wrong. All autonomous. All on Monad."**

> **"Proof of Reality."**

---

## JUDGES QUESTIONS — PREPARED ANSWERS

**Q: Is this just an oracle?**
> "No. An oracle has no skin in the game. Our agents own MON, risk it on every vote, and earn or lose based on accuracy. They have incentives, reputation, and autonomous decision-making."

**Q: Why does this need blockchain?**
> "Reputation and payouts are permanent and trustless. No central server can change an agent's score or steal their earnings."

**Q: Why Monad specifically?**
> "Each observation is storage-isolated. Parallel votes on different observations map directly to Monad's optimistic parallel execution. A sequential chain bottlenecks as you scale to thousands of concurrent verifications."

**Q: Is this production-ready?**
> "It's hackathon-grade by design. The contract has known limitations we'd fix for production: pull payments instead of push, reputation decay, minimum reputation thresholds for voting."

---

## BACKUP PLAN

If network fails mid-demo:
1. Play backup screen recording
2. Say: "Let me show you a recording of what you just saw happen live"

If server crashes:
```powershell
# Restart server (5 seconds)
node server/index.mjs
```

If frontend won't load:
- Use Terminal to run the smoke test instead: `node scripts/smokeTest.mjs`
- Read the output to judges — the numbers tell the story

---

## KEY NUMBERS TO KNOW

- Contract: `0x85c1C9CB97438DDE2E680804a7A6Dbff68F2bB38`
- Chain: Monad Testnet (10143)
- Agents: 4 (Flood, Grid, Crowd, Skeptic)
- Observations on chain: 10+ (all finalized)
- Demo flow time: ~10-15 seconds
- Agent balances: ~4-4.5 MON each (real testnet tokens)
