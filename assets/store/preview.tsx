// Local-only store screenshot fixtures. Never connect to or mutate a live game.
import React from 'react';
import { createRoot } from 'react-dom/client';
import TaskListView from '../../src/components/TaskListView';
import { GameHeader } from '../../src/components/game/GameHeader';
import { LeaderboardWidget } from '../../src/components/game/LeaderboardWidget';
import InvitePanel from '../../src/components/lobby/InvitePanel';
import Roster from '../../src/components/lobby/Roster';
import GameSetup from '../../src/components/lobby/GameSetup';
import '../../src/index.css';
import type { Player, TaskInstance, Game } from '../../src/types';

const noop = () => {};
const tasks: TaskInstance[] = [
  'Get a player to pick up something you dropped and hand it back to you.',
  'Get a player to start a conga line.',
  'Get a player to challenge you to a thumb war.',
  'Get a player to make an animal noise.',
  'Get a player to do an impression of someone.',
  'Get a player to put on sunglasses indoors.',
  'Get a player to take a photo of you.',
].map((text, i) => ({ id: `mission-${i}`, gameId: 'DEMO42', playerId: 'alex', text,
  status: 'pending', tips: i === 0 ? 'Let your keys slip off the table while you keep chatting.' : 'Pick your moment and keep it casual.' }));
const players = ['Alex', 'Jordan', 'Sam', 'Taylor'].map((name, i) => ({
  id: name.toLowerCase(), name, gameId: 'DEMO42', swapsLeft: 2, score: [1.5, 3, 1, 0][i],
  lockedIn: true, isHost: i === 1, token: '', tasks: i === 0 ? tasks : [],
  stats: { gothcas: 0, failed: 0, disputesLost: 0, uniqueTargets: [], firstTimeTargets: 0 },
  avatar: ['🦊', '🐯', '🐼', '🐸'][i], avatarType: 'emoji',
})) as Player[];
const game = {id:'DEMO42', players, gameType:'traditional', settings:{swapsAllowed:2,disputeTimeoutSeconds:300,targetScore:5,briefingMinutes:5},status:'draft'} as Game;
const page = new URLSearchParams(location.search).get('screen');
createRoot(document.getElementById('root')!).render(
  <div className="container">
    {page === 'lobby' ? <>
      <InvitePanel gameId="DEMO42" playerCount={4} maxPlayers={18}/>
      <Roster players={players} currentPlayerId="alex" isHost={false} maxPlayers={18} onEditSelf={noop} onManage={noop}/>
      <GameSetup game={game} packName="Core Pack" isHost={false} busy={false} onChangePack={noop} onUpdate={noop}/>
      <p style={{textAlign:'center'}}>Ready — waiting for Jordan to start</p>
    </> : <>
      <GameHeader currentPlayer={players[0]} playerCount={4} targetScore={5} onOpenHostMenu={noop} onLeaveGame={noop} onShowLeaderboard={noop}/>
      <LeaderboardWidget players={players} currentPlayerId="alex" targetScore={5} onShowLeaderboard={noop}/>
      <TaskListView tasks={tasks} players={players} currentPlayerId="alex" onTaskResult={noop} onSwapTask={noop} swapsLeft={2} swapsTotal={2} activeDisputes={[]} filing={null}/>
    </>}
  </div>
);
// Drive the same public controls as a player for the example screenshot.
if (page === 'mission') {
  setTimeout(() => document.querySelector<HTMLButtonElement>('[aria-label="Mission 01 / 07, hidden. Tap to reveal."]')?.click(), 100);
}
