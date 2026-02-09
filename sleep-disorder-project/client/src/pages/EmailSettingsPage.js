import React from 'react';
import EmailSettings from '../components/EmailSettings';

export default function EmailSettingsPage() {
  return (
    <div className="main-content">
      <div style={{ width: '100%', maxWidth: '900px', padding: '20px' }}>
        <EmailSettings />
      </div>
    </div>
  );
}
