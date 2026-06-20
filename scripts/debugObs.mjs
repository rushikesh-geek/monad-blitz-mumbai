import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const contract = new ethers.Contract(address, abi, provider);

async function main() {
  const nextId = Number(await contract.nextObservationId());
  console.log(`Next observation ID: ${nextId}`);
  console.log(`Last observation ID (to check): ${nextId - 1}\n`);

  if (nextId > 0) {
    const lastId = nextId - 1;
    const obs = await contract.observations(lastId);
    console.log(`Observation ${lastId}:`);
    console.log(`  Reporter: ${obs.reporter}`);
    console.log(`  ClaimType: ${obs.claimType}`);
    console.log(`  Description: ${obs.description}`);
    console.log(`  Finalized: ${obs.finalized}`);
    console.log(`  Status: ${obs.status} (0=DISPUTED, 1=CONFIRMED)`);
    console.log(`  VoteCount: ${obs.voteCount}`);
    console.log(`  ConfirmStake: ${ethers.formatEther(obs.confirmStake)} MON`);
    console.log(`  DisputeStake: ${ethers.formatEther(obs.disputeStake)} MON\n`);

    // Check if each agent has voted
    const AGENTS = [
      { key: process.env.AGENT_1_PRIVATE_KEY, persona: 'Agent-Flood' },
      { key: process.env.AGENT_2_PRIVATE_KEY, persona: 'Agent-Grid' },
      { key: process.env.AGENT_3_PRIVATE_KEY, persona: 'Agent-Crowd' },
      { key: process.env.AGENT_4_PRIVATE_KEY, persona: 'Agent-Skeptic' },
    ];

    for (const agent of AGENTS) {
      if (!agent.key) continue;
      const w = new ethers.Wallet(agent.key, provider);
      const hasVoted = await contract.hasVoted(lastId, w.address);
      console.log(`${agent.persona}: hasVoted = ${hasVoted}`);
    }
  }
}

main().catch(console.error);
