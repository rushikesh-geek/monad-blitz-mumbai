// Central API client — talks to the backend server.
// VITE_API_URL is set by Vercel; /api keeps local reverse-proxy development possible.
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 12_000;

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
  source?: 'live' | 'demo';
}

export type SSEEvent =
  | { type: 'connected' }
  | { type: 'log'; message: string }
  | { type: 'error'; message: string }
  | { type: 'observation'; id: string; claimType: string; description: string; lat: string; lng: string; status: string }
  | { type: 'observation_submitted'; obsId: string; claimType: string; description: string; lat: number; lng: number; txHash: string; timestamp: number }
  | { type: 'vote'; obsId: string; agent: string; action: string; confidence: number; stake: string; reasoning: string; source: string; timestamp: number }
  | { type: 'finalized'; obsId: string; result: string; confidenceBps: number; txHash: string; timestamp: number };

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function loadDemoState(): Promise<ChainState> {
  const res = await fetch('/demo-data.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Demo data is unavailable');
  const data = await res.json() as ChainState;
  return { ...data, source: 'demo' };
}

export async function fetchState(): Promise<ChainState> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetchWithTimeout(`${BASE}/state`);
      if (!res.ok) throw new Error(`RPC state request failed (${res.status})`);
      return { ...(await res.json() as ChainState), source: 'live' };
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  console.warn('Backend unavailable; loading bundled demo state.', lastError);
  return loadDemoState();
}

export async function simulate(params: {
  claimType: string;
  description: string;
  lat: number;
  lng: number;
}): Promise<{ success: boolean; observationId: string; txHash: string }> {
  const res = await fetchWithTimeout(`${BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error || `Simulation failed (${res.status})`);
  }
  return res.json() as Promise<{ success: boolean; observationId: string; txHash: string }>;
}

export function connectSSE(
  onEvent: (e: SSEEvent) => void,
  onStatus?: (connected: boolean) => void,
): () => void {
  let es: EventSource | null = null;
  let stopped = false;
  let retryMs = 1_000;
  let timer: number | undefined;

  const connect = () => {
    if (stopped) return;
    es = new EventSource(`${BASE}/events`);
    es.onopen = () => {
      retryMs = 1_000;
      onStatus?.(true);
    };
    es.onmessage = (event) => {
      try { onEvent(JSON.parse(event.data) as SSEEvent); } catch { /* Ignore malformed events. */ }
    };
    es.onerror = () => {
      onStatus?.(false);
      es?.close();
      timer = window.setTimeout(connect, retryMs);
      retryMs = Math.min(retryMs * 2, 15_000);
    };
  };

  connect();
  return () => {
    stopped = true;
    if (timer) window.clearTimeout(timer);
    es?.close();
  };
}
