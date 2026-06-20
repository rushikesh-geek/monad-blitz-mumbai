// Central API client — talks to the backend server

const BASE = 'http://localhost:3001';

export interface Observation {
  id: string;
  reporter: string;
  claimType: string;
  description: string;
  lat: number;
  lng: number;
  timestamp: number;
  status: number; // 0=Pending, 1=Confirmed, 2=Disputed
  confirmStake: string;
  disputeStake: string;
  finalized: boolean;
  voteCount: number;
  confidenceBps: number;
}

export interface Agent {
  persona: string;
  address: string;
  registered: boolean;
  reputation: number;
  totalVotes: number;
  correctVotes: number;
  accuracy: number;
  balance: string;
}

export interface ChainState {
  observations: Observation[];
  agents: Agent[];
  operator: { address: string; balance: string };
  contractAddress: string;
  chainId: number;
}

export type SSEEvent =
  | { type: 'connected' }
  | { type: 'log'; message: string }
  | { type: 'error'; message: string }
  | { type: 'observation'; id: string; claimType: string; description: string; lat: string; lng: string; status: string }
  | { type: 'observation_submitted'; obsId: string; claimType: string; description: string; lat: number; lng: number; txHash: string; timestamp: number }
  | { type: 'vote'; obsId: string; agent: string; action: string; confidence: number; stake: string; reasoning: string; source: string; timestamp: number }
  | { type: 'finalized'; obsId: string; result: string; confidenceBps: number; txHash: string; timestamp: number };

export async function fetchState(): Promise<ChainState> {
  const res = await fetch(`${BASE}/state`);
  if (!res.ok) throw new Error(`State fetch failed: ${res.status}`);
  return res.json();
}

export async function simulate(params: {
  claimType: string;
  description: string;
  lat: number;
  lng: number;
}): Promise<{ success: boolean; observationId: string; txHash: string }> {
  const res = await fetch(`${BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Simulate failed');
  }
  return res.json();
}

export function connectSSE(onEvent: (e: SSEEvent) => void): () => void {
  const es = new EventSource(`${BASE}/events`);
  es.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch (_) {}
  };
  es.onerror = () => {
    // Reconnect automatically handled by browser
  };
  return () => es.close();
}
