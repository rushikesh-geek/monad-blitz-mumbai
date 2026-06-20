import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';

const { address, abi } = JSON.parse(fs.readFileSync('./shared/contracts.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz', { chainId: 10143, name: 'monad-testnet' });
const operator = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
const contract = new ethers.Contract(address, abi, operator);

// Pre-defined scenarios for demo
const scenarios = [
  {
    claimType: 'power_outage',
    description: 'Power outage reported near Bandra station',
    lat: 19076000n, // 19.076°N
    lng: 72877000n, // 72.877°E
  },
  {
    claimType: 'flood',
    description: 'Waterlogging reported at Andheri underpass after heavy rain',
    lat: 19110000n,
    lng: 72830000n,
  },
  {
    claimType: 'crowd',
    description: 'Heavy crowd at Central station during peak hours',
    lat: 18941000n,
    lng: 72821000n,
  },
];

async function submitObservation(scenario) {
  try {
    const tx = await contract.submitObservation(
      scenario.claimType,
      scenario.description,
      scenario.lat,
      scenario.lng
    );
    const receipt = await tx.wait();
    console.log(`✓ Submitted: ${scenario.description}`);
    return receipt.hash;
  } catch (error) {
    console.error(`✗ Failed to submit: ${error.message}`);
    return null;
  }
}

async function main() {
  if (process.argv[2]) {
    // Custom observation
    const [claimType, description, lat, lng] = process.argv.slice(2);
    const scenario = {
      claimType,
      description,
      lat: BigInt(lat),
      lng: BigInt(lng),
    };
    await submitObservation(scenario);
  } else {
    // Submit first scenario as demo
    console.log('Submitting demo observation...\n');
    await submitObservation(scenarios[0]);
  }
}

main().catch(console.error);
