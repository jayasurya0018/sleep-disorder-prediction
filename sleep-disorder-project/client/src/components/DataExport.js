import React, { useState } from 'react';
import '../styles/DataExport.css';

export default function DataExport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    if (!startDate || !endDate) {
      setMessage('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }

      const endpoint = `http://localhost:5000/api/export/${exportFormat}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          userName: 'User'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sleep-data-${startDate}-${endDate}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage(`✓ Data exported successfully as ${exportFormat.toUpperCase()}`);
      setStartDate('');
      setEndDate('');
    } catch (error) {
      console.error('Export error:', error);
      setMessage(`✗ Export failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-container">
      <h2>Export Sleep Data</h2>
      
      <div className="export-form">
        <div className="form-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Format:</label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            disabled={loading}
          >
            <option value="csv">CSV (Spreadsheet)</option>
            <option value="pdf">PDF (Report)</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="export-button"
        >
          {loading ? 'Exporting...' : 'Export Data'}
        </button>
      </div>

      {message && (
        <div className={`export-message ${message.includes('✓') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="export-info">
        <h3>Export Formats:</h3>
        <ul>
          <li><strong>CSV:</strong> Import into Excel, Google Sheets, or other analysis tools</li>
          <li><strong>PDF:</strong> Professional report with statistics and graphs</li>
        </ul>
      </div>
    </div>
  );
}
