import React, { useState, useEffect, useMemo } from 'react';
import AnalysisChart from '../components/AnalysisChart';
import ProgressBadges from '../components/ProgressBadges';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, Heart, Moon, AlertCircle } from 'lucide-react';
import api from '../api';

function Dashboard() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        api.get('/data/history')
            .then(res => {
                setHistory(res.data || []);
                setError(null);
                localStorage.setItem('dashboardHistory', JSON.stringify(res.data || []));
            })
            .catch(err => {
                const cached = localStorage.getItem('dashboardHistory');
                if (cached) {
                    setHistory(JSON.parse(cached));
                    setError('Loaded offline data. Some features may be limited.');
                } else {
                    setError('Failed to load data');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    // Defensive: always work with array
    const safeHistory = Array.isArray(history) ? history : [];

    // Chart data for SpO2
    const spo2Chart = {
        type: 'line',
        data: {
            labels: safeHistory.map((entry) => entry && entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''),
            datasets: [
                {
                    label: 'SpO2',
                    data: safeHistory.map((entry) => entry && entry.spo2 != null ? entry.spo2 : null),
                    borderColor: '#f59e42',
                    backgroundColor: 'rgba(245,158,66,0.15)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Recent SpO2 Levels' }
            }
        }
    };

    // Chart data for HRV
    const hrvChart = {
        type: 'line',
        data: {
            labels: safeHistory.map((entry) => entry && entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''),
            datasets: [
                {
                    label: 'HRV',
                    data: safeHistory.map((entry) => entry && entry.hrv != null ? entry.hrv : null),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37,99,235,0.15)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Recent HRV' }
            }
        }
    };

    // Chart data for Movement
    const movementChart = {
        type: 'bar',
        data: {
            labels: safeHistory.map((entry) => entry && entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''),
            datasets: [
                {
                    label: 'Movement',
                    data: safeHistory.map((entry) => entry && entry.movement != null ? entry.movement : null),
                    backgroundColor: '#38b2ac',
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Movement Count' }
            }
        }
    };

    // Chart data for Sleep Stages (stacked bar)
    const sleepStagesLabels = ['Awake', 'REM', 'Light', 'Deep'];
    const sleepStagesChart = {
        type: 'bar',
        data: {
            labels: safeHistory.map((entry) => entry && entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''),
            datasets: sleepStagesLabels.map((stage, idx) => ({
                label: stage,
                data: safeHistory.map((entry) => {
                    let stages = [];
                    if (entry && entry.sleepStages) {
                        if (Array.isArray(entry.sleepStages)) {
                            stages = entry.sleepStages;
                        } else if (typeof entry.sleepStages === 'string') {
                            stages = entry.sleepStages.split(',');
                        }
                    }
                    return stages.filter(s => s === stage).length;
                }),
                backgroundColor: ['#fbbf24', '#6366f1', '#60a5fa', '#10b981'][idx],
                stack: 'sleepStages',
            }))
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Sleep Stages Distribution' }
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    };

    // --- Analytics ---
    const analytics = useMemo(() => {
        if (!Array.isArray(history) || !history.length) return null;
        // Weekly/Monthly trends
        const byWeek = {};
        let bestDay = null, worstDay = null;
        let bestScore = -Infinity, worstScore = Infinity;
        let anomalies = [];
        history.forEach(entry => {
            if (!entry || !entry.timestamp) return;
            const date = new Date(entry.timestamp);
            const week = `${date.getFullYear()}-W${Math.ceil((date.getDate() + 6 - date.getDay()) / 7)}`;
            byWeek[week] = byWeek[week] || [];
            byWeek[week].push(entry);
            // Simple sleep score: SpO2 + HRV - Movement
            const score = (entry.spo2 || 0) + (entry.hrv || 0) - (entry.movement || 0);
            if (score > bestScore) { bestScore = score; bestDay = entry; }
            if (score < worstScore) { worstScore = score; worstDay = entry; }
        });
        // Anomaly detection: flag nights with SpO2 < 92 or HRV < 40
        anomalies = history.filter(e => e && ((e.spo2 && e.spo2 < 92) || (e.hrv && e.hrv < 40)));
        // Weekly trend data
        const weeklyLabels = Object.keys(byWeek);
        const weeklySpO2 = weeklyLabels.map(w => Math.round(byWeek[w].reduce((a, b) => a + (b.spo2 || 0), 0) / byWeek[w].length));
        const weeklyHRV = weeklyLabels.map(w => Math.round(byWeek[w].reduce((a, b) => a + (b.hrv || 0), 0) / byWeek[w].length));
        return { weeklyLabels, weeklySpO2, weeklyHRV, bestDay, worstDay, anomalies };
    }, [history]);

    // Weekly trend charts
    const weeklySpo2Chart = analytics && analytics.weeklyLabels && analytics.weeklySpO2 ? {
        type: 'line',
        data: {
            labels: analytics.weeklyLabels,
            datasets: [
                {
                    label: 'Weekly Avg SpO2',
                    data: analytics.weeklySpO2,
                    borderColor: '#f59e42',
                    backgroundColor: 'rgba(245,158,66,0.15)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Weekly SpO2 Trend' }
            }
        }
    } : null;
    const weeklyHrvChart = analytics && analytics.weeklyLabels && analytics.weeklyHRV ? {
        type: 'line',
        data: {
            labels: analytics.weeklyLabels,
            datasets: [
                {
                    label: 'Weekly Avg HRV',
                    data: analytics.weeklyHRV,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168,85,247,0.15)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Weekly HRV Trend' }
            }
        }
    } : null;

    // Quick stats
    const stats = useMemo(() => {
        if (!safeHistory.length) return null;
        const latest = safeHistory[safeHistory.length - 1];
        const avgSpO2 = Math.round(safeHistory.reduce((a, b) => a + (b.spo2 || 0), 0) / safeHistory.length);
        const avgHRV = Math.round(safeHistory.reduce((a, b) => a + (b.hrv || 0), 0) / safeHistory.length);
        const avgMovement = Math.round(safeHistory.reduce((a, b) => a + (b.movement || 0), 0) / safeHistory.length);
        return { latest, avgSpO2, avgHRV, avgMovement };
    }, [safeHistory]);

    if (loading) {
        return (
            <div className="container-custom" style={{ padding: 'var(--space-2xl) var(--space-md)' }}>
                <div className="fade-in" style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: 'var(--space-md)', color: 'hsl(var(--muted-foreground))' }}>
                        Loading your dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-custom" style={{ padding: 'var(--space-2xl) var(--space-md)' }}>
                <div className="alert alert-warning">
                    <AlertCircle size={20} />
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 'var(--space-xl) 0' }}>
            <div className="container-custom">
                {/* Header */}
                <div style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
                    <h1 className="text-gradient" style={{ marginBottom: 'var(--space-sm)' }}>
                        Sleep Analytics Dashboard
                    </h1>
                    <p style={{ fontSize: 'var(--text-lg)', color: 'hsl(var(--muted-foreground))' }}>
                        Track your sleep patterns and health metrics
                    </p>
                </div>

                {/* Quick Actions */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-sm)',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--space-2xl)'
                }}>
                    <button onClick={() => navigate('/data-input')} className="btn btn-primary">
                        <Activity size={18} />
                        Add Data
                    </button>
                    <button onClick={() => navigate('/analysis')} className="btn btn-secondary">
                        <TrendingUp size={18} />
                        Run Analysis
                    </button>
                    <button onClick={() => navigate('/recommendations')} className="btn btn-outline">
                        <Heart size={18} />
                        Recommendations
                    </button>
                </div>

                {/* Progress Badges */}
                <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <ProgressBadges badges={['streak', 'improvement', 'early']} />
                </div>

                {safeHistory.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                        <Moon size={64} style={{ margin: '0 auto var(--space-lg)', color: 'hsl(var(--muted-foreground))' }} />
                        <h3 style={{ marginBottom: 'var(--space-sm)' }}>No Data Yet</h3>
                        <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-lg)' }}>
                            Start tracking your sleep to see analytics here
                        </p>
                        <button onClick={() => navigate('/data-input')} className="btn btn-primary btn-lg">
                            Add Your First Entry
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid-auto-fit" style={{ marginBottom: 'var(--space-2xl)' }}>
                                <div className="stat-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <div className="stat-label">Avg SpO2</div>
                                            <div className="stat-value">{stats.avgSpO2}%</div>
                                        </div>
                                        <Activity size={24} style={{ color: 'hsl(var(--primary))' }} />
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <div className="stat-label">Avg HRV</div>
                                            <div className="stat-value">{stats.avgHRV}</div>
                                        </div>
                                        <Heart size={24} style={{ color: 'hsl(var(--primary))' }} />
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <div className="stat-label">Avg Movement</div>
                                            <div className="stat-value">{stats.avgMovement}</div>
                                        </div>
                                        <TrendingUp size={24} style={{ color: 'hsl(var(--primary))' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Charts Grid */}
                        <div className="grid-auto-fit" style={{ marginBottom: 'var(--space-2xl)' }}>
                            <div className="card">
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-sm)' }}>
                                    SpO2 Levels
                                </h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>
                                    Blood oxygen trends
                                </p>
                                <AnalysisChart type="line" data={spo2Chart.data} options={spo2Chart.options} />
                            </div>
                            
                            <div className="card">
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-sm)' }}>
                                    Heart Rate Variability
                                </h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>
                                    HRV trends
                                </p>
                                <AnalysisChart type="line" data={hrvChart.data} options={hrvChart.options} />
                            </div>
                        </div>

                        <div className="grid-auto-fit" style={{ marginBottom: 'var(--space-2xl)' }}>
                            <div className="card">
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-sm)' }}>
                                    Movement Count
                                </h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>
                                    Nighttime movement
                                </p>
                                <AnalysisChart type="bar" data={movementChart.data} options={movementChart.options} />
                            </div>
                            
                            <div className="card">
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-sm)' }}>
                                    Sleep Stages
                                </h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>
                                    Sleep stage distribution
                                </p>
                                <AnalysisChart type="bar" data={sleepStagesChart.data} options={sleepStagesChart.options} />
                            </div>
                        </div>

                        {/* Weekly Trends */}
                        {(weeklySpo2Chart || weeklyHrvChart) && (
                            <div className="grid-auto-fit" style={{ marginBottom: 'var(--space-2xl)' }}>
                                {weeklySpo2Chart && (
                                    <div className="card">
                                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-sm)' }}>
                                            Weekly SpO2 Trend
                                        </h3>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>
                                            Weekly averages
                                        </p>
                                        <AnalysisChart type="line" data={weeklySpo2Chart.data} options={weeklySpo2Chart.options} />
                                    </div>
                                )}
                                {weeklyHrvChart && (
                                    <div className="card">
                                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-sm)' }}>
                                            Weekly HRV Trend
                                        </h3>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>
                                            Weekly averages
                                        </p>
                                        <AnalysisChart type="line" data={weeklyHrvChart.data} options={weeklyHrvChart.options} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Insights */}
                        {analytics && (
                            <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
                                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', marginBottom: 'var(--space-lg)' }}>
                                    Sleep Insights
                                </h2>
                                
                                <div style={{ display: 'grid', gap: 'var(--space-lg)', gridTemplateColumns: '1fr', '@media (minWidth: 768px)': { gridTemplateColumns: '1fr 1fr' } }}>
                                    {analytics.bestDay && (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                                <TrendingUp size={20} style={{ color: 'hsl(var(--success))' }} />
                                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'hsl(var(--success))' }}>
                                                    Best Sleep Day
                                                </h3>
                                            </div>
                                            <div className="badge badge-success" style={{ marginBottom: 'var(--space-xs)' }}>
                                                {new Date(analytics.bestDay.timestamp).toLocaleDateString()}
                                            </div>
                                            <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))' }}>
                                                SpO2: {analytics.bestDay.spo2}% | HRV: {analytics.bestDay.hrv} | Movement: {analytics.bestDay.movement}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {analytics.worstDay && (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                                <TrendingDown size={20} style={{ color: 'hsl(var(--destructive))' }} />
                                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'hsl(var(--destructive))' }}>
                                                    Needs Improvement
                                                </h3>
                                            </div>
                                            <div className="badge badge-danger" style={{ marginBottom: 'var(--space-xs)' }}>
                                                {new Date(analytics.worstDay.timestamp).toLocaleDateString()}
                                            </div>
                                            <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))' }}>
                                                SpO2: {analytics.worstDay.spo2}% | HRV: {analytics.worstDay.hrv} | Movement: {analytics.worstDay.movement}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                {analytics.anomalies && analytics.anomalies.length > 0 && (
                                    <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-md)', background: 'hsl(var(--warning) / 0.1)', borderRadius: 'var(--radius-lg)', border: '1px solid hsl(var(--warning) / 0.3)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                            <AlertCircle size={20} style={{ color: 'hsl(var(--warning))' }} />
                                            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'hsl(var(--warning))' }}>
                                                Anomalies Detected ({analytics.anomalies.length})
                                            </h3>
                                        </div>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))' }}>
                                            Days with SpO2 &lt; 92% or HRV &lt; 40
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Data Table */}
                        <div className="card" style={{ overflowX: 'auto' }}>
                            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', marginBottom: 'var(--space-lg)' }}>
                                Recent Entries
                            </h2>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid hsl(var(--border))' }}>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'left', fontWeight: '600' }}>Date</th>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'left', fontWeight: '600' }}>Sleep Stages</th>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'left', fontWeight: '600' }}>HRV</th>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'left', fontWeight: '600' }}>SpO2</th>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'left', fontWeight: '600' }}>Movement</th>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'left', fontWeight: '600' }}>Breathing</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safeHistory.slice(-10).reverse().map((entry, idx) => (
                                        <tr key={entry._id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                                            <td style={{ padding: 'var(--space-sm)' }}>
                                                {new Date(entry.timestamp).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: 'var(--space-sm)', fontSize: 'var(--text-sm)' }}>
                                                {Array.isArray(entry.sleepStages) ? entry.sleepStages.join(', ') : entry.sleepStages}
                                            </td>
                                            <td style={{ padding: 'var(--space-sm)' }}>{entry.hrv}</td>
                                            <td style={{ padding: 'var(--space-sm)' }}>{entry.spo2}%</td>
                                            <td style={{ padding: 'var(--space-sm)' }}>{entry.movement}</td>
                                            <td style={{ padding: 'var(--space-sm)' }}>{entry.breathing}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Dashboard;