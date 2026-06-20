import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';

const artifact = JSON.parse(
  fs.readFileSync('./artifacts/contracts/ProofOfReality.sol/ProofOfReality.json', 'utf8')
);

const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz', {
  chainId: 10143, name: 'monad-testnet',
});

// match whatever env var name Phase 0's generateWallets.ts actually used
const operator = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);

async function main() {
  console.log('Deploying from:', operator.address);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, operator);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log('Deployed at:', address);
  console.log('Explorer:', `https://testnet.monadexplorer.com/address/${address}`);

  fs.mkdirSync('./shared', { recursive: true });
  fs.writeFileSync('./shared/contracts.json', JSON.stringify({ address, abi: artifact.abi }, null, 2));
  console.log('Saved address+ABI to shared/contracts.json — frontend and agents read from here later.');
}
main().catch((e) => { console.error(e); process.exit(1); });
