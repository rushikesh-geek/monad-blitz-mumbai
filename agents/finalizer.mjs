import 'dotenv/config';
import { ethers } from 'ethers';
import chalk from 'chalk';
import fs from 'fs';
import { emitEvent } from './agentSwarm.mjs';

const deployment = JSON.parse(fs.readFileSync(new URL('../shared/contracts.json', import.meta.url), 'utf8'));
const address = process.env.CONTRACT_ADDRESS || deployment.address;
const { abi } = deployment;
const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz');
const operator = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
const contract = new ethers.Contract(address, abi, operator);

const log = {
  info: (s) => { console.log(s); emitEvent({ type: 'log', message: s }); },
  error: (s) => { console.error(chalk.red(s)); },
};

// Track which IDs have been finalized to avoid redundant retries
const finalizedIds = new Set();

async function tryFinalize(id) {
  try {
    const obs = await contract.observations(id);

    // Already finalized on-chain
    if (obs.finalized) {
      finalizedIds.add(id);
      return;
    }

    // Not enough votes yet AND window hasn't elapsed
    const voteCount = Number(obs.voteCount);
    const now = BigInt(Math.floor(Date.now() / 1000));
    const windowElapsed =
      obs.firstVoteTimestamp > 0n && now >= obs.firstVoteTimestamp + 30n;

    if (voteCount < 3 && !windowElapsed) return;

    log.info(chalk.bold.yellow(`\n🔨 FINALIZING Observation ${id}...`));
    log.info(`   Votes: ${voteCount} | Window elapsed: ${windowElapsed ? 'yes' : 'no'}`);

    const tx = await contract.finalizeConsensus(id, { gasLimit: 500000 });
    await tx.wait();

    const finalObs = await contract.observations(id);
    const result = finalObs.status.toString() === '1' ? 'CONFIRMED ✓' : 'DISPUTED ✗';
    const totalStake = finalObs.confirmStake + finalObs.disputeStake;
    const confidenceBps = totalStake > 0n
      ? Number((finalObs.confirmStake * 10000n) / totalStake)
      : 0;

    log.info(chalk.green(`   Result: ${result} (${(confidenceBps / 100).toFixed(1)}% confidence)`));
    log.info(chalk.dim(`   Tx: ${tx.hash}\n`));

    emitEvent({
      type: 'finalized',
      obsId: id.toString(),
      result: finalObs.status.toString() === '1' ? 'CONFIRMED' : 'DISPUTED',
      confidenceBps,
      txHash: tx.hash,
      timestamp: Date.now(),
    });

    finalizedIds.add(id);
  } catch (e) {
    if (
      e.message.includes('already finalized') ||
      e.message.includes('quorum not reached') ||
      e.message.includes('no votes to finalize')
    ) {
      // These are expected — don't spam logs
      if (e.message.includes('already finalized')) finalizedIds.add(id);
      return;
    }
    log.error(`   Finalize(${id}) failed: ${e.message.substring(0, 80)}`);
  }
}

export async function startFinalizer() {
  log.info(chalk.bold.green('\n🔨 CONSENSUS FINALIZER ONLINE\n'));
  log.info(chalk.cyan('Monitoring for quorum-ready observations...\n'));

  const finalize = async () => {
    try {
      const nextId = Number(await contract.nextObservationId());

      // Check ALL non-finalized observations every cycle (no premature caching)
      for (let id = 0; id < nextId; id++) {
        if (finalizedIds.has(id)) continue;
        await tryFinalize(id);
      }
    } catch (e) {
      log.error(`Finalizer cycle error: ${e.message.substring(0, 60)}`);
    }

    setTimeout(finalize, 1500); // 1.5s poll — faster than agentSwarm's 2s
  };

  finalize();
}

// Standalone mode
if (process.argv[1].endsWith('finalizer.mjs')) {
  startFinalizer().catch((e) => {
    console.error(chalk.red(`Fatal: ${e.message}`));
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Finalizer shutting down\n'));
    process.exit(0);
  });
}
