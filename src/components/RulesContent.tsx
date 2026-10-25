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

        {/* Invented examples (EXAMPLE_ONLY_KEYWORDS in packs.ts) — never real challenges. */}
        <RuleCard title="Challenges look like this" tone="warning">
          <ExampleBox title="“Get a local to tell you where the best ice cream is”" hint="Chat to someone new" />
          <ExampleBox title="“Get someone to show you a magic trick”" hint="Strangers love showing off" />
          <ExampleBox title="“Get a photo of your whole group saluting a statue”" hint="Needs photo proof" />
          <div style={{ fontSize: '0.88rem', fontStyle: 'italic', marginTop: '0.25rem' }}>
            Made-up examples — your real challenges appear when the game starts.
          </div>
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

      {/* Invented examples (EXAMPLE_ONLY_KEYWORDS in packs.ts) — never real missions,
          so showing them can't spoil anyone's hand. */}
      <RuleCard title="How a gotcha plays out" tone="info">
        <ol className="rules-story">
          <li>Your secret mission: <em>“Get a player to pick up something you dropped and hand it back to you.”</em></li>
          <li>Chatting to Jordan, you “accidentally” knock your keys off the table by their feet.</li>
          <li>You keep talking. Jordan bends down, picks it up and hands it over: “Here you go.”</li>
          <li><strong>“GOTCHA, Jordan!”</strong> Tap the mission → Got it! → Jordan. You score.</li>
          <li>But if Jordan had clocked it first — “You dropped that on purpose!” — you'd be busted.</li>
        </ol>
      </RuleCard>

      <RuleCard title="Missions look like this" tone="warning">
        <ExampleBox title="“Get a player to do 10 push-ups”" hint="Bet them they can't — then look doubtful" />
        <ExampleBox title="“Get a player to start a conga line”" hint="Wait for the right song and look bored of sitting" />
        <ExampleBox title="“Get a player to challenge you to a thumb war”" hint="Brag that your thumbs are undefeated" />
        <div style={{ fontSize: '0.88rem', fontStyle: 'italic', marginTop: '0.25rem' }}>
          Made-up examples — your real missions are a surprise.
        </div>
      </RuleCard>
    </div>
  );
}
