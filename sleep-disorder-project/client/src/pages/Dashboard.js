import React, { useState, useEffect, useMemo } from 'react';
import AnalysisChart from '../components/AnalysisChart';
import ProgressBadges from '../components/ProgressBadges';
import { useNavigate } from 'react-router-dom';
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
                // Save to localStorage for offline support
                localStorage.setItem('dashboardHistory', JSON.stringify(res.data || []));
            })
            .catch(err => {
                // Try to load from localStorage if offline or error
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

    const Skeleton = ({ height = 32, width = '100%', style = {} }) => (
        <div style={{
            background: 'linear-gradient(90deg,#e0e7ef 25%,#f5f7fa 50%,#e0e7ef 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-shimmer 1.2s infinite linear',
            borderRadius: 12,
            height,
            width,
            margin: '12px 0',
            ...style
        }} />
    );

    return (
        <>
            <style>{`
                @keyframes skeleton-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                body, .modern-dashboard-bg, .modern-dashboard-container {
                    font-family: 'Inter', 'Poppins', Arial, sans-serif;
                }
                .modern-dashboard-bg {
                    min-height: 100vh;
                    padding: 2rem 1rem;
                    background: linear-gradient(135deg, #e0e7ff 0%, #f5f7fa 100%);
                }
                .modern-dashboard-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 2.5rem;
                }
                .modern-dashboard-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    font-family: 'Poppins', 'Inter', Arial, sans-serif;
                    background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                    margin-bottom: 1rem;
                    text-align: center;
                    text-shadow: 0 2px 12px #38b2ac33;
                    letter-spacing: 0.02em;
                    animation: fade-in 0.7s;
                }
                .modern-dashboard-desc {
                    font-size: 1.2rem;
                    color: #232946cc;
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .modern-dashboard-btns {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    justify-content: center;
                    margin-bottom: 2rem;
                }
                .modern-dashboard-btn {
                    background: linear-gradient(135deg, #7f53ac 0%, #38b2ac 100%);
                    color: #fff;
                    font-weight: 700;
                    font-size: 1.1rem;
                    border: none;
                    border-radius: 1rem;
                    padding: 1rem 2.2rem;
                    box-shadow: 0 8px 24px rgba(100, 125, 222, 0.18);
                    transition: background 0.3s, box-shadow 0.3s, transform 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    cursor: pointer;
                    outline: none;
                }
                .modern-dashboard-btn:hover {
                    background: linear-gradient(135deg, #232946 0%, #7f53ac 100%);
                    box-shadow: 0 12px 32px rgba(35, 41, 70, 0.18);
                    transform: translateY(-2px) scale(1.04);
                }
                .modern-dashboard-analytics {
                    background: rgba(255,255,255,0.98);
                    border-radius: 2rem;
                    box-shadow: 0 8px 32px rgba(100, 125, 222, 0.18);
                    padding: 2rem 1.5rem;
                    margin-bottom: 2rem;
                    animation: fade-in 0.7s;
                }
                .dashboard-table {
                    background: rgba(255,255,255,0.92);
                    border-radius: 1.2rem;
                    box-shadow: 0 4px 16px rgba(100, 125, 222, 0.10);
                    margin-top: 2rem;
                    border-collapse: separate;
                    border-spacing: 0;
                    overflow: hidden;
                }
                .dashboard-table th, .dashboard-table td {
                    padding: 0.8rem 1.1rem;
                    text-align: left;
                }
                .dashboard-table th {
                    background: #38b2ac;
                    color: #fff;
                    font-weight: 700;
                }
                .dashboard-table tr:nth-child(even) {
                    background: #f5f7fa;
                }
                .modern-form-section {
                    background: #fff;
                    border-radius: 1.5rem;
                    box-shadow: 0 4px 24px #7f53ac22;
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
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: none; }
                }
            `}</style>
            <div className="modern-dashboard-bg">
                <div className="modern-dashboard-container">
                    <div>
                        <h1 className="modern-dashboard-title">Modern Analytics Dashboard</h1>
                        <p className="modern-dashboard-desc">Beautiful, interactive charts with modern design</p>
                    </div>
                    <div className="modern-dashboard-btns">
                        <button className="modern-dashboard-btn" onClick={() => navigate('/data-input')}>Add Data</button>
                        <button className="modern-dashboard-btn" onClick={() => navigate('/analysis')}>Run Analysis</button>
                        <button className="modern-dashboard-btn" onClick={() => navigate('/recommendations')}>View Recommendations</button>
                    </div>
                    {/* Progress Badges: demo badges for now, will add real logic next */}
                    <ProgressBadges badges={['streak', 'improvement', 'early']} />
                    {loading ? (
                        <div>
                            <Skeleton height={40} width="60%" style={{ margin: '24px auto' }} />
                            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                <Skeleton height={220} width="48%" />
                                <Skeleton height={220} width="48%" />
                            </div>
                            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 24 }}>
                                <Skeleton height={220} width="48%" />
                                <Skeleton height={220} width="48%" />
                            </div>
                            <Skeleton height={40} width="80%" style={{ margin: '32px auto' }} />
                            <Skeleton height={32} width="100%" />
                            <Skeleton height={32} width="100%" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-12">{error}</div>
                    ) : history.length > 0 ? (
                        <>
                            <div className="modern-dashboard-analytics grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h2 className="text-lg font-semibold mb-1">SpO2 Levels</h2>
                                    <p className="text-xs text-muted-foreground mb-2">Recent blood oxygen trends</p>
                                    <AnalysisChart
                                        type="line"
                                        data={spo2Chart.data}
                                        options={spo2Chart.options}
                                        style={{ height: 300 }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold mb-1">HRV</h2>
                                    <p className="text-xs text-muted-foreground mb-2">Heart Rate Variability</p>
                                    <AnalysisChart
                                        type="line"
                                        data={hrvChart.data}
                                        options={hrvChart.options}
                                        style={{ height: 300 }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold mb-1">Movement</h2>
                                    <p className="text-xs text-muted-foreground mb-2">Movement Count</p>
                                    <AnalysisChart
                                        type="bar"
                                        data={movementChart.data}
                                        options={movementChart.options}
                                        style={{ height: 300 }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold mb-1">Sleep Stages</h2>
                                    <p className="text-xs text-muted-foreground mb-2">Distribution of sleep stages</p>
                                    <AnalysisChart
                                        type="bar"
                                        data={sleepStagesChart.data}
                                        options={sleepStagesChart.options}
                                        style={{ height: 300 }}
                                    />
                                </div>
                            </div>
                            <div className="modern-dashboard-analytics grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                                {weeklySpo2Chart && (
                                    <div>
                                        <h2 className="text-lg font-semibold mb-1">Weekly Avg SpO2</h2>
                                        <p className="text-xs text-muted-foreground mb-2">Weekly blood oxygen trend</p>
                                        <AnalysisChart
                                            type="line"
                                            data={weeklySpo2Chart.data}
                                            options={weeklySpo2Chart.options}
                                            style={{ height: 300 }}
                                        />
                                    </div>
                                )}
                                {weeklyHrvChart && (
                                    <div>
                                        <h2 className="text-lg font-semibold mb-1">Weekly Avg HRV</h2>
                                        <p className="text-xs text-muted-foreground mb-2">Weekly HRV trend</p>
                                        <AnalysisChart
                                            type="line"
                                            data={weeklyHrvChart.data}
                                            options={weeklyHrvChart.options}
                                            style={{ height: 300 }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="modern-dashboard-analytics mt-10">
                                <h3 className="text-xl font-semibold mb-4 text-primary">Best Sleep Day</h3>
                                {analytics && analytics.bestDay && (
                                    <div className="text-green-700 font-semibold">
                                        {new Date(analytics.bestDay.timestamp).toLocaleDateString()} - SpO2: {analytics.bestDay.spo2}, HRV: {analytics.bestDay.hrv}, Movement: {analytics.bestDay.movement}
                                    </div>
                                )}
                                <h3 className="text-xl font-semibold mt-8 mb-4 text-destructive">Worst Sleep Day</h3>
                                {analytics && analytics.worstDay && (
                                    <div className="text-red-700 font-semibold">
                                        {new Date(analytics.worstDay.timestamp).toLocaleDateString()} - SpO2: {analytics.worstDay.spo2}, HRV: {analytics.worstDay.hrv}, Movement: {analytics.worstDay.movement}
                                    </div>
                                )}
                                {analytics && analytics.anomalies.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-lg font-semibold text-yellow-600">Anomalies Detected</h3>
                                        <ul>
                                            {analytics.anomalies.map((a, i) => (
                                                <li key={i} className="text-yellow-700">
                                                    {new Date(a.timestamp).toLocaleDateString()} - SpO2: {a.spo2}, HRV: {a.hrv}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="overflow-x-auto mt-10">
                                <table className="dashboard-table w-full text-sm">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Sleep Stages</th>
                                            <th>HRV</th>
                                            <th>SpO2</th>
                                            <th>Movement</th>
                                            <th>Breathing</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((entry) => (
                                            <tr key={entry._id}>
                                                <td>{new Date(entry.timestamp).toLocaleDateString()}</td>
                                                <td>{Array.isArray(entry.sleepStages) ? entry.sleepStages.join(', ') : entry.sleepStages}</td>
                                                <td>{entry.hrv}</td>
                                                <td>{entry.spo2}</td>
                                                <td>{entry.movement}</td>
                                                <td>{entry.breathing}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-muted-foreground">No data available. Add data to get started.</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default Dashboard;