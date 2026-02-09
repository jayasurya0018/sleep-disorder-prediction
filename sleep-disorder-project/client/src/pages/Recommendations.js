import React, { useState, useEffect } from 'react';
import RecommendationCard from '../components/RecommendationCard';
import api from '../api.js';
import { Lightbulb, Utensils, BedDouble, Stethoscope, AlertTriangle } from 'lucide-react';

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
        <div style={{ padding: 'var(--space-xl) 0' }}>
            <div className="container-custom" style={{ maxWidth: '700px' }}>
                {/* Header */}
                <div className="card fade-in" style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                        <Lightbulb size={32} style={{ color: 'hsl(var(--primary))' }} />
                        <h1 className="text-gradient">AI Recommendations</h1>
                    </div>
                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>Personalized insights and recommendations for your sleep health</p>
                </div>

                {/* Error State */}
                {error && (
                    <div className="alert alert-destructive fade-in" style={{ marginBottom: 'var(--space-2xl)' }}>
                        <AlertTriangle size={18} />
                        <p>{error}</p>
                    </div>
                )}

                {/* Content */}
                {recs ? (
                    <>
                        {/* Disorder Info Card */}
                        <div className="card fade-in" style={{ marginBottom: 'var(--space-2xl)', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
                            <h2 className="text-gradient" style={{ marginBottom: 'var(--space-md)' }}>{recs.disorder || 'Sleep Analysis Complete'}</h2>
                            
                            <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
                                {recs.severity && (
                                    <div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-xs)' }}>Severity Level</div>
                                        <span className="badge" style={{
                                            backgroundColor: recs.severity === 'Severe' ? 'hsl(var(--destructive))' : recs.severity === 'Moderate' ? 'hsl(var(--warning))' : 'hsl(var(--success))',
                                            color: '#fff',
                                            padding: 'var(--space-xs) var(--space-md)',
                                            borderRadius: 'var(--radius-md)',
                                            fontWeight: 'var(--font-semibold)',
                                            display: 'inline-block'
                                        }}>{recs.severity}</span>
                                    </div>
                                )}
                            </div>

                            {recs.shapPlot && (
                                <div style={{ marginBottom: 'var(--space-lg)' }}>
                                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-sm)', color: 'hsl(var(--foreground))' }}>Explainable AI Analysis</h3>
                                    <img src={`data:image/png;base64,${recs.shapPlot}`} alt="SHAP explanation" style={{ maxWidth: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} />
                                </div>
                            )}

                            {recs.explanation && (
                                <div style={{ textAlign: 'left', padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'hsl(var(--foreground))' }}>
                                    {recs.explanation}
                                </div>
                            )}
                        </div>

                        {/* Recommendation Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
                            {recs.diet && (
                                <div className="card" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, var(--bg-secondary) 100%)' }}>
                                    <Utensils size={28} style={{ color: 'hsl(var(--primary))', marginBottom: 'var(--space-md)', margin: '0 auto var(--space-md) auto' }} />
                                    <h3 style={{ fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-md)', color: 'hsl(var(--foreground))' }}>Diet</h3>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>{recs.diet}</p>
                                </div>
                            )}
                            {recs.sleepPlan && (
                                <div className="card" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, var(--bg-secondary) 100%)' }}>
                                    <BedDouble size={28} style={{ color: 'hsl(var(--primary))', marginBottom: 'var(--space-md)', margin: '0 auto var(--space-md) auto' }} />
                                    <h3 style={{ fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-md)', color: 'hsl(var(--foreground))' }}>Sleep Plan</h3>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>{recs.sleepPlan}</p>
                                </div>
                            )}
                            {recs.consulting && (
                                <div className="card" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, var(--bg-secondary) 100%)' }}>
                                    <Stethoscope size={28} style={{ color: 'hsl(var(--primary))', marginBottom: 'var(--space-md)', margin: '0 auto var(--space-md) auto' }} />
                                    <h3 style={{ fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-md)', color: 'hsl(var(--foreground))' }}>Consulting</h3>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>{recs.consulting}</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <div className="spinner" style={{ margin: '0 auto var(--space-md) auto' }}></div>
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Analyzing your sleep data...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recommendations;
