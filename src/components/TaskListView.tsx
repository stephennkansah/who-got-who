import React, { useState, useEffect } from 'react';
import { TaskInstance, Player } from '../types';

interface TaskListViewProps {
  tasks: TaskInstance[];
  players: Player[];
  onTaskResult: (task: TaskInstance, result: 'passed' | 'failed') => void;
  onSwapTask: (taskId: string) => void;
  swapsLeft: number;
}

export default function TaskListView({ tasks, players, onTaskResult, onSwapTask, swapsLeft }: TaskListViewProps) {
  const [taskFeedback, setTaskFeedback] = useState<{[taskId: string]: 'passed' | 'failed' | null}>({});

  // Clear feedback when task status changes from pending
  useEffect(() => {
    const updatedFeedback = { ...taskFeedback };
    let hasChanges = false;

    // Check each task with feedback
    Object.keys(taskFeedback).forEach(taskId => {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== 'pending' && taskFeedback[taskId]) {
        // Task is no longer pending, clear the feedback
        updatedFeedback[taskId] = null;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setTaskFeedback(updatedFeedback);
    }
  }, [tasks, taskFeedback]);

  const handleTaskAction = (task: TaskInstance, result: 'passed' | 'failed') => {
    // Show immediate visual feedback
    setTaskFeedback(prev => ({ ...prev, [task.id]: result }));
    
    // Don't clear feedback automatically - let it persist until task status changes
    // The feedback will be cleared when the task status updates from the database
    
    // Call the original handler
    onTaskResult(task, result);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'failed': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className="task-list-view">
      {tasks.map((task, index) => (
        <div 
          key={task.id} 
          className="task-list-item"
          style={{
            position: 'relative',
            background: task.status === 'pending' 
              ? '#fff' 
              : task.status === 'completed' 
                ? 'linear-gradient(135deg, #e8f5e8, #f1f8e9)' 
                : 'linear-gradient(135deg, #ffebee, #fce4ec)',
            border: `3px solid ${getStatusColor(task.status)}`,
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '0.75rem',
            boxShadow: task.status === 'pending' 
              ? '0 2px 8px rgba(0,0,0,0.1)' 
              : task.status === 'completed'
                ? '0 4px 12px rgba(76, 175, 80, 0.2)'
                : '0 4px 12px rgba(244, 67, 54, 0.2)',
            opacity: task.status === 'pending' ? 1 : 0.9
          }}
        >
          {/* Visual Feedback Overlay */}
          {taskFeedback[task.id] && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: taskFeedback[task.id] === 'passed' 
                ? 'rgba(76, 175, 80, 0.95)' 
                : 'rgba(244, 67, 54, 0.95)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              animation: 'feedbackPulse 2s ease-out'
            }}>
              <div style={{
                color: 'white',
                fontSize: '3rem',
                fontWeight: '900',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                transform: 'scale(1)',
                animation: 'feedbackScale 0.6s ease-out'
              }}>
                {taskFeedback[task.id] === 'passed' ? '✅ PASS' : '❌ FAIL'}
              </div>
            </div>
          )}

          {/* Task Header with Large Status Badge */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '0.75rem'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem'
            }}>
              {/* Large Status Badge - Only show for completed/failed tasks */}
              {(taskFeedback[task.id] || task.status !== 'pending') && (
                <div style={{
                  background: taskFeedback[task.id] === 'passed'
                    ? 'linear-gradient(135deg, #4caf50, #388e3c)'
                    : taskFeedback[task.id] === 'failed'
                      ? 'linear-gradient(135deg, #f44336, #d32f2f)'
                      : task.status === 'completed'
                        ? 'linear-gradient(135deg, #4caf50, #388e3c)'
                        : 'linear-gradient(135deg, #f44336, #d32f2f)',
                  color: 'white',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  minWidth: '80px',
                  textAlign: 'center'
                }}>
                  {taskFeedback[task.id] === 'passed'
                    ? '✅ DONE'
                    : taskFeedback[task.id] === 'failed'
                      ? '❌ FAILED'
                      : task.status === 'completed'
                        ? '✅ DONE'
                        : '❌ FAILED'}
                </div>
              )}
              
              {/* Task Number */}
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#666',
                fontWeight: '600',
                background: 'rgba(0,0,0,0.05)',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px'
              }}>
                Task #{index + 1}
              </div>
            </div>
          </div>

          {/* Task Text */}
          <div style={{ 
            fontSize: task.status === 'pending' ? '0.95rem' : '1rem',
            lineHeight: '1.4',
            marginBottom: '0.75rem',
            color: '#333',
            fontWeight: task.status === 'pending' ? '400' : '600',
            padding: task.status === 'pending' ? '0' : '0.5rem',
            background: task.status === 'pending' 
              ? 'transparent' 
              : task.status === 'completed'
                ? 'rgba(76, 175, 80, 0.1)'
                : 'rgba(244, 67, 54, 0.1)',
            borderRadius: task.status === 'pending' ? '0' : '8px',
            border: task.status === 'pending' 
              ? 'none' 
              : task.status === 'completed'
                ? '1px solid rgba(76, 175, 80, 0.3)'
                : '1px solid rgba(244, 67, 54, 0.3)'
          }}>
            {task.status !== 'pending' && (
              <div style={{ 
                fontSize: '0.8rem', 
                fontWeight: '700', 
                textTransform: 'uppercase',
                color: '#666',
                marginBottom: '0.25rem'
              }}>
                Task Completed:
              </div>
            )}
            {task.text}
          </div>

          {/* Target Info (for completed tasks) */}
          {task.status === 'completed' && task.targetId && (
            <div style={{
              background: 'linear-gradient(135deg, #e8f5e8, #d4edda)',
              border: '2px solid #4caf50',
              borderRadius: '12px',
              padding: '0.75rem',
              marginBottom: '0.75rem',
              fontSize: '1rem',
              fontWeight: '700',
              color: '#2e7d32',
              textAlign: 'center',
              boxShadow: '0 3px 8px rgba(76, 175, 80, 0.2)'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                🎯 SUCCESS!
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                You got: <strong>{players.find(p => p.id === task.targetId)?.name || 'Unknown'}</strong>
              </div>
            </div>
          )}

          {/* Target Info (for failed tasks) */}
          {task.status === 'failed' && task.targetId && (
            <div style={{
              background: 'linear-gradient(135deg, #ffebee, #ffcdd2)',
              border: '2px solid #f44336',
              borderRadius: '12px',
              padding: '0.75rem',
              marginBottom: '0.75rem',
              fontSize: '1rem',
              fontWeight: '700',
              color: '#c62828',
              textAlign: 'center',
              boxShadow: '0 3px 8px rgba(244, 67, 54, 0.2)'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                🚨 BUSTED!
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Caught by: <strong>{players.find(p => p.id === task.targetId)?.name || 'Unknown'}</strong>
              </div>
            </div>
          )}

          {/* Actions for pending tasks */}
          {task.status === 'pending' && (
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => handleTaskAction(task, 'passed')}
                style={{
                  background: 'linear-gradient(135deg, #4caf50, #45a049)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1',
                  minWidth: '80px'
                }}
              >
                ✅ PASS
              </button>
              <button
                onClick={() => handleTaskAction(task, 'failed')}
                style={{
                  background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1',
                  minWidth: '80px'
                }}
              >
                ❌ FAIL
              </button>
              {swapsLeft > 0 && (
                <button
                  onClick={() => onSwapTask(task.id)}
                  style={{
                    background: 'linear-gradient(135deg, #9C27B0, #673AB7)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: '1',
                    minWidth: '120px'
                  }}
                >
                  🔄 SWAP ({swapsLeft}/2)
                </button>
              )}
            </div>
          )}


        </div>
      ))}

      {tasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#666',
          fontSize: '1.1rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎯</div>
          <div>No tasks yet!</div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Tasks will appear when the game starts
          </div>
        </div>
      )}
    </div>
  );
} 