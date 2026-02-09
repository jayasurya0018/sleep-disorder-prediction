import React, { useState } from 'react';
import './ReportGenerator.css';

const ReportGenerator = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [options, setOptions] = useState({
        userName: '',
        reportTitle: 'Sleep Disorder Detection Report',
        startDate: '',
        endDate: '',
        includeCharts: true,
        includeRecommendations: true,
        includeSummary: true,
        includeDetailedData: true,
        includeMetrics: true,
        fontSize: 'medium',
        colorScheme: 'professional',
        customSections: [],
        // Phase 1: Demographics
        includeDemographics: true,
        patientAge: '',
        patientGender: 'Not specified',
        patientWeight: '',
        patientHeight: '',
        // Phase 1: Org Info
        organizationName: 'Sleep Disorder Monitoring System',
        includeTrendCharts: true,
        logoPath: '',
        // Phase 2: Severity & Baseline
        includeSeverityRecommendations: false,
        includeBaselineComparison: false,
        language: 'en',
        severityThresholds: {
            hrvMin: 20,
            hrvMax: 60,
            spo2Min: 90,
            breathingMin: 12,
            breathingMax: 20
        },
        // Phase 3: Detailed Analysis & Signatures
        includeDetailedSleepAnalysis: false,
        includeDigitalSignature: false,
        physicianName: '',
        physicianLicense: '',
        clinicStamp: false,
        includeHIPAACompliance: false,
        includePatientActionPlan: false,
        actionPlanDays: 30,
        weeklyComparison: false
    });

    const [customSection, setCustomSection] = useState({ title: '', content: '' });

    const handleOptionChange = (e) => {
        const { name, value, type, checked } = e.target;
        setOptions(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDemographicsChange = (e) => {
        const { name, value } = e.target;
        setOptions(prev => ({
            ...prev,
            [name]: isNaN(value) ? value : parseFloat(value)
        }));
    };

    const addCustomSection = () => {
        if (customSection.title && customSection.content) {
            setOptions(prev => ({
                ...prev,
                customSections: [...prev.customSections, { ...customSection }]
            }));
            setCustomSection({ title: '', content: '' });
        }
    };

    const removeCustomSection = (index) => {
        setOptions(prev => ({
            ...prev,
            customSections: prev.customSections.filter((_, i) => i !== index)
        }));
    };

    const generateReport = async (format) => {
        setLoading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage('Please login first');
                setLoading(false);
                return;
            }

            const endpoint = format === 'docx' ? '/api/export/docx' : 
                           format === 'pdf' ? '/api/export/pdf' : '/api/export/csv';

            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(options)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate report');
            }

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sleep-report-${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setMessage(`${format.toUpperCase()} report downloaded successfully!`);
        } catch (error) {
            console.error('Report generation error:', error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-generator-container">
            <div className="report-header">
                <h2>📄 Generate Customizable Report</h2>
                <p>Create professional sleep disorder detection reports in multiple formats</p>
            </div>

            {message && (
                <div className={`report-message ${message.includes('Error') ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}

            <div className="report-options">
                {/* Basic Information */}
                <div className="option-section">
                    <h3>Basic Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Patient Name</label>
                            <input
                                type="text"
                                name="userName"
                                value={options.userName}
                                onChange={handleOptionChange}
                                placeholder="Enter patient name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Report Title</label>
                            <input
                                type="text"
                                name="reportTitle"
                                value={options.reportTitle}
                                onChange={handleOptionChange}
                                placeholder="Enter report title"
                            />
                        </div>

                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={options.startDate}
                                onChange={handleOptionChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={options.endDate}
                                onChange={handleOptionChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Report Sections */}
                <div className="option-section">
                    <h3>Report Sections</h3>
                    <div className="checkbox-grid">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="includeSummary"
                                checked={options.includeSummary}
                                onChange={handleOptionChange}
                            />
                            <span>Include Executive Summary</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="includeMetrics"
                                checked={options.includeMetrics}
                                onChange={handleOptionChange}
                            />
                            <span>Include Key Metrics</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="includeDetailedData"
                                checked={options.includeDetailedData}
                                onChange={handleOptionChange}
                            />
                            <span>Include Detailed Data Table</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="includeRecommendations"
                                checked={options.includeRecommendations}
                                onChange={handleOptionChange}
                            />
                            <span>Include Clinical Recommendations</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="includeCharts"
                                checked={options.includeCharts}
                                onChange={handleOptionChange}
                            />
                            <span>Include Charts (Future)</span>
                        </label>
                    </div>
                </div>

                {/* Styling Options */}
                <div className="option-section">
                    <h3>Styling Options</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Font Size</label>
                            <select
                                name="fontSize"
                                value={options.fontSize}
                                onChange={handleOptionChange}
                            >
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Color Scheme</label>
                            <select
                                name="colorScheme"
                                value={options.colorScheme}
                                onChange={handleOptionChange}
                            >
                                <option value="professional">Professional (Blue)</option>
                                <option value="medical">Medical (Teal/Green)</option>
                                <option value="modern">Modern (Indigo/Purple)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Phase 1: Patient Demographics */}
                <div className="option-section phase1-section">
                    <h3>👤 Patient Demographics (Phase 1)</h3>
                    <p className="section-note">Optional: Add patient demographics to the report for more personalized insights</p>
                    
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="includeDemographics"
                            checked={options.includeDemographics}
                            onChange={handleOptionChange}
                        />
                        <span>Include Demographics Section</span>
                    </label>

                    {options.includeDemographics && (
                        <div className="form-grid demographics-grid">
                            <div className="form-group">
                                <label>Age (years)</label>
                                <input
                                    type="number"
                                    name="patientAge"
                                    value={options.patientAge}
                                    onChange={handleDemographicsChange}
                                    placeholder="e.g., 45"
                                    min="0"
                                    max="150"
                                />
                            </div>

                            <div className="form-group">
                                <label>Gender</label>
                                <select
                                    name="patientGender"
                                    value={options.patientGender}
                                    onChange={handleOptionChange}
                                >
                                    <option value="Not specified">Not specified</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Height (cm)</label>
                                <input
                                    type="number"
                                    name="patientHeight"
                                    value={options.patientHeight}
                                    onChange={handleDemographicsChange}
                                    placeholder="e.g., 175"
                                    min="100"
                                    max="250"
                                />
                            </div>

                            <div className="form-group">
                                <label>Weight (kg)</label>
                                <input
                                    type="number"
                                    name="patientWeight"
                                    value={options.patientWeight}
                                    onChange={handleDemographicsChange}
                                    placeholder="e.g., 75"
                                    min="20"
                                    max="300"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Phase 1: Trend Charts & Organization */}
                <div className="option-section phase1-section">
                    <h3>📊 Advanced Options (Phase 1)</h3>
                    
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="includeTrendCharts"
                            checked={options.includeTrendCharts}
                            onChange={handleOptionChange}
                        />
                        <span>Include Trend Charts & Analysis</span>
                    </label>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Organization Name</label>
                            <input
                                type="text"
                                name="organizationName"
                                value={options.organizationName}
                                onChange={handleOptionChange}
                                placeholder="Your organization name"
                            />
                        </div>
                    </div>
                </div>

                {/* Phase 2: Severity-Based Recommendations */}
                <div className="option-section phase2-section">
                    <h3>⚠️ Severity Analysis (Phase 2)</h3>
                    <p className="section-note">Advanced: Include severity scoring and personalized medical recommendations</p>
                    
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="includeSeverityRecommendations"
                            checked={options.includeSeverityRecommendations}
                            onChange={handleOptionChange}
                        />
                        <span>Include Severity-Based Recommendations</span>
                    </label>

                    {options.includeSeverityRecommendations && (
                        <div className="severity-config">
                            <h4>Severity Thresholds (Optional)</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Minimum HRV (ms)</label>
                                    <input
                                        type="number"
                                        value={options.severityThresholds.hrvMin}
                                        onChange={(e) => setOptions(prev => ({
                                            ...prev,
                                            severityThresholds: { ...prev.severityThresholds, hrvMin: parseInt(e.target.value) }
                                        }))}
                                        placeholder="Default: 20"
                                        min="0"
                                        max="100"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Maximum HRV (ms)</label>
                                    <input
                                        type="number"
                                        value={options.severityThresholds.hrvMax}
                                        onChange={(e) => setOptions(prev => ({
                                            ...prev,
                                            severityThresholds: { ...prev.severityThresholds, hrvMax: parseInt(e.target.value) }
                                        }))}
                                        placeholder="Default: 60"
                                        min="0"
                                        max="200"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Minimum SpO2 (%)</label>
                                    <input
                                        type="number"
                                        value={options.severityThresholds.spo2Min}
                                        onChange={(e) => setOptions(prev => ({
                                            ...prev,
                                            severityThresholds: { ...prev.severityThresholds, spo2Min: parseInt(e.target.value) }
                                        }))}
                                        placeholder="Default: 90"
                                        min="80"
                                        max="100"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Minimum Breathing Rate</label>
                                    <input
                                        type="number"
                                        value={options.severityThresholds.breathingMin}
                                        onChange={(e) => setOptions(prev => ({
                                            ...prev,
                                            severityThresholds: { ...prev.severityThresholds, breathingMin: parseInt(e.target.value) }
                                        }))}
                                        placeholder="Default: 12"
                                        min="5"
                                        max="20"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Maximum Breathing Rate</label>
                                    <input
                                        type="number"
                                        value={options.severityThresholds.breathingMax}
                                        onChange={(e) => setOptions(prev => ({
                                            ...prev,
                                            severityThresholds: { ...prev.severityThresholds, breathingMax: parseInt(e.target.value) }
                                        }))}
                                        placeholder="Default: 20"
                                        min="15"
                                        max="40"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Phase 2: Baseline Comparison */}
                <div className="option-section phase2-section">
                    <h3>📈 Baseline Comparison (Phase 2)</h3>
                    <p className="section-note">Compare current metrics against historical baseline data</p>
                    
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="includeBaselineComparison"
                            checked={options.includeBaselineComparison}
                            onChange={handleOptionChange}
                        />
                        <span>Include Baseline Comparison Analysis</span>
                    </label>

                    {options.includeBaselineComparison && (
                        <div className="baseline-info">
                            <p className="info-text">ℹ️ Baseline data will be automatically calculated from your historical sleep records (previous 30 days)</p>
                        </div>
                    )}
                </div>

                {/* Phase 2: Language Selection */}
                <div className="option-section phase2-section">
                    <h3>🌐 Language & Localization (Phase 2)</h3>
                    <p className="section-note">Generate reports in different languages</p>
                    
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Report Language</label>
                            <select
                                name="language"
                                value={options.language}
                                onChange={handleOptionChange}
                            >
                                <option value="en">English</option>
                                <option value="es">Español (Spanish)</option>
                                <option value="fr">Français (French)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Phase 3: Detailed Sleep Analysis */}
                <div className="option-section phase3-section">
                    <h3>📋 Detailed Sleep Analysis (Phase 3)</h3>
                    <p className="section-note">In-depth analysis with sleep stage breakdown and weekly trends</p>
                    
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="includeDetailedSleepAnalysis"
                            checked={options.includeDetailedSleepAnalysis}
                            onChange={handleOptionChange}
                        />
                        <span>Include Detailed Sleep Stage Analysis</span>
                    </label>

                    {options.includeDetailedSleepAnalysis && (
                        <div className="analysis-config">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="weeklyComparison"
                                    checked={options.weeklyComparison}
                                    onChange={handleOptionChange}
                                />
                                <span>Include Weekly Trend Comparison</span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Phase 3: Patient Action Plan */}
                <div className="option-section phase3-section">
                    <h3>✅ Patient Action Plan (Phase 3)</h3>
                    <p className="section-note">Personalized 4-week improvement plan with milestones</p>
                    
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="includePatientActionPlan"
                            checked={options.includePatientActionPlan}
                            onChange={handleOptionChange}
                        />
                        <span>Include Patient Action Plan</span>
                    </label>

                    {options.includePatientActionPlan && (
                        <div className="action-config">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Plan Duration (days)</label>
                                    <select
                                        name="actionPlanDays"
                                        value={options.actionPlanDays}
                                        onChange={handleOptionChange}
                                    >
                                        <option value="14">14 days (2 weeks)</option>
                                        <option value="30">30 days (4 weeks)</option>
                                        <option value="60">60 days (8 weeks)</option>
                                        <option value="90">90 days (12 weeks)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Phase 3: HIPAA Compliance */}
                <div className="option-section phase3-section">
                    <h3>🔒 HIPAA Compliance (Phase 3)</h3>
                    <p className="section-note">Include legal privacy and data protection statements</p>
                    
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="includeHIPAACompliance"
                            checked={options.includeHIPAACompliance}
                            onChange={handleOptionChange}
                        />
                        <span>Include HIPAA Compliance Section</span>
                    </label>
                </div>

                {/* Phase 3: Digital Signature */}
                <div className="option-section phase3-section">
                    <h3>✍️ Physician Certification (Phase 3)</h3>
                    <p className="section-note">Add physician signature, license, and clinic stamp</p>
                    
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="includeDigitalSignature"
                            checked={options.includeDigitalSignature}
                            onChange={handleOptionChange}
                        />
                        <span>Include Physician Certification Section</span>
                    </label>

                    {options.includeDigitalSignature && (
                        <div className="signature-config">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Physician Name</label>
                                    <input
                                        type="text"
                                        name="physicianName"
                                        value={options.physicianName}
                                        onChange={handleOptionChange}
                                        placeholder="Dr. John Smith"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>License Number</label>
                                    <input
                                        type="text"
                                        name="physicianLicense"
                                        value={options.physicianLicense}
                                        onChange={handleOptionChange}
                                        placeholder="MD-12345"
                                    />
                                </div>
                            </div>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="clinicStamp"
                                    checked={options.clinicStamp}
                                    onChange={handleOptionChange}
                                />
                                <span>Include Clinic Stamp/Seal</span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Custom Sections */}
                <div className="option-section">
                    <h3>Custom Sections</h3>
                    <div className="custom-section-input">
                        <input
                            type="text"
                            placeholder="Section Title"
                            value={customSection.title}
                            onChange={(e) => setCustomSection({ ...customSection, title: e.target.value })}
                        />
                        <textarea
                            placeholder="Section Content"
                            value={customSection.content}
                            onChange={(e) => setCustomSection({ ...customSection, content: e.target.value })}
                            rows="4"
                        />
                        <button 
                            onClick={addCustomSection}
                            className="add-section-btn"
                            disabled={!customSection.title || !customSection.content}
                        >
                            ➕ Add Custom Section
                        </button>
                    </div>

                    {options.customSections.length > 0 && (
                        <div className="custom-sections-list">
                            <h4>Added Sections:</h4>
                            {options.customSections.map((section, index) => (
                                <div key={index} className="custom-section-item">
                                    <div>
                                        <strong>{section.title}</strong>
                                        <p>{section.content.substring(0, 100)}...</p>
                                    </div>
                                    <button 
                                        onClick={() => removeCustomSection(index)}
                                        className="remove-btn"
                                    >
                                        ✖
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Generate Buttons */}
                <div className="option-section generate-section">
                    <h3>Generate Report</h3>
                    <div className="generate-buttons">
                        <button
                            onClick={() => generateReport('docx')}
                            disabled={loading}
                            className="generate-btn docx-btn"
                        >
                            {loading ? '⏳ Generating...' : '📄 Download DOCX'}
                        </button>

                        <button
                            onClick={() => generateReport('pdf')}
                            disabled={loading}
                            className="generate-btn pdf-btn"
                        >
                            {loading ? '⏳ Generating...' : '📕 Download PDF'}
                        </button>

                        <button
                            onClick={() => generateReport('csv')}
                            disabled={loading}
                            className="generate-btn csv-btn"
                        >
                            {loading ? '⏳ Generating...' : '📊 Download CSV'}
                        </button>
                    </div>

                    <div className="format-info">
                        <p><strong>DOCX:</strong> Fully customizable Word document with all styling options</p>
                        <p><strong>PDF:</strong> Print-ready PDF format (existing functionality)</p>
                        <p><strong>CSV:</strong> Raw data export for analysis</p>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="report-preview">
                <h3>Report Preview</h3>
                <div className="preview-box">
                    <p><strong>Patient:</strong> {options.userName || 'Not specified'}</p>
                    <p><strong>Title:</strong> {options.reportTitle}</p>
                    <p><strong>Period:</strong> {options.startDate || 'All time'} - {options.endDate || 'Present'}</p>
                    <p><strong>Color Scheme:</strong> {options.colorScheme}</p>
                    <p><strong>Sections:</strong> {
                        [
                            options.includeSummary && 'Summary',
                            options.includeMetrics && 'Metrics',
                            options.includeDetailedData && 'Data Table',
                            options.includeRecommendations && 'Recommendations',
                            options.customSections.length > 0 && `${options.customSections.length} Custom`
                        ].filter(Boolean).join(', ') || 'None selected'
                    }</p>
                </div>
            </div>
        </div>
    );
};

export default ReportGenerator;
