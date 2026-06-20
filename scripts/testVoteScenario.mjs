import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');

const AGENTS = [
  { key: process.env.AGENT_1_PRIVATE_KEY, name: 'Agent-Flood', index: 0 },
  { key: process.env.AGENT_2_PRIVATE_KEY, name: 'Agent-Grid', index: 1 },
  { key: process.env.AGENT_3_PRIVATE_KEY, name: 'Agent-Crowd', index: 2 },
  { key: process.env.AGENT_4_PRIVATE_KEY, name: 'Agent-Skeptic', index: 3 },
];

const voteScenario = [
  { index: 0, verdict: true, confidence: 95 },
  { index: 1, verdict: true, confidence: 70 },
  { index: 2, verdict: true, confidence: 80 },
  { index: 3, verdict: false, confidence: 60 },
];

async function main() {
  const obsId = 8n;

  for (const scenario of voteScenario) {
    const agent = AGENTS[scenario.index];
    const w = new ethers.Wallet(agent.key, provider);
    const c = new ethers.Contract(address, abi, w);

    // Check if already voted
    const hasVoted = await c.hasVoted(obsId, w.address);
    if (hasVoted) {
      const voteChoice = await c.voteChoice(obsId, w.address);
      const side = voteChoice ? 'CONFIRM' : 'DISPUTE';
      console.log(`${agent.name}: Already voted ${side}`);
      continue;
    }

    // Attempt to vote
    const stakeAmount = scenario.confidence >= 81
      ? ethers.parseEther('0.10')
      : scenario.confidence >= 61
        ? ethers.parseEther('0.05')
        : scenario.confidence >= 31
          ? ethers.parseEther('0.03')
          : ethers.parseEther('0.01');

    try {
      console.log(`${agent.name}: Voting ${scenario.verdict ? 'CONFIRM' : 'DISPUTE'} with stake ${ethers.formatEther(stakeAmount)}...`);
      const voteTx = await c.agentVote(obsId, scenario.verdict, { value: stakeAmount, gasLimit: 500000 });
      const voteReceipt = await voteTx.wait();
      console.log(`  ✓ Success (tx: ${voteReceipt.hash})`);
    } catch (e) {
      console.log(`  ✗ Error: ${e.message}`);
    }
  }
}

main().catch(console.error);
