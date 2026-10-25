import { gamePacks, getAllHolidayChallenges } from './packs';

/** Summary of the anonymous counters in the Stats table, for the /stats page and `npm run stats`. */

type Counts = Record<string, number>;

export type MissionRow = { id: string; text: string; dealt: number; rate: number };

export type StatsReport = {
  days: number;
  since: string;
  games: { created: number; started: number; won: number; endedByHost: number; unfinished: number };
  players: { avgPerGame: number | null; bigGames: number; lateJoins: number; leftMidGame: number };
  spreading: {
    rematches: number;
    rematchRate: number | null;
    guestsWhoBecameHosts: number;
    repeatHosts: number;
    brandNewHosts: number;
  };
  play: {
    avgMinutes: number | null;
    claimed: number;
    confirmed: number;
    disputes: number;
    disputeRate: number | null;
    overturned: number;
    caughtReports: number;
    swaps: number;
    pauses: number;
    challengeClaims: number;
    proofPhotos: number;
  };
  packs: Counts;
  lengths: Counts;
  withBriefing: number;
  daily: Array<{ date: string; started: number }>;
  missions: { mostSwapped: MissionRow[]; mostCompleted: MissionRow[]; neverCompleted: MissionRow[] };
};

const missionTexts = (() => {
  const texts = new Map<string, string>();
  for (const pack of Object.values(gamePacks)) pack.tasks.forEach((task) => texts.set(task.id, task.text));
  getAllHolidayChallenges().forEach((challenge) => texts.set(challenge.id, challenge.text));
  return texts;
})();

const ratio = (part: number, whole: number) => (whole ? part / whole : null);

export function buildStatsReport(items: Array<Record<string, unknown>>, days: number, now = new Date()): StatsReport {
  const since = new Date(now.getTime() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const total: Counts = {};
  const perDay = new Map<string, number>();

  for (const item of items) {
    const key = String(item.key);
    if (!key.startsWith('day#') || key.slice(4) < since) continue;
    perDay.set(key.slice(4), Number(item.gamesStarted ?? 0));
    for (const [field, value] of Object.entries(item)) {
      if (typeof value === 'number') total[field] = (total[field] ?? 0) + value;
    }
  }
  const get = (field: string) => total[field] ?? 0;
  const prefixed = (prefix: string): Counts => Object.fromEntries(
    Object.entries(total)
      .filter(([field]) => field.startsWith(prefix))
      .map(([field, value]) => [field.slice(prefix.length), value]),
  );

  const started = get('gamesStarted');
  const finished = get('gamesWon') + get('gamesEndedByHost');
  const claimed = get('gotchasClaimed');

  const daily: StatsReport['daily'] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getTime() - offset * 86400000).toISOString().slice(0, 10);
    daily.push({ date, started: perDay.get(date) ?? 0 });
  }

  // Mission counters are all-time; only judge missions seen often enough to mean something.
  const missions = items
    .filter((item) => String(item.key).startsWith('mission#'))
    .map((item) => {
      const id = String(item.key).slice('mission#'.length);
      const n = (field: string) => Number(item[field] ?? 0);
      return { id, dealt: n('dealt'), swapped: n('swappedAway'), completed: n('completed') };
    })
    .filter((mission) => mission.dealt >= 5);
  const row = (mission: { id: string; dealt: number }, rate: number): MissionRow => ({
    id: mission.id,
    text: missionTexts.get(mission.id) ?? '(retired mission)',
    dealt: mission.dealt,
    rate,
  });
  const ranked = (score: (m: (typeof missions)[number]) => number) => missions
    .map((mission) => ({ mission, rate: score(mission) }))
    .filter(({ rate }) => rate > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5)
    .map(({ mission, rate }) => row(mission, rate));

  return {
    days,
    since,
    games: {
      created: get('gamesCreated'),
      started,
      won: get('gamesWon'),
      endedByHost: get('gamesEndedByHost'),
      unfinished: Math.max(0, started - finished),
    },
    players: {
      avgPerGame: started ? Math.round((get('playersAtStart') / started) * 10) / 10 : null,
      bigGames: get('bigGamesStarted'),
      lateJoins: get('lateJoins'),
      leftMidGame: get('leftMidGame'),
    },
    spreading: {
      rematches: get('rematches'),
      rematchRate: ratio(get('rematches'), finished),
      guestsWhoBecameHosts: get('guestsWhoBecameHosts'),
      repeatHosts: get('repeatHosts'),
      brandNewHosts: get('brandNewHosts'),
    },
    play: {
      avgMinutes: finished ? Math.round(get('minutesPlayed') / finished) : null,
      claimed,
      confirmed: get('gotchasConfirmed'),
      disputes: get('disputes'),
      disputeRate: ratio(get('disputes'), claimed),
      overturned: get('gotchasOverturned'),
      caughtReports: get('caughtReports'),
      swaps: get('swaps'),
      pauses: get('pauses'),
      challengeClaims: get('challengeClaims'),
      proofPhotos: get('proofPhotos'),
    },
    packs: prefixed('pack_'),
    lengths: prefixed('length_'),
    withBriefing: get('startedWithBriefing'),
    daily,
    missions: {
      mostSwapped: ranked((m) => m.swapped / m.dealt),
      mostCompleted: ranked((m) => m.completed / m.dealt),
      neverCompleted: missions
        .filter((m) => m.dealt >= 8 && m.completed === 0)
        .slice(0, 8)
        .map((m) => row(m, 0)),
    },
  };
}
