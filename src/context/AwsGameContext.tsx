import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import imageCompression from 'browser-image-compression';
import { Game, GameContextType, GameState, Player } from '../types';
import {
  awsGameClient,
  configureAws,
  getIdentityId,
  uploadPrivateImage,
} from '../services/aws';

type GameViewPayload = {
  game: Game;
  currentPlayer: Player;
  activeDisputes?: GameState['activeDisputes'];
};

type AwsGameAction =
  | { type: 'LOADING'; value: boolean }
  | { type: 'ERROR'; value: string | null }
  | { type: 'CONNECTED'; value: boolean }
  | { type: 'VIEW'; value: GameViewPayload }
  | { type: 'RESET' };

const initialState: GameState = {
  currentGame: null,
  currentPlayer: null,
  isConnected: false,
  isLoading: true,
  error: null,
  activeDisputes: [],
  leaderboard: [],
};

function reducer(state: GameState, action: AwsGameAction): GameState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: action.value };
    case 'ERROR':
      return { ...state, error: action.value };
    case 'CONNECTED':
      return { ...state, isConnected: action.value };
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
      return { ...initialState, isLoading: false, isConnected: state.isConnected };
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

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const refreshGame = useCallback(async (gameId: string) => {
    const response = await awsGameClient.queries.getGameView(
      { gameId },
      { authMode: 'identityPool' },
    );
    if (response.errors?.length || !response.data) throw dataError(response.errors);
    const view = reviveView(response.data.payload);
    revisionRef.current = response.data.revision || revisionRef.current;
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
      await configureAws();
      const gameId = explicitGameId || stateRef.current.currentGame?.id;
      const response = await awsGameClient.mutations.gameAction(
        { action, gameId, requestId: requestId(), payload },
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
  const updatePlayerName = useCallback(
    (name: string) => run(() => sendAction('UPDATE_NAME', { name }).then(() => undefined)),
    [run, sendAction],
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

  useEffect(() => {
    const gameId = state.currentGame?.id;
    if (!gameId || !state.isConnected) return undefined;
    const subscription = awsGameClient.subscriptions
      .onGameUpdated({ gameId }, { authMode: 'identityPool' })
      .subscribe({
        next: (event: { revision?: number }) => {
          if ((event.revision || 0) >= revisionRef.current) {
            void refreshGame(gameId).catch((error) =>
              dispatch({ type: 'ERROR', value: errorMessage(error) }),
            );
          }
        },
        error: () => dispatch({ type: 'CONNECTED', value: false }),
      });
    return () => subscription.unsubscribe();
  }, [refreshGame, state.currentGame?.id, state.isConnected]);

  useEffect(() => {
    const pending = state.activeDisputes.filter((dispute) => dispute.result === 'pending');
    if (!pending.length || !state.currentGame) return undefined;
    const nextClose = Math.min(...pending.map((dispute) => new Date(dispute.closesAt).getTime()));
    const timeout = window.setTimeout(() => {
      void sendAction('RESOLVE_EXPIRED').catch((error) =>
        dispatch({ type: 'ERROR', value: errorMessage(error) }),
      );
    }, Math.max(100, nextClose - Date.now() + 250));
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
      updatePlayerName,
      swapTask,
      claimGotcha,
      disputeGotcha,
      voteOnDispute,
      acceptGotcha,
      updatePlayerTasks: () => undefined,
      socket: null,
      completeChallenge,
      uploadProofImage,
    }),
    [
      acceptGotcha,
      claimGotcha,
      completeChallenge,
      createGame,
      disputeGotcha,
      endGame,
      joinGame,
      leaveGame,
      selectPack,
      startGame,
      state,
      swapTask,
      updatePlayerName,
      uploadProofImage,
      voteOnDispute,
    ],
  );

  return <AwsGameContext.Provider value={value}>{children}</AwsGameContext.Provider>;
}
