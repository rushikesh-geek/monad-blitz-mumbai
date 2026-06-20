import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const contract = new ethers.Contract(address, abi, provider);

async function main() {
  const nextId = Number(await contract.nextObservationId());
  console.log(`Next observation ID will be: ${nextId}`);
  
  if (nextId === 0) {
    console.log('No observations exist yet.');
    return;
  }

  const latestId = nextId - 1;
  const obs = await contract.observations(latestId);

  console.log(`\n=== OBSERVATION ${latestId} ===`);
  console.log(`Reporter: ${obs.reporter}`);
  console.log(`Type: ${obs.claimType}`);
  console.log(`Description: ${obs.description}`);
  console.log(`Status: ${obs.status.toString()} (0=Pending, 1=Confirmed, 2=Disputed)`);
  console.log(`ConfirmStake: ${ethers.formatEther(obs.confirmStake)} MON`);
  console.log(`DisputeStake: ${ethers.formatEther(obs.disputeStake)} MON`);
  console.log(`Finalized: ${obs.finalized}`);
  console.log(`VoteCount: ${obs.voteCount.toString()}`);
  console.log(`FirstVoteTimestamp: ${obs.firstVoteTimestamp.toString()}`);
  console.log(`SubmissionTimestamp: ${obs.timestamp.toString()}`);
}

main().catch(console.error);
