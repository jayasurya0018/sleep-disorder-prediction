import React, { useState } from 'react';
import { Upload, Watch, Zap, BarChart3 } from 'lucide-react';
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
        <div style={{ padding: 'var(--space-xl) 0' }}>
            {loading && <div className="spinner" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 'var(--z-modal)' }}></div>}
            
            <div className="container-custom" style={{ maxWidth: '700px' }}>
                <div className="card fade-in" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                        <h1 className="text-gradient" style={{ marginBottom: 'var(--space-sm)' }}>
                            Add Sleep Data
                        </h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Enter your sleep metrics manually or import from connected devices
                        </p>
                    </div>

                    {/* Data Form Component */}
                    <div style={{ marginBottom: 'var(--space-2xl)' }}>
                        <DataForm onSubmit={handleSubmit} loading={loading} />
                    </div>

                    {/* Quick Action Buttons */}
                    <div style={{
                        display: 'grid',
                        gap: 'var(--space-sm)',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        marginTop: 'var(--space-xl)'
                    }}>
                        <button
                            className="btn btn-secondary btn-full"
                            onClick={importSmartwatch}
                            disabled={loading}
                        >
                            <Upload size={18} />
                            Import Smartwatch
                        </button>

                        <button
                            className="btn btn-outline btn-full"
                            onClick={handleDemo}
                            disabled={loading}
                        >
                            <Zap size={18} />
                            Try Demo Data
                        </button>

                        <button
                            className="btn btn-outline btn-full"
                            onClick={() => window.location.href = '/auth/fitbit'}
                            disabled={loading}
                        >
                            <Watch size={18} />
                            Connect Fitbit
                        </button>

                        <button
                            className="btn btn-outline btn-full"
                            onClick={connectWatch}
                            disabled={loading}
                        >
                            <BarChart3 size={18} />
                            Smart Watch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataInput;