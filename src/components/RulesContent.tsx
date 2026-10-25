import React from 'react';
import { Game } from '../types';
import { lobbySummary } from '../utils/gameSettings';

interface RuleCardProps {
  title: string;
  tone: 'danger' | 'info' | 'warning' | 'success';
  children: React.ReactNode;
}

const toneStyles: Record<RuleCardProps['tone'], { bg: string; border: string; ink: string }> = {
  danger: { bg: 'var(--danger-soft)', border: 'var(--danger)', ink: 'var(--danger-ink)' },
  info: { bg: 'var(--info-soft)', border: 'var(--secondary)', ink: 'var(--info-ink)' },
  warning: { bg: 'var(--warning-soft)', border: 'var(--warning)', ink: 'var(--warning-ink)' },
  success: { bg: 'var(--success-soft)', border: 'var(--success)', ink: 'var(--success-ink)' },
};

// Colour lives in the stripe and the heading; the reading text stays near-black on
// paper so it's easy to read in a dim room.
const RuleCard: React.FC<RuleCardProps> = ({ title, tone, children }) => {
  const t = toneStyles[tone];
  return (
    <div style={{
      padding: '1rem 1.1rem',
      background: 'var(--paper)',
      borderRadius: 'var(--radius-md)',
      borderLeft: `6px solid ${t.border}`,
      textAlign: 'left',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.3rem',
        letterSpacing: '0.06em',
        color: t.ink,
        marginBottom: '0.35rem',
      }}>
        {title}
      </div>
      <div style={{ fontSize: '1rem', color: 'var(--paper-ink)', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
};

const ExampleBox: React.FC<{ title: string; hint: string }> = ({ title, hint }) => (
  <div style={{
    background: 'rgba(35, 32, 20, 0.06)',
    padding: '0.65rem 0.8rem',
    borderRadius: '8px',
    marginBottom: '8px',
  }}>
    <strong>{title}</strong>
    <div style={{ fontStyle: 'italic', fontSize: '0.92em', marginTop: '3px', color: '#4c4636' }}>{hint}</div>
  </div>
);

/** How to play, with this game's real numbers. Shown in the lobby and mid-game. */
export default function RulesContent({ game }: { game: Game }) {
  const summary = lobbySummary(game);

  if (summary.isHoliday) {
    return (
      <div className="flex-column gap-2">
        <RuleCard title={`1 · Same ${summary.challenges} challenges for everyone`} tone="danger">
          No secrets this time — <strong>race the others</strong> to complete social
          challenges: chat to holiday-goers, snap photos, make friends.
        </RuleCard>

        <RuleCard title="2 · Gold for first, silver for speed" tone="info">
          <strong>First to finish a challenge:</strong> 3 gold points.{' '}
          <strong>Next 2 players:</strong> 1 silver point each.
          Some challenges need photo proof — everyone sees it in the trip album.
        </RuleCard>

        <RuleCard title={`3 · First to ${summary.target} points wins`} tone="success">
          Bigger groups get more challenges and a lower target.
          {summary.briefingMinutes > 0 && <> Challenges open {summary.briefingMinutes} minutes after the start.</>}
        </RuleCard>

        <RuleCard title="Example challenges" tone="warning">
          <ExampleBox title="“Get someone to take a group photo of your team”" hint="Requires photo proof" />
          <ExampleBox title="“Borrow sunscreen from another group”" hint="A simple social mission" />
          <ExampleBox title="“Make a new friend and learn their name”" hint="Holiday networking!" />
        </RuleCard>
      </div>
    );
  }

  return (
    <div className="flex-column gap-2">
      <RuleCard title="1 · Your secret missions" tone="info">
        You get <strong>{summary.missions} missions</strong> — things to get <strong>other players in this game</strong> to
        say or do. Nobody else can see yours, and no one else has the same ones. Don't fancy one?
        <strong> Swap</strong> it ({summary.swaps} per game).
        {summary.briefingMinutes > 0 && <> You get {summary.briefingMinutes} minutes to read up before gotchas open.</>}
      </RuleCard>

      <RuleCard title={'2 · Pull it off, then say "Gotcha!"'} tone="success">
        Make it happen <strong>without them realising</strong>. The moment they do it, say
        <strong> "Gotcha [name]!"</strong> out loud, then tap the mission → <strong>Got it!</strong> → pick them.
        They get {summary.responseMinutes} minutes to accept — or dispute it and the others vote.
      </RuleCard>

      <RuleCard title="3 · Catch them first" tone="danger">
        Think someone's working you? <strong>Call it out</strong> — "You're trying to get me to say something!"
        If you're right before they say Gotcha, they're <strong>busted</strong> and tap
        <strong> I Got Caught</strong>. It runs on honesty, so play fair.
      </RuleCard>

      <RuleCard title={`4 · First to ${summary.target} points wins`} tone="warning">
        <strong>1 point</strong> per gotcha, <strong>+0.5</strong> the first time you get each player — so spread
        the love. When it's over, everyone's missions are revealed.
      </RuleCard>

      <RuleCard title="How a gotcha plays out" tone="info">
        <ol className="rules-story">
          <li>Your mission: <em>“Get a player to say ‘literally’.”</em></li>
          <li>You tell Jordan a wild story. Jordan: “That's <strong>literally</strong> insane.”</li>
          <li>You: <strong>“Gotcha, Jordan!”</strong> Tap the mission, hit Got it!, pick Jordan.</li>
          <li>Jordan accepts on their phone — you score. If Jordan had called you out first, you'd be busted.</li>
        </ol>
      </RuleCard>

      <RuleCard title="Example missions" tone="warning">
        <ExampleBox title="“Get a player to correct you when you misquote a movie”" hint="Say: “Peter, I am your father” → wait for the correction" />
        <ExampleBox title="“Get a player to take a group selfie”" hint="Suggest a photo without being obvious" />
        <ExampleBox title="“Get a player to scratch your back for 10 seconds”" hint="Ask casually — “my back is killing me…”" />
      </RuleCard>
    </div>
  );
}
