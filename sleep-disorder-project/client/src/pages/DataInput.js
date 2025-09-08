import React, { useState, useEffect } from 'react';
import api from '../api.js';

import DataForm from '../components/DataForm';

const DataInput = () => {
    const [loading, setLoading] = useState(false);

    const connectWatch = () => {
        alert('Connecting to smart watch... (Mock: Data fetched)');
    };

    const handleSubmit = async (formData) => {
        setLoading(true);
        // Ensure all numeric fields are numbers
        const dataToSend = {
            ...formData,
            hrv: Number(formData.hrv),
            spo2: Number(formData.spo2),
            movement: Number(formData.movement),
            breathing: Number(formData.breathing)
        };
        try {
            await api.post('/data/save', dataToSend);
            alert('Data saved!');
        } catch (err) {
            console.error(err);
            alert('Failed to save data.');
        }
        setLoading(false);
    };

    // Import from smartwatch (mock)
    const importSmartwatch = async () => {
        setLoading(true);
        try {
            await api.post('/data/import-smartwatch');
            alert('Smartwatch data imported!');
        } catch (err) {
            console.error(err);
            alert('Failed to import smartwatch data.');
        }
        setLoading(false);
    };

    // Demo data for instant try
    const demoData = {
        sleepStages: 'Awake,REM,Deep,Light',
        hrv: 60,
        spo2: 98,
        movement: 10,
        breathing: 15
    };
    const handleDemo = () => handleSubmit(demoData);

    return (
        <>
            {loading && (
                <div className="modern-loading-overlay" aria-live="polite">
                    <div className="modern-spinner"></div>
                </div>
            )}
            <style>{`
  body {
    font-family: 'Inter', 'Poppins', Arial, sans-serif;
    color: #232946;
    background: #f7f8fa;
  }
  .modern-loading-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255,255,255,0.6);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modern-spinner {
    width: 56px;
    height: 56px;
    border: 6px solid #e0e7ff;
    border-top: 6px solid #7f53ac;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .modern-form-section {
    background: #fff;
    border-radius: 1.5rem;
    padding: 2.5rem 2rem;
    margin: 2rem auto 2.5rem auto;
    max-width: 700px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
  .modern-form-title {
    font-size: 2rem;
    font-weight: 800;
    color: #7f53ac;
    margin-bottom: 0.5rem;
    letter-spacing: 0.01em;
    text-align: center;
  }
  .modern-form-label {
    font-size: 1.08rem;
    color: #232946;
    font-weight: 600;
    margin-bottom: 0.2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .modern-form-input {
    width: 100%;
    max-width: 320px;
    padding: 0.7rem 1rem;
    border-radius: 0.8rem;
    border: 1.5px solid #e0e7ff;
    background: #f7f8fa;
    font-size: 1.05rem;
    color: #232946;
    font-family: inherit;
    margin-top: 0.1rem;
    transition: border 0.2s, box-shadow 0.2s;
    outline: none;
    box-shadow: 0 1px 4px #7f53ac11;
  }
  .modern-form-input:focus {
    border: 1.5px solid #7f53ac;
    box-shadow: 0 2px 12px #7f53ac22;
    background: #fff;
  }
  .modern-data-input-btn-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.2rem;
    margin-top: 2.5rem;
  }
  .modern-data-input-btn {
    min-width: 160px;
    padding: 0.8rem 1.3rem;
    font-size: 1.05rem;
    font-weight: 700;
    border-radius: 1.1rem;
    border: none;
    background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
    color: #fff;
    box-shadow: 0 2px 12px #7f53ac22;
    margin: 0;
    transition: background 0.2s, transform 0.2s;
    cursor: pointer;
    margin-bottom: 0.5rem;
  }
  .modern-data-input-btn:hover {
    background: linear-gradient(90deg, #38b2ac 0%, #7f53ac 100%);
    transform: scale(1.04);
  }
  @media (max-width: 600px) {
    .modern-form-section {
      padding: 1.2rem 0.5rem;
      max-width: 98vw;
    }
    .modern-form-input {
      max-width: 98vw;
      font-size: 0.98rem;
      padding: 0.6rem 0.7rem;
    }
  }
`}</style>
            <div className="modern-form-section">
                <h2 className="modern-form-title">Data Input</h2>
                <div className="modern-data-input-form">
                    <DataForm onSubmit={handleSubmit} loading={loading} />
                </div>
                <div className="modern-data-input-btn-row">
                    <button className="modern-data-input-btn" data-variant="teal" onClick={importSmartwatch} disabled={loading}>Import from Smartwatch</button>
                    <button className="modern-data-input-btn" data-variant="yellow" onClick={handleDemo} disabled={loading}>Try Demo Data</button>
                    <button
                        className="modern-data-input-btn" data-variant="blue"
                        onClick={() => window.location.href = '/auth/fitbit'}
                        disabled={loading}
                    >
                        Connect Fitbit
                    </button>
                    <button className="modern-data-input-btn" data-variant="indigo" onClick={connectWatch} disabled={loading}>Connect Smart Watch (OAuth)</button>
                </div>
            </div>
        </>
    );
};

export default DataInput;