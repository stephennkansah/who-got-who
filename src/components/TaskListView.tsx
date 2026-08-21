import React, { useState, useEffect } from 'react';
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
}: TaskListViewProps) {
  const [taskFeedback, setTaskFeedback] = useState<{[taskId: string]: 'passed' | 'failed' | null}>({});

  const disputeForTask = (taskId: string) =>
    activeDisputes.find(
      (dispute) => dispute.taskInstanceId === taskId && dispute.accuserId === currentPlayerId,
    );

  // Clear the optimistic overlay once the claim is reflected in game state
  useEffect(() => {
    setTaskFeedback((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(prev).forEach((taskId) => {
        if (!prev[taskId]) return;
        const task = tasks.find((t) => t.id === taskId);
        const claimTracked = task && task.status !== 'pending';
        const disputeTracked = !!disputeForTask(taskId);
        if (claimTracked || disputeTracked) {
          next[taskId] = null;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, activeDisputes]);

  const handleTaskAction = (task: TaskInstance, result: 'passed' | 'failed') => {
    setTaskFeedback(prev => ({ ...prev, [task.id]: result }));
    onTaskResult(task, result);
  };

  const playerName = (id?: string) => players.find(p => p.id === id)?.name || 'Unknown';

  const stampFor = (status: TaskInstance['status']) => {
    switch (status) {
      case 'completed': return { cls: 'stamp success', label: "Got 'em" };
      case 'failed': return { cls: 'stamp danger', label: 'Busted' };
      case 'disputed': return { cls: 'stamp warning', label: 'Disputed' };
      default: return null;
    }
  };

  return (
    <div>
      {tasks.map((task, index) => {
        const stamp = stampFor(task.status);
        const dispute = disputeForTask(task.id);
        const feedback = taskFeedback[task.id];
        const isPending = task.status === 'pending';
        const missionNo = String(index + 1).padStart(2, '0');

        return (
          <div
            key={task.id}
            className="task-list-item paper-card"
            style={{
              opacity: isPending || task.status === 'disputed' ? 1 : 0.82,
              animationDelay: `${Math.min(index * 60, 420)}ms`,
              transform: `rotate(${index % 2 === 0 ? '-0.35' : '0.35'}deg)`,
            }}
          >
            {/* Optimistic "sending" overlay — a stamp slamming down */}
            {feedback && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(35, 32, 20, 0.82)',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                zIndex: 10,
                animation: 'feedbackPulse 0.5s ease-out'
              }}>
                <div
                  className={`stamp big ${feedback === 'passed' ? 'success' : 'danger'}`}
                  style={{ animation: 'feedbackScale 0.45s ease-out', background: 'var(--paper)' }}
                >
                  {feedback === 'passed' ? "Got 'em" : 'Busted'}
                </div>
                <div className="type" style={{ color: 'var(--paper)', fontSize: '0.75rem' }}>
                  filing report…
                </div>
              </div>
            )}

            {/* Dossier header */}
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <div className="type" style={{
                fontSize: '0.68rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--paper-dim)',
              }}>
                Mission № {missionNo} / {String(tasks.length).padStart(2, '0')}
              </div>
              {stamp && <span className={stamp.cls}>{stamp.label}</span>}
            </div>

            {/* Mission text — typewriter */}
            <div className="type" style={{
              fontSize: '0.98rem',
              lineHeight: 1.5,
              color: 'var(--paper-ink)',
              marginBottom: '0.75rem',
            }}>
              {task.text}
            </div>

            {/* Claim awaiting response / vote */}
            {dispute && (
              <div className="type" style={{
                borderTop: '1px dashed var(--paper-line)',
                paddingTop: '0.55rem',
                marginBottom: '0.25rem',
                fontSize: '0.82rem',
                color: 'var(--warning-ink)',
                textAlign: 'center',
              }}>
                {dispute.phase === 'voting'
                  ? '⚖ disputed — the group is voting…'
                  : `⏳ awaiting ${playerName(dispute.targetId)}'s response…`}
              </div>
            )}

            {/* Outcome line */}
            {task.status === 'completed' && task.targetId && (
              <div className="type" style={{
                borderTop: '1px dashed var(--paper-line)',
                paddingTop: '0.55rem',
                fontSize: '0.85rem',
                color: 'var(--success-ink)',
                textAlign: 'center',
              }}>
                target: <strong>{playerName(task.targetId)}</strong> — mission accomplished
              </div>
            )}

            {task.status === 'failed' && task.targetId && (
              <div className="type" style={{
                borderTop: '1px dashed var(--paper-line)',
                paddingTop: '0.55rem',
                fontSize: '0.85rem',
                color: 'var(--danger-ink)',
                textAlign: 'center',
              }}>
                compromised by <strong>{playerName(task.targetId)}</strong>
              </div>
            )}

            {/* Actions for pending tasks */}
            {isPending && !dispute && (
              <div className="flex gap-1" style={{ flexWrap: 'wrap', marginTop: '0.25rem' }}>
                <button
                  onClick={() => handleTaskAction(task, 'passed')}
                  className="btn btn-success"
                  style={{ flex: 2, minWidth: '110px', padding: '0.6rem', fontSize: '1.05rem' }}
                >
                  Got it!
                </button>
                <button
                  onClick={() => handleTaskAction(task, 'failed')}
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '86px', padding: '0.6rem', fontSize: '1.05rem' }}
                >
                  Caught
                </button>
                {swapsLeft > 0 && (
                  <button
                    onClick={() => onSwapTask(task.id)}
                    className="btn btn-secondary"
                    style={{ flex: 1, minWidth: '96px', padding: '0.6rem', fontSize: '1.05rem' }}
                  >
                    Swap · {swapsLeft}/{swapsTotal}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--text-muted)',
        }}>
          <div className="type" style={{ fontSize: '0.95rem', fontWeight: 700 }}>No missions on file.</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
            Your dossier arrives when the game starts.
          </div>
        </div>
      )}
    </div>
  );
}
