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

  const statusTheme = (status: TaskInstance['status']) => {
    switch (status) {
      case 'completed':
        return { border: 'var(--success)', chipBg: 'var(--success-gradient)', chip: '✅ GOT IT' };
      case 'failed':
        return { border: 'var(--danger)', chipBg: 'var(--danger-gradient)', chip: '🚨 CAUGHT' };
      case 'disputed':
        return { border: 'var(--warning)', chipBg: 'var(--warning-gradient)', chip: '⚖️ IN DISPUTE' };
      default:
        return { border: 'rgba(0,0,0,0.08)', chipBg: '', chip: '' };
    }
  };

  return (
    <div>
      {tasks.map((task, index) => {
        const theme = statusTheme(task.status);
        const dispute = disputeForTask(task.id);
        const feedback = taskFeedback[task.id];
        const isPending = task.status === 'pending';

        return (
          <div
            key={task.id}
            className="task-list-item"
            style={{
              background: 'white',
              borderLeft: `5px solid ${theme.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              opacity: isPending || task.status === 'disputed' ? 1 : 0.88,
              animationDelay: `${Math.min(index * 60, 420)}ms`,
            }}
          >
            {/* Optimistic "sending" overlay — clears as soon as the claim lands */}
            {feedback && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: feedback === 'passed'
                  ? 'rgba(16, 185, 129, 0.95)'
                  : 'rgba(239, 68, 68, 0.95)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                zIndex: 10,
                animation: 'feedbackPulse 0.6s ease-out'
              }}>
                <div style={{
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 900,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  animation: 'feedbackScale 0.5s ease-out'
                }}>
                  {feedback === 'passed' ? '✅ GOT IT' : '🚨 CAUGHT'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', fontWeight: 700 }}>
                  Sending…
                </div>
              </div>
            )}

            {/* Header row: number + status chip */}
            <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                background: 'rgba(0,0,0,0.05)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-pill)'
              }}>
                Task {index + 1} of {tasks.length}
              </div>
              {!isPending && (
                <div style={{
                  background: theme.chipBg,
                  color: 'white',
                  padding: '0.3rem 0.7rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}>
                  {theme.chip}
                </div>
              )}
            </div>

            {/* Task text */}
            <div style={{
              fontSize: '0.98rem',
              lineHeight: 1.45,
              color: 'var(--text-main)',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}>
              {task.text}
            </div>

            {/* Claim awaiting response / vote */}
            {dispute && (
              <div style={{
                background: 'var(--warning-soft)',
                border: '1px solid var(--warning-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem 0.75rem',
                marginBottom: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--warning-ink)',
                textAlign: 'center',
              }}>
                {dispute.phase === 'voting'
                  ? '⚖️ Disputed — the group is voting…'
                  : `⏳ Waiting for ${playerName(dispute.targetId)} to accept…`}
              </div>
            )}

            {/* Outcome row */}
            {task.status === 'completed' && task.targetId && (
              <div style={{
                background: 'var(--success-soft)',
                border: '1px solid var(--success-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem 0.75rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--success-ink)',
                textAlign: 'center',
              }}>
                🎯 You got <strong>{playerName(task.targetId)}</strong>!
              </div>
            )}

            {task.status === 'failed' && task.targetId && (
              <div style={{
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem 0.75rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--danger-ink)',
                textAlign: 'center',
              }}>
                🚨 Busted by <strong>{playerName(task.targetId)}</strong>
              </div>
            )}

            {/* Actions for pending tasks */}
            {isPending && !dispute && (
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleTaskAction(task, 'passed')}
                  className="btn btn-success"
                  style={{ flex: 2, minWidth: '110px', padding: '0.65rem', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)' }}
                >
                  ✅ Got it!
                </button>
                <button
                  onClick={() => handleTaskAction(task, 'failed')}
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '90px', padding: '0.65rem', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                >
                  😅 Caught
                </button>
                {swapsLeft > 0 && (
                  <button
                    onClick={() => onSwapTask(task.id)}
                    className="btn btn-secondary"
                    style={{ flex: 1, minWidth: '90px', padding: '0.65rem', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    🔄 Swap ({swapsLeft}/{swapsTotal})
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
          fontSize: '1rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }} aria-hidden="true">🎯</div>
          <div style={{ fontWeight: 700 }}>No tasks yet!</div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Your secret missions appear when the game starts.
          </div>
        </div>
      )}
    </div>
  );
}
