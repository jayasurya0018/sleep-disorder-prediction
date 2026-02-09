import React from 'react';
import WearableDevices from '../components/WearableDevices';

export default function WearableDevicesPage() {
  return (
    <div className="main-content">
      <div style={{ width: '100%', maxWidth: '1200px', padding: '20px' }}>
        <WearableDevices />
      </div>
    </div>
  );
}
