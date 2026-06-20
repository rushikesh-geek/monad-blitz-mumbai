# 🔍 Proof of Reality (PoR)

> **Monad Blitz Mumbai V3 Hackathon Project**

**"Google Maps tells you where things are. Proof of Reality is a network where autonomous AI agents independently verify what's actually happening right now, stake their own reputation and funds on-chain, and get rewarded for being correct."**

---

## What It Is

Proof of Reality is a decentralized event verification network built on **Monad Testnet**.

When someone reports a real-world event (flood, power outage, traffic jam), a swarm of 4 autonomous AI agents independently:
- Analyze the claim using Claude AI via OpenRouter
- Vote CONFIRM or DISPUTE with staked MON
- Earn rewards for correct verdicts, lose stake for wrong ones
- Update their on-chain reputation permanently

**No human approves anything. Consensus and payouts are fully on-chain.**

---

## Why Monad

Each observation lives in its own storage slot. Each agent vote touches only that observation.

Votes on different observations execute independently — this maps directly onto **Monad's optimistic parallel execution model**. A sequential chain eventually bottlenecks. Monad is built for exactly this workload.

---

## Architecture

```
Operator Wallet ──► submitObservation() ──► Contract (Monad Testnet)
                                                    │
                    ┌───────────────────────────────┤
                    │                               │
              Agent-Flood        Agent-Grid   Agent-Crowd   Agent-Skeptic
              (Claude AI)       (Claude AI)  (Claude AI)   (Claude AI)
                    │                               │
                    └──────── agentVote() ──────────┘
                                    │
                         finalizeConsensus()
                                    │
                         ReputationUpdated events
                         MON payouts to winners
```

---

## Contract

- **Network**: Monad Testnet (Chain ID: 10143)
- **Address**: `0x85c1C9CB97438DDE2E680804a7A6Dbff68F2bB38`
- **Explorer**: [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x85c1C9CB97438DDE2E680804a7A6Dbff68F2bB38)

---

## Agents

| Agent | Specialty | Wallet |
|-------|-----------|--------|
| Agent-Flood 🌊 | Waterlogging / floods | `0x1aFC369Db91De7bC56447272451E334D014b6649` |
| Agent-Grid ⚡ | Power / utility failures | `0xDac5e0d1513C3077cF2E968a04cd842FF8382346` |
| Agent-Crowd 👥 | Crowd / congestion | `0xc5A0D383EF3bD534901C1c1653f340340ccFD5cf` |
| Agent-Skeptic 🔍 | Duplicate / spam detection | `0x20601819f09238a4b78c0Ea6B0257d20b23BF1e4` |

---

## Quick Start

### Prerequisites
- Node.js 18+
- `.env` file configured (already done)

### Run the demo

**Terminal 1 — Backend Server (agents + API)**
```bash
node server/index.mjs
```

**Terminal 2 — Frontend**
```bash
cd frontend && npm run dev
```

Open **http://localhost:5173**

### Trigger a simulation
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/simulate" `
  -ContentType "application/json" `
  -Body '{"claimType":"flood","description":"Flooding near Andheri station","lat":19.1136,"lng":72.8697}'
```

---

## Frontend Features

- 🗺️ **Live Map** — Leaflet + CartoDB dark tiles, animated markers, Observation Inspector
- 🤖 **Agent Economy** — Why Agent Economy section, Story Mode timeline, reasoning panel
- ⚡ **Monad Win Panel** — Traditional Oracle vs PoR comparison
- ▶️ **Run Live Demo** — One-click 15-second orchestrated demo (header button)
- 🏆 **Agent Leaderboard** — Reputation, votes, accuracy, balances
- 💰 **Agent Treasury** — Real-time wallet balances and stake tracking
- 📡 **Activity Feed** — Live SSE stream of votes, consensus, reputation changes
- ⚡ **Simulate Events** — 4 preset buttons (sidebar backup)

---

## Project Structure

```
contracts/          ProofOfReality.sol (deployed)
agents/
  agentSwarm.mjs    4-agent voting swarm with Claude AI
  finalizer.mjs     Quorum detection + auto-finalization
server/
  index.mjs         HTTP API server + SSE events
shared/
  contracts.json    ABI + address (source of truth)
  contracts.ts      TypeScript exports
frontend/
  src/
    App.tsx               Main layout
    api.ts                API client
    components/
      LiveMap.tsx          Leaflet map
      Leaderboard.tsx      Agent rankings
      TreasuryPanel.tsx    Wallet balances
      ActivityFeed.tsx     Live SSE feed
      SimulatePanel.tsx    Demo buttons
```

---

## Demo Flow (15 seconds — one click)

1. Click **"Run Live Demo"** in the header
2. Auto-switches to Agent Economy tab
3. Story Mode timeline animates through each step
4. 4 agents vote with reasoning + stakes
5. Confidence ring fills, consensus reached
6. Rewards + reputation highlighted
7. Monad Win panel scrolls into view

**Backup:** Sidebar "Flood near Andheri" button works the same way.

## Judge Assets

| Document | Purpose |
|----------|---------|
| `DEMO_SCRIPT.md` | Presenter script |
| `JUDGE_FAQ.md` | Detailed FAQ |
| `JUDGE_ATTACK_QUESTIONS.md` | Quick Q&A prep |
| `EXECUTIVE_SUMMARY.md` | One-page overview |
| `PITCH_SLIDE.md` | One-slide pitch |
| `ARCHITECTURE.md` | System diagram |
| `DEMO_CHECKLIST.md` | Pre-demo risk checklist |

---

## Fallback Safety

If OpenRouter API fails → agents use rule-based persona voting (always votes, never blocks)

If RPC is slow → frontend polls every 5s as backup to SSE

If WiFi drops → SSE auto-reconnects via browser EventSource
