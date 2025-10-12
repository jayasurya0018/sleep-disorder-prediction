import React, { useState, useEffect } from 'react';
import RecommendationCard from '../components/RecommendationCard';
import api from '../api.js';

const recColors = {
    diet: '#38b2ac',
    sleepPlan: '#7f53ac',
    consulting: '#2563eb'
};

const Recommendations = () => {
    const [recs, setRecs] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                // Use analyze so we get disorder/severity/explanation + recommendations
                const res = await api.post('/ml/analyze');
                if (res.data && (res.data.error || res.data.message)) {
                    setError(res.data.error || res.data.message || 'Unknown error');
                    setRecs(null);
                } else {
                    setRecs(res.data);
                }
            } catch (err) {
                let msg = 'Failed to fetch AI recommendations. Please try again later.';
                if (err && err.response && err.response.data) {
                    if (typeof err.response.data === 'object') {
                        msg = err.response.data.error || err.response.data.message || msg;
                    } else if (typeof err.response.data === 'string') {
                        msg = err.response.data;
                    }
                }
                setError(msg);
            }
        };
        fetchRecs();
    }, []);

    return (
        <>
            <style>{`
                body, .modern-recs-bg, .modern-recs-container {
                    font-family: 'Inter', 'Poppins', Arial, sans-serif;
                }
                .modern-recs-bg {
                    min-height: 80vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #e0e7ff 0%, #f5f7fa 100%);
                    padding: 2rem 1rem;
                }
                .modern-recs-container {
                    background: rgba(255,255,255,0.98);
                    border-radius: 2rem;
                    box-shadow: 0 8px 32px rgba(100, 125, 222, 0.18);
                    padding: 2.5rem 2rem;
                    max-width: 600px;
                    width: 100%;
                    margin: 2rem auto;
                    text-align: center;
                    animation: fade-in 0.7s;
                }
                .modern-recs-title {
                    font-size: 2.2rem;
                    font-weight: 800;
                    font-family: 'Poppins', 'Inter', Arial, sans-serif;
                    background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                    margin-bottom: 1.5rem;
                    text-shadow: 0 2px 12px #38b2ac33;
                    letter-spacing: 0.02em;
                }
                .modern-recs-error {
                    color: #f87171;
                    background: rgba(248, 113, 113, 0.15);
                    border-radius: 12px;
                    padding: 0.75rem 1.25rem;
                    margin-bottom: 1.25rem;
                    font-weight: 600;
                    box-shadow: 0 0 8px rgba(248, 113, 113, 0.3);
                    border: 1px solid #f87171;
                }
            `}</style>
            <div className="modern-recs-bg">
                <div className="modern-recs-container">
                    <h1 className="modern-recs-title">Your Recommendations</h1>
                    {error && <div className="modern-recs-error">{error}</div>}
                    {recs ? (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <h2 style={{ margin: 0 }}>{recs.disorder || 'No clear disorder detected'}</h2>
                                <div style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Severity: <strong>{recs.severity || 'Unknown'}</strong></div>
                                {recs.shapPlot ? (
                                    <img src={`data:image/png;base64,${recs.shapPlot}`} alt="SHAP explanation" style={{ maxWidth: '100%', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', marginBottom: '1rem' }} />
                                ) : null}
                                <p style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{recs.explanation}</p>
                            </div>
                            <RecommendationCard title="Diet" content={recs.diet} color={recColors.diet} />
                            <RecommendationCard title="Sleep Plan" content={recs.sleepPlan} color={recColors.sleepPlan} />
                            <RecommendationCard title="Consulting" content={recs.consulting} color={recColors.consulting} />
                        </>
                    ) : (
                        <p>Loading recommendations...</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default Recommendations;
