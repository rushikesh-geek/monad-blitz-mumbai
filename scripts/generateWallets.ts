import { Wallet } from 'ethers';

// Generate 5 fresh wallets
const wallets = Array.from({ length: 5 }, () => Wallet.createRandom());

console.log('# Operator wallet');
console.log(`OPERATOR_PRIVATE_KEY=${wallets[0].privateKey}`);
console.log(`OPERATOR_ADDRESS=${wallets[0].address}`);
console.log();

console.log('# Agent wallets');
wallets.slice(1).forEach((w, i) => {
  console.log(`AGENT_${i + 1}_PRIVATE_KEY=${w.privateKey}`);
  console.log(`AGENT_${i + 1}_ADDRESS=${w.address}`);
});

console.log();
console.log('# Anthropic API Key (add this manually)');
console.log('ANTHROPIC_API_KEY=your_key_here');
