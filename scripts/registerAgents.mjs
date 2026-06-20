import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');

const AGENTS = [
  { key: process.env.AGENT_1_PRIVATE_KEY, persona: 'Agent-Flood' },
  { key: process.env.AGENT_2_PRIVATE_KEY, persona: 'Agent-Grid' },
  { key: process.env.AGENT_3_PRIVATE_KEY, persona: 'Agent-Crowd' },
  { key: process.env.AGENT_4_PRIVATE_KEY, persona: 'Agent-Skeptic' },
];

async function main() {
  console.log('\n=== REGISTERING AGENTS ===\n');

  for (const agent of AGENTS) {
    if (!agent.key) continue;

    const wallet = new ethers.Wallet(agent.key, provider);
    const contract = new ethers.Contract(address, abi, wallet);

    try {
      const profile = await contract.agents(wallet.address);
      if (profile.registered) {
        console.log(`✓ ${agent.persona} already registered`);
        continue;
      }

      console.log(`Registering ${agent.persona}...`);
      const tx = await contract.registerAgent(agent.persona);
      await tx.wait();
      console.log(`✓ ${agent.persona} registered\n`);
    } catch (error) {
      console.error(`✗ ${agent.persona} failed: ${error.message}\n`);
    }
  }

  console.log('=== DONE ===\n');
}

main().catch(console.error);
