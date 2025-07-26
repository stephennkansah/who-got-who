import React, { useState, useEffect } from 'react';
import { Dispute } from '../types';

interface DisputeModalProps {
  dispute: Dispute;
  onAccept: () => void;
  onDispute: (reason?: string) => void;
  onCancel: () => void;
}

export default function DisputeModal({ 
  dispute, 
  onAccept, 
  onDispute, 
  onCancel 
}: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const closeTime = new Date(dispute.closesAt).getTime();
      const remaining = Math.max(0, Math.ceil((closeTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        onAccept(); // Auto-accept when time runs out
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [dispute.closesAt, onAccept]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>⚖️ Gotcha Claimed!</h3>
        
        <div className="timer" style={{ margin: '1rem 0' }}>
          ⏱️ Time to respond: {formatTime(timeLeft)}
        </div>
        
        <div className="card" style={{ margin: '1rem 0', backgroundColor: '#333' }}>
          <p><strong>Someone claims they completed a task on you!</strong></p>
          <p>Did they say "Gotcha!" before you could call them out?</p>
        </div>
        
        <div className="flex flex-column gap-1">
          <button 
            className="btn btn-success"
            onClick={onAccept}
          >
            ✅ Accept - They got me fair and square
          </button>
          
          <button 
            className="btn btn-danger"
            onClick={() => onDispute(reason)}
          >
            ❌ Dispute - I caught them first!
          </button>
        </div>
        
        <div style={{ margin: '1rem 0' }}>
          <input
            type="text"
            className="input"
            placeholder="Optional: Why are you disputing? (e.g., 'I saw them before they said Gotcha')"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={100}
          />
        </div>
        
        <div className="text-small" style={{ 
          margin: '1rem 0', 
          padding: '0.5rem', 
          backgroundColor: '#444', 
          borderRadius: '4px' 
        }}>
          <strong>How disputes work:</strong><br/>
          • If you dispute, other players will vote<br/>
          • Majority decides the outcome<br/>
          • Ties go to the host's default setting<br/>
          • If you don't respond in time, the Gotcha is automatically accepted
        </div>
        
        <button 
          className="btn btn-secondary btn-small" 
          onClick={onCancel}
          style={{ marginTop: '0.5rem' }}
        >
          Cancel (Auto-accept)
        </button>
      </div>
    </div>
  );
} 