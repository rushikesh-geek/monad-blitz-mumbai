import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';
import chalk from 'chalk';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const operator = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
const contract = new ethers.Contract(address, abi, operator);

async function main() {
  const obsId = 8n;
  const obs = await contract.observations(obsId);

  console.log(`\nAttempting to finalize observation ${obsId}...`);
  console.log(`Current state:`);
  console.log(`  Finalized: ${obs.finalized}`);
  console.log(`  VoteCount: ${obs.voteCount.toString()}`);
  console.log(`  ConfirmStake: ${ethers.formatEther(obs.confirmStake)}`);
  console.log(`  DisputeStake: ${ethers.formatEther(obs.disputeStake)}`);
  console.log(`  Status: ${obs.status.toString()}\n`);

  try {
    const tx = await contract.finalizeConsensus(obsId);
    const receipt = await tx.wait();
    console.log(chalk.green('✓ Finalize succeeded'));
    console.log(`  TX hash: ${receipt.hash}`);

    const obsAfter = await contract.observations(obsId);
    console.log(`\nAfter finalization:`);
    console.log(`  Finalized: ${obsAfter.finalized}`);
    console.log(`  Status: ${obsAfter.status.toString()} (1=Confirmed, 2=Disputed)`);
  } catch (e) {
    console.log(chalk.red(`✗ Finalize failed: ${e.message}`));
  }
}

main().catch(console.error);
