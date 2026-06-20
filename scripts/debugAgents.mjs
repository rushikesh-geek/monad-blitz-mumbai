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
  console.log('\n=== AGENT STATUS ===\n');
  console.log('Persona | Wallet | Balance | Registered | Reputation');
  console.log('--------|--------|---------|------------|----------');

  for (const agent of AGENTS) {
    if (!agent.key) {
      console.log(`${agent.name} | NO_KEY | N/A | N/A | N/A`);
      continue;
    }

    const w = new ethers.Wallet(agent.key, provider);
    const balance = await provider.getBalance(w.address);
    const profile = await contract.agents(w.address);

    const balanceStr = ethers.formatEther(balance);
    const registered = profile.registered ? 'YES' : 'NO';
    const reputation = profile.reputation.toString();

    console.log(`${agent.name} | ${w.address.substring(0, 6)}... | ${balanceStr} | ${registered} | ${reputation}`);
  }
}

main().catch(console.error);
