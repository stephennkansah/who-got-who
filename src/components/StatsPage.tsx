import React, { useCallback, useEffect, useState } from 'react';
import { getAwsGameClient } from '../services/aws';

// Mirrors StatsReport in amplify/functions/game-api/statsReport.ts.
type MissionRow = { id: string; text: string; dealt: number; rate: number };
type StatsReport = {
  days: number;
  since: string;
  games: { created: number; started: number; won: number; endedByHost: number; unfinished: number };
  players: { avgPerGame: number | null; bigGames: number; lateJoins: number; leftMidGame: number };
  spreading: { rematches: number; rematchRate: number | null; guestsWhoBecameHosts: number; repeatHosts: number; brandNewHosts: number };
  play: {
    avgMinutes: number | null; claimed: number; confirmed: number; disputes: number; disputeRate: number | null;
    overturned: number; caughtReports: number; swaps: number; pauses: number; challengeClaims: number; proofPhotos: number;
  };
  packs: Record<string, number>;
  lengths: Record<string, number>;
  withBriefing: number;
  daily: Array<{ date: string; started: number }>;
  missions: { mostSwapped: MissionRow[]; mostCompleted: MissionRow[]; neverCompleted: MissionRow[] };
};

const KEY_STORAGE = 'wgw-stats-key';
const pct = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`);

function readKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

async function fetchReport(key: string, days: number): Promise<StatsReport> {
  const client = await getAwsGameClient();
  if (!client.queries?.getStats) throw new Error('Stats arrive with the next deploy.');
  const response = await client.queries.getStats({ key, days }, { authMode: 'identityPool' });
  if (response.errors?.length) throw new Error(response.errors[0].message);
  return (typeof response.data === 'string' ? JSON.parse(response.data) : response.data) as StatsReport;
}

const Tile = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
  <div className="stat-tile">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {hint && <div className="stat-hint">{hint}</div>}
  </div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex-between stat-row"><span>{label}</span><strong>{value}</strong></div>
);

const Missions = ({ rows, showRate = true }: { rows: MissionRow[]; showRate?: boolean }) =>
  rows.length ? (
    <ol className="stat-missions">
      {rows.map((row) => (
        <li key={row.id}>
          {showRate && <strong>{pct(row.rate)}</strong>} {row.text}
          <span className="stat-hint"> · {row.id} · dealt {row.dealt}×</span>
        </li>
      ))}
    </ol>
  ) : <p className="stat-hint">Not enough games yet.</p>;

/** Private play statistics. Unlisted; the server checks the passcode. */
export default function StatsPage() {
  const [key, setKey] = useState(readKey);
  const [draft, setDraft] = useState('');
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<StatsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (passcode: string, range: number) => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchReport(passcode, range));
      try {
        localStorage.setItem(KEY_STORAGE, passcode);
      } catch {
        // Fine: you'll just type it again next time.
      }
      setKey(passcode);
    } catch (problem) {
      setReport(null);
      setError(problem instanceof Error ? problem.message : 'Could not load stats');
      if (problem instanceof Error && /passcode/i.test(problem.message)) setKey('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (key) void load(key, days);
    // Reload when the range changes; the passcode is applied on submit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const lock = () => {
    try {
      localStorage.removeItem(KEY_STORAGE);
    } catch {
      // Nothing stored.
    }
    setKey('');
    setReport(null);
  };

  if (!report) {
    return (
      <div className="container flex-center">
        <div className="card" style={{ width: '100%' }}>
          <h2>Game Stats</h2>
          <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Anonymous numbers on how games go. Enter the stats passcode set in Amplify.
          </p>
          <input
            type="password"
            aria-label="Stats passcode"
            placeholder="Passcode"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && draft) void load(draft, days);
            }}
            style={{ marginBottom: '0.8rem' }}
          />
          {error && <div className="game-error" style={{ marginBottom: '0.8rem' }}>{error}</div>}
          <button className="btn btn-primary" onClick={() => load(draft || key, days)} disabled={loading || !(draft || key)}>
            {loading ? 'Loading…' : 'Show Stats'}
          </button>
        </div>
      </div>
    );
  }

  return <StatsReportView report={report} days={days} busy={loading} onDays={setDays} onLock={lock} />;
}

/** The report itself: headline numbers up top, detail in tap-to-open cards. */
export function StatsReportView({ report, days, busy, onDays, onLock }: {
  report: StatsReport;
  days: number;
  busy: boolean;
  onDays: (days: number) => void;
  onLock: () => void;
}) {
  const { games, players, spreading, play } = report;
  const busiest = Math.max(1, ...report.daily.map((day) => day.started));
  const breakdown = (counts: Record<string, number>) =>
    Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => `${name} ${value}`).join(' · ') || '—';

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, textAlign: 'left' }}>Game Stats</h2>
        <button className="link-btn" onClick={onLock}>Lock</button>
      </div>

      <div className="segmented" role="radiogroup" aria-label="Time range" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '0.9rem' }}>
        {[7, 30, 90].map((range) => (
          <button
            key={range}
            role="radio"
            aria-checked={days === range}
            className={days === range ? 'is-selected' : ''}
            onClick={() => onDays(range)}
            disabled={busy}
          >
            {range} days
          </button>
        ))}
      </div>

      <div className="stat-grid">
        <Tile label="games started" value={games.started} hint={`${games.created} created`} />
        <Tile label="guests became hosts" value={spreading.guestsWhoBecameHosts} hint="the growth number" />
        <Tile label="rematch rate" value={pct(spreading.rematchRate)} hint={`${spreading.rematches} rematches`} />
        <Tile label="players per game" value={players.avgPerGame ?? '—'} hint={`avg ${play.avgMinutes ?? '—'} min`} />
      </div>

      <div className="card stat-chart" aria-label="Games started per day">
        <div className="overline" style={{ marginBottom: '0.5rem' }}>Games started per day</div>
        <div className="stat-bars">
          {report.daily.map((day) => (
            <span
              key={day.date}
              title={`${day.date}: ${day.started}`}
              style={{ height: `${Math.max(4, (day.started / busiest) * 100)}%`, opacity: day.started ? 1 : 0.25 }}
            />
          ))}
        </div>
      </div>

      <details className="card stat-section">
        <summary>Is it spreading?</summary>
        <Row label="Guests who later hosted" value={spreading.guestsWhoBecameHosts} />
        <Row label="Hosts who came back" value={spreading.repeatHosts} />
        <Row label="Brand-new hosts" value={spreading.brandNewHosts} />
        <Row label="Rematches" value={`${spreading.rematches} (${pct(spreading.rematchRate)} of finished games)`} />
      </details>

      <details className="card stat-section">
        <summary>How games go</summary>
        <Row label="Won by reaching the target" value={games.won} />
        <Row label="Ended by the host" value={games.endedByHost} />
        <Row label="Never finished" value={games.unfinished} />
        <Row label="Average length" value={play.avgMinutes === null ? '—' : `${play.avgMinutes} min`} />
        <Row label="Games of 7+ players" value={players.bigGames} />
        <Row label="Late joins · left mid-game" value={`${players.lateJoins} · ${players.leftMidGame}`} />
      </details>

      <details className="card stat-section">
        <summary>Gotchas &amp; disputes</summary>
        <Row label="Gotchas claimed · confirmed" value={`${play.claimed} · ${play.confirmed}`} />
        <Row label="Disputed" value={`${play.disputes} (${pct(play.disputeRate)})`} />
        <Row label="Overturned by the group" value={play.overturned} />
        <Row label="Players who reported being caught" value={play.caughtReports} />
        <Row label="Swaps · pauses" value={`${play.swaps} · ${play.pauses}`} />
        {play.challengeClaims > 0 && <Row label="Holiday claims · photos" value={`${play.challengeClaims} · ${play.proofPhotos}`} />}
      </details>

      <details className="card stat-section">
        <summary>Packs &amp; settings</summary>
        <Row label="Packs" value={breakdown(report.packs)} />
        <Row label="Game length" value={breakdown(report.lengths)} />
        <Row label="Used a settling-in time" value={report.withBriefing} />
      </details>

      <details className="card stat-section">
        <summary>Missions to fix &amp; missions that work</summary>
        <div className="overline" style={{ margin: '0.6rem 0 0.3rem' }}>Most swapped away — rewrite or retire</div>
        <Missions rows={report.missions.mostSwapped} />
        <div className="overline" style={{ margin: '0.8rem 0 0.3rem' }}>Most often pulled off — write more like these</div>
        <Missions rows={report.missions.mostCompleted} />
        <div className="overline" style={{ margin: '0.8rem 0 0.3rem' }}>Dealt 8+ times, never pulled off</div>
        <Missions rows={report.missions.neverCompleted} showRate={false} />
      </details>

      <p className="stat-hint" style={{ textAlign: 'center' }}>
        Anonymous counts since {report.since}. No names, photos or messages are kept.
      </p>
    </div>
  );
}
