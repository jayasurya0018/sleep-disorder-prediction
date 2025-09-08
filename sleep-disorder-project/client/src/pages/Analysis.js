import React, { useState, useEffect, useMemo } from 'react';
import AnalysisChart from '../components/AnalysisChart';
import api from '../api';
import { AlertTriangle, Utensils, BedDouble, Stethoscope, Download, Share2, SunMoon, Star, ArrowUpRight } from 'lucide-react';

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

	function SeverityBadge({ severity }) {
		const color = severity === 'Severe' ? '#dc2626' : severity === 'Moderate' ? '#f59e42' : '#10b981';
		return (
			<span style={{
				background: color,
				color: '#fff',
				borderRadius: '0.7rem',
				padding: '0.3rem 1rem',
				fontWeight: 700,
				fontSize: '1rem',
				marginLeft: '0.5rem',
				boxShadow: '0 2px 8px #7f53ac22',
				display: 'inline-block',
				letterSpacing: '0.03em',
				textShadow: '0 2px 8px #23294622',
				border: '2px solid #fff',
				transition: 'background 0.2s',
			}}>{severity}</span>
		);
	}

	function RecommendationCard({ title, description, icon, action }) {
		return (
			<div style={{
				background: 'linear-gradient(135deg, #e0e7ff 0%, #f7f8fa 100%)',
				borderRadius: '1.2rem',
				boxShadow: '0 4px 24px #7f53ac22',
				padding: '1.5rem',
				margin: '0.7rem',
				minWidth: 240,
				maxWidth: 320,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: '1rem',
				transition: 'transform 0.2s',
				border: '1.5px solid #e0e7ff',
			}}>
				<div style={{ fontSize: 38, color: '#7f53ac', marginBottom: 4 }}>{icon}</div>
				<div style={{ fontWeight: 800, color: '#7f53ac', fontSize: '1.18rem', letterSpacing: '0.02em', textAlign: 'center' }}>{title}</div>
				<div style={{ fontSize: '1rem', color: '#444', textAlign: 'center', fontWeight: 500 }}>{description}</div>
				{action && <a href={action.link} target="_blank" rel="noopener noreferrer" style={{
					background: 'linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%)',
					color: '#fff',
					borderRadius: '0.7rem',
					padding: '0.6rem 1.3rem',
					fontWeight: 700,
					textDecoration: 'none',
					marginTop: '0.5rem',
					boxShadow: '0 2px 8px #7f53ac22',
					fontSize: '1rem',
					letterSpacing: '0.02em',
					transition: 'background 0.2s',
				}}>{action.label}</a>}
			</div>
		);
	}

	function NextSteps({ severity }) {
		if (severity !== 'Severe') return null;
		return (
			<div style={{
				background: 'linear-gradient(135deg, #fff7ed 0%, #ffe4e6 100%)',
				borderRadius: '1.2rem',
				boxShadow: '0 4px 24px #f59e42',
				padding: '1.5rem',
				margin: '2rem 0',
				fontWeight: 600,
				color: '#dc2626',
				textAlign: 'center',
				border: '1.5px solid #f59e42',
				maxWidth: 600,
				marginLeft: 'auto',
				marginRight: 'auto',
			}}>
				<div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><AlertTriangle style={{marginRight:8}}/>Severe abnormality detected</div>
				<div style={{ fontSize: '1.05rem', marginBottom: 10 }}>Strongly recommended to consult a healthcare professional.</div>
				<div style={{ marginTop: 12 }}>
					<a href="https://www.sleepfoundation.org/sleep-disorders" target="_blank" rel="noopener noreferrer" style={{
						background: '#dc2626',
						color: '#fff',
						borderRadius: '0.7rem',
						padding: '0.6rem 1.3rem',
						fontWeight: 700,
						textDecoration: 'none',
						boxShadow: '0 2px 8px #dc2626',
						fontSize: '1rem',
						letterSpacing: '0.02em',
					}}>Find a Specialist</a>
				</div>
			</div>
		);
	}

	// Dark mode toggle
	function DarkModeToggle() {
	  const [dark, setDark] = React.useState(false);
	  React.useEffect(() => {
	    document.body.style.background = dark ? 'linear-gradient(135deg, #232946 0%, #232946 100%)' : 'linear-gradient(135deg, #e0e7ff 0%, #f7f8fa 100%)';
	    document.body.style.color = dark ? '#f7f8fa' : '#232946';
	  }, [dark]);
	  return (
	    <button aria-label="Toggle dark mode" style={{
	      position: 'fixed',
	      top: 18,
	      right: 18,
	      zIndex: 100,
	      background: dark ? '#232946' : '#fff',
	      color: dark ? '#fff' : '#7f53ac',
	      borderRadius: '50%',
	      border: '2px solid #7f53ac',
	      boxShadow: '0 2px 8px #7f53ac22',
	      padding: 10,
	      cursor: 'pointer',
	      transition: 'background 0.2s',
	    }} onClick={() => setDark(d => !d)}>
	      <SunMoon />
	    </button>
	  );
	}

	// Animated loading spinner
	function AnimatedSpinner() {
	  return (
	    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}>
	      <div style={{
	        border: '6px solid #e0e7ff',
	        borderTop: '6px solid #7f53ac',
	        borderRadius: '50%',
	        width: 48,
	        height: 48,
	        animation: 'spin 1s linear infinite',
	      }} />
	      <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
	    </div>
	  );
	}

	// Section divider
	function SectionDivider() {
	  return <hr style={{ border: 'none', borderTop: '2px solid #e0e7ff', margin: '2rem 0', width: '80%' }} />;
	}

	// Feedback widget
	function FeedbackWidget() {
	  const [feedback, setFeedback] = React.useState(null);
	  return (
	    <div style={{ margin: '2rem auto', textAlign: 'center' }}>
	      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#7f53ac', marginBottom: 8 }}>Was this analysis helpful?</div>
	      <button aria-label="Yes" style={{ background: '#10b981', color: '#fff', borderRadius: '0.7rem', padding: '0.5rem 1.2rem', fontWeight: 700, marginRight: 8, border: 'none', cursor: 'pointer' }} onClick={() => setFeedback('yes')}>👍 Yes</button>
	      <button aria-label="No" style={{ background: '#dc2626', color: '#fff', borderRadius: '0.7rem', padding: '0.5rem 1.2rem', fontWeight: 700, border: 'none', cursor: 'pointer' }} onClick={() => setFeedback('no')}>👎 No</button>
	      {feedback && <div style={{ marginTop: 10, color: feedback === 'yes' ? '#10b981' : '#dc2626', fontWeight: 700 }}>{feedback === 'yes' ? 'Thank you for your feedback!' : 'We appreciate your feedback!'}</div>}
	    </div>
	  );
	}

	// Download/share report
	function DownloadShareButtons() {
	  function handleDownload() {
	    window.print();
	  }
	  function handleShare() {
	    window.open('mailto:?subject=My Sleep Analysis&body=Check out my sleep analysis report!', '_blank');
	  }
	  return (
	    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '1.5rem 0' }}>
	      <button aria-label="Download report" style={{ background: '#7f53ac', color: '#fff', borderRadius: '0.7rem', padding: '0.6rem 1.3rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleDownload}><Download /> Download</button>
	      <button aria-label="Share report" style={{ background: '#38b2ac', color: '#fff', borderRadius: '0.7rem', padding: '0.6rem 1.3rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleShare}><Share2 /> Share</button>
	    </div>
	  );
	}

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

	// Improved Personalized Tips
	function PersonalizedTips({ mlResult, history }) {
	  if (!mlResult) return null;
	  let tips = [];
	  // Example logic for personalized tips
	  const last = history && history.length ? history[history.length - 1] : {};
	  if (last.hrv && last.hrv < 50) tips.push('Your HRV is low. Try relaxation techniques like deep breathing or yoga before bed.');
	  if (last.movement && last.movement > 8) tips.push('High movement detected. Consider a calming bedtime routine and avoid caffeine late in the day.');
	  if (last.spo2 && last.spo2 < 95) tips.push('Your SpO2 is below normal. Ensure your sleeping environment is well-ventilated and consult a doctor if this persists.');
	  if (last.breathing && (last.breathing < 12 || last.breathing > 20)) tips.push('Abnormal breathing rate detected. Practice mindful breathing and consult a healthcare professional if you feel unwell.');
	  if (!tips.length) tips.push('Keep up the good sleep habits! Try meditation before bed and avoid screens 30 minutes before sleep for better quality.');
	  return (
	    <div style={{ background: '#e0e7ff', borderRadius: '1rem', boxShadow: '0 2px 12px #7f53ac11', padding: '1.2rem', margin: '1.5rem auto', maxWidth: 600, textAlign: 'center' }} aria-live="polite">
	      <div style={{ fontWeight: 700, color: '#7f53ac', fontSize: '1.1rem', marginBottom: 8 }}><Star style={{ marginRight: 6 }} />Personalized Sleep Tips</div>
	      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
	        {tips.map((tip, i) => (
	          <li key={i} style={{ fontSize: '1rem', color: '#444', fontWeight: 500, marginBottom: 6 }}>{tip}</li>
	        ))}
	      </ul>
	    </div>
	  );
	}

	// Progress tracker
	function ProgressTracker({ analytics }) {
	  if (!analytics || !analytics.bestDay || !analytics.worstDay) return null;
	  const improvement = Math.max(0, ((analytics.bestDay.spo2 + analytics.bestDay.hrv) - (analytics.worstDay.spo2 + analytics.worstDay.hrv)));
	  return (
	    <div style={{ background: 'linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%)', borderRadius: '1rem', boxShadow: '0 2px 12px #7f53ac22', padding: '1.2rem', margin: '1.5rem auto', maxWidth: 600, color: '#fff', textAlign: 'center', fontWeight: 700 }}>
	      <div style={{ fontSize: '1.1rem', marginBottom: 8 }}><ArrowUpRight style={{ marginRight: 6 }} />Your sleep quality improved by {improvement}% this month!</div>
	    </div>
	  );
	}

	return (
		<>
			<style>{`
  body {
    font-family: 'Inter', 'Poppins', Arial, sans-serif;
    color: #232946;
    background: #f7f8fa;

  }
	
  .modern-analysis-section {
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
  .modern-analysis-title {
    font-size: 2.2rem;
    font-weight: 800;
    color: #7f53ac;
    margin-bottom: 0.5rem;
    letter-spacing: 0.01em;
    text-align: center;
  }
  .modern-analysis-ml {
    background: #f7f8fa;
    color: #232946;
    border-radius: 1.2rem;
    box-shadow: 0 2px 12px #7f53ac11;
    padding: 1.5rem 4rem;
    width: 100%;
    margin-top: 1.5rem;
    font-size: 1.15rem;
    font-weight: 600;
    text-align: center;
    letter-spacing: 0.01em;
    border: 1.5px solid #e0e7ff;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .modern-analysis-label {
    font-size: 1.1rem;
    color: #647dee;
    font-weight: 700;
    margin-bottom: 0.5rem;
    text-align: center;
  }
  @media (max-width: 600px) {
    .modern-analysis-section {
      padding: 1.2rem 0.5rem;
      max-width: 98vw;
    }
    .modern-analysis-ml {
      padding: 2rem 0.5rem;
      font-size: 1rem;
    }
  }
`}</style>
			<div className="modern-analysis-bg">
				<div className="modern-analysis-container">
					<div className="mb-8 animate-fade-in">
						<h1 className="modern-analysis-title">Sleep Analysis</h1>
						<p className="modern-analysis-desc">AI-powered insights into your sleep patterns and health trends</p>
					</div>
					{/* ML AI Analysis Result Section */}
					<div className="mb-10">
						{mlLoading ? (
							<div className="text-center text-lg py-6">Loading AI analysis...</div>
						) : mlError ? (
							<div className="text-center text-red-500 py-6">{mlError}</div>
						) : mlResult && (
							<div className="modern-analysis-ml" style={{ boxShadow: '0 4px 24px #7f53ac22', borderRadius: '1.5rem', padding: '2rem 1.5rem', margin: '2rem auto', maxWidth: 1400, background: 'linear-gradient(135deg, #e0e7ff 0%, #f7f8fa 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
								<h2 className="text-2xl font-bold mb-2 text-primary" style={{ color: '#7f53ac', fontWeight: 800, fontSize: '2rem', marginBottom: 8 }}>AI Sleep Disorder Detection</h2>
								<div className="flex flex-col md:flex-row flex-wrap gap-8 items-center" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
									<div style={{ minWidth: 220, textAlign: 'left' }}>
										<div className="text-lg font-semibold" style={{ fontWeight: 700, color: '#232946', fontSize: '1.1rem' }}>Detected Disorder:</div>
										<div className="text-xl font-bold text-destructive mb-2" style={{ fontWeight: 800, color: '#dc2626', fontSize: '1.3rem', marginBottom: 6 }}>{mlResult.disorder}</div>
										<div className="text-lg font-semibold" style={{ fontWeight: 700, color: '#232946', fontSize: '1.1rem' }}>Severity:<SeverityBadge severity={mlResult.severity} /></div>
										<div className="text-base text-muted-foreground mb-2" style={{ fontSize: '1rem', color: '#647dee', marginTop: 8 }}>{mlResult.explanation}</div>
									</div>
									{mlResult.shapPlot && (
										<div className="flex flex-col items-center justify-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 220 }}>
											<div className="text-lg font-semibold mb-1" style={{ fontWeight: 700, color: '#7f53ac', marginBottom: 6 }}>Explainable AI (SHAP)</div>
											<img
												src={`data:image/png;base64,${mlResult.shapPlot}`}
												alt="SHAP Explanation"
												className="rounded-xl shadow-lg max-w-full h-auto"
												style={{ maxWidth: 400, borderRadius: '1rem', boxShadow: '0 2px 12px #7f53ac22' }}
											/>
										</div>
									)}
								</div>
								<NextSteps severity={mlResult.severity} />
								<div className="mt-6 flex flex-wrap gap-4 justify-center" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', alignItems: 'stretch', width: '100%' }}>
									<RecommendationCard
										title="Diet Recommendation"
										description={mlResult.diet}
										icon={<Utensils />}
										action={{ label: 'Find Nutritionists', link: 'https://www.eatright.org/health/wellness/sleep' }}
									/>
									<RecommendationCard
										title="Sleep Plan"
										description={mlResult.sleepPlan}
										icon={<BedDouble />}
										action={{ label: 'Book Appointment', link: 'https://www.sleepfoundation.org/sleep-doctors' }}
									/>
									<RecommendationCard
										title="Consulting"
										description={mlResult.consulting}
										icon={<Stethoscope />}
										action={{ label: 'Find Sleep Clinics', link: 'https://www.sleepfoundation.org/sleep-clinics' }}
									/>
								</div>
							</div>
						)}
					</div>

					{loading ? (
						<div className="text-center text-lg py-12">Loading analysis...</div>
					) : error ? (
						<div className="text-center text-red-500 py-12">{error}</div>
					) : (
						<>
							<div className="modern-analysis-analytics grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
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
							<div className="modern-analysis-analytics grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
								{weeklySpo2Chart && (
									<div className="modern-analysis-section">
										<h2 className="modern-analysis-title">Weekly Avg SpO2</h2>
										<p className="modern-analysis-label">Weekly blood oxygen trend</p>
										<AnalysisChart
											type="line"
											data={weeklySpo2Chart.data}
											options={weeklySpo2Chart.options}
											style={{ height: 300 }}
										/>
									</div>
								)}
								{weeklyHrvChart && (
								<div className="modern-analysis-section">
									<h2 className="modern-analysis-title">Weekly Avg HRV</h2>
									<p className="modern-analysis-label">Weekly HRV trend</p>
									<AnalysisChart
										type="line"
										data={weeklyHrvChart.data}
										options={weeklyHrvChart.options}
										style={{ width: 600, height: 300 }}
									/>
								</div>
							)}
							</div>
							<div className="modern-analysis-analytics mt-10">
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
							<SectionDivider />
							<div className="modern-analysis-analytics grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
								<div>
									<h2 className="text-lg font-semibold mb-1">Sleep Duration</h2>
									<p className="text-xs text-muted-foreground mb-2">Total hours slept each night</p>
									<SleepDurationChart history={safeHistory} />
								</div>
								<div>
									<h2 className="text-lg font-semibold mb-1">Breathing Rate</h2>
									<p className="text-xs text-muted-foreground mb-2">Breaths per minute during sleep</p>
									<BreathingRateChart history={safeHistory} />
								</div>
							</div>
							<DownloadShareButtons />
							<FeedbackWidget />
							<PersonalizedTips mlResult={mlResult} history={safeHistory} />
							<ProgressTracker analytics={analytics} />
						</>
					)}
				</div>
			</div>
		</>
	);
}

export default Analysis;
