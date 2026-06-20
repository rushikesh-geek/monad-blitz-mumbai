# Demo Day Risk Elimination Checklist

## Pre-Demo (30 min before)

- [ ] **Backend running** — `node server/index.mjs` → shows `PoR Server running on http://localhost:3001`
- [ ] **Frontend running** — `cd frontend && npm run dev` → open http://localhost:5173 (or 5174)
- [ ] **RPC healthy** — `Invoke-RestMethod http://localhost:3001/health` returns `status: ok`
- [ ] **Agent swarm healthy** — Terminal shows `✓ Agent-Flood online` × 4
- [ ] **Finalizer healthy** — No error spam in server terminal
- [ ] **Live indicator green** — Header shows "Live" not "Connecting..."
- [ ] **Run Live Demo test** — Click button, full flow completes in ~15s

## Backup Assets

- [ ] **Backup demo data** — `demo-data.json` present (12+ observations)
- [ ] **Screenshot available** — Capture map + economy panel after successful demo
- [ ] **Video backup available** — Screen recording of Run Live Demo flow
- [ ] **Smoke test ready** — `node scripts/smokeTest.mjs` as terminal fallback

## Documentation

- [ ] **README complete** — `README.md`
- [ ] **FAQ complete** — `JUDGE_FAQ.md` + `JUDGE_ATTACK_QUESTIONS.md`
- [ ] **Demo script rehearsed** — `DEMO_SCRIPT.md` (use Run Live Demo button)
- [ ] **Executive summary printed** — `EXECUTIVE_SUMMARY.md`
- [ ] **Architecture diagram ready** — `ARCHITECTURE.md`

## Network Safety

- [ ] Use phone hotspot (not venue WiFi)
- [ ] Contract address bookmarked: [Monad Explorer](https://testnet.monadexplorer.com/address/0x85c1C9CB97438DDE2E680804a7A6Dbff68F2bB38)
- [ ] `.env` configured with agent keys

## If Something Breaks

| Issue | Fix |
|-------|-----|
| Server won't start (port in use) | Already running — check `http://localhost:3001/health` |
| Frontend won't load | Try port 5174; restart with `npm run dev` |
| RPC timeout | Wait 10s, refresh; show backup video |
| Agents not voting | Restart server; OpenRouter fallback uses rule-based voting |
| Demo button fails | Use sidebar "Flood near Andheri" button instead |

## Key Numbers

- Contract: `0x85c1C9CB97438DDE2E680804a7A6Dbff68F2bB38`
- Chain: Monad Testnet (10143)
- Agents: 4 (Flood, Grid, Crowd, Skeptic)
- Agent balances: ~4.1–4.3 MON each
- Demo flow: ~15 seconds
