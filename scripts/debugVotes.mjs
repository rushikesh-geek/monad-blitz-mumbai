import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const contract = new ethers.Contract(address, abi, provider);

const AGENTS = [
  { key: process.env.AGENT_1_PRIVATE_KEY, name: 'Agent-Flood' },
  { key: process.env.AGENT_2_PRIVATE_KEY, name: 'Agent-Grid' },
  { key: process.env.AGENT_3_PRIVATE_KEY, name: 'Agent-Crowd' },
  { key: process.env.AGENT_4_PRIVATE_KEY, name: 'Agent-Skeptic' },
];

async function main() {
  const nextId = Number(await contract.nextObservationId());
  if (nextId === 0) {
    console.log('No observations exist.');
    return;
  }

  const obsId = nextId - 1;
  const obs = await contract.observations(obsId);

  console.log(`\n=== VOTES ON OBSERVATION ${obsId} ===`);
  console.log(`(Observation finalized: ${obs.finalized})\n`);
  console.log('Persona | HasVoted | VoteSide');
  console.log('--------|----------|----------');

  for (const agent of AGENTS) {
    if (!agent.key) {
      console.log(`${agent.name} | NO_KEY | N/A`);
      continue;
    }

    const w = new ethers.Wallet(agent.key, provider);
    const hasVoted = await contract.hasVoted(obsId, w.address);
    let voteSide = 'N/A';

    if (hasVoted) {
      const voteChoice = await contract.voteChoice(obsId, w.address);
      voteSide = voteChoice ? 'CONFIRM' : 'DISPUTE';
    }

    const hasVotedStr = hasVoted ? 'YES' : 'NO';
    console.log(`${agent.name} | ${hasVotedStr} | ${voteSide}`);
  }
}

main().catch(console.error);
