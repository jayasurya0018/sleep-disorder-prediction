import React, { useState } from 'react';
// Removed custom UI imports, using standard HTML elements instead
import { ActivityIcon, HeartIcon, WindIcon, MoonIcon, TrendingUpIcon } from 'lucide-react';


const SleepDataForm = ({ onSubmit, initialData = {}, loading = false }) => {
	const [data, setData] = useState({
		sleepStages: initialData.sleepStages || '',
		hrv: initialData.hrv || '',
		spo2: initialData.spo2 || '',
		movement: initialData.movement || '',
		breathing: initialData.breathing || ''
	});
	const [error, setError] = useState('');

	const handleChange = (e) => {
		setData({ ...data, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		// Basic validation
		if (!data.sleepStages || !data.hrv || !data.spo2 || !data.movement || !data.breathing) {
			setError('All fields are required.');
			return;
		}

		setError('');

		// Convert numeric fields to numbers
		const cleanData = {
			...data,
			hrv: Number(data.hrv),
			spo2: Number(data.spo2),
			movement: Number(data.movement),
			breathing: Number(data.breathing)
		};

		onSubmit(cleanData);
	};

	const inputFields = [
		{
			name: 'sleepStages',
			label: 'Sleep Stages',
			placeholder: 'Deep, Light, REM (comma-separated)',
			type: 'text',
			icon: MoonIcon,
			description: 'Track your sleep phase transitions'
		},
		{
			name: 'hrv',
			label: 'Heart Rate Variability',
			placeholder: '45',
			type: 'number',
			icon: HeartIcon,
			description: 'HRV score in milliseconds'
		},
		{
			name: 'spo2',
			label: 'Oxygen Saturation',
			placeholder: '98',
			type: 'number',
			icon: TrendingUpIcon,
			description: 'SpO2 percentage during sleep'
		},
		{
			name: 'movement',
			label: 'Movement Count',
			placeholder: '12',
			type: 'number',
			icon: ActivityIcon,
			description: 'Number of movements detected'
		},
		{
			name: 'breathing',
			label: 'Breathing Rate',
			placeholder: '16',
			type: 'number',
			icon: WindIcon,
			description: 'Average breaths per minute'
		}
	];

	return (
		<div className="modern-form-section">
			<div className="text-center space-y-2 mb-6">
				<h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-lg">
					Sleep Health Tracker
				</h2>
				<div className="text-lg text-muted-foreground">
					Record your sleep metrics for comprehensive health monitoring
				</div>
			</div>
			<form onSubmit={handleSubmit} className="space-y-6">
				<style>{`
				.modern-form-btn {
					background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
					color: #fff;
					font-weight: 700;
					font-size: 1.08rem;
					border: none;
					border-radius: 1rem;
					padding: 0.9rem 2.2rem;
					box-shadow: 0 4px 16px #7f53ac22;
					transition: background 0.2s, transform 0.2s;
					cursor: pointer;
					margin-top: 1.2rem;
					margin-bottom: 0.5rem;
					display: block;
					width: 100%;
				}
				.modern-form-btn:disabled {
					background: #e0e7ff;
					color: #7f53ac;
					cursor: not-allowed;
					opacity: 0.7;
				}
				.modern-form-btn:hover:not(:disabled) {
					background: linear-gradient(90deg, #38b2ac 0%, #7f53ac 100%);
					transform: scale(1.04);
				}
				.modern-form-input::placeholder {
					color: #888;
					opacity: 0.7;
				}
			`}</style>
				<div className="grid gap-6">
					{inputFields.map((field) => {
						const IconComponent = field.icon;
						return (
							<div key={field.name} className="space-y-2 group">
								<label
									htmlFor={field.name}
									className="modern-form-label"
								>
									<IconComponent className="h-5 w-5 text-primary group-focus-within:text-primary-glow transition-colors" />
									{field.label}
								</label>
								<input
									id={field.name}
									name={field.name}
									type={field.type}
									value={data[field.name]}
									onChange={handleChange}
									placeholder={field.placeholder}
									className="modern-form-input"
								/>
								<p className="text-xs text-muted-foreground pl-6">
									{field.description}
								</p>
							</div>
						);
					})}
				</div>
				{error && (
					<div className="bg-red-100 text-red-700 px-4 py-2 rounded-xl animate-fade-in font-semibold">
						{error}
					</div>
				)}
				<button
					type="submit"
					disabled={loading}
					className="modern-form-btn"
				>
					{loading ? (
						<div className="flex items-center gap-2 justify-center">
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent inline-block"></span>
							Saving Sleep Data...
						</div>
					) : (
						'Save Sleep Data'
					)}
				</button>
			</form>
		</div>
	);
};

export default SleepDataForm;