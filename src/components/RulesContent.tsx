import React, { useRef, useState } from 'react';
import { Game } from '../types';
import { lobbySummary } from '../utils/gameSettings';
import HowToPlayVideo from './HowToPlayVideo';
import './RulesContent.css';

type Tone = 'danger' | 'info' | 'warning' | 'success';

interface RuleCard {
  title: string;
  tone: Tone;
  body: React.ReactNode;
  /** Optional detail behind a tap, so the card itself stays short. */
  more?: { label: string; content: React.ReactNode };
}

const ExampleBox: React.FC<{ title: string; hint: string }> = ({ title, hint }) => (
  <div className="rule-example">
    <strong>{title}</strong>
    <div className="rule-example-hint">{hint}</div>
  </div>
);

function holidayCards(summary: ReturnType<typeof lobbySummary>): RuleCard[] {
  return [
    {
      title: `Same ${summary.challenges} challenges for everyone`,
      tone: 'danger',
      body: (
        <>
          No secrets this time — <strong>race the others</strong> to complete social
          challenges: chat to holiday-goers, snap photos, make friends.
        </>
      ),
      // Invented examples (EXAMPLE_ONLY_KEYWORDS in packs.ts) — never real challenges.
      more: {
        label: 'What do challenges look like?',
        content: (
          <>
            <ExampleBox title="“Get a local to tell you where the best ice cream is”" hint="Chat to someone new" />
            <ExampleBox title="“Get someone to show you a magic trick”" hint="Strangers love showing off" />
            <ExampleBox title="“Get a photo of your whole group saluting a statue”" hint="Needs photo proof" />
            <div className="rule-example-note">Made-up examples — your real challenges appear when the game starts.</div>
          </>
        ),
      },
    },
    {
      title: 'Gold for first, silver for speed',
      tone: 'info',
      body: (
        <>
          <strong>First to finish a challenge:</strong> 3 gold points.{' '}
          <strong>Next 2 players:</strong> 1 silver point each.
          Some challenges need photo proof — everyone sees it in the trip album.
        </>
      ),
    },
    {
      title: `First to ${summary.target} points wins`,
      tone: 'success',
      body: (
        <>
          Bigger groups get more challenges and a lower target.
          {summary.briefingMinutes > 0 && <> Challenges open {summary.briefingMinutes} minutes after the start.</>}
        </>
      ),
    },
  ];
}

function missionCards(summary: ReturnType<typeof lobbySummary>): RuleCard[] {
  return [
    {
      title: 'Your secret missions',
      tone: 'info',
      body: (
        <>
          You get <strong>{summary.missions} missions</strong> — things to get <strong>other players</strong> to
          say or do. Only you can see yours. Don't fancy one? <strong>Swap</strong> it ({summary.swaps} per game).
          {summary.briefingMinutes > 0 && <> You get {summary.briefingMinutes} minutes to read up before gotchas open.</>}
        </>
      ),
      // Invented examples (EXAMPLE_ONLY_KEYWORDS in packs.ts) — never real missions,
      // so showing them can't spoil anyone's hand.
      more: {
        label: 'What do missions look like?',
        content: (
          <>
            <ExampleBox title="“Get a player to do 10 push-ups”" hint="Bet them they can't — then look doubtful" />
            <ExampleBox title="“Get a player to start a conga line”" hint="Wait for the right song and look bored of sitting" />
            <ExampleBox title="“Get a player to challenge you to a thumb war”" hint="Brag that your thumbs are undefeated" />
            <div className="rule-example-note">Made-up examples — your real missions are a surprise.</div>
          </>
        ),
      },
    },
    {
      title: 'Pull it off, then say "Gotcha!"',
      tone: 'success',
      body: (
        <>
          Make it happen <strong>without them realising</strong>. The moment they do it, say
          <strong> "Gotcha [name]!"</strong> out loud, then tap the mission → <strong>Got it!</strong> → pick them.
          They get {summary.responseMinutes} minutes to accept — or dispute it and the others vote.
        </>
      ),
      more: {
        label: 'See how one plays out',
        content: (
          <ol className="rules-story">
            <li>Your secret mission: <em>“Get a player to pick up something you dropped and hand it back to you.”</em></li>
            <li>Chatting to Jordan, you “accidentally” knock your keys off the table by their feet.</li>
            <li>Jordan bends down, picks them up and hands them over: “Here you go.”</li>
            <li><strong>“GOTCHA, Jordan!”</strong> Tap the mission → Got it! → Jordan. You score.</li>
            <li>But if Jordan had clocked it first — “You dropped that on purpose!” — Jordan taps Bust Them, and that mission is gone.</li>
          </ol>
        ),
      },
    },
    {
      title: 'Catch them first',
      tone: 'danger',
      body: (
        <>
          Think someone's working you? <strong>Call it out.</strong> If you're right before they say Gotcha,
          tap <strong>Bust Them</strong> and pick them. Their mission is <strong>gone for good</strong>.
          <br />
          <strong>Busted yourself?</strong> Pick the mission when asked, or tap it → <strong>I Got Caught</strong>.
          You keep the rest. It runs on honesty, so play fair.
        </>
      ),
    },
    {
      title: summary.places > 1 ? `Race to ${summary.target} points` : `First to ${summary.target} points wins`,
      tone: 'warning',
      body: (
        <>
          <strong>1 point</strong> per gotcha, <strong>+0.5</strong> the first time you get each player — so spread
          the love.
          {summary.places > 1 && (
            <>
              {' '}<strong>First to {summary.target} wins</strong>, but the game keeps going
              until <strong>{summary.places} players</strong> have got there
              {summary.places === 2 ? ' — 1st and 2nd' : ' — 1st, 2nd and 3rd'}. Finished? Stay in to vote.
            </>
          )}
          {' '}When it's over, everyone's missions are revealed.
        </>
      ),
    },
  ];
}

