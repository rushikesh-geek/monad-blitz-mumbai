import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: "0.8.24",
  networks: {
    monad: {
      type: "http",
      url: process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz",
      chainId: Number(process.env.MONAD_CHAIN_ID ?? 10143),
      accounts: process.env.OPERATOR_PRIVATE_KEY ? [process.env.OPERATOR_PRIVATE_KEY] : [],
    },
  },
});
