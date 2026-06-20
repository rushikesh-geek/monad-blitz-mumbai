import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const contract = new ethers.Contract(address, abi, provider);

const AGENTS = [
  { key: process.env.AGENT_1_PRIVATE_KEY, persona: 'Agent-Flood' },
  { key: process.env.AGENT_2_PRIVATE_KEY, persona: 'Agent-Grid' },
  { key: process.env.AGENT_3_PRIVATE_KEY, persona: 'Agent-Crowd' },
  { key: process.env.AGENT_4_PRIVATE_KEY, persona: 'Agent-Skeptic' },
];

async function main() {
  console.log('\n=== AGENT STATUS CHECK ===\n');

  const results = [];

  for (const agent of AGENTS) {
    if (!agent.key) {
      results.push({
        Persona: agent.persona,
        Wallet: 'N/A',
        'Balance (MON)': 'N/A',
        Registered: '✗ (No key)',
        Reputation: 'N/A',
      });
      continue;
    }

    const wallet = new ethers.Wallet(agent.key, provider);
    const balance = await provider.getBalance(wallet.address);
    const balanceFormatted = ethers.formatEther(balance);

    try {
      const profile = await contract.agents(wallet.address);
      results.push({
        Persona: agent.persona,
        Wallet: wallet.address.substring(0, 10) + '...',
        'Balance (MON)': balanceFormatted,
        Registered: profile.registered ? '✓ Yes' : '✗ No',
        Reputation: profile.reputation.toString(),
      });
    } catch (error) {
      results.push({
        Persona: agent.persona,
        Wallet: wallet.address.substring(0, 10) + '...',
        'Balance (MON)': balanceFormatted,
        Registered: '✗ Error',
        Reputation: 'Error',
      });
    }
  }

  console.table(results);

  // Check if all pass
  const allFunded = results.every((r) => r['Balance (MON)'] !== 'N/A' && parseFloat(r['Balance (MON)']) > 1);
  const allRegistered = results.every((r) => r.Registered === '✓ Yes');
  const allHaveReputation = results.every((r) => r.Reputation !== 'N/A' && r.Reputation !== 'Error');

  console.log('\n=== VERIFICATION ===');
  console.log(`All funded (>1 MON): ${allFunded ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`All registered: ${allRegistered ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`All have reputation: ${allHaveReputation ? '✓ PASS' : '✗ FAIL'}`);

  if (allFunded && allRegistered && allHaveReputation) {
    console.log('\n✓ TASK 1 COMPLETE: All 4 agents ready\n');
    process.exit(0);
  } else {
    console.log('\n✗ TASK 1 INCOMPLETE: See above for issues\n');
    process.exit(1);
  }
}

main().catch(console.error);
