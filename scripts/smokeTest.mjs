import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';
import chalk from 'chalk';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const operator = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
const contract = new ethers.Contract(address, abi, operator);

const AGENTS = [
  { key: process.env.AGENT_1_PRIVATE_KEY, persona: 'Agent-Flood' },
  { key: process.env.AGENT_2_PRIVATE_KEY, persona: 'Agent-Grid' },
  { key: process.env.AGENT_3_PRIVATE_KEY, persona: 'Agent-Crowd' },
  { key: process.env.AGENT_4_PRIVATE_KEY, persona: 'Agent-Skeptic' },
];

async function main() {
  console.log(chalk.bold.green('\n======================================'));
  console.log('PHASE 2.5 - SMOKE TEST');
  console.log('======================================\n');

  // First, finalize any pending observations to clear state
  console.log('Clearing pending observations...\n');
  const nextId = Number(await contract.nextObservationId());
  for (let i = 0; i < nextId; i++) {
    const obs = await contract.observations(i);
    if (!obs.finalized && obs.reporter !== ethers.ZeroAddress) {
      try {
        const finTx = await contract.finalizeConsensus(i);
        await finTx.wait();
        console.log(`✓ Finalized pending observation ${i}`);
      } catch (e) {
        // Already finalized or quorum not reached, skip
      }
    }
  }

  // Now clear votes from any fresh observations (ones that have votes but no agents voting yet)
  const finalNextId = Number(await contract.nextObservationId());
  for (let i = 0; i < finalNextId; i++) {
    const obs = await contract.observations(i);
    if (!obs.finalized && obs.voteCount > 0 && obs.reporter !== ethers.ZeroAddress) {
      // Unfinalized with votes - finalize it
      try {
        const finTx = await contract.finalizeConsensus(i);
        await finTx.wait();
      } catch (e) {
        // ignore
      }
    }
  }

  console.log(chalk.bold.cyan('\nSTEP 1: Submit Observation\n'));
  
  // Get current nextObservationId BEFORE submitting
  const idBefore = Number(await contract.nextObservationId());
  
  const submitTx = await contract.submitObservation(
    'flood',
    'Heavy flooding reported in Andheri during monsoon',
    19110000n,
    72830000n
  );
  const submitReceipt = await submitTx.wait();
  
  // The new observation should have ID = idBefore (before increment)
  const obsId = BigInt(idBefore);
  
  console.log('✓ Observation submitted');
  console.log(`  ID: ${obsId}`);
  console.log(`  Type: flood\n`);

  console.log(chalk.bold.cyan('STEP 2: Agent Votes\n'));

  // Verify all agents are registered before voting
  for (const agent of AGENTS) {
    if (!agent.key) continue;
    const w = new ethers.Wallet(agent.key, provider);
    const profile = await contract.agents(w.address);
    if (!profile.registered) {
      console.log(`Registering ${agent.persona}...`);
      const c = new ethers.Contract(address, abi, w);
      const regTx = await c.registerAgent(agent.persona);
      await regTx.wait();
    }
  }

  const voteScenario = [
    { index: 0, verdict: true, confidence: 95 },
    { index: 1, verdict: true, confidence: 70 },
    { index: 2, verdict: true, confidence: 80 },
    { index: 3, verdict: false, confidence: 60 },
  ];

  for (const scenario of voteScenario) {
    const agent = AGENTS[scenario.index];
    if (!agent.key) continue;

    const w = new ethers.Wallet(agent.key, provider);
    const c = new ethers.Contract(address, abi, w);

    const stakeAmount = scenario.confidence >= 81
      ? ethers.parseEther('0.10')
      : scenario.confidence >= 61
        ? ethers.parseEther('0.05')
        : scenario.confidence >= 31
          ? ethers.parseEther('0.03')
          : ethers.parseEther('0.01');

    const voteTx = await c.agentVote(obsId, scenario.verdict, { value: stakeAmount, gasLimit: 500000 });
    const voteReceipt = await voteTx.wait();
    const action = scenario.verdict ? 'CONFIRM' : 'DISPUTE';
    console.log(`[${agent.persona}] ${action} CONFIDENCE: ${scenario.confidence} STAKE: ${ethers.formatEther(stakeAmount)} MON`);
    
    // Wait between votes to avoid nonce collisions
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(chalk.bold.cyan('\nSTEP 3: Finalize Consensus\n'));
  const finalizeTx = await contract.finalizeConsensus(obsId);
  const finalizeReceipt = await finalizeTx.wait();
  console.log('✓ Consensus finalized\n');

  console.log(chalk.bold.cyan('STEP 4: Results\n'));
  const obs = await contract.observations(obsId);
  const result = obs.status.toString() === '1' ? 'CONFIRMED' : 'DISPUTED';
  const totalStake = obs.confirmStake + obs.disputeStake;
  const confidence = totalStake > 0n ? Number((obs.confirmStake * 10000n) / totalStake) / 100 : 0;

  console.log(`Status: ${result}`);
  console.log(`Confirm Stake: ${ethers.formatEther(obs.confirmStake)} MON`);
  console.log(`Dispute Stake: ${ethers.formatEther(obs.disputeStake)} MON`);
  console.log(`Confidence: ${confidence.toFixed(2)}%\n`);

  console.log(chalk.bold.cyan('STEP 5: Reputation\n'));
  for (let i = 0; i < AGENTS.length; i++) {
    const agent = AGENTS[i];
    if (!agent.key) continue;
    const w = new ethers.Wallet(agent.key, provider);
    const profile = await contract.agents(w.address);
    const scenario = voteScenario[i];
    const wasCorrect = scenario.verdict === (obs.status.toString() === '1');
    const mark = wasCorrect ? 'CORRECT' : 'WRONG';

    console.log(`${agent.persona}: reputation ${profile.reputation.toString()} [${mark}]`);
  }

  console.log(chalk.bold.green('\n✓ SMOKE TEST PASSED\n'));
}

main().catch((e) => {
  console.error(chalk.red(`✗ Test failed: ${e.message}\n`));
  process.exit(1);
});
