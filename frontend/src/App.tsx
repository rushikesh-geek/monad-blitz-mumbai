import { useEffect, useState, useCallback, useRef } from 'react';
import './index.css';
import './App.css';
import type { Observation, Agent, SSEEvent } from './api';
import { fetchState, connectSSE } from './api';
import LiveMap from './components/LiveMap';
import Leaderboard from './components/Leaderboard';
import TreasuryPanel from './components/TreasuryPanel';
import AgentEconomyPanel from './components/AgentEconomyPanel';
import ActivityFeed, { type FeedEntry, sseEventToFeedEntry } from './components/ActivityFeed';
import SimulatePanel from './components/SimulatePanel';
import LiveDemoButton from './components/LiveDemoButton';
import ObservationInspector from './components/ObservationInspector';
import type { StoryStep } from './components/StoryTimeline';

import JudgeFAQ from './components/JudgeFAQ';

type Panel = 'map' | 'leaderboard' | 'treasury' | 'economy' | 'faq';

interface VoteRecord {
  agent: string;
  action: 'CONFIRM' | 'DISPUTE';
  confidence: number;
  stake: string;
  reasoning: string;
  source: string;
  timestamp: number;
}

interface ObsVotes {
  obsId: string;
  claimType: string;
  description: string;
  votes: VoteRecord[];
  result?: string;
  confidenceBps?: number;
  timestamp: number;
}

