import 'dotenv/config';
import { ethers } from 'ethers';
import chalk from 'chalk';
import axios from 'axios';
import fs from 'fs';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');

const AGENTS = [
  { key: process.env.AGENT_1_PRIVATE_KEY, persona: 'Agent-Flood', specialty: 'waterlogging/flood events' },
  { key: process.env.AGENT_2_PRIVATE_KEY, persona: 'Agent-Grid', specialty: 'power outages and utility failures' },
  { key: process.env.AGENT_3_PRIVATE_KEY, persona: 'Agent-Crowd', specialty: 'crowd density and traffic congestion' },
  { key: process.env.AGENT_4_PRIVATE_KEY, persona: 'Agent-Skeptic', specialty: 'detecting duplicates and spam reports' },
];

// Global event emitter for the server to hook into
export const eventListeners = [];
export function emitEvent(event) {
  for (const fn of eventListeners) {
    try { fn(event); } catch (_) {}
  }
}

const log = {
  info: (s) => { console.log(s); emitEvent({ type: 'log', message: s }); },
  error: (s) => { console.error(chalk.red(s)); emitEvent({ type: 'error', message: s }); },
};

function stakeFromConfidence(confidence) {
  if (confidence >= 81) return ethers.parseEther('0.10');
  if (confidence >= 61) return ethers.parseEther('0.05');
  if (confidence >= 31) return ethers.parseEther('0.03');
  return ethers.parseEther('0.01');
}

// Deterministic fallback — persona-based so each agent behaves differently
function fallbackVote(agent, observation) {
  const desc = observation.description.toLowerCase();
  const claim = observation.claimType.toLowerCase();

  let verdict, confidence, reasoning;

  if (agent.persona === 'Agent-Skeptic') {
    // Skeptic disputes 30% of the time
    const hash = desc.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    verdict = hash % 10 > 2; // confirms 70%, disputes 30%
    confidence = verdict ? 45 : 70;
    reasoning = verdict ? 'Claim appears plausible based on keywords' : 'Insufficient evidence, marking disputed';
  } else if (agent.persona === 'Agent-Flood') {
    verdict = claim.includes('flood') || desc.includes('flood') || desc.includes('water');
    confidence = verdict ? 88 : 40;
    reasoning = verdict ? 'Flood indicators detected in report' : 'No flood indicators found';
  } else if (agent.persona === 'Agent-Grid') {
    verdict = claim.includes('power') || claim.includes('outage') || desc.includes('power') || desc.includes('electric');
    confidence = verdict ? 85 : 42;
    reasoning = verdict ? 'Power grid anomaly confirmed' : 'No utility failure indicators';
  } else {
    verdict = desc.length > 30;
    confidence = verdict ? 75 : 38;
    reasoning = verdict ? 'Detailed report with sufficient context' : 'Report lacks sufficient detail';
  }

  return { verdict, confidence, reasoning };
}