interface RulesContentProps {
  game: Game;
  /** The button on the last card. */
  doneLabel: string;
  onDone: () => void;
  /** Shown under the last card only (e.g. the notifications prompt). */
  lastExtra?: React.ReactNode;
}

/**
 * How to play, with this game's real numbers, one short card at a time.
 * Swipe or tap Next. Shown in the lobby and mid-game.
 */
export default function RulesContent({ game, doneLabel, onDone, lastExtra }: RulesContentProps) {
  const summary = lobbySummary(game);
  const cards = summary.isHoliday ? holidayCards(summary) : missionCards(summary);
  const [step, setStep] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const index = Math.min(step, cards.length - 1);
  const card = cards[index];
  const isLast = index === cards.length - 1;

  const go = (to: number) => {
    setStep(Math.max(0, Math.min(cards.length - 1, to)));
    setShowMore(false);
  };

  return (
    <div className="rules-cards">
      <div className="rules-dots">
        {cards.map((item, i) => (
          <button
            key={item.title}
            className={`rules-dot ${i === index ? 'is-current' : ''}`}
            onClick={() => go(i)}
            aria-label={`Rule ${i + 1} of ${cards.length}: ${item.title}`}
            aria-current={i === index ? 'step' : undefined}
          />
        ))}
      </div>

      <div
        key={index}
        className={`rule-card tone-${card.tone}`}
        onTouchStart={(event) => {
          touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = event.changedTouches[0].clientX - start.x;
          const dy = event.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          go(index + (dx < 0 ? 1 : -1));
        }}
      >
        <div className="rule-step">{index + 1} of {cards.length}</div>
        <div className="rule-title">{card.title}</div>
        <div className="rule-body">{card.body}</div>
        {card.more && (
          <>
            <button className="rule-more" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore}>
              {card.more.label} <span aria-hidden="true">{showMore ? '▴' : '▾'}</span>
            </button>
            {showMore && <div className="rule-more-body">{card.more.content}</div>}
          </>
        )}
      </div>

      <div className="rules-nav">
        {index > 0 && (
          <button className="btn btn-secondary rules-back" onClick={() => go(index - 1)} aria-label="Previous rule">
            ←
          </button>
        )}
        <button className="btn btn-primary" onClick={() => (isLast ? onDone() : go(index + 1))}>
          {isLast ? doneLabel : 'Next'}
        </button>
      </div>

      {/* Under the buttons, so Next stays in the same place on every card */}
      {index === 0 && !summary.isHoliday && <HowToPlayVideo style={{ margin: 0 }} />}
      {isLast && lastExtra}
    </div>
  );
}
