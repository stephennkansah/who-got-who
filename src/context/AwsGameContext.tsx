import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import imageCompression from 'browser-image-compression';
import { Game, GameContextType, GameState, Player, SettingsUpdate } from '../types';
import {
  configureAws,
  getAwsGameClient,
  getIdentityId,
  uploadPrivateImage,
} from '../services/aws';
import { serverNow, syncServerClock } from '../utils/serverClock';
import { currentPushSubscription, PUSH_PERMISSION_EVENT } from '../services/pushService';

type GameViewPayload = {
  game: Game;
  currentPlayer: Player;
  activeDisputes?: GameState['activeDisputes'];
  serverTime?: string;
  /** The server's public push key, for subscribing this phone. */
  pushKey?: string;
};

type AwsGameAction =
  | { type: 'LOADING'; value: boolean }
  | { type: 'ERROR'; value: string | null }
  | { type: 'CONNECTED'; value: boolean }
  | { type: 'LINK'; value: GameState['connection'] }
  | { type: 'VIEW'; value: GameViewPayload }
  | { type: 'RESET' };

const initialState: GameState = {
  currentGame: null,
  currentPlayer: null,
  isConnected: false,
  connection: 'live',
  isLoading: true,
  error: null,
  activeDisputes: [],
  leaderboard: [],
};

/** The server no longer recognises this device as part of the game. */
const GONE_PATTERN = /not a member of this game|not found or expired/i;

function reducer(state: GameState, action: AwsGameAction): GameState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: action.value };
    case 'ERROR':
      return { ...state, error: action.value };
    case 'CONNECTED':
      return { ...state, isConnected: action.value };
    case 'LINK':
      return state.connection === action.value ? state : { ...state, connection: action.value };
    case 'VIEW': {
      const players = action.value.game.players || [];
      const usesChallengeScore = action.value.game.gameType === 'holiday-challenge';
      return {
        ...state,
        currentGame: action.value.game,
        currentPlayer: action.value.currentPlayer,
        activeDisputes: action.value.activeDisputes || [],
        leaderboard: [...players].sort((left, right) =>
          usesChallengeScore
            ? (right.challengeScore || 0) - (left.challengeScore || 0)
            : right.score - left.score,
        ),
        error: null,
      };
    }
    case 'RESET':
      return { ...initialState, isLoading: false, isConnected: state.isConnected, error: state.error };
    default:
      return state;
  }
}

function requestId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const raw = error.message || '';
    // Network/parse noise is meaningless to players — translate it.
    if (/unexpected token|not valid json|failed to fetch|network ?error|load failed/i.test(raw)) {
      return "Can't reach the game service — check your connection and try again.";
    }
    // Setup problems are for developers; players just need to know to retry.
    if (process.env.NODE_ENV === 'production' && /configuration could not be loaded|backend is not deployed/i.test(raw)) {
      return "Can't reach the game service right now — try again in a moment.";
    }
    if (/access ?denied|not authorized to perform: s3/i.test(raw)) {
      return "Your photo couldn't be uploaded — pick an emoji avatar or try again.";
    }
    return raw;
  }
  return 'The game service is temporarily unavailable';
}

function dataError(errors: unknown): Error {
  const list = Array.isArray(errors) ? errors : [];
  const first = list[0] as { message?: string } | undefined;
  return new Error(first?.message || 'The AWS game service rejected the request');
}

function reviveView(value: unknown): GameViewPayload {
  const payload = typeof value === 'string' ? JSON.parse(value) : value;
  if (!payload || typeof payload !== 'object') throw new Error('Invalid game response');
  const view = payload as GameViewPayload;
  syncServerClock(view.serverTime);
  view.game.createdAt = new Date(view.game.createdAt);
  view.game.challengeCompletions = (view.game.challengeCompletions || []).map((completion) => ({
    ...completion,
    completedAt: new Date(completion.completedAt),
  }));
  view.game.players = (view.game.players || []).map((player) => ({
    ...player,
    tasks: (player.tasks || []).map((task) => ({
      ...task,
      gotAt: task.gotAt ? new Date(task.gotAt) : undefined,
    })),
  }));
  view.currentPlayer =
    view.game.players.find((player) => player.id === view.currentPlayer.id) || view.currentPlayer;
  view.activeDisputes = (view.activeDisputes || []).map((dispute) => ({
    ...dispute,
    openedAt: new Date(dispute.openedAt),
    closesAt: new Date(dispute.closesAt),
    votes: (dispute.votes || []).map((vote) => ({
      ...vote,
      votedAt: new Date(vote.votedAt),
    })),
  }));
  return view;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('Avatar image could not be prepared');
  return response.blob();
}

