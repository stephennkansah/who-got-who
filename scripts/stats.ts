// Prints the anonymous play statistics: `npm run stats` (last 30 days)
// or `npm run stats -- --days 7`. Needs an AWS login with access to the
// account (AWS_PROFILE or `aws configure`). Without one, use the private
// page at https://whogotwho.club/stats instead.
//
//   --days N        how far back to look (default 30)
//   --table NAME    which Stats table, if more than one exists (e.g. sandbox + live)
//   --region NAME   AWS region (default eu-west-2)
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { buildStatsReport, type MissionRow } from '../amplify/functions/game-api/statsReport';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const days = Number(arg('days') ?? 30);
const region = arg('region') ?? process.env.AWS_REGION ?? 'eu-west-2';
const client = new DynamoDBClient({ region });
const dynamo = DynamoDBDocumentClient.from(client);

async function findTable(): Promise<string> {
  const chosen = arg('table');
  if (chosen) return chosen;
  const names: string[] = [];
  let start: string | undefined;
  do {
    const page = await client.send(new ListTablesCommand({ ExclusiveStartTableName: start }));
    names.push(...(page.TableNames ?? []));
    start = page.LastEvaluatedTableName;
  } while (start);
  const stats = names.filter((name) => /Stats/.test(name) && /game-?state/i.test(name));
  if (stats.length === 1) return stats[0];
  if (!stats.length) throw new Error(`No Stats table in ${region} yet — it appears after the next deploy.`);
  throw new Error(`Several Stats tables found; pick one with --table:\n  ${stats.join('\n  ')}`);
}

async function scanAll(table: string): Promise<Array<Record<string, unknown>>> {
  const items: Array<Record<string, unknown>> = [];
  let start: Record<string, unknown> | undefined;
  do {
    const page = await dynamo.send(new ScanCommand({ TableName: table, ExclusiveStartKey: start }));
    items.push(...(page.Items ?? []));
    start = page.LastEvaluatedKey;
  } while (start);
  return items;
}

const pct = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`);
const list = (counts: Record<string, number>) =>
  Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => `${name} ${value}`).join(', ') || '—';
const missions = (rows: MissionRow[], showRate = true) =>
  rows.map((row) => `   ${showRate ? `${pct(row.rate).padStart(4)}  ` : ''}${row.id}  ${row.text.slice(0, 70)}`).join('\n') || '   —';

async function main() {
  const table = await findTable();
  const report = buildStatsReport(await scanAll(table), days);
  const { games, players, spreading, play } = report;

  console.log(`\nWho Got Who — last ${days} days (since ${report.since}) · table ${table}\n`);
  console.log(`Spreading  guests who became hosts ${spreading.guestsWhoBecameHosts} · repeat hosts ${spreading.repeatHosts} · brand-new hosts ${spreading.brandNewHosts} · rematches ${spreading.rematches} (${pct(spreading.rematchRate)} of finished games)`);
  console.log(`Games      created ${games.created} · started ${games.started} · won ${games.won} · ended by host ${games.endedByHost} · never finished ${games.unfinished}`);
  console.log(`Players    avg ${players.avgPerGame ?? '—'} per game · ${players.bigGames} games of 7+ · ${players.lateJoins} late joins · ${players.leftMidGame} left mid-game`);
  console.log(`Play       avg ${play.avgMinutes ?? '—'} min · gotchas claimed ${play.claimed}, confirmed ${play.confirmed} · disputes ${play.disputes} (${pct(play.disputeRate)}) · overturned ${play.overturned} · swaps ${play.swaps} · pauses ${play.pauses}`);
  console.log(`Setup      packs ${list(report.packs)} | lengths ${list(report.lengths)} | with settling-in time ${report.withBriefing}`);
  if (play.challengeClaims) console.log(`Holiday    challenge claims ${play.challengeClaims} · photo proofs ${play.proofPhotos}`);
  console.log('\nMissions (all time, dealt 5+ times)');
  console.log(' Most swapped away — rewrite or retire:');
  console.log(missions(report.missions.mostSwapped));
  console.log(' Most often pulled off — write more like these:');
  console.log(missions(report.missions.mostCompleted));
  console.log(' Dealt 8+ times, never pulled off — maybe too hard:');
  console.log(missions(report.missions.neverCompleted, false));
  console.log('');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(/credentials/i.test(message)
    ? 'No AWS login found. Set AWS_PROFILE or run `aws configure` — or use https://whogotwho.club/stats.'
    : message);
  process.exitCode = 1;
});
