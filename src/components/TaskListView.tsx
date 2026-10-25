import React, { useEffect, useRef, useState } from 'react';
import { TaskInstance, Player, Dispute } from '../types';

interface TaskListViewProps {
  tasks: TaskInstance[];
  players: Player[];
  onTaskResult: (task: TaskInstance, result: 'passed' | 'failed') => void;
  onSwapTask: (taskId: string) => void;
  swapsLeft: number;
  swapsTotal: number;
  activeDisputes: Dispute[];
  currentPlayerId: string;
  /** The mission whose claim is being sent right now, if any. */
  filing: { taskId: string; result: 'passed' | 'failed' } | null;
  /** Set while claims are blocked (briefing or pause); swaps still work. */
  lockReason?: string | null;
}

const COVER_KEY = 'wgw-cover';
const PEEK_MS = 8000;

function readCover(): boolean {
  try {
    return sessionStorage.getItem(COVER_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCover(covered: boolean) {
  try {
    sessionStorage.setItem(COVER_KEY, covered ? '1' : '0');
  } catch {
    // Private mode: cover still works for this visit.
  }
}

export default function TaskListView({
  tasks,
  players,
  onTaskResult,
  onSwapTask,
  swapsLeft,
  swapsTotal,
  activeDisputes,
  currentPlayerId,
  filing,
  lockReason = null,
}: TaskListViewProps) {
  const [covered, setCovered] = useState(readCover);
  const [openId, setOpenId] = useState<string | null>(null);
  const [peekId, setPeekId] = useState<string | null>(null);
  const [showFiled, setShowFiled] = useState(false);
  const peekTimer = useRef<number>();

  // Pocket the phone and the dossier closes itself.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        setCovered(true);
        writeCover(true);
        setPeekId(null);
        setOpenId(null);
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.clearTimeout(peekTimer.current);
    };
  }, []);

  const toggleCover = () => {
    const next = !covered;
    setCovered(next);
    writeCover(next);
    setPeekId(null);
    setOpenId(null);
  };

  const disputeForTask = (taskId: string) =>
    activeDisputes.find(
      (dispute) => dispute.taskInstanceId === taskId && dispute.accuserId === currentPlayerId,
    );

  const playerName = (id?: string) => players.find((p) => p.id === id)?.name || 'Unknown';

  const handleCardTap = (task: TaskInstance) => {
    window.clearTimeout(peekTimer.current);
    if (covered) {
      const peeking = peekId === task.id;
      setPeekId(peeking ? null : task.id);
      setOpenId(peeking ? null : task.id);
      if (!peeking) {
        peekTimer.current = window.setTimeout(() => {
          setPeekId(null);
          setOpenId(null);
        }, PEEK_MS);
      }
      return;
    }
    setOpenId((current) => (current === task.id ? null : task.id));
  };

  const act = (task: TaskInstance, result: 'passed' | 'failed') => {
    window.clearTimeout(peekTimer.current);
    setOpenId(null);
    onTaskResult(task, result);
  };

  const missionNumber = (task: TaskInstance) =>
    `${String(tasks.indexOf(task) + 1).padStart(2, '0')} / ${String(tasks.length).padStart(2, '0')}`;

  const inFlight = tasks.filter((task) => task.status === 'disputed');
  const open = tasks.filter((task) => task.status === 'pending');
  const filed = tasks.filter((task) => task.status === 'completed' || task.status === 'failed');
  const active = [...inFlight, ...open];

  if (tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        <div className="type" style={{ fontSize: '0.95rem', fontWeight: 700 }}>No missions on file.</div>
        <div style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>
          Your dossier arrives when the game starts.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mission-toolbar">
        <div className="mission-toolbar-title">
          <span className="overline">Your missions</span>
          <span className="mission-count">{open.length} open</span>
        </div>
        <button
          className={`chip-btn ${covered ? 'active' : ''}`}
          onClick={toggleCover}
          aria-label={covered ? 'Show all missions' : 'Hide all missions'}
        >
          {covered ? 'Show' : 'Hide'}
        </button>
        <div className="mission-hint">
          {covered
            ? 'Hidden from prying eyes — tap one to peek'
            : lockReason
              ? 'Read up and plan — tap one to swap it'
              : 'Tap a mission when you pull it off'}
        </div>
      </div>

      {active.map((task, index) => {
        const dispute = disputeForTask(task.id);
        const isOpen = openId === task.id && task.status === 'pending' && !dispute;
        const hidden = covered && peekId !== task.id && task.status === 'pending';
        const isFiling = filing?.taskId === task.id;

        return (
          <div
            key={task.id}
            className={`task-list-item paper-card ${isOpen ? 'is-open' : ''}`}
            style={{ animationDelay: `${Math.min(index * 60, 420)}ms` }}
          >
            {isFiling && (
              <div className="filing-overlay">
                <div className={`stamp big ${filing?.result === 'passed' ? 'success' : 'danger'}`}>
                  {filing?.result === 'passed' ? "Got 'em" : 'Busted'}
                </div>
                <div className="type" style={{ color: 'var(--paper)', fontSize: '0.82rem' }}>
                  filing report…
                </div>
              </div>
            )}

            <button
              className="mission-body"
              onClick={() => handleCardTap(task)}
              disabled={task.status !== 'pending' || !!dispute}
              aria-expanded={task.status === 'pending' ? isOpen : undefined}
              aria-label={hidden ? `Mission ${missionNumber(task)}, hidden. Tap to peek.` : undefined}
            >
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <div className="mission-number type">Mission № {missionNumber(task)}</div>
                {dispute && (
                  <span className="stamp warning">
                    {dispute.phase === 'voting' ? 'Jury out' : 'Pending'}
                  </span>
                )}
              </div>

              {hidden ? (
                <div className="mission-redacted" aria-hidden="true">
                  <span className="redacted" style={{ width: '88%' }}>&nbsp;</span>
                  <span className="redacted" style={{ width: '58%' }}>&nbsp;</span>
                </div>
              ) : (
                <>
                  <div className="mission-text">{task.text}</div>
                  {task.tips && isOpen && <div className="mission-tip">Tip: {task.tips}</div>}
                </>
              )}
            </button>

            {dispute && (
              <div className="mission-status warning">
                {dispute.phase === 'voting'
                  ? `${playerName(dispute.targetId)} disputed it — the group is voting…`
                  : `Waiting for ${playerName(dispute.targetId)} to accept…`}
              </div>
            )}

            {isOpen && lockReason && (
              <div className="mission-locked">{lockReason} — no claims yet</div>
            )}

            {isOpen && (
              <div className="mission-actions">
                {!lockReason && (
                  <>
                    <button onClick={() => act(task, 'passed')} className="btn btn-success mission-primary">
                      Got it!
                    </button>
                    <button
                      onClick={() => act(task, 'failed')}
                      className="btn btn-secondary"
                      aria-label="I got caught trying this mission"
                    >
                      I Got Caught
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setOpenId(null);
                    onSwapTask(task.id);
                  }}
                  className="btn btn-secondary"
                  disabled={swapsLeft <= 0}
                  style={lockReason ? { gridColumn: '1 / -1' } : undefined}
                  aria-label={`Swap this mission, ${swapsLeft} of ${swapsTotal} swaps left`}
                >
                  Swap {swapsLeft}/{swapsTotal}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {active.length === 0 && (
        <div className="paper-card" style={{ padding: '1.25rem', textAlign: 'center', marginBottom: '0.8rem' }}>
          <div className="type" style={{ fontWeight: 700 }}>Every mission filed.</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--paper-dim)', marginTop: '0.3rem' }}>
            Lie low and watch the board.
          </div>
        </div>
      )}

      {filed.length > 0 && (
        <div className="filed-missions">
          <button className="filed-toggle" onClick={() => setShowFiled((value) => !value)} aria-expanded={showFiled}>
            <span>Filed missions · {filed.length}</span>
            <span aria-hidden="true">{showFiled ? '▴' : '▾'}</span>
          </button>
          {showFiled && filed.map((task) => (
            <div key={task.id} className={`filed-row ${task.status}`}>
              <div className="filed-text">{task.text}</div>
              <div className="filed-outcome">
                {task.status === 'completed'
                  ? <>Got <strong>{playerName(task.targetId)}</strong></>
                  : <>Busted by <strong>{playerName(task.targetId)}</strong></>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
