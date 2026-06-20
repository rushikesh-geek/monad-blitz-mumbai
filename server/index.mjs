import 'dotenv/config';
import http from 'http';
import { ethers } from 'ethers';
import fs from 'fs';
import chalk from 'chalk';

import { startAgentSwarm, eventListeners } from '../agents/agentSwarm.mjs';
import { startFinalizer } from '../agents/finalizer.mjs';

const deployment = JSON.parse(fs.readFileSync(new URL('../shared/contracts.json', import.meta.url), 'utf8'));
const address = process.env.CONTRACT_ADDRESS || deployment.address;
const { abi } = deployment;
const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
const requiredKeys = [
  'OPERATOR_PRIVATE_KEY',
  'AGENT_1_PRIVATE_KEY',
  'AGENT_2_PRIVATE_KEY',
  'AGENT_3_PRIVATE_KEY',
  'AGENT_4_PRIVATE_KEY',
];
const missingKeys = requiredKeys.filter((key) => !process.env[key]);
if (missingKeys.length) {
  throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const operator = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
const contract = new ethers.Contract(address, abi, operator);

const PORT = Number(process.env.PORT || 3001);
const BACKEND_URL = process.env.BACKEND_URL
  || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined);
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''));

// Agent wallet addresses for treasury panel
const AGENT_WALLETS = [
  { persona: 'Agent-Flood',    key: process.env.AGENT_1_PRIVATE_KEY, address: process.env.AGENT_1_ADDRESS },
  { persona: 'Agent-Grid',     key: process.env.AGENT_2_PRIVATE_KEY, address: process.env.AGENT_2_ADDRESS },
  { persona: 'Agent-Crowd',    key: process.env.AGENT_3_PRIVATE_KEY, address: process.env.AGENT_3_ADDRESS },
  { persona: 'Agent-Skeptic',  key: process.env.AGENT_4_PRIVATE_KEY, address: process.env.AGENT_4_ADDRESS },
].map((agent) => ({
  ...agent,
  address: agent.address || new ethers.Wallet(agent.key).address,
}));

// SSE clients
const sseClients = new Set();

// Broadcast all events to SSE clients
eventListeners.push((event) => {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch (_) { sseClients.delete(res); }
  }
});

// --- State fetchers ---

async function fetchObservations() {
  const nextId = Number(await contract.nextObservationId());
  const observations = [];
  for (let id = 0; id < nextId; id++) {
    try {
      const obs = await contract.observations(id);
      if (obs.reporter === ethers.ZeroAddress) continue;
      const totalStake = obs.confirmStake + obs.disputeStake;
      const confidenceBps = totalStake > 0n
        ? Number((obs.confirmStake * 10000n) / totalStake)
        : 0;
      observations.push({
        id: id.toString(),
        reporter: obs.reporter,
        claimType: obs.claimType,
        description: obs.description,
        lat: Number(obs.lat) / 1e6,
        lng: Number(obs.lng) / 1e6,
        timestamp: Number(obs.timestamp),
        status: Number(obs.status), // 0=Pending, 1=Confirmed, 2=Disputed
        confirmStake: ethers.formatEther(obs.confirmStake),
        disputeStake: ethers.formatEther(obs.disputeStake),
        finalized: obs.finalized,
        voteCount: Number(obs.voteCount),
        confidenceBps,
      });
    } catch (_) {}
  }
  return observations;
}

async function fetchAgents() {
  const agents = [];
  for (const w of AGENT_WALLETS) {
    try {
      const profile = await contract.agents(w.address);
      const balance = await provider.getBalance(w.address);
      agents.push({
        persona: w.persona,
        address: w.address,
        registered: profile.registered,
        reputation: Number(profile.reputation),
        totalVotes: Number(profile.totalVotes),
        correctVotes: Number(profile.correctVotes),
        accuracy: profile.totalVotes > 0n
          ? Math.round((Number(profile.correctVotes) / Number(profile.totalVotes)) * 100)
          : 0,
        balance: ethers.formatEther(balance),
      });
    } catch (_) {}
  }
  return agents;
}

// --- HTTP Handler ---

