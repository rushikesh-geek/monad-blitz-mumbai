import { ethers } from "ethers";

async function main() {
  const rpcUrl = "https://testnet-rpc.monad.xyz";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const addresses = [
    "0x7fF1cbd4B4d17284817CADd01dEC502D3cB60177", // operator
    "0x1aFC369Db91De7bC56447272451E334D014b6649", // agent 1
    "0xDac5e0d1513C3077cF2E968a04cd842FF8382346", // agent 2
    "0xc5A0D383EF3bD534901C1c1653f340340ccFD5cf", // agent 3
    "0x20601819f09238a4b78c0Ea6B0257d20b23BF1e4", // agent 4
  ];

  console.log("Checking wallet balances on Monad Testnet:\n");
  for (const addr of addresses) {
    const balance = await provider.getBalance(addr);
    const formatted = ethers.formatEther(balance);
    console.log(`${addr}: ${formatted} MON`);
  }
}

main().catch(console.error);
