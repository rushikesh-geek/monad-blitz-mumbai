# Proof of Reality deployment

This repository deploys as two services:

- Backend: Railway, repository root
- Frontend: Vercel, `frontend` root directory

## Railway backend

1. In Railway, choose **New Project → Deploy from GitHub repo** and select this repository.
2. Keep the service root directory at `/` (the repository root).
3. Railway reads `railway.json`; the start command is `npm start` and the health check is `/health`.
4. Generate a public Railway domain under **Settings → Networking**.
5. Add the environment variables below, then set `BACKEND_URL` to that public HTTPS domain.

### Backend environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONAD_RPC_URL` | Yes | Monad Testnet HTTPS RPC endpoint |
| `MONAD_CHAIN_ID` | Yes | `10143` for Monad Testnet |
| `CONTRACT_ADDRESS` | Yes | Deployed Proof of Reality contract |
| `OPENROUTER_API_KEY` | Yes for AI voting | OpenRouter API key; deterministic fallback voting is used if absent or unavailable |
| `OPERATOR_PRIVATE_KEY` | Yes | Funds observation submission and finalization |
| `AGENT_1_PRIVATE_KEY` … `AGENT_4_PRIVATE_KEY` | Yes | Funds and signs agent votes |
| `AGENT_1_ADDRESS` … `AGENT_4_ADDRESS` | No | Derived from private keys when omitted |
| `BACKEND_URL` | Yes | Public Railway HTTPS URL |
| `FRONTEND_URL` | Yes after Vercel deploy | Public Vercel HTTPS URL used for CORS |
| `CORS_ORIGIN` | Recommended | Allowed browser origin; use the frontend URL |
| `DISABLE_WORKERS` | No | Set to `true` only for read-only process checks; keep `false` in production |
| `PORT` | Managed by Railway | Runtime listen port; do not hardcode it |

Never add private keys or API keys to Git, Vercel, screenshots, or build logs. Use Railway secret variables only.

### Backend verification

```powershell
$env:BACKEND_URL = "https://your-backend.up.railway.app"
Invoke-RestMethod "$env:BACKEND_URL/health"
Invoke-RestMethod "$env:BACKEND_URL/state"
Invoke-WebRequest "$env:BACKEND_URL/events" -Headers @{ Accept = "text/event-stream" }
```

`/health` returns `status: ok`, a Monad block number, chain ID, and contract address. `/events` must immediately return an SSE `connected` event and then heartbeat comments.

To test a write (this spends Testnet MON):

```powershell
$body = @{
  claimType = "flood"
  description = "Severe waterlogging reported on SV Road near Andheri station."
  lat = 19.1136
  lng = 72.8697
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$env:BACKEND_URL/simulate" -ContentType "application/json" -Body $body
```

## Vercel frontend

1. In Vercel, choose **Add New → Project** and import the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add `VITE_API_URL` with the public Railway HTTPS URL for Production, Preview, and Development as appropriate.
7. Deploy, then copy the production URL into Railway as `FRONTEND_URL` and `CORS_ORIGIN`.

The frontend retries transient state failures and SSE disconnects. If the backend remains unavailable, it displays `frontend/public/demo-data.json` in an explicit demo-data state instead of a blank dashboard.

## Redeployment

- Normal path: merge or push to the production branch. Both GitHub integrations redeploy automatically.
- Railway manual redeploy: open the service deployment history, select the latest deployment, and choose **Redeploy**.
- Vercel manual redeploy: open **Deployments**, select a deployment, and choose **Redeploy**. Confirm that the existing environment variables are included.
- After every redeploy, verify `/health`, `/state`, `/events`, the dashboard map, and one read-only page load before triggering a paid on-chain simulation.

## Rollback

- Railway: open **Deployments**, choose the last known-good deployment, and use **Redeploy**. Railway creates a new deployment from that build.
- Vercel: open **Deployments**, find the last known-good production deployment, and choose **Promote to Production**.
- If contract configuration caused the incident, restore the previous `CONTRACT_ADDRESS` and RPC variables first, then redeploy the Railway service.
- Re-run the health and state checks after rollback. Do not trigger `/simulate` until reads and SSE are healthy.

## Production checklist

- [ ] Frontend production build passes
- [ ] Backend starts with Railway-provided `PORT`
- [ ] All required secrets exist only in Railway
- [ ] `VITE_API_URL` points to the Railway HTTPS domain
- [ ] `BACKEND_URL`, `FRONTEND_URL`, and `CORS_ORIGIN` use public HTTPS URLs
- [ ] `/health` reports Monad RPC success
- [ ] `/state` returns observations, agents, operator, and contract data
- [ ] `/events` streams `connected`, vote, and finalization events
- [ ] Flood near Andheri reaches consensus and updates the dashboard
- [ ] Railway and Vercel rollback paths are confirmed

## Operational risks

- `/simulate` is intentionally public for the demo and spends Testnet MON from funded service wallets. Add authentication or rate limiting before using valuable assets.
- The agent poller and finalizer run in the web process. Keep Railway at one replica unless distributed locking is added.
- SSE events are in memory and are not replayed after a restart; `/state` remains the source of truth.
- OpenRouter failures switch votes to deterministic fallback mode and are visible in the activity stream.
