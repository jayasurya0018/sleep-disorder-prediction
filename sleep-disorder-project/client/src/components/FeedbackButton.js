import React, { useState } from 'react';

const FeedbackButton = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setSent(false);
      setMessage('');
    }, 2000);
  };

  return (
    <>
      <button
        aria-label="Send Feedback"
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 10000,
          background: 'linear-gradient(90deg,#7f53ac,#38b2ac)',
          color: '#fff',
          border: 'none',
          borderRadius: 32,
          padding: '0.9rem 1.5rem',
          fontWeight: 700,
          fontSize: 18,
          boxShadow: '0 4px 16px #38b2ac33',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(true)}
      >
        💬 Feedback
      </button>
      {open && (
  <div style={{
          position: 'fixed',
          bottom: 90,
          right: 32,
          zIndex: 10001,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px #38b2ac33',
          padding: 24,
          minWidth: 300,
        }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>Send Feedback</h3>
          <textarea
            aria-label="Feedback message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            style={{ width: '100%', margin: '12px 0', borderRadius: 8, padding: 8, border: '1px solid #c3cfe2' }}
            placeholder="Your feedback..."
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setOpen(false)} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 600 }}>Cancel</button>
            <button onClick={handleSend} style={{ background: 'linear-gradient(90deg,#7f53ac,#38b2ac)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 600 }}>Send</button>
          </div>
          {sent && <div style={{ color: '#38b2ac', marginTop: 8 }}>Thank you for your feedback!</div>}
        </div>
      )}
    </>
  );
};

export default FeedbackButton;
