import React from 'react';
import DataExport from '../components/DataExport';

export default function DataExportPage() {
  return (
    <div className="main-content">
      <div style={{ width: '100%', maxWidth: '900px', padding: '20px' }}>
        <DataExport />
      </div>
    </div>
  );
}
