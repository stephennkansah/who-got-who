import { buzz } from '../services/appPlatform';
import { playSound } from '../services/sounds';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Player, SettingsUpdate } from '../types';
import NotificationPrompt from './NotificationPrompt';
import { ConfirmationModal } from './common/ConfirmationModal';
import LoadingScreen from './common/LoadingScreen';
import { showToast } from './common/Toast';
import { getAllPackOptions } from '../data/packCatalog';
import { lobbySummary } from '../utils/gameSettings';
import InvitePanel from './lobby/InvitePanel';
import Roster from './lobby/Roster';
import GameSetup from './lobby/GameSetup';
import ProfileEditor from './lobby/ProfileEditor';
import PlayerActions from './lobby/PlayerActions';
import WarmUp from './lobby/WarmUp';
import RulesContent from './RulesContent';
import { useBackToClose } from '../hooks/useBackToClose';
import StampSplash from './common/StampSplash';
import { takeJustJoined } from '../utils/justJoined';

const RULES_SEEN_KEY = 'wgw-rules-seen';

/** Tells you who came, went, or took over while you were looking at the lobby. */
function useLobbyFeed(players: Player[], currentPlayerId?: string) {
  const previous = useRef<Player[] | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = players;
    if (!before || !currentPlayerId) return;
    const had = new Set(before.map((player) => player.id));
    const has = new Set(players.map((player) => player.id));
    const amHost = players.find((player) => player.id === currentPlayerId)?.isHost;
    players
      .filter((player) => !had.has(player.id) && player.id !== currentPlayerId)
      .forEach((player) => {
        showToast(`${player.name} joined`, 'success');
        if (amHost) {
          buzz(60);
          playSound('join');
        }
      });
    before
      .filter((player) => !has.has(player.id))
      .forEach((player) => showToast(`${player.name} left the lobby`, 'info'));
    const oldHost = before.find((player) => player.isHost)?.id;
    const newHost = players.find((player) => player.isHost);
    if (newHost && oldHost && newHost.id !== oldHost && has.has(oldHost)) {
      showToast(newHost.id === currentPlayerId ? "You're the host now" : `${newHost.name} is now the host`, 'info');
    }
  }, [players, currentPlayerId]);
}

