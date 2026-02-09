import React, { useState, useEffect, useMemo } from 'react';
import AnalysisChart from '../components/AnalysisChart';
import api from '../api';
import { AlertTriangle, Utensils, BedDouble, Stethoscope, Download, Share2, Star, ArrowUpRight, BarChart3, Zap, TrendingUp } from 'lucide-react';

function Analysis() {
	const [history, setHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [mlResult, setMlResult] = useState(null);
	const [mlLoading, setMlLoading] = useState(false);
	const [mlError, setMlError] = useState(null);

	useEffect(() => {
		setLoading(true);
		 api.get('/data/history')
			.then(res => {
				setHistory(res.data || []);
				setError(null);
			})
			.catch(err => {
				setError('Failed to load data');
			})
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		setMlLoading(true);
		 api.post('/ml/analyze')
			.then(res => {
				setMlResult(res.data || null);
				setMlError(null);
			})
			.catch(err => {
				setMlError('Failed to get AI analysis');
			})
			.finally(() => setMlLoading(false));
	}, []);

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


	// Additional Chart: Sleep Duration
	function SleepDurationChart({ history }) {
		const data = {
			labels: history.map((entry) => entry && entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''),
			datasets: [
				{
					label: 'Sleep Duration (hrs)',
					data: history.map((entry) => entry && entry.sleepDuration != null ? entry.sleepDuration : null),
					borderColor: '#38b2ac',
					backgroundColor: 'rgba(56,178,172,0.15)',
					fill: true,
				},
			],
		};
		const options = {
			responsive: true,
			plugins: {
				legend: { position: 'top' },
				title: { display: true, text: 'Sleep Duration Over Time' },
			},
			scales: {
				y: { beginAtZero: true, title: { display: true, text: 'Hours' } },
			},
		};
		return <AnalysisChart type="line" data={data} options={options} style={{ height: 300 }} aria-label="Sleep Duration Chart" />;
	}

	// Additional Chart: Breathing Rate
	function BreathingRateChart({ history }) {
		const data = {
			labels: history.map((entry) => entry && entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''),
			datasets: [
				{
					label: 'Breathing Rate',
					data: history.map((entry) => entry && entry.breathing != null ? entry.breathing : null),
					borderColor: '#a3e635',
					backgroundColor: 'rgba(163,230,53,0.15)',
					fill: true,
				},
			],
		};
		const options = {
			responsive: true,
			plugins: {
				legend: { position: 'top' },
				title: { display: true, text: 'Breathing Rate Over Time' },
			},
			scales: {
				y: { beginAtZero: true, title: { display: true, text: 'Breaths/min' } },
			},
		};
		return <AnalysisChart type="line" data={data} options={options} style={{ height: 300 }} aria-label="Breathing Rate Chart" />;
	}

	function PersonalizedTips({ mlResult, history }) {
		if (!mlResult) return null;
		let tips = [];
		const last = history && history.length ? history[history.length - 1] : {};
		if (last.hrv && last.hrv < 50) tips.push('Your HRV is low. Try relaxation techniques like deep breathing or yoga before bed.');
		if (last.movement && last.movement > 8) tips.push('High movement detected. Consider a calming bedtime routine and avoid caffeine late in the day.');
		if (last.spo2 && last.spo2 < 95) tips.push('Your SpO2 is below normal. Ensure your sleeping environment is well-ventilated and consult a doctor if this persists.');
		if (last.breathing && (last.breathing < 12 || last.breathing > 20)) tips.push('Abnormal breathing rate detected. Practice mindful breathing and consult a healthcare professional if you feel unwell.');
		if (!tips.length) tips.push('Keep up the good sleep habits! Try meditation before bed and avoid screens 30 minutes before sleep for better quality.');
		return (
			<ul style={{ listStylePosition: 'inside', margin: 0, padding: 0 }}>
				{tips.map((tip, i) => (
					<li key={i} style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--foreground))', marginBottom: 'var(--space-sm)', lineHeight: 1.6 }}>{tip}</li>
				))}
			</ul>
		);
	}

	function ProgressTracker({ analytics }) {
		if (!analytics || !analytics.bestDay || !analytics.worstDay) return null;
		const improvement = Math.max(0, ((analytics.bestDay.spo2 + analytics.bestDay.hrv) - (analytics.worstDay.spo2 + analytics.worstDay.hrv)));
		return (
			<div className="card fade-in" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)', color: '#fff', textAlign: 'center', padding: 'var(--space-2xl)' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)' }}>
					<ArrowUpRight size={24} />
					<div>
						<div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>Sleep Quality Improved</div>
						<div style={{ fontSize: 'var(--text-sm)', opacity: 0.9 }}>{improvement}% increase this period</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={{ padding: 'var(--space-xl) 0' }}>
			<div className="container-custom">
				{/* Header */}
				<div className="card fade-in" style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
					<h1 className="text-gradient" style={{ marginBottom: 'var(--space-sm)' }}>Sleep Analysis</h1>
					<p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 'var(--text-lg)' }}>
						AI-powered insights into your sleep patterns
					</p>
				</div>

				{/* AI Analysis Result */}
				{mlLoading ? (
					<div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
						<div className="spinner" style={{ margin: '0 auto' }}></div>
						<p style={{ marginTop: 'var(--space-md)', color: 'hsl(var(--muted-foreground))' }}>Analyzing your sleep data...</p>
					</div>
				) : mlError ? (
					<div className="alert alert-destructive fade-in" style={{ marginBottom: 'var(--space-2xl)' }}>
						<AlertTriangle size={18} />
						<p>{mlError}</p>
					</div>
				) : mlResult && (
					<div className="card fade-in" style={{ marginBottom: 'var(--space-2xl)', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
						<h2 className="text-gradient" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-md)' }}>AI Sleep Disorder Detection</h2>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
							<div>
								<h3 style={{ fontWeight: 'var(--font-bold)', color: 'hsl(var(--foreground))', marginBottom: 'var(--space-sm)' }}>Detected Disorder</h3>
								<div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'hsl(var(--primary))', marginBottom: 'var(--space-sm)' }}>{mlResult.disorder}</div>
								<div style={{ marginBottom: 'var(--space-sm)' }}>
									<span style={{ fontWeight: 'var(--font-semibold)', marginRight: 'var(--space-xs)' }}>Severity:</span>
									<span className="badge" style={{
										backgroundColor: mlResult.severity === 'Severe' ? 'hsl(var(--destructive))' : mlResult.severity === 'Moderate' ? 'hsl(var(--warning))' : 'hsl(var(--success))',
										color: '#fff',
										padding: 'var(--space-xs) var(--space-md)',
										borderRadius: 'var(--radius-md)',
										fontWeight: 'var(--font-semibold)',
										display: 'inline-block'
									}}>{mlResult.severity}</span>
								</div>
								<p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 'var(--text-sm)' }}>{mlResult.explanation}</p>
							</div>
							{mlResult.shapPlot && (
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
									<h3 style={{ fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-sm)', color: 'hsl(var(--foreground))' }}>Explainable AI (SHAP)</h3>
									<img src={`data:image/png;base64,${mlResult.shapPlot}`} alt="SHAP Explanation" style={{ maxWidth: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} />
								</div>
							)}
						</div>

						{/* Recommendations */}
						{mlResult.severity === 'Severe' && (
							<div className="alert alert-warning fade-in" style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
								<AlertTriangle size={20} />
								<div>
									<h4 style={{ fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-xs)' }}>Severe abnormality detected</h4>
									<p style={{ marginBottom: 'var(--space-md)' }}>Strongly recommended to consult a healthcare professional.</p>
									<a href="https://www.sleepfoundation.org/sleep-disorders" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-destructive">Find a Specialist</a>
								</div>
							</div>
						)}

						{/* Recommendation Cards */}
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
							<div className="card" style={{ background: 'var(--bg-secondary)', border: 'var(--border-input)', textAlign: 'center' }}>
								<Utensils size={32} style={{ color: 'hsl(var(--primary))', margin: '0 auto var(--space-md) auto' }} />
								<h4 style={{ fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-sm)' }}>Diet Recommendation</h4>
								<p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>{mlResult.diet}</p>
								<a href="https://www.eatright.org/health/wellness/sleep" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">Learn More</a>
							</div>
							<div className="card" style={{ background: 'var(--bg-secondary)', border: 'var(--border-input)', textAlign: 'center' }}>
								<BedDouble size={32} style={{ color: 'hsl(var(--primary))', margin: '0 auto var(--space-md) auto' }} />
								<h4 style={{ fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-sm)' }}>Sleep Plan</h4>
								<p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>{mlResult.sleepPlan}</p>
								<a href="https://www.sleepfoundation.org/sleep-doctors" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">Book Appointment</a>
							</div>
							<div className="card" style={{ background: 'var(--bg-secondary)', border: 'var(--border-input)', textAlign: 'center' }}>
								<Stethoscope size={32} style={{ color: 'hsl(var(--primary))', margin: '0 auto var(--space-md) auto' }} />
								<h4 style={{ fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-sm)' }}>Consulting</h4>
								<p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>{mlResult.consulting}</p>
								<a href="https://www.sleepfoundation.org/sleep-clinics" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">Find Clinics</a>
							</div>
						</div>
					</div>
				)}

				{/* Charts Section */}
				{loading ? (
					<div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
						<div className="spinner" style={{ margin: '0 auto' }}></div>
						<p style={{ marginTop: 'var(--space-md)', color: 'hsl(var(--muted-foreground))' }}>Loading analysis...</p>
					</div>
				) : error ? (
					<div className="alert alert-destructive fade-in">
						<AlertTriangle size={18} />
						<p>{error}</p>
					</div>
				) : (
					<>
						{/* Main Charts Grid */}
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
							<div className="card">
								<h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-xs)' }}>SpO2 Levels</h3>
								<p style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>Recent blood oxygen trends</p>
								<AnalysisChart type="line" data={spo2Chart.data} options={spo2Chart.options} style={{ height: 300 }} />
							</div>
							<div className="card">
								<h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-xs)' }}>HRV</h3>
								<p style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>Heart Rate Variability</p>
								<AnalysisChart type="line" data={hrvChart.data} options={hrvChart.options} style={{ height: 300 }} />
							</div>
							<div className="card">
								<h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-xs)' }}>Movement</h3>
								<p style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>Movement Count</p>
								<AnalysisChart type="bar" data={movementChart.data} options={movementChart.options} style={{ height: 300 }} />
							</div>
							<div className="card">
								<h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-xs)' }}>Sleep Stages</h3>
								<p style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>Sleep stages distribution</p>
								<AnalysisChart type="bar" data={sleepStagesChart.data} options={sleepStagesChart.options} style={{ height: 300 }} />
							</div>
						</div>

						{/* Weekly Trends */}
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
							{weeklySpo2Chart && (
								<div className="card">
									<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
										<TrendingUp size={20} style={{ color: 'hsl(var(--primary))' }} />
										<h3 style={{ fontWeight: 'var(--font-semibold)' }}>Weekly Avg SpO2</h3>
									</div>
									<p style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>Blood oxygen trend</p>
									<AnalysisChart type="line" data={weeklySpo2Chart.data} options={weeklySpo2Chart.options} style={{ height: 300 }} />
								</div>
							)}
							{weeklyHrvChart && (
								<div className="card">
									<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
										<BarChart3 size={20} style={{ color: 'hsl(var(--primary))' }} />
										<h3 style={{ fontWeight: 'var(--font-semibold)' }}>Weekly Avg HRV</h3>
									</div>
									<p style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>HRV trend analysis</p>
									<AnalysisChart type="line" data={weeklyHrvChart.data} options={weeklyHrvChart.options} style={{ height: 300 }} />
								</div>
							)}
						</div>

						{/* Sleep Duration & Breathing Rate */}
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
							<div className="card">
								<h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-xs)' }}>Sleep Duration</h3>
								<p style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>Total hours slept each night</p>
								<SleepDurationChart history={safeHistory} />
							</div>
							<div className="card">
								<h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-xs)' }}>Breathing Rate</h3>
								<p style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>Breaths per minute during sleep</p>
								<BreathingRateChart history={safeHistory} />
							</div>
						</div>

						{/* Insights Section */}
						<div className="card fade-in" style={{ marginBottom: 'var(--space-2xl)', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
							<h3 className="text-lg font-semibold mb-4" style={{ fontWeight: 'var(--font-bold)' }}>
								<Zap size={20} style={{ display: 'inline-block', marginRight: 'var(--space-sm)', color: 'hsl(var(--primary))' }} />
								Your Insights
							</h3>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
								{analytics && analytics.bestDay && (
									<div className="stat-card">
										<div style={{ color: 'hsl(var(--success))', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-sm)' }}>Best Sleep Day</div>
										<div style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))' }}>
											{new Date(analytics.bestDay.timestamp).toLocaleDateString()}
										</div>
										<div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginTop: 'var(--space-xs)' }}>
											SpO2: {analytics.bestDay.spo2} | HRV: {analytics.bestDay.hrv}
										</div>
									</div>
								)}
								{analytics && analytics.worstDay && (
									<div className="stat-card">
										<div style={{ color: 'hsl(var(--destructive))', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-sm)' }}>Worst Sleep Day</div>
										<div style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))' }}>
											{new Date(analytics.worstDay.timestamp).toLocaleDateString()}
										</div>
										<div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginTop: 'var(--space-xs)' }}>
											SpO2: {analytics.worstDay.spo2} | HRV: {analytics.worstDay.hrv}
										</div>
									</div>
								)}
								{analytics && analytics.anomalies && analytics.anomalies.length > 0 && (
									<div className="stat-card" style={{ background: 'hsl(var(--warning) / 0.1)', borderLeft: '4px solid hsl(var(--warning))' }}>
										<div style={{ color: 'hsl(var(--warning))', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-sm)' }}>
											⚠️ {analytics.anomalies.length} Anomalies
										</div>
										<p style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))' }}>
											Detected unusual patterns. Review recommendations above.
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Personalized Tips */}
						<div className="card fade-in" style={{ marginBottom: 'var(--space-2xl)', background: 'var(--bg-secondary)' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
								<Star size={20} style={{ color: 'hsl(var(--primary))' }} />
								<h3 style={{ fontWeight: 'var(--font-bold)' }}>Personalized Sleep Tips</h3>
							</div>
							<PersonalizedTips mlResult={mlResult} history={safeHistory} />
						</div>

						{/* Progress & Action Buttons */}
						{analytics && (
							<>
								<ProgressTracker analytics={analytics} />
								<div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap', marginTop: 'var(--space-2xl)' }}>
									<button className="btn btn-primary" onClick={() => window.print()}>
										<Download size={18} />
										Download Report
									</button>
									<button className="btn btn-secondary" onClick={() => window.open('mailto:?subject=My Sleep Analysis&body=Check out my sleep analysis report!', '_blank')}>
										<Share2 size={18} />
										Share Report
									</button>
								</div>
							</>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export default Analysis;
