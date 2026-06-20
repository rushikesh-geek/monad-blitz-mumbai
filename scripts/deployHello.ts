import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // Read contract ABI and bytecode
  const artifactPath = path.join(process.cwd(), "artifacts/contracts/Hello.sol/Hello.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;

  const rpcUrl = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
  const privateKey = process.env.OPERATOR_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("OPERATOR_PRIVATE_KEY not set in .env");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  console.log(`Deploying with account: ${signer.address}`);

  // Check balance
  const balance = await provider.getBalance(signer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} MON`);

  // Deploy
  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`Hello contract deployed to: ${address}`);

  // Verify it works
  const greet = await contract.greet();
  console.log(`Greeting: ${greet}`);

  const val = await contract.value();
  console.log(`Value: ${val}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

