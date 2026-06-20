import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz', { chainId: 10143, name: 'monad-testnet' });

// Use only funded agents (2, 3, 4 — skip Agent 1 which has 0 balance)
const agentKeys = [process.env.AGENT_2_PRIVATE_KEY, process.env.AGENT_3_PRIVATE_KEY, process.env.AGENT_4_PRIVATE_KEY];
const personas = ['Agent-Grid', 'Agent-Crowd', 'Agent-Skeptic'];
const wallets = agentKeys.map((k) => new ethers.Wallet(k, provider));
const contracts = wallets.map((w) => new ethers.Contract(address, abi, w));

async function main() {
  console.log('=== AGENT REGISTRATION ===');
  for (let i = 0; i < contracts.length; i++) {
    const tx = await contracts[i].registerAgent(personas[i]);
    await tx.wait();
    console.log(`✓ Registered ${personas[i]} (${wallets[i].address})`);
  }

  console.log('\n=== OBSERVATION SUBMITTED ===');
  const operator = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
  const opContract = new ethers.Contract(address, abi, operator);
  const submitTx = await opContract.submitObservation(
    'power_outage', 'Power outage reported near Bandra station', 19076000n, 72877000n
  );
  const submitReceipt = await submitTx.wait();
  console.log(`✓ Observation ID 0 submitted (tx: ${submitReceipt.hash})`);

  console.log('\n=== AGENT VOTES ===');
  const observationId = 0n;
  const stake = ethers.parseEther('0.01');
  const votes = [true, true, false]; // Agent-Grid CONFIRM, Agent-Crowd CONFIRM, Agent-Skeptic DISPUTE
  for (let i = 0; i < contracts.length; i++) {
    const tx = await contracts[i].agentVote(observationId, votes[i], { value: stake });
    await tx.wait();
    console.log(`✓ ${personas[i]} voted ${votes[i] ? 'CONFIRM' : 'DISPUTE'} (stake: 0.01 MON)`);
  }

  console.log('\n=== CONSENSUS FINALIZATION ===');
  const finalizeTx = await opContract.finalizeConsensus(observationId);
  const finalizeReceipt = await finalizeTx.wait();
  console.log(`✓ Consensus finalized (tx: ${finalizeReceipt.hash})`);

  console.log('\n=== RESULTS ===');
  const obs = await opContract.observations(observationId);
  console.log(`Observation Status: ${obs.status.toString() === '1' ? 'CONFIRMED ✓' : 'DISPUTED ✗'}`);
  console.log(`Confirm Stake: ${ethers.formatEther(obs.confirmStake)} MON`);
  console.log(`Dispute Stake: ${ethers.formatEther(obs.disputeStake)} MON`);
  console.log(`Confidence: ${(BigInt(obs.confirmStake) * 100n / (BigInt(obs.confirmStake) + BigInt(obs.disputeStake))).toString()}%`);

  console.log('\n=== FINAL REPUTATIONS ===');
  for (let i = 0; i < contracts.length; i++) {
    const profile = await opContract.agents(wallets[i].address);
    const correctVotes = profile.correctVotes.toString();
    const totalVotes = profile.totalVotes.toString();
    console.log(`${personas[i]}: reputation ${profile.reputation.toString()} (${correctVotes}/${totalVotes} correct)`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
