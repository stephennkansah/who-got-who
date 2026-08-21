import React, { useState } from 'react';
import Modal from './common/Modal';

const FeedbackButton: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'suggestion',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Open the user's mail client; no form data is sent to a third party.
    const subject = encodeURIComponent(`Who Got Who ${formData.type}: ${formData.name || 'anonymous'}`);
    const body = encodeURIComponent(`
From: ${formData.name} (${formData.email})
Type: ${formData.type}

Message:
${formData.message}
    `);

    window.location.href = `mailto:info@myformatic.com?subject=${subject}&body=${body}`;

    setSubmitStatus('success');
    setTimeout(() => {
      setShowModal(false);
      setSubmitStatus('idle');
      setFormData({ name: '', email: '', type: 'suggestion', message: '' });
    }, 3500);
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'inherit',
    textAlign: 'left',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 700,
    color: 'var(--paper-ink)',
    fontSize: '0.9rem',
    textAlign: 'left',
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          left: '16px',
          background: 'var(--ink-2)',
          color: 'var(--text-muted)',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 14px',
          fontSize: '12px',
          fontWeight: 700,
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: 0.9,
        }}
        aria-label="Send feedback"
      >
        💬 Feedback
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        ariaLabel="Send feedback"
        maxWidth={460}
        showClose
      >
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', textAlign: 'left' }}>
          💬 Send Feedback
        </h2>

        {submitStatus === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--success-ink)' }}>
            <div style={{ fontSize: '46px', marginBottom: '12px' }} aria-hidden="true">📧</div>
            <h3>Almost there!</h3>
            <p>
              Your email app just opened with the message ready — hit <strong>send</strong> there
              to deliver it.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle} htmlFor="fb-name">Name (optional)</label>
              <input
                id="fb-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={fieldStyle}
                placeholder="Your name"
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle} htmlFor="fb-email">Email (optional)</label>
              <input
                id="fb-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={fieldStyle}
                placeholder="your@email.com"
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle} htmlFor="fb-type">Type</label>
              <select
                id="fb-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={fieldStyle}
              >
                <option value="suggestion">💡 Suggestion</option>
                <option value="bug">🐛 Bug Report</option>
                <option value="feature">✨ Feature Request</option>
                <option value="question">❓ Question</option>
                <option value="other">💬 Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle} htmlFor="fb-message">Message *</label>
              <textarea
                id="fb-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={4}
                style={{ ...fieldStyle, resize: 'vertical' }}
                placeholder="Tell us about your experience, ideas, or issues..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '10px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={!formData.message.trim()}
                style={{ flex: 1.4, padding: '0.8rem', borderRadius: '10px' }}
              >
                📤 Open in email
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default FeedbackButton;