// OpenRouter integration (OpenAI-compatible API)
async function getAgentVerdict(agent, observation) {
  if (!process.env.OPENROUTER_API_KEY) {
    return { ...fallbackVote(agent, observation), source: '[FALLBACK]' };
  }

  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-haiku-4-5',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `You are ${agent.persona}, an autonomous AI agent specializing in ${agent.specialty}. 
You are part of a decentralized verification network called Proof of Reality on Monad blockchain.
You stake your own MON tokens and reputation on every vote.
Analyze the observation and respond with ONLY valid JSON, no other text:
{"verdict":"CONFIRM","confidence":85,"reasoning":"one sentence explanation"}
verdict must be exactly "CONFIRM" or "DISPUTE". confidence is 0-100.`,
          },
          {
            role: 'user',
            content: `Observation to verify:
Type: ${observation.claimType}
Description: ${observation.description}
Location: lat=${observation.lat}, lng=${observation.lng}

Should this be confirmed or disputed?`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://proof-of-reality.xyz',
          'X-Title': 'Proof of Reality',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const text = res.data.choices[0].message.content.trim();
    // Extract JSON even if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      verdict: parsed.verdict === 'CONFIRM',
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 75)),
      reasoning: parsed.reasoning || 'AI verdict',
      source: '[AI]',
    };
  } catch (e) {
    log.error(`[${agent.persona}] AI call failed: ${e.message?.substring(0, 50)}, using fallback`);
    return { ...fallbackVote(agent, observation), source: '[FALLBACK]' };
  }
}

let lastId = -1;

async function processObservation(id, contract) {
  try {
    const obs = await contract.observations(id);

    if (obs.reporter === ethers.ZeroAddress || obs.finalized) return;

    log.info(chalk.bold.cyan(`\n📋 OBSERVATION ${id} — ${obs.claimType}`));
    log.info(`   "${obs.description.substring(0, 70)}"`);
    log.info(chalk.dim('   Agents deliberating in parallel...\n'));

    emitEvent({
      type: 'observation',
      id: id.toString(),
      claimType: obs.claimType,
      description: obs.description,
      lat: obs.lat.toString(),
      lng: obs.lng.toString(),
      status: 'voting',
    });

    const observationData = {
      claimType: obs.claimType,
      description: obs.description,
      lat: obs.lat.toString(),
      lng: obs.lng.toString(),
    };

    // Vote in parallel — each agent independent
    await Promise.all(
      AGENTS.map(async (agent) => {
        if (!agent.key) return;
        const w = new ethers.Wallet(agent.key, provider);
        const c = new ethers.Contract(address, abi, w);

        try {
          const fresh = await c.observations(id);
          if (fresh.finalized) return;

          const hasVoted = await c.hasVoted(id, w.address);
          if (hasVoted) return;

          const verdict = await getAgentVerdict(agent, observationData);
          const stake = stakeFromConfidence(verdict.confidence);

          const tx = await c.agentVote(id, verdict.verdict, { value: stake, gasLimit: 500000 });
          await tx.wait();

          const action = verdict.verdict ? 'CONFIRM' : 'DISPUTE';
          const stakeFormatted = ethers.formatEther(stake);

          log.info(
            chalk.yellow(
              `[${agent.persona}] ${action} | confidence ${verdict.confidence}% | stake ${stakeFormatted} MON | ${verdict.source}`
            )
          );
          log.info(chalk.dim(`                reason: "${verdict.reasoning}"\n`));

          emitEvent({
            type: 'vote',
            obsId: id.toString(),
            agent: agent.persona,
            action,
            confidence: verdict.confidence,
            stake: stakeFormatted,
            reasoning: verdict.reasoning,
            source: verdict.source,
            timestamp: Date.now(),
          });
        } catch (e) {
          if (e.message.includes('already voted') || e.message.includes('finalized')) return;
          log.error(`[${agent.persona}] ERROR: ${e.message.substring(0, 80)}`);
        }
      })
    );

    log.info(chalk.cyan(`✓ Observation ${id} — all votes cast\n`));
  } catch (e) {
    log.error(`processObservation(${id}) error: ${e.message.substring(0, 60)}`);
  }
}

export async function startAgentSwarm() {
  const contract = new ethers.Contract(address, abi, provider);

  log.info(chalk.bold.green('\n🤖 PROOF OF REALITY — AGENT SWARM ONLINE\n'));

  // Ensure all agents are registered
  for (const agent of AGENTS) {
    if (!agent.key) continue;
    try {
      const w = new ethers.Wallet(agent.key, provider);
      const c = new ethers.Contract(address, abi, w);
      const profile = await c.agents(w.address);
      if (!profile.registered) {
        const tx = await c.registerAgent(agent.persona);
        await tx.wait();
        log.info(`✓ ${agent.persona} registered`);
      } else {
        log.info(`✓ ${agent.persona} online (reputation: ${profile.reputation})`);
      }
    } catch (e) {
      log.error(`✗ ${agent.persona}: ${e.message.substring(0, 60)}`);
    }
  }

  log.info(chalk.cyan('\n👁️  Polling for new observations...\n'));

  const poll = async () => {
    try {
      const nextId = Number(await contract.nextObservationId());
      for (let id = lastId + 1; id < nextId; id++) {
        await processObservation(id, contract);
        lastId = id;
      }
    } catch (e) {
      log.error(`Poll error: ${e.message.substring(0, 60)}`);
    }
    setTimeout(poll, 2000);
  };

  poll();
}

// Standalone mode
if (process.argv[1].endsWith('agentSwarm.mjs')) {
  startAgentSwarm().catch((e) => {
    console.error(chalk.red(`Fatal: ${e.message}`));
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Agent swarm shutting down\n'));
    process.exit(0);
  });
}
