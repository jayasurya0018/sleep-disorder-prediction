import React, { useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
	zoomPlugin
);

const chartTypes = {
	line: Line,
	bar: Bar
};

const AnalysisChart = ({ type = 'line', data, options, style }) => {
	const ChartComponent = chartTypes[type] || Line;
	const chartRef = useRef();
	// Defensive: If data or datasets are missing, show a message instead of rendering chart
	const hasData = data && Array.isArray(data.labels) && data.labels.length > 0 && data.datasets && Array.isArray(data.datasets) && data.datasets.length > 0 && data.datasets.some(ds => Array.isArray(ds.data) && ds.data.length > 0);

	// Merge zoom/pan options
	const mergedOptions = {
		...options,
		plugins: {
			...options?.plugins,
			zoom: {
				pan: { enabled: true, mode: 'xy' },
				zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
				limits: { y: { min: 'original', max: 'original' }, x: { min: 'original', max: 'original' } }
			}
		}
	};

	// Download chart as image
	const handleDownload = () => {
		if (chartRef.current) {
			const url = chartRef.current.toBase64Image();
			const link = document.createElement('a');
			link.href = url;
			link.download = 'chart.png';
			link.click();
		}
	};

	return (
		<div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(44,62,80,0.08)', padding: 24, margin: '24px 0', ...style }}>
			{hasData ? (
				<>
					<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
						<button onClick={handleDownload} style={{ background: 'linear-gradient(90deg,#7f53ac,#38b2ac)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.3rem 1.1rem', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Download</button>
					</div>
					<ChartComponent ref={chartRef} data={data} options={mergedOptions} />
				</>
			) : (
				<div style={{ textAlign: 'center', color: '#888', padding: 32 }}>
					No chart data available.
				</div>
			)}
		</div>
	);
};

export default AnalysisChart;
