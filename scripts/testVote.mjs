import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');

const AGENT_1_KEY = process.env.AGENT_1_PRIVATE_KEY;
const w = new ethers.Wallet(AGENT_1_KEY, provider);
const contract = new ethers.Contract(address, abi, w);

async function main() {
  try {
    // Check agent is registered
    const profile = await contract.agents(w.address);
    console.log(`Agent registered: ${profile.registered}`);
    console.log(`Agent reputation: ${profile.reputation}`);
    
    // Get latest observation
    const nextId = Number(await contract.nextObservationId());
    console.log(`\nNext observation ID: ${nextId}`);
    console.log(`Latest observation ID: ${nextId - 1}\n`);
    
    if (nextId > 0) {
      const obsId = nextId - 1;
      const obs = await contract.observations(obsId);
      console.log(`Observation ${obsId}:`);
      console.log(`  Finalized: ${obs.finalized}`);
      console.log(`  VoteCount: ${obs.voteCount}`);
      
      const hasVoted = await contract.hasVoted(obsId, w.address);
      console.log(`  Agent has voted: ${hasVoted}\n`);
      
      if (!obs.finalized && !hasVoted) {
        console.log('Attempting to vote...');
        const stake = ethers.parseEther('0.10');
        const tx = await contract.agentVote(obsId, true, { value: stake, gasLimit: 500000 });
        const receipt = await tx.wait();
        console.log(`✓ Vote submitted: ${receipt.hash}`);
      } else if (obs.finalized) {
        console.log('Observation already finalized!');
      } else {
        console.log('Agent already voted on this observation!');
      }
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    if (e.data) console.error(`Data: ${e.data}`);
    if (e.reason) console.error(`Reason: ${e.reason}`);
  }
}

main().catch(console.error);