export default function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const {
    state, startGame, leaveGame, kickPlayer, transferHost, setReady, updateProfile, updateSettings,
  } = useGame();
  const [showRules, setShowRules] = useState(
    () => localStorage.getItem(RULES_SEEN_KEY) !== 'true',
  );
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [kickTarget, setKickTarget] = useState<Player | null>(null);
  const [managing, setManaging] = useState<Player | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [welcome, setWelcome] = useState(false);

  const currentPlayer = state.currentPlayer;
  const currentGame = state.currentGame;
  const isHost = currentPlayer?.isHost || false;
  const players = currentGame?.players || [];
  const playerCount = players.length;
  const canStart = playerCount >= 2;
  const isHoliday = currentGame?.gameType === 'holiday-challenge';
  const hostName = players.find((p) => p.isHost)?.name || 'the host';
  const packName = getAllPackOptions().find((pack) => pack.id === currentGame?.settings?.selectedPack)?.name;
  const summary = currentGame ? lobbySummary(currentGame) : null;
  const notReady = players.filter((player) => !player.isHost && !player.lockedIn);

  useLobbyFeed(players, currentPlayer?.id);

  // Fresh from the home screen into someone's game: say so, once.
  const lobbyId = currentGame?.id;
  useEffect(() => {
    if (lobbyId && takeJustJoined(lobbyId)) setWelcome(true);
  }, [lobbyId]);

  useEffect(() => {
    if (!gameId || (!currentGame && !state.isLoading)) navigate('/', { replace: true });
  }, [gameId, currentGame, state.isLoading, navigate]);

  useEffect(() => {
    if (currentGame?.status === 'live') {
      navigate(`/game/${currentGame.id}`, { replace: true });
    }
  }, [currentGame?.status, currentGame?.id, navigate]);

  const attempt = async (action: () => Promise<void>) => {
    try {
      await action();
      return true;
    } catch {
      // Errors surface via the global toast bridge.
      return false;
    }
  };

  const handleKick = async () => {
    const player = kickTarget;
    setKickTarget(null);
    if (player && await attempt(() => kickPlayer(player.id))) showToast(`${player.name} was removed`, 'info');
  };

  const handleMakeHost = async (player: Player) => {
    setManaging(null);
    await attempt(() => transferHost(player.id));
  };

  const handleSaveProfile = async (name: string, avatar?: string, avatarType?: 'emoji' | 'photo') => {
    if (await attempt(() => updateProfile(name, avatar, avatarType))) {
      setEditingProfile(false);
      try {
        const saved = JSON.parse(localStorage.getItem('wgw-profile') || '{}');
        localStorage.setItem('wgw-profile', JSON.stringify({
          ...saved,
          name,
          ...(avatar ? { avatar, avatarType } : {}),
        }));
      } catch {
        // Remembering the profile is a convenience only.
      }
    }
  };

  const handleUpdateSettings = (settings: SettingsUpdate) => {
    void attempt(() => updateSettings(settings));
  };

  const handleStartGame = async () => {
    if (!isHost || !canStart || isStarting) return;
    setIsStarting(true);
    await attempt(startGame);
    setIsStarting(false);
  };

  const handleLeaveGame = async () => {
    setConfirmLeave(false);
    await attempt(leaveGame);
    navigate('/', { replace: true });
  };

  // Finishing the rules is the natural moment to say you're ready.
  const dismissRules = () => {
    localStorage.setItem(RULES_SEEN_KEY, 'true');
    setShowRules(false);
    if (currentPlayer && !currentPlayer.isHost && !currentPlayer.lockedIn) void attempt(() => setReady(true));
  };

  // Back (button or phone) leaves the rules for the lobby without saying you're ready.
  const closeRules = () => {
    localStorage.setItem(RULES_SEEN_KEY, 'true');
    setShowRules(false);
  };
  useBackToClose(showRules && !!currentGame, closeRules);

  if (!currentGame || !currentPlayer || !summary) {
    return <LoadingScreen message="finding your game…" showBack />;
  }

  const welcomeSplash = welcome && (
    <StampSplash
      title="You're In!"
      subtitle={`${hostName}'s game · ${playerCount} player${playerCount === 1 ? '' : 's'} here so far`}
      tone="success"
      mascot="lobby"
      sound="join"
      durationMs={1900}
      onDone={() => setWelcome(false)}
    />
  );

  // ---------- Rules (first visit, or on request) ----------
  if (showRules) {
    return (
      <div className="container">
        {welcomeSplash}
        <button className="back-link" onClick={closeRules}>
          ← Lobby
        </button>
        <header className="rules-head">
          <h1>{isHoliday ? 'You Got Who?' : 'How to Play'}</h1>
          <div className="app-subtitle">
            {isHoliday ? 'How to play · ' : ''}{playerCount} player{playerCount !== 1 ? 's' : ''} in the lobby
          </div>
        </header>

        <RulesContent
          game={currentGame}
          doneLabel={isHost || currentPlayer.lockedIn ? 'Got It — to the Lobby' : "Got It — I'm Ready"}
          onDone={dismissRules}
          lastExtra={<NotificationPrompt />}
        />
        <p className="app-subtitle" style={{ marginTop: '0.7rem' }}>
          You can reopen these anytime — in the lobby or mid-game.
        </p>
      </div>
    );
  }

  // Guests see this first: in a big group the roster is long, and a button below
  // it was easy to miss. Ready is how the host knows you've read the rules.
  const readyCard = (
    <div className={`card ready-card ${currentPlayer.lockedIn ? 'is-ready' : ''}`} style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '0.3rem' }}>
        {currentPlayer.lockedIn ? "You're ready" : 'Read the rules, then tap Ready'}
      </p>
      <p style={{ fontSize: '0.9rem', margin: '0 0 0.75rem' }}>
        {currentPlayer.lockedIn
          ? `${hostName} starts the game once everyone's ready. Your missions appear here.`
          : `It tells ${hostName} you know how to play. They start once everyone's ready.`}
      </p>
      <button
        className={`btn ${currentPlayer.lockedIn ? 'btn-secondary' : 'btn-success'}`}
        onClick={() => attempt(() => setReady(!currentPlayer.lockedIn))}
        disabled={state.isLoading}
      >
        {currentPlayer.lockedIn ? 'Not Ready Yet' : "I'm Ready"}
      </button>
      {!currentPlayer.lockedIn && (
        <button className="link-btn" onClick={() => setShowRules(true)} style={{ marginTop: '0.6rem' }}>
          Read the rules first
        </button>
      )}
    </div>
  );

  // ---------- Lobby ----------
  return (
    <div className="container">
      {!isHost && readyCard}

      {/* Ready and waiting: something to do until the host starts */}
      {!isHost && !isHoliday && currentPlayer.lockedIn && <WarmUp missions={summary.missions} />}

      <InvitePanel
        gameId={currentGame.id}
        gameType={currentGame.gameType}
        playerCount={playerCount}
        maxPlayers={currentGame.settings.maxPlayers}
      />

      {/* Start: straight under the code, so the host never has to scroll for it.
          Guests have their Ready card at the top instead. */}
      {isHost && (
        <div className="card" style={{ textAlign: 'center' }}>
          {canStart ? (
            <>
              <p style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '0.75rem' }}>
                {notReady.length === 0
                  ? "Everyone's ready. Deal the missions."
                  : `${playerCount - 1 - notReady.length} of ${playerCount - 1} ready · still reading: ${
                    notReady.slice(0, 3).map((player) => player.name).join(', ')
                  }${notReady.length > 3 ? ` and ${notReady.length - 3} more` : ''}`}
              </p>
              <button
                className={`btn btn-success ${notReady.length === 0 ? 'is-go' : ''}`}
                onClick={handleStartGame}
                disabled={isStarting}
              >
                {isStarting ? 'Starting…' : notReady.length === 0 ? 'Start the Game' : 'Start Anyway'}
              </button>
              <p style={{ fontSize: '0.86rem', margin: '0.6rem 0 0' }}>
                Latecomers can still join with the code after you start.
              </p>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--amber)', fontWeight: 700, marginBottom: '0.25rem' }}>
                You need at least 2 players to start
              </p>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Share the code, link or QR above and the game can begin.
              </p>
            </>
          )}
        </div>
      )}

      <Roster
        players={players}
        currentPlayerId={currentPlayer.id}
        isHost={isHost}
        maxPlayers={currentGame.settings.maxPlayers}
        onEditSelf={() => setEditingProfile(true)}
        onManage={setManaging}
      />

      <GameSetup
        game={currentGame}
        packName={packName}
        isHost={isHost}
        busy={state.isLoading}
        onChangePack={() => navigate(`/select-pack/${currentGame.id}`)}
        onUpdate={handleUpdateSettings}
      />

      {/* What's coming: a warm-up for anyone not already shown one, or the sealed missions */}
      {!isHoliday && !(!isHost && currentPlayer.lockedIn) ? (
        <WarmUp missions={summary.missions} />
      ) : isHoliday ? (
        <div className="paper-card" style={{ textAlign: 'center', padding: '1.25rem', marginBottom: '0.9rem' }}>
          <div className="type" style={{
            fontSize: '0.76rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--paper-dim)',
            marginBottom: '0.75rem',
          }}>
            Your challenges · sealed until the start
          </div>
          <div className="flex-column gap-1" style={{ alignItems: 'center', marginBottom: '0.75rem' }} aria-hidden="true">
            <span className="redacted" style={{ width: '82%', height: '0.95rem' }}>&nbsp;</span>
            <span className="redacted" style={{ width: '64%', height: '0.95rem' }}>&nbsp;</span>
            <span className="redacted" style={{ width: '74%', height: '0.95rem' }}>&nbsp;</span>
          </div>
          <p className="type" style={{ fontSize: '0.88rem', margin: 0, color: 'var(--paper-dim)' }}>
            everyone races the same {summary.challenges} challenges once the game starts.
          </p>
        </div>
      ) : null}

      <NotificationPrompt />

      <div className="flex gap-2" style={{ justifyContent: 'center', marginTop: '0.75rem' }}>
        <button className="btn btn-ghost btn-small" onClick={() => setShowRules(true)}>
          Rules
        </button>
        <button className="btn btn-ghost btn-small" onClick={() => setConfirmLeave(true)}>
          Leave game
        </button>
      </div>

      <ConfirmationModal
        isOpen={confirmLeave}
        title="Leave the game?"
        message={isHost && playerCount > 1
          ? `You'll return to the home screen and ${players.find((p) => !p.isHost)?.name ?? 'someone else'} becomes host.\nTip: use ⋯ on a player to pick the next host yourself.`
          : 'You\'ll return to the home screen.\nEveryone else stays in the lobby.'}
        confirmLabel="Leave"
        isDangerous
        onConfirm={handleLeaveGame}
        onCancel={() => setConfirmLeave(false)}
      />

      <ConfirmationModal
        isOpen={!!kickTarget}
        title={`Remove ${kickTarget?.name ?? 'player'}?`}
        message="They'll drop out of this lobby. They can rejoin with the code if you change your mind."
        confirmLabel="Remove"
        isDangerous
        onConfirm={handleKick}
        onCancel={() => setKickTarget(null)}
      />

      <PlayerActions
        player={managing}
        onClose={() => setManaging(null)}
        onMakeHost={handleMakeHost}
        onRemove={(player) => {
          setManaging(null);
          setKickTarget(player);
        }}
      />

      {welcomeSplash}

      <ProfileEditor
        player={editingProfile ? currentPlayer : null}
        busy={state.isLoading}
        onClose={() => setEditingProfile(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
