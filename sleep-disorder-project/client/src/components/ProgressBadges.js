import React from 'react';
import { useNotification } from './NotificationProvider';

const BADGES = [
  { id: 'streak', label: 'Sleep Streak', desc: '5+ days of healthy sleep', icon: '🌙' },
  { id: 'improvement', label: 'Improvement', desc: 'HRV or SpO2 improved', icon: '📈' },
  { id: 'early', label: 'Early Bird', desc: '3+ days early bedtime', icon: '⏰' },
  { id: 'consistency', label: 'Consistency', desc: 'Consistent sleep schedule', icon: '📅' },
];

const ProgressBadges = ({ badges = [] }) => {
  const { showNotification } = useNotification();
  const handleClick = (badge) => {
    showNotification(`${badge.label}: ${badge.desc}`, 'info');
  };
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '1.5rem 0 7rem 0', zIndex: 10, position: 'relative' }}>
      {BADGES.filter(b => badges.includes(b.id)).map(badge => (
        <button
          key={badge.id}
          style={{
            background: 'linear-gradient(90deg,#7f53ac,#38b2ac)',
            color: '#fff',
            borderRadius: 12,
            padding: '0.7rem 1.2rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 8px #38b2ac33',
            fontSize: 18,
            border: 'none',
            cursor: 'pointer',
            margin:'22px 0',
            transition: 'background 0.2s, transform 0.2s',
          }}
          onClick={() => handleClick(badge)}
          aria-label={badge.label}
        >
          <span style={{ fontSize: 22 }}>{badge.icon}</span> {badge.label}
        </button>
      ))}
    </div>
  );
};

export default ProgressBadges;
