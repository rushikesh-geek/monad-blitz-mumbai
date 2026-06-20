// Single source of truth for contract info
// Used by both agents and frontend

export const CONTRACT_ADDRESS = '0x85c1C9CB97438DDE2E680804a7A6Dbff68F2bB38';
export const CHAIN_ID = 10143;
export const RPC_URL = 'https://testnet-rpc.monad.xyz';
export const EXPLORER_URL = 'https://testnet.monadexplorer.com';

export const ABI = [
  {
    "anonymous": false,
    "inputs": [{"indexed": true,"internalType": "address","name": "agent","type": "address"},{"indexed": false,"internalType": "string","name": "persona","type": "string"}],
    "name": "AgentRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true,"internalType": "uint256","name": "id","type": "uint256"},{"indexed": true,"internalType": "address","name": "agent","type": "address"},{"indexed": false,"internalType": "bool","name": "confirm","type": "bool"},{"indexed": false,"internalType": "uint256","name": "stake","type": "uint256"}],
    "name": "AgentVoted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true,"internalType": "uint256","name": "id","type": "uint256"},{"indexed": false,"internalType": "bool","name": "verifiedTrue","type": "bool"},{"indexed": false,"internalType": "uint256","name": "confidenceBps","type": "uint256"}],
    "name": "ConsensusReached",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true,"internalType": "uint256","name": "id","type": "uint256"},{"indexed": true,"internalType": "address","name": "reporter","type": "address"},{"indexed": false,"internalType": "string","name": "claimType","type": "string"},{"indexed": false,"internalType": "string","name": "description","type": "string"},{"indexed": false,"internalType": "int256","name": "lat","type": "int256"},{"indexed": false,"internalType": "int256","name": "lng","type": "int256"},{"indexed": false,"internalType": "uint256","name": "timestamp","type": "uint256"}],
    "name": "ObservationSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true,"internalType": "address","name": "agent","type": "address"},{"indexed": false,"internalType": "int256","name": "newReputation","type": "int256"}],
    "name": "ReputationUpdated",
    "type": "event"
  },
  {"inputs": [],"name": "MIN_AGENTS","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},
  {"inputs": [],"name": "REPUTATION_STEP","outputs": [{"internalType": "int256","name": "","type": "int256"}],"stateMutability": "view","type": "function"},
  {"inputs": [],"name": "STARTING_REPUTATION","outputs": [{"internalType": "int256","name": "","type": "int256"}],"stateMutability": "view","type": "function"},
  {"inputs": [],"name": "VOTE_WINDOW","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},
  {"inputs": [{"internalType": "uint256","name": "observationId","type": "uint256"},{"internalType": "bool","name": "confirm","type": "bool"}],"name": "agentVote","outputs": [],"stateMutability": "payable","type": "function"},
  {"inputs": [{"internalType": "address","name": "","type": "address"}],"name": "agents","outputs": [{"internalType": "bool","name": "registered","type": "bool"},{"internalType": "string","name": "persona","type": "string"},{"internalType": "int256","name": "reputation","type": "int256"},{"internalType": "uint256","name": "totalVotes","type": "uint256"},{"internalType": "uint256","name": "correctVotes","type": "uint256"}],"stateMutability": "view","type": "function"},
  {"inputs": [{"internalType": "uint256","name": "observationId","type": "uint256"}],"name": "finalizeConsensus","outputs": [],"stateMutability": "nonpayable","type": "function"},
  {"inputs": [{"internalType": "uint256","name": "","type": "uint256"},{"internalType": "address","name": "","type": "address"}],"name": "hasVoted","outputs": [{"internalType": "bool","name": "","type": "bool"}],"stateMutability": "view","type": "function"},
  {"inputs": [],"name": "nextObservationId","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},
  {"inputs": [{"internalType": "uint256","name": "","type": "uint256"},{"internalType": "uint256","name": "","type": "uint256"}],"name": "observationVoters","outputs": [{"internalType": "address","name": "","type": "address"}],"stateMutability": "view","type": "function"},
  {"inputs": [{"internalType": "uint256","name": "","type": "uint256"}],"name": "observations","outputs": [{"internalType": "address","name": "reporter","type": "address"},{"internalType": "string","name": "claimType","type": "string"},{"internalType": "string","name": "description","type": "string"},{"internalType": "int256","name": "lat","type": "int256"},{"internalType": "int256","name": "lng","type": "int256"},{"internalType": "uint256","name": "timestamp","type": "uint256"},{"internalType": "uint8","name": "status","type": "uint8"},{"internalType": "uint256","name": "confirmStake","type": "uint256"},{"internalType": "uint256","name": "disputeStake","type": "uint256"},{"internalType": "bool","name": "finalized","type": "bool"},{"internalType": "uint256","name": "firstVoteTimestamp","type": "uint256"},{"internalType": "uint256","name": "voteCount","type": "uint256"}],"stateMutability": "view","type": "function"},
  {"inputs": [{"internalType": "string","name": "persona","type": "string"}],"name": "registerAgent","outputs": [],"stateMutability": "nonpayable","type": "function"},
  {"inputs": [{"internalType": "string","name": "claimType","type": "string"},{"internalType": "string","name": "description","type": "string"},{"internalType": "int256","name": "lat","type": "int256"},{"internalType": "int256","name": "lng","type": "int256"}],"name": "submitObservation","outputs": [{"internalType": "uint256","name": "observationId","type": "uint256"}],"stateMutability": "nonpayable","type": "function"},
  {"inputs": [{"internalType": "uint256","name": "","type": "uint256"},{"internalType": "address","name": "","type": "address"}],"name": "voteChoice","outputs": [{"internalType": "bool","name": "","type": "bool"}],"stateMutability": "view","type": "function"},
  {"inputs": [{"internalType": "uint256","name": "","type": "uint256"},{"internalType": "address","name": "","type": "address"}],"name": "voteStake","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},
  {"stateMutability": "payable","type": "receive"}
];
