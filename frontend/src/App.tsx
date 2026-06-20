import { lazy, Suspense, useCallback, useState } from 'react';
import './index.css';
import type { Observation } from './api';
import { simulate } from './api';
import ActivityFeed from './components/ActivityFeed';
import ObservationInspector from './components/ObservationInspector';
import SubmitObservation from './components/SubmitObservation';
import { Badge } from './components/ui';
import { useNetworkState } from './hooks/useNetworkState';
import AgentsView from './views/AgentsView';
import Dashboard from './views/Dashboard';
import TreasuryView from './views/TreasuryView';

const MapView = lazy(() => import('./views/MapView'));

type View = 'dashboard' | 'map' | 'agents' | 'treasury';

const NAV: { id: View; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'map', label: 'Map' },
  { id: 'agents', label: 'Agents' },
  { id: 'treasury', label: 'Treasury' },
];

const CONTRACT = '0x85c1C9CB97438DDE2E680804a7A6Dbff68F2bB38';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [verifying, setVerifying] = useState(false);

  const {
    observations,
    agents,
    feedEntries,
    loading,
    connected,
    isDemoFallback,
    error,
    refreshState,
    getVotesForObservation,
  } = useNetworkState();

  const runVerification = useCallback(async () => {
    if (verifying) return;
    setVerifying(true);
    setView('dashboard');
    try {
      await simulate({
        claimType: 'flood',
        description: 'Severe waterlogging on SV Road near Andheri station.',
        lat: 19.1136,
        lng: 72.8697,
      });
    } catch (e) {
      console.error(e);
    } finally {
      window.setTimeout(() => setVerifying(false), 3000);
    }
  }, [verifying]);

  const confirmed = observations.filter((o) => o.finalized && o.status === 1).length;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__logo">PoR</div>
          <div>
            <div className="app-header__title">Proof of Reality</div>
            <div className="app-header__subtitle">Verification network · Monad</div>
          </div>
        </div>

        <nav className="app-nav" aria-label="Main">
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`app-nav__item${view === id ? ' app-nav__item--active' : ''}`}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="app-header__meta">
          <Badge tone={connected ? 'success' : isDemoFallback ? 'warning' : 'neutral'}>
            {connected ? 'Live' : isDemoFallback ? 'Cached' : 'Connecting'}
          </Badge>
          <a
            className="app-header__link"
            href={`https://testnet.monadexplorer.com/address/${CONTRACT}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contract
          </a>
        </div>
      </header>

      {(loading || error) && (
        <div className={`app-banner${loading ? ' app-banner--info' : ' app-banner--warn'}`}>
          <span>{loading ? 'Loading network state…' : error}</span>
          {!loading && (
            <button type="button" className="app-banner__action" onClick={() => void refreshState()}>
              Retry
            </button>
          )}
        </div>
      )}

      <div className="app-body">
        <main className="app-main">
          {view === 'dashboard' && (
            <Dashboard
              observations={observations}
              loading={loading}
              verifying={verifying}
              onRunVerification={() => void runVerification()}
              onViewNetwork={() => setView('agents')}
              onSelectObservation={setSelectedObs}
            />
          )}
          {view === 'map' && (
            <Suspense fallback={<div className="app-loading">Loading map…</div>}>
              <MapView observations={observations} onSelectObservation={setSelectedObs} />
            </Suspense>
          )}
          {view === 'agents' && <AgentsView agents={agents} loading={loading} />}
          {view === 'treasury' && <TreasuryView agents={agents} loading={loading} />}
        </main>

        <aside className="app-sidebar">
          <section className="app-sidebar__section">
            <h2 className="app-sidebar__heading">Submit observation</h2>
            <SubmitObservation disabled={isDemoFallback} onSubmitted={() => setView('dashboard')} />
          </section>

          <section className="app-sidebar__section app-sidebar__section--grow">
            <div className="app-sidebar__heading-row">
              <h2 className="app-sidebar__heading">Activity</h2>
              <span className="app-sidebar__count">{confirmed} confirmed</span>
            </div>
            <ActivityFeed entries={feedEntries} />
          </section>
        </aside>
      </div>

      <nav className="app-mobile-nav" aria-label="Mobile">
        {NAV.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`app-mobile-nav__item${view === id ? ' app-mobile-nav__item--active' : ''}`}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {selectedObs && (
        <ObservationInspector
          observation={selectedObs}
          votes={getVotesForObservation(selectedObs.id)}
          onClose={() => setSelectedObs(null)}
        />
      )}
    </div>
  );
}