export default function App() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const [activePanel, setActivePanel] = useState<Panel>('map');
  const [connected, setConnected] = useState(false);
  const [recentVotes, setRecentVotes] = useState<VoteRecord[]>([]);
  const [recentObs, setRecentObs] = useState<ObsVotes[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState<StoryStep>('idle');
  const [highlightMonad, setHighlightMonad] = useState(false);
  const [highlightStory, setHighlightStory] = useState(false);
  const [highlightEconomy, setHighlightEconomy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const obsMapRef = useRef<Map<string, ObsVotes>>(new Map());
  const demoRunningRef = useRef(false);

  const refreshState = useCallback(async () => {
    try {
      const state = await fetchState();
      setObservations(state.observations);
      setAgents(state.agents);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'connected') {
      setConnected(true);
      return;
    }

    const entry = sseEventToFeedEntry(event);
    if (entry) {
      setFeedEntries((prev) => [...prev.slice(-199), entry]);
    }

    // Demo step progression (after vote recorded)
    const advanceDemoOnVote = (obsId: string) => {
      if (!demoRunningRef.current) return;
      const obs = obsMapRef.current.get(obsId);
      if (!obs) return;
      if (obs.votes.length >= 1) setDemoStep('staking');
      if (obs.votes.length >= 2) setDemoStep('analyzing');
      if (obs.votes.length >= 4) setDemoStep('consensus');
    };

    const advanceDemoOnFinalize = () => {
      if (!demoRunningRef.current) return;
      setDemoStep('consensus');
      setHighlightStory(true);
      setTimeout(() => {
        setDemoStep('rewards');
        setHighlightEconomy(true);
      }, 2000);
      setTimeout(() => {
        setDemoStep('reputation');
        setHighlightMonad(true);
        document.getElementById('monad-win-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 4000);
      setTimeout(() => {
        setDemoRunning(false);
        demoRunningRef.current = false;
        setDemoStep('idle');
        setHighlightMonad(false);
        setHighlightStory(false);
        setHighlightEconomy(false);
      }, 8000);
    };

    // Track votes per observation for the Economy panel
    if (event.type === 'observation_submitted') {
      const obsKey = event.obsId;
      obsMapRef.current.set(obsKey, {
        obsId: event.obsId,
        claimType: event.claimType,
        description: event.description,
        votes: [],
        timestamp: event.timestamp,
      });
      setRecentObs([...obsMapRef.current.values()].slice(-10));
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

      setRecentVotes((prev) => [...prev.slice(-49), voteRecord]);

      // Add to obs votes
      const obs = obsMapRef.current.get(event.obsId);
      if (obs) {
        if (!obs.votes.find(v => v.agent === event.agent)) {
          obs.votes.push(voteRecord);
        }
        setRecentObs([...obsMapRef.current.values()].slice(-10));
        advanceDemoOnVote(event.obsId);
      }

      setTimeout(refreshState, 800);
    }

    if (event.type === 'finalized') {
      // Update obs with result
      const obs = obsMapRef.current.get(event.obsId);
      if (obs) {
        obs.result = event.result;
        obs.confidenceBps = event.confidenceBps;
        setRecentObs([...obsMapRef.current.values()].slice(-10));
      }
      setTimeout(refreshState, 1500);
      advanceDemoOnFinalize();

      // Auto-switch to economy tab to show the result
      if (!demoRunningRef.current) setActivePanel('economy');
    }

    if (event.type === 'observation_submitted') {
      setTimeout(refreshState, 1500);
      if (demoRunningRef.current) {
        setActivePanel('economy');
        setDemoStep('analyzing');
        setHighlightStory(true);
      }
    }
  }, [refreshState]);

  useEffect(() => {
    refreshState();
    pollRef.current = setInterval(refreshState, 5000);
    const disconnect = connectSSE(handleSSEEvent);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      disconnect();
    };
  }, [refreshState, handleSSEEvent]);

  const handleDemoStart = useCallback(() => {
    setDemoRunning(true);
    demoRunningRef.current = true;
    setActivePanel('economy');
    setDemoStep('submitted');
    setHighlightEconomy(true);
    setHighlightStory(false);
    setHighlightMonad(false);
  }, []);

  const selectedObsVotes = selectedObs
    ? obsMapRef.current.get(selectedObs.id)?.votes
    : undefined;

  const pendingCount = observations.filter((o) => !o.finalized && o.voteCount === 0).length;
  const votingCount = observations.filter((o) => !o.finalized && o.voteCount > 0).length;
  const confirmedCount = observations.filter((o) => o.finalized && o.status === 1).length;
  const disputedCount = observations.filter((o) => o.finalized && o.status === 2).length;

  const TABS: { id: Panel; label: string }[] = [
    { id: 'map', label: '🗺️ Live Map' },
    { id: 'economy', label: '🤖 Agent Economy' },
    { id: 'leaderboard', label: '🏆 Leaderboard' },
    { id: 'treasury', label: '💰 Treasury' },
    { id: 'faq', label: '🏆 Judge FAQ' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-0)',
      overflow: 'hidden',
    }}>
      {/* ═══ HEADER ═══ */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        height: 54,
        background: 'rgba(7,11,20,0.98)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(124,58,237,0.2)',
        gap: 16,
        flexShrink: 0,
        zIndex: 100,
        boxShadow: '0 1px 30px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            boxShadow: '0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.2)',
          }}>
            🔍
          </div>
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: 15,
              color: '#f1f5f9',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              Proof of Reality
            </div>
            <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.3, marginTop: 1 }}>
              Autonomous Agent Network · Monad Testnet
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: 5, marginLeft: 8 }}>
          {[
            { label: 'Pending', count: pendingCount, color: '#64748b' },
            { label: 'Voting', count: votingCount, color: '#f59e0b' },
            { label: 'Confirmed', count: confirmedCount, color: '#10b981' },
            { label: 'Disputed', count: disputedCount, color: '#ef4444' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 9px',
              borderRadius: 20,
              background: `${color}12`,
              border: `1px solid ${color}28`,
              fontSize: 11,
            }}>
              <div style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 5px ${color}`,
                animation: label === 'Voting' && count > 0 ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
              }} />
              <span style={{ color: '#64748b' }}>{label}</span>
              <span style={{ color, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{count}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Run Live Demo */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <LiveDemoButton
            onDemoStart={handleDemoStart}
            onDemoStep={setDemoStep}
            disabled={demoRunning}
          />
        </div>

        {/* Contract address */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 9, color: '#334155', fontFamily: 'var(--font-mono)' }}>
            0x85c1…bB38
          </div>
          <a
            href="https://testnet.monadexplorer.com/address/0x85c1C9CB97438DDE2E680804a7A6Dbff68F2bB38"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 9, color: '#7c3aed', textDecoration: 'none' }}
          >
            ↗
          </a>
        </div>

        {/* Connection status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11,
          color: connected ? '#6ee7b7' : '#fca5a5',
        }}>
          <div style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: connected ? '#10b981' : '#ef4444',
            boxShadow: connected ? '0 0 8px #10b981' : '0 0 8px #ef4444',
            animation: connected ? 'pulse-dot 2s ease-in-out infinite' : 'none',
          }} />
          {connected ? 'Live' : 'Connecting...'}
        </div>

        {/* Chain badge */}
        <div style={{
          padding: '4px 10px',
          borderRadius: 20,
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.35)',
          fontSize: 11,
          fontWeight: 700,
          color: '#a78bfa',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.02em',
        }}>
          Monad Testnet
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: Main panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            gap: 1,
            padding: '0 16px',
            borderBottom: '1px solid rgba(124,58,237,0.15)',
            background: 'rgba(7,11,20,0.9)',
            flexShrink: 0,
          }}>
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => setActivePanel(id)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderBottom: activePanel === id ? '2px solid #7c3aed' : '2px solid transparent',
                  background: 'transparent',
                  color: activePanel === id ? '#a78bfa' : '#475569',
                  fontWeight: activePanel === id ? 700 : 400,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
                {id === 'economy' && recentObs.length > 0 && activePanel !== 'economy' && (
                  <span style={{
                    marginLeft: 5,
                    padding: '1px 5px',
                    borderRadius: 10,
                    background: '#7c3aed',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 800,
                  }}>
                    {recentObs.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {activePanel === 'map' && (
              <LiveMap
                observations={observations}
                onSelectObservation={setSelectedObs}
              />
            )}
            {activePanel === 'economy' && (
              <div style={{ height: '100%', overflow: 'auto', padding: 14 }}>
                <AgentEconomyPanel
                  agents={agents}
                  recentVotes={recentVotes}
                  recentObs={recentObs}
                  demoStep={demoStep}
                  highlightMonad={highlightMonad}
                  highlightStory={highlightStory}
                  highlightEconomy={highlightEconomy}
                />
              </div>
            )}
            {activePanel === 'leaderboard' && (
              <div style={{ height: '100%', overflow: 'auto', padding: 14 }}>
                <Leaderboard agents={agents} />
              </div>
            )}
            {activePanel === 'treasury' && (
              <div style={{ height: '100%', overflow: 'auto', padding: 14 }}>
                <TreasuryPanel agents={agents} />
              </div>
            )}
            {activePanel === 'faq' && (
              <div style={{ height: '100%', overflow: 'auto', padding: 14 }}>
                <JudgeFAQ />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{
          width: 336,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(124,58,237,0.12)',
          background: 'rgba(7,11,20,0.85)',
          overflow: 'hidden',
        }}>

          {/* Simulate Event */}
          <div style={{
            padding: '14px 14px 12px',
            borderBottom: '1px solid rgba(124,58,237,0.1)',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}>
              <div style={{
                width: 22, height: 22,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                boxShadow: '0 0 12px rgba(124,58,237,0.4)',
              }}>
                ⚡
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9' }}>Simulate Event</div>
              <div style={{
                marginLeft: 'auto',
                fontSize: 9,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(16,185,129,0.12)',
                color: '#6ee7b7',
                border: '1px solid rgba(16,185,129,0.25)',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}>
                DEMO MODE
              </div>
            </div>
            <SimulatePanel onSimulated={() => setActivePanel('economy')} />
          </div>

          {/* Activity Feed */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 14px 8px',
              borderBottom: '1px solid rgba(100,120,200,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              flexShrink: 0,
            }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8' }}>Activity Feed</div>
              <div style={{
                width: 5, height: 5,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 5px #10b981',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }} />
              {feedEntries.length > 0 && (
                <div style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  color: '#334155',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {feedEntries.length}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '6px 10px' }}>
              <ActivityFeed entries={feedEntries} />
            </div>
          </div>
        </div>
      </div>

      {selectedObs && (
        <ObservationInspector
          observation={selectedObs}
          votes={selectedObsVotes}
          onClose={() => setSelectedObs(null)}
        />
      )}
    </div>
  );
}
