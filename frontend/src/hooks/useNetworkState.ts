import { useCallback, useEffect, useRef, useState } from 'react';
import type { Agent, Observation, SSEEvent } from '../api';
import { connectSSE, fetchState } from '../api';
import { sseEventToFeedEntry, type FeedEntry } from '../components/ActivityFeed';

export interface VoteRecord {
  agent: string;
  action: 'CONFIRM' | 'DISPUTE';
  confidence: number;
  stake: string;
  reasoning: string;
  source: string;
  timestamp: number;
}

export interface ObsVotes {
  obsId: string;
  claimType: string;
  description: string;
  votes: VoteRecord[];
  result?: string;
  confidenceBps?: number;
  timestamp: number;
}

export function useNetworkState() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const [recentObs, setRecentObs] = useState<ObsVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isDemoFallback, setIsDemoFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obsMapRef = useRef<Map<string, ObsVotes>>(new Map());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshState = useCallback(async () => {
    try {
      const state = await fetchState();
      setObservations(state.observations);
      setAgents(state.agents);
      const fallback = state.source === 'demo';
      setIsDemoFallback(fallback);
      setConnected(!fallback);
      setError(fallback ? 'Live network unavailable. Showing cached snapshot only.' : null);
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : 'Unable to load network data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'connected') {
      setConnected(true);
      setIsDemoFallback(false);
      return;
    }

    const entry = sseEventToFeedEntry(event);
    if (entry) setFeedEntries((prev) => [...prev.slice(-199), entry]);

    if (event.type === 'observation_submitted') {
      obsMapRef.current.set(event.obsId, {
        obsId: event.obsId,
        claimType: event.claimType,
        description: event.description,
        votes: [],
        timestamp: event.timestamp,
      });
      setRecentObs([...obsMapRef.current.values()].slice(-10));
      window.setTimeout(refreshState, 1500);
    }

    if (event.type === 'vote') {
      const voteRecord: VoteRecord = {
        agent: event.agent,
        action: event.action as 'CONFIRM' | 'DISPUTE',
        confidence: event.confidence,
        stake: event.stake,
        reasoning: event.reasoning,
        source: event.source,
        timestamp: event.timestamp,
      };
      const obs = obsMapRef.current.get(event.obsId);
      if (obs && !obs.votes.find((v) => v.agent === event.agent)) {
        obs.votes.push(voteRecord);
        setRecentObs([...obsMapRef.current.values()].slice(-10));
      }
      window.setTimeout(refreshState, 800);
    }

    if (event.type === 'finalized') {
      const obs = obsMapRef.current.get(event.obsId);
      if (obs) {
        obs.result = event.result;
        obs.confidenceBps = event.confidenceBps;
        setRecentObs([...obsMapRef.current.values()].slice(-10));
      }
      window.setTimeout(refreshState, 1500);
    }
  }, [refreshState]);

  useEffect(() => {
    void refreshState();
    pollRef.current = setInterval(refreshState, 15_000);
    const disconnect = connectSSE(handleSSEEvent, (live) => {
      if (live) {
        setConnected(true);
        setIsDemoFallback(false);
        setError(null);
      }
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      disconnect();
    };
  }, [refreshState, handleSSEEvent]);

  const getVotesForObservation = useCallback(
    (id: string) => obsMapRef.current.get(id)?.votes,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recentObs],
  );

  return {
    observations,
    agents,
    feedEntries,
    recentObs,
    loading,
    connected,
    isDemoFallback,
    error,
    refreshState,
    getVotesForObservation,
  };
}