export const AwsGameContext = createContext<GameContextType | null>(null);

export function AwsGameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  const revisionRef = useRef(0);
  const [pushKey, setPushKey] = useState<string>();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const refreshGame = useCallback(async (gameId: string) => {
    const client = await getAwsGameClient();
    const response = await client.queries.getGameView(
      { gameId },
      { authMode: 'identityPool' },
    );
    if (response.errors?.length || !response.data) throw dataError(response.errors);
    const view = reviveView(response.data.payload);
    revisionRef.current = response.data.revision || revisionRef.current;
    if (view.pushKey) setPushKey(view.pushKey);
    dispatch({ type: 'VIEW', value: view });
    return view;
  }, []);

  const sendAction = useCallback(
    async (
      action: string,
      payload: Record<string, unknown> = {},
      explicitGameId?: string,
      refresh = true,
    ) => {
      const client = await getAwsGameClient();
      const gameId = explicitGameId || stateRef.current.currentGame?.id;
      const response = await client.mutations.gameAction(
        { action, gameId, requestId: requestId(), payload: JSON.stringify(payload) },
        { authMode: 'identityPool' },
      );
      if (response.errors?.length || !response.data) throw dataError(response.errors);
      revisionRef.current = response.data.revision || revisionRef.current;
      if (refresh && response.data.gameId) await refreshGame(response.data.gameId);
      return response.data as { gameId: string; revision: number };
    },
    [refreshGame],
  );

  const run = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    dispatch({ type: 'LOADING', value: true });
    dispatch({ type: 'ERROR', value: null });
    try {
      return await operation();
    } catch (error) {
      const message = errorMessage(error);
      dispatch({ type: 'ERROR', value: message });
      throw new Error(message);
    } finally {
      dispatch({ type: 'LOADING', value: false });
    }
  }, []);

  const prepareAvatar = useCallback(
    async (avatar?: string, avatarType?: 'emoji' | 'photo') => {
      // A photo already in storage (e.g. carried into a rematch) is reused as-is.
      if (avatarType === 'photo' && avatar?.startsWith('avatars/')) {
        return { avatar, avatarType: 'photo' as const };
      }
      if (avatarType !== 'photo' || !avatar?.startsWith('data:image/')) {
        return { avatar: avatar || '🎮', avatarType: 'emoji' as const };
      }
      const identityId = await getIdentityId();
      const blob = await dataUrlToBlob(avatar);
      if (!blob.type.startsWith('image/') || blob.size > 200 * 1024) {
        throw new Error('Avatar must be an image smaller than 200 KB');
      }
      const path = `avatars/${identityId}/${requestId()}.jpg`;
      await uploadPrivateImage(path, blob, 'image/jpeg');
      return { avatar: path, avatarType: 'photo' as const };
    },
    [],
  );

  const createGame = useCallback(
    (hostName: string, avatar?: string, avatarType?: 'emoji' | 'photo') =>
      run(async () => {
        await configureAws();
        const preparedAvatar = await prepareAvatar(avatar, avatarType);
        const response = await sendAction(
          'CREATE',
          { name: hostName, ...preparedAvatar },
          undefined,
          false,
        );
        localStorage.setItem('currentGameId', response.gameId);
        // Start on the Core pack so the host lands straight in the lobby; it can be changed there.
        await sendAction('SELECT_PACK', { packId: 'core' }, response.gameId, false).catch(() => undefined);
        await refreshGame(response.gameId);
      }),
    [prepareAvatar, refreshGame, run, sendAction],
  );

  const joinGame = useCallback(
    (gameId: string, playerName: string, avatar?: string, avatarType?: 'emoji' | 'photo') =>
      run(async () => {
        const id = gameId.trim().toUpperCase();
        const preparedAvatar = await prepareAvatar(avatar, avatarType);
        await sendAction('JOIN', { name: playerName, ...preparedAvatar }, id);
        localStorage.setItem('currentGameId', id);
      }),
    [prepareAvatar, run, sendAction],
  );

  const selectPack = useCallback(
    (packId: 'core' | 'remote' | 'holiday-challenge') =>
      run(() => sendAction('SELECT_PACK', { packId }).then(() => undefined)),
    [run, sendAction],
  );
  const startGame = useCallback(
    () => run(() => sendAction('START').then(() => undefined)),
    [run, sendAction],
  );
  const endGame = useCallback(
    () => run(() => sendAction('END').then(() => undefined)),
    [run, sendAction],
  );
  const leaveGame = useCallback(
    () =>
      run(async () => {
        const current = stateRef.current.currentGame;
        if (current && current.status !== 'ended') {
          await sendAction('LEAVE', {}, current.id, false);
        }
        localStorage.removeItem('currentGameId');
        dispatch({ type: 'RESET' });
      }),
    [run, sendAction],
  );
  const kickPlayer = useCallback(
    (playerId: string) => run(() => sendAction('KICK', { playerId }).then(() => undefined)),
    [run, sendAction],
  );
  const rematch = useCallback(
    () =>
      run(async () => {
        const finished = stateRef.current.currentGame;
        const me = stateRef.current.currentPlayer;
        if (!finished || !me) throw new Error('No finished game to rematch');
        let rematchId = finished.rematchGameId;
        if (!rematchId) {
          await sendAction('REMATCH', {}, finished.id, false);
          rematchId = (await refreshGame(finished.id)).game.rematchGameId;
        }
        if (!rematchId) throw new Error('The rematch could not be opened — try again');
        // Joining is a no-op for whoever opened the rematch (they are already its host).
        await sendAction(
          'JOIN',
          {
            name: me.name,
            avatar: me.avatarType === 'photo' ? me.avatarKey : me.avatar,
            avatarType: me.avatarType === 'photo' && me.avatarKey ? 'photo' : 'emoji',
          },
          rematchId,
          false,
        );
        localStorage.setItem('currentGameId', rematchId);
        await refreshGame(rematchId);
      }),
    [refreshGame, run, sendAction],
  );
  const updateSettings = useCallback(
    (settings: SettingsUpdate) =>
      run(() => sendAction('UPDATE_SETTINGS', { ...settings }).then(() => undefined)),
    [run, sendAction],
  );
  const setReady = useCallback(
    (ready: boolean) => run(() => sendAction('SET_READY', { ready }).then(() => undefined)),
    [run, sendAction],
  );
  const transferHost = useCallback(
    (playerId: string) => run(() => sendAction('TRANSFER_HOST', { playerId }).then(() => undefined)),
    [run, sendAction],
  );
  const openClaims = useCallback(
    () => run(() => sendAction('OPEN_CLAIMS').then(() => undefined)),
    [run, sendAction],
  );
  const pauseGame = useCallback(
    () => run(() => sendAction('PAUSE').then(() => undefined)),
    [run, sendAction],
  );
  const resumeGame = useCallback(
    () => run(() => sendAction('RESUME').then(() => undefined)),
    [run, sendAction],
  );
  const updateProfile = useCallback(
    (name: string, avatar?: string, avatarType?: 'emoji' | 'photo') =>
      run(async () => {
        const profile = avatar === undefined ? {} : await prepareAvatar(avatar, avatarType);
        await sendAction('UPDATE_NAME', { name, ...profile });
      }),
    [prepareAvatar, run, sendAction],
  );
  const swapTask = useCallback(
    (taskId: string) => run(() => sendAction('SWAP_TASK', { taskId }).then(() => undefined)),
    [run, sendAction],
  );
  const claimGotcha = useCallback(
    (taskId: string, targetId: string) => {
      const caught = targetId.startsWith('caught:');
      return run(() =>
        sendAction('CLAIM_GOTCHA', {
          taskId,
          targetId: caught ? targetId.slice('caught:'.length) : targetId,
          outcome: caught ? 'caught' : 'success',
        }).then(() => undefined),
      );
    },
    [run, sendAction],
  );
  const acceptGotcha = useCallback(
    (taskId: string) => run(() => sendAction('ACCEPT_GOTCHA', { taskId }).then(() => undefined)),
    [run, sendAction],
  );
  const disputeGotcha = useCallback(
    (taskId: string, reason?: string) =>
      run(() => sendAction('DISPUTE_GOTCHA', { taskId, reason }).then(() => undefined)),
    [run, sendAction],
  );
  const voteOnDispute = useCallback(
    (disputeId: string, vote: boolean) =>
      run(() => sendAction('VOTE_DISPUTE', { disputeId, vote }).then(() => undefined)),
    [run, sendAction],
  );

  const uploadProofImage = useCallback(async (file: File, challengeId: string) => {
    if (!file.type.startsWith('image/')) throw new Error('Photo proof must be an image');
    if (file.size > 10 * 1024 * 1024) throw new Error('Photo proof must be smaller than 10 MB');
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: 'image/jpeg',
    });
    const identityId = await getIdentityId();
    const gameId = stateRef.current.currentGame?.id;
    if (!gameId) throw new Error('No active game');
    const path = `proofs/${identityId}/${gameId}/${challengeId}-${requestId()}.jpg`;
    return uploadPrivateImage(path, compressed, 'image/jpeg');
  }, []);

  const completeChallenge = useCallback(
    (challengeId: string, proofImage?: File) =>
      run(async () => {
        const proofImageKey = proofImage
          ? await uploadProofImage(proofImage, challengeId)
          : undefined;
        await sendAction('COMPLETE_CHALLENGE', { challengeId, proofImageKey });
      }),
    [run, sendAction, uploadProofImage],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await configureAws();
        if (cancelled) return;
        dispatch({ type: 'CONNECTED', value: true });
        const savedGameId = localStorage.getItem('currentGameId');
        if (savedGameId) await refreshGame(savedGameId);
      } catch (error) {
        if (cancelled) return;
        localStorage.removeItem('currentGameId');
        dispatch({ type: 'ERROR', value: errorMessage(error) });
        dispatch({ type: 'CONNECTED', value: false });
      } finally {
        if (!cancelled) dispatch({ type: 'LOADING', value: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshGame]);

  // Background refreshes: if this device was removed (kicked, or the game expired),
  // drop back to a clean state with an explanation instead of a dead screen.
  const syncGame = useCallback(
    async (gameId: string) => {
      try {
        await refreshGame(gameId);
        dispatch({ type: 'LINK', value: 'live' });
      } catch (error) {
        const message = errorMessage(error);
        if (GONE_PATTERN.test(message) && stateRef.current.currentGame?.id === gameId) {
          localStorage.removeItem('currentGameId');
          dispatch({ type: 'RESET' });
          dispatch({ type: 'ERROR', value: "You're no longer in that game." });
        } else {
          dispatch({ type: 'LINK', value: 'reconnecting' });
        }
      }
    },
    [refreshGame],
  );

  const [subscriptionAttempt, setSubscriptionAttempt] = useState(0);
  const retryDelay = useRef(1000);

  useEffect(() => {
    const gameId = state.currentGame?.id;
    if (!gameId || !state.isConnected) return undefined;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let retryTimer: number | undefined;
    const retry = () => {
      if (cancelled) return;
      dispatch({ type: 'LINK', value: 'reconnecting' });
      retryTimer = window.setTimeout(() => setSubscriptionAttempt((n) => n + 1), retryDelay.current);
      retryDelay.current = Math.min(retryDelay.current * 2, 15000);
    };
    void getAwsGameClient()
      .then((client) => {
        if (cancelled) return;
        const subscription = client.subscriptions
          .onGameUpdated({ gameId }, { authMode: 'apiKey' })
          .subscribe({
            next: (event: { revision?: number }) => {
              retryDelay.current = 1000;
              if ((event.revision || 0) >= revisionRef.current) void syncGame(gameId);
            },
            error: retry,
          });
        unsubscribe = () => subscription.unsubscribe();
        // Catch up on anything missed while the subscription was down.
        if (subscriptionAttempt > 0) void syncGame(gameId);
      })
      .catch(retry);
    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
      unsubscribe?.();
    };
  }, [state.currentGame?.id, state.isConnected, subscriptionAttempt, syncGame]);

  // Give the server this phone's push subscription once per game (and again if it changes),
  // so claims and votes reach the player even with the phone locked.
  const [pushPermission, setPushPermission] = useState(0);
  useEffect(() => {
    const onGranted = () => setPushPermission((n) => n + 1);
    window.addEventListener(PUSH_PERMISSION_EVENT, onGranted);
    return () => window.removeEventListener(PUSH_PERMISSION_EVENT, onGranted);
  }, []);
  const pushGameId = state.currentGame?.status === 'ended' ? undefined : state.currentGame?.id;
  const pushPlayerId = state.currentPlayer?.id;
  useEffect(() => {
    if (!pushGameId || !pushPlayerId || !pushKey) return undefined;
    let cancelled = false;
    void (async () => {
      try {
        const subscription = await currentPushSubscription(pushKey);
        if (cancelled || !subscription?.endpoint) return;
        const savedKey = `wgw-push:${pushGameId}:${pushPlayerId}`;
        if (localStorage.getItem(savedKey) === subscription.endpoint) return;
        await sendAction('SAVE_PUSH', { subscription }, pushGameId, false);
        localStorage.setItem(savedKey, subscription.endpoint);
      } catch {
        // Push is a bonus: in-app buzzes still work without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pushGameId, pushPlayerId, pushKey, pushPermission, sendAction]);

  // Phones sleep mid-party: resync the moment the app is visible or back online.
  useEffect(() => {
    const gameId = state.currentGame?.id;
    if (!gameId) return undefined;
    const resume = () => {
      if (document.visibilityState !== 'visible') return;
      void syncGame(gameId);
      if (stateRef.current.connection === 'reconnecting') {
        retryDelay.current = 1000;
        setSubscriptionAttempt((n) => n + 1);
      }
    };
    const offline = () => dispatch({ type: 'LINK', value: 'reconnecting' });
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    window.addEventListener('offline', offline);
    return () => {
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', offline);
    };
  }, [state.currentGame?.id, syncGame]);

  useEffect(() => {
    const pending = state.activeDisputes.filter((dispute) => dispute.result === 'pending');
    // Timers are frozen while the host has the game paused.
    if (!pending.length || !state.currentGame || state.currentGame.pausedAt) return undefined;
    const nextClose = Math.min(...pending.map((dispute) => new Date(dispute.closesAt).getTime()));
    const timeout = window.setTimeout(() => {
      void sendAction('RESOLVE_EXPIRED').catch((error) =>
        dispatch({ type: 'ERROR', value: errorMessage(error) }),
      );
    }, Math.max(100, nextClose - serverNow() + 250));
    return () => window.clearTimeout(timeout);
  }, [sendAction, state.activeDisputes, state.currentGame]);

  const value = useMemo<GameContextType>(
    () => ({
      state,
      createGame,
      joinGame,
      selectPack,
      startGame,
      endGame,
      leaveGame,
      kickPlayer,
      transferHost,
      setReady,
      updateProfile,
      swapTask,
      claimGotcha,
      disputeGotcha,
      voteOnDispute,
      acceptGotcha,
      rematch,
      updateSettings,
      openClaims,
      pauseGame,
      resumeGame,
      completeChallenge,
    }),
    [
      acceptGotcha,
      claimGotcha,
      completeChallenge,
      createGame,
      disputeGotcha,
      endGame,
      joinGame,
      kickPlayer,
      leaveGame,
      openClaims,
      pauseGame,
      rematch,
      resumeGame,
      selectPack,
      setReady,
      startGame,
      state,
      swapTask,
      transferHost,
      updateProfile,
      updateSettings,
      voteOnDispute,
    ],
  );

  return <AwsGameContext.Provider value={value}>{children}</AwsGameContext.Provider>;
}
