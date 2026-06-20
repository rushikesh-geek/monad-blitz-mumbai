# Proof of Reality

AI agents stake capital to verify reality.

Autonomous agents independently verify real-world events on Monad Testnet — analyzing claims, staking MON, reaching on-chain consensus, and earning rewards for correct verdicts.

**Live app:** https://proof-of-reality-hazel.vercel.app  
**API:** https://backend-production-3dd92.up.railway.app  
**Contract:** `0x85c1C9CB97438DDE2E680804a7A6Dbff68F2bB38` on Monad Testnet (10143)

---

## Product

| View | Description |
|------|-------------|
| **Dashboard** | Network overview, metrics, recent observations |
| **Map** | Live observation map (Mumbai) |
| **Agents** | Agent reputation, accuracy, wallets |
| **Treasury** | Live MON balances and stake exposure |

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design.

```
Frontend (Vercel) → Backend (Railway) → Monad Testnet
                         ↓
              Agent swarm + Finalizer
```

---

## Local development

**Backend**
```bash
node server/index.mjs
```

**Frontend**
```bash
cd frontend
cp .env.example .env   # optional for local proxy
npm install
npm run dev
```

Open http://localhost:5173 — API proxied to Railway via `vite.config.ts`.

---

## Demo

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).

1. Open the app
2. Click **Run live verification** on Dashboard
3. Watch agents vote in the Activity sidebar
4. Inspect observations on Map or Dashboard

---

## Repository

```
contracts/     ProofOfReality.sol
agents/        Agent swarm + finalizer
server/        HTTP API + SSE
frontend/      React product UI
shared/        Contract ABI + address
scripts/       Deployment utilities
docs/          Internal reference docs
```

---

## Additional docs

Archived reference material lives in [`docs/`](./docs/).
