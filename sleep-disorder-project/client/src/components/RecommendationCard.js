import React from 'react';

const RecommendationCard = ({ title, content, color }) => (
	<div style={{
		background: '#fff',
		borderLeft: `6px solid ${color || '#2563eb'}`,
		borderRadius: 10,
		boxShadow: '0 2px 8px rgba(44,62,80,0.08)',
		padding: '20px 24px',
		marginBottom: 24,
		marginTop: 8
	}}>
		<h3 style={{ color: color || '#2563eb', marginBottom: 10 }}>{title}</h3>
		<div style={{ fontSize: '1.08rem', color: '#2d3748' }}>{content}</div>
	</div>
);

export default RecommendationCard;