function setCORSHeaders(req, res) {
  const origin = req.headers.origin?.replace(/\/$/, '');
  const allowedOrigin = allowedOrigins.includes('*')
    ? '*'
    : (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJSON(req, res, data, status = 200) {
  setCORSHeaders(req, res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleSimulate(req, res) {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    try {
      const { claimType, description, lat, lng } = JSON.parse(body);

      if (!claimType || !description) {
        sendJSON(req, res, { error: 'Missing claimType or description' }, 400);
        return;
      }

      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        sendJSON(req, res, { error: 'Invalid latitude or longitude' }, 400);
        return;
      }

      const latInt = BigInt(Math.round(lat * 1e6));
      const lngInt = BigInt(Math.round(lng * 1e6));

      console.log(chalk.bold.magenta(`\n🎯 SIMULATE: ${claimType} — ${description}`));

      const tx = await contract.submitObservation(claimType, description, latInt, lngInt, {
        gasLimit: 500000,
      });
      const receipt = await tx.wait();

      // Extract observation ID from the nextObservationId before this tx
      const nextId = Number(await contract.nextObservationId());
      const obsId = (nextId - 1).toString();

      console.log(chalk.green(`✓ Observation ${obsId} submitted (tx: ${tx.hash})`));

      // Broadcast to SSE
      for (const client of sseClients) {
        try {
          client.write(`data: ${JSON.stringify({
            type: 'observation_submitted',
            obsId,
            claimType,
            description,
            lat: lat,
            lng: lng,
            txHash: tx.hash,
            timestamp: Date.now(),
          })}\n\n`);
        } catch (_) {}
      }

      sendJSON(req, res, { success: true, observationId: obsId, txHash: tx.hash });
    } catch (e) {
      console.error(chalk.red(`Simulate error: ${e.message}`));
      sendJSON(req, res, { error: `Blockchain submission failed: ${e.shortMessage || e.message}` }, 500);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, BACKEND_URL || 'http://service.internal');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  // SSE events stream
  if (url.pathname === '/events' && req.method === 'GET') {
    setCORSHeaders(req, res);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 3000\ndata: {"type":"connected"}\n\n');
    sseClients.add(res);
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 20_000);
    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
    return;
  }

  // Chain state
  if (url.pathname === '/state' && req.method === 'GET') {
    try {
      const [observations, agents] = await Promise.all([fetchObservations(), fetchAgents()]);
      const operatorBalance = await provider.getBalance(operator.address);
      sendJSON(req, res, {
        observations,
        agents,
        operator: {
          address: operator.address,
          balance: ethers.formatEther(operatorBalance),
        },
        contractAddress: address,
        chainId: 10143,
      });
    } catch (e) {
      sendJSON(req, res, { error: `RPC state fetch failed: ${e.shortMessage || e.message}` }, 503);
    }
    return;
  }

  // Simulate event
  if (url.pathname === '/simulate' && req.method === 'POST') {
    await handleSimulate(req, res);
    return;
  }

  // Health check
  if (url.pathname === '/health' && req.method === 'GET') {
    try {
      const blockNumber = await provider.getBlockNumber();
      sendJSON(req, res, {
        status: 'ok',
        time: new Date().toISOString(),
        chainId: Number(process.env.MONAD_CHAIN_ID || 10143),
        blockNumber,
        contractAddress: address,
      });
    } catch (e) {
      sendJSON(req, res, { status: 'degraded', error: `RPC unavailable: ${e.shortMessage || e.message}` }, 503);
    }
    return;
  }

  setCORSHeaders(req, res);
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, async () => {
  console.log(chalk.bold.green(`\n🌐 PoR Server listening on port ${PORT}\n`));
  console.log(chalk.dim('Endpoints:'));
  console.log(chalk.dim(`  GET  /state    — chain state (observations + agents)`));
  console.log(chalk.dim(`  POST /simulate — trigger a new observation`));
  console.log(chalk.dim(`  GET  /events   — SSE activity feed`));
  console.log('');

  // Start agent subsystems unless this is a read-only process check.
  if (process.env.DISABLE_WORKERS !== 'true') {
    await startAgentSwarm();
    await startFinalizer();
  }
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Server shutting down\n'));
  process.exit(0);
});
