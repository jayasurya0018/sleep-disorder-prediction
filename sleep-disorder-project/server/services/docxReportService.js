/**
 * DOCX Report Generator Service
 * Creates customizable Word documents for sleep disorder detection reports
 * Phase 1: Logo, Demographics, Report ID, Trend Charts
 */

const { Document, Paragraph, TextRun, HeadingLevel, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle, ImageRun, Packer } = require('docx');
const fs = require('fs');
const path = require('path');

class DocxReportService {
    constructor() {
        this.exportDir = path.join(__dirname, '../../exports');
        this.ensureExportDir();
    }

    ensureExportDir() {
        if (!fs.existsSync(this.exportDir)) {
            fs.mkdirSync(this.exportDir, { recursive: true });
        }
    }

    /**
     * Generate Report ID
     */
    generateReportId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const randomId = Math.random().toString(36).substr(2, 9).toUpperCase();
        return `SLEEP-${year}${month}${day}-${randomId}`;
    }

    /**
     * Generate customizable DOCX report
     */
    async generateReport(data, options = {}) {
        const {
            userName = 'Patient',
            reportTitle = 'Sleep Disorder Detection Report',
            startDate = null,
            endDate = null,
            includeCharts = true,
            includeRecommendations = true,
            includeSummary = true,
            includeDetailedData = true,
            includeMetrics = true,
            customSections = [],
            logoPath = null,
            fontSize = 'medium', // small, medium, large
            colorScheme = 'professional', // professional, medical, modern
            // Phase 1 additions
            includeDemographics = true,
            patientAge = null,
            patientGender = null,
            patientWeight = null,
            patientHeight = null,
            includeTrendCharts = true,
            organizationName = 'Sleep Disorder Monitoring System',
            // Phase 2 additions
            includeSeverityRecommendations = false,
            includeBaselineComparison = false,
            baselineData = null,
            language = 'en', // en, es, fr
            severityThresholds = {},
            // Phase 3 additions
            includeDetailedSleepAnalysis = false,
            includeDigitalSignature = false,
            physicianName = '',
            physicianLicense = '',
            clinicStamp = false,
            includeHIPAACompliance = false,
            includePatientActionPlan = false,
            actionPlanDays = 30,
            weeklyComparison = false
        } = options;

        // Generate Report ID and Timestamp
        const reportId = this.generateReportId();
        const generatedAt = new Date().toLocaleString();

        // Calculate statistics
        const stats = this.calculateStatistics(data);
        const predictions = this.extractPredictions(data);

        // Create document sections
        const sections = [];

        // Phase 1: Enhanced Title Page with Logo, Demographics, Report ID
        sections.push(...this.createEnhancedTitlePage(
            reportTitle, 
            userName, 
            startDate, 
            endDate, 
            colorScheme,
            logoPath,
            reportId,
            generatedAt,
            organizationName,
            {
                age: patientAge,
                gender: patientGender,
                weight: patientWeight,
                height: patientHeight
            }
        ));

        // Phase 2: Severity-Based Recommendations (if enabled)
        if (includeSeverityRecommendations) {
            sections.push(...this.createSeverityBasedSection(
                predictions,
                stats,
                colorScheme,
                language,
                severityThresholds
            ));
        }

        // Phase 2: Baseline Comparison (if enabled)
        if (includeBaselineComparison && baselineData) {
            sections.push(...this.createBaselineComparisonSection(
                stats,
                baselineData,
                colorScheme,
                language
            ));
        }

        // Executive Summary
        if (includeSummary) {
            sections.push(...this.createExecutiveSummary(stats, predictions, colorScheme));
        }

        // Key Metrics Section
        if (includeMetrics) {
            sections.push(...this.createMetricsSection(stats, colorScheme));
        }

        // Phase 1: Trend Charts Section
        if (includeTrendCharts && data.length > 1) {
            sections.push(...this.createTrendChartsSection(data, stats, colorScheme));
        }

        // Phase 1: Demographics Section
        if (includeDemographics && (patientAge || patientGender || patientWeight || patientHeight)) {
            sections.push(...this.createDemographicsSection(
                {
                    age: patientAge,
                    gender: patientGender,
                    weight: patientWeight,
                    height: patientHeight
                },
                colorScheme
            ));
        }

        // Phase 3: Detailed Sleep Analysis (if enabled)
        if (includeDetailedSleepAnalysis && data.length > 0) {
            sections.push(...this.createDetailedSleepAnalysis(
                data,
                stats,
                colorScheme,
                language,
                weeklyComparison
            ));
        }

        // Phase 3: Patient Action Plan (if enabled)
        if (includePatientActionPlan) {
            sections.push(...this.createPatientActionPlan(
                predictions,
                stats,
                colorScheme,
                language,
                actionPlanDays
            ));
        }

        // Phase 3: HIPAA Compliance (if enabled)
        if (includeHIPAACompliance) {
            sections.push(...this.createHIPAAComplianceSection(
                reportId,
                colorScheme,
                language
            ));
        }

        // Phase 3: Digital Signature (if enabled)
        if (includeDigitalSignature) {
            sections.push(...this.createDigitalSignatureSection(
                physicianName,
                physicianLicense,
                clinicStamp,
                colorScheme,
                language
            ));
        }

        // Detection Results
        sections.push(...this.createDetectionResults(predictions, colorScheme));

        // Detailed Data Table
        if (includeDetailedData) {
            sections.push(...this.createDetailedDataTable(data.slice(-20), colorScheme)); // Last 20 records
        }

        // Recommendations
        if (includeRecommendations) {
            sections.push(...this.createRecommendations(predictions, stats, colorScheme));
        }

        // Custom Sections
        if (customSections && customSections.length > 0) {
            customSections.forEach(section => {
                sections.push(...this.createCustomSection(section, colorScheme));
            });
        }

        // Footer with Report ID
        sections.push(...this.createFooterWithMetadata(reportId, generatedAt));

        // Create document
        const doc = new Document({
            sections: [{
                properties: {},
                children: sections
            }]
        });

        // Generate filename and save
        const filename = `${reportId}-${userName.replace(/\s+/g, '-')}.docx`;
        const filepath = path.join(this.exportDir, filename);

        // Convert to buffer and save
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(filepath, buffer);

        return filepath;
    }

    /**
     * Create enhanced title page with logo, demographics, and report ID (Phase 1)
     */
    createEnhancedTitlePage(title, userName, startDate, endDate, colorScheme, logoPath, reportId, generatedAt, organizationName, demographics) {
        const colors = this.getColorScheme(colorScheme);
        const paragraphs = [];

        // Organization Name
        paragraphs.push(
            new Paragraph({
                text: organizationName,
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 100 },
                children: [
                    new TextRun({
                        text: organizationName,
                        size: 24,
                        color: colors.secondary,
                        bold: true
                    })
                ]
            })
        );

        // Logo placeholder (if provided)
        if (logoPath) {
            try {
                paragraphs.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 300 },
                        children: [
                            new TextRun({
                                text: '[Organization Logo]',
                                italics: true,
                                size: 20,
                                color: colors.accent
                            })
                        ]
                    })
                );
            } catch (error) {
                console.error('Logo loading error:', error);
            }
        }

        // Report Title
        paragraphs.push(
            new Paragraph({
                text: title,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { before: 800, after: 200 },
                children: [
                    new TextRun({
                        text: title,
                        bold: true,
                        size: 48,
                        color: colors.primary
                    })
                ]
            })
        );

        // Divider
        paragraphs.push(
            new Paragraph({
                text: '─'.repeat(60),
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                    new TextRun({
                        text: '─'.repeat(60),
                        color: colors.accent,
                        size: 20
                    })
                ]
            })
        );

        // Patient Information Section
        paragraphs.push(
            new Paragraph({
                text: 'PATIENT INFORMATION',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
                children: [
                    new TextRun({
                        text: 'PATIENT INFORMATION',
                        bold: true,
                        size: 28,
                        color: colors.secondary
                    })
                ]
            })
        );

        // Patient Name
        paragraphs.push(
            new Paragraph({
                spacing: { after: 100 },
                children: [
                    new TextRun({
                        text: 'Name: ',
                        bold: true,
                        size: 24
                    }),
                    new TextRun({
                        text: userName,
                        size: 24
                    })
                ]
            })
        );

        // Phase 1: Demographics
        if (demographics.age) {
            paragraphs.push(
                new Paragraph({
                    spacing: { after: 100 },
                    children: [
                        new TextRun({
                            text: 'Age: ',
                            bold: true,
                            size: 24
                        }),
                        new TextRun({
                            text: `${demographics.age} years`,
                            size: 24
                        })
                    ]
                })
            );
        }

        if (demographics.gender) {
            paragraphs.push(
                new Paragraph({
                    spacing: { after: 100 },
                    children: [
                        new TextRun({
                            text: 'Gender: ',
                            bold: true,
                            size: 24
                        }),
                        new TextRun({
                            text: demographics.gender,
                            size: 24
                        })
                    ]
                })
            );
        }

        if (demographics.weight && demographics.height) {
            const bmi = (demographics.weight / ((demographics.height / 100) ** 2)).toFixed(1);
            paragraphs.push(
                new Paragraph({
                    spacing: { after: 100 },
                    children: [
                        new TextRun({
                            text: 'Height/Weight: ',
                            bold: true,
                            size: 24
                        }),
                        new TextRun({
                            text: `${demographics.height} cm / ${demographics.weight} kg (BMI: ${bmi})`,
                            size: 24
                        })
                    ]
                })
            );
        }

        // Date Range
        if (startDate || endDate) {
            paragraphs.push(
                new Paragraph({
                    spacing: { before: 200, after: 100 },
                    children: [
                        new TextRun({
                            text: 'Observation Period: ',
                            bold: true,
                            size: 24
                        }),
                        new TextRun({
                            text: `${startDate || 'N/A'} to ${endDate || 'N/A'}`,
                            size: 24
                        })
                    ]
                })
            );
        }

        // Report Metadata
        paragraphs.push(
            new Paragraph({
                spacing: { before: 400, after: 100 },
                children: [
                    new TextRun({
                        text: 'Report ID: ',
                        bold: true,
                        size: 24
                    }),
                    new TextRun({
                        text: reportId,
                        size: 24,
                        color: colors.primary
                    })
                ]
            })
        );

        paragraphs.push(
            new Paragraph({
                spacing: { after: 600 },
                children: [
                    new TextRun({
                        text: 'Generated: ',
                        bold: true,
                        size: 24
                    }),
                    new TextRun({
                        text: generatedAt,
                        size: 24
                    })
                ]
            })
        );

        // Footer note
        paragraphs.push(
            new Paragraph({
                spacing: { before: 1000 },
                border: {
                    top: {
                        color: colors.accent,
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6
                    }
                },
                children: [
                    new TextRun({
                        text: 'This report contains confidential medical information. Please handle with care.',
                        italics: true,
                        size: 20,
                        color: '666666'
                    })
                ]
            })
        );

        return paragraphs;
    }

    /**
     * Create Demographics Section (Phase 1)
     */
    createDemographicsSection(demographics, colorScheme) {
        const colors = this.getColorScheme(colorScheme);
        const paragraphs = [];

        paragraphs.push(
            new Paragraph({
                text: 'PATIENT DEMOGRAPHICS',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
                children: [
                    new TextRun({
                        text: 'PATIENT DEMOGRAPHICS',
                        bold: true,
                        size: 28,
                        color: colors.secondary
                    })
                ]
            })
        );

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({
                        text: 'Metric',
                        shading: { fill: colors.primary },
                        children: [new Paragraph({
                            text: 'Metric',
                            bold: true,
                            color: 'FFFFFF'
                        })]
                    }),
                    new TableCell({
                        text: 'Value',
                        shading: { fill: colors.primary },
                        children: [new Paragraph({
                            text: 'Value',
                            bold: true,
                            color: 'FFFFFF'
                        })]
                    })
                ]
            })
        ];

        if (demographics.age) {
            tableRows.push(
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('Age')] }),
                        new TableCell({ children: [new Paragraph(`${demographics.age} years`)] })
                    ]
                })
            );
        }

        if (demographics.gender) {
            tableRows.push(
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('Gender')] }),
                        new TableCell({ children: [new Paragraph(demographics.gender)] })
                    ]
                })
            );
        }

        if (demographics.height && demographics.weight) {
            const bmi = (demographics.weight / ((demographics.height / 100) ** 2)).toFixed(1);
            tableRows.push(
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('Height')] }),
                        new TableCell({ children: [new Paragraph(`${demographics.height} cm`)] })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('Weight')] }),
                        new TableCell({ children: [new Paragraph(`${demographics.weight} kg`)] })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                text: 'BMI',
                                bold: true
                            })]
                        }),
                        new TableCell({
                            children: [new Paragraph({
                                text: bmi,
                                bold: true,
                                color: this.getBMIColor(bmi)
                            })]
                        })
                    ]
                })
            );
        }

        paragraphs.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: tableRows
            })
        );

        return paragraphs;
    }

    /**
     * Create Trend Charts Section (Phase 1)
     */
    createTrendChartsSection(data, stats, colorScheme) {
        const colors = this.getColorScheme(colorScheme);
        const paragraphs = [];

        // Calculate min/max for trends
        const hrvValues = data.map(d => d.hrv).filter(v => v !== undefined && v !== null);
        const spo2Values = data.map(d => d.blood_oxygen).filter(v => v !== undefined && v !== null);
        const breathingValues = data.map(d => d.breathing).filter(v => v !== undefined && v !== null);

        const hrvMin = hrvValues.length > 0 ? Math.min(...hrvValues) : 0;
        const hrvMax = hrvValues.length > 0 ? Math.max(...hrvValues) : 0;
        const spo2Min = spo2Values.length > 0 ? Math.min(...spo2Values) : 0;
        const spo2Max = spo2Values.length > 0 ? Math.max(...spo2Values) : 0;
        const breathMin = breathingValues.length > 0 ? Math.min(...breathingValues) : 0;
        const breathMax = breathingValues.length > 0 ? Math.max(...breathingValues) : 0;

        paragraphs.push(
            new Paragraph({
                text: 'TREND ANALYSIS',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
                children: [
                    new TextRun({
                        text: 'TREND ANALYSIS',
                        bold: true,
                        size: 28,
                        color: colors.secondary
                    })
                ]
            })
        );

        // HRV Trend
        paragraphs.push(
            new Paragraph({
                text: 'Heart Rate Variability (HRV) Trend',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
                children: [
                    new TextRun({
                        text: 'Heart Rate Variability (HRV) Trend',
                        bold: true,
                        size: 26,
                        color: colors.accent
                    })
                ]
            })
        );

        paragraphs.push(
            new Paragraph({
                spacing: { after: 300 },
                children: [
                    new TextRun({
                        text: `Average: ${stats.avgHRV.toFixed(1)} ms | Min: ${hrvMin.toFixed(1)} ms | Max: ${hrvMax.toFixed(1)} ms | Trend: ${this.calculateTrend(hrvValues)}`,
                        size: 22
                    })
                ]
            })
        );

        // Blood Oxygen Trend
        paragraphs.push(
            new Paragraph({
                text: 'Blood Oxygen (SpO2) Trend',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
                children: [
                    new TextRun({
                        text: 'Blood Oxygen (SpO2) Trend',
                        bold: true,
                        size: 26,
                        color: colors.accent
                    })
                ]
            })
        );

        paragraphs.push(
            new Paragraph({
                spacing: { after: 300 },
                children: [
                    new TextRun({
                        text: `Average: ${stats.avgBloodOxygen.toFixed(1)}% | Min: ${spo2Min.toFixed(1)}% | Max: ${spo2Max.toFixed(1)}% | Trend: ${this.calculateTrend(spo2Values)}`,
                        size: 22
                    })
                ]
            })
        );

        // Breathing Rate Trend
        paragraphs.push(
            new Paragraph({
                text: 'Breathing Rate Trend',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
                children: [
                    new TextRun({
                        text: 'Breathing Rate Trend',
                        bold: true,
                        size: 26,
                        color: colors.accent
                    })
                ]
            })
        );

        paragraphs.push(
            new Paragraph({
                spacing: { after: 300 },
                children: [
                    new TextRun({
                        text: `Average: ${stats.avgBreathing.toFixed(1)} /min | Min: ${breathMin.toFixed(1)} /min | Max: ${breathMax.toFixed(1)} /min | Trend: ${this.calculateTrend(breathingValues)}`,
                        size: 22
                    })
                ]
            })
        );

        return paragraphs;
    }

    /**
     * Calculate trend direction
     */
    calculateTrend(values) {
        if (values.length < 2) return 'N/A';
        const recent = values.slice(-5);
        const avg1 = recent.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const avg2 = recent.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const diff = avg2 - avg1;
        if (diff > 2) return '↑ Increasing';
        if (diff < -2) return '↓ Decreasing';
        return '→ Stable';
    }

    /**
     * Get BMI color based on value
     */
    getBMIColor(bmi) {
        if (bmi < 18.5) return '3366FF'; // Underweight - Blue
        if (bmi < 25) return '00AA00'; // Normal - Green
        if (bmi < 30) return 'FFAA00'; // Overweight - Orange
        return 'FF3300'; // Obese - Red
    }

    /**
     * Create footer with metadata (Phase 1)
     */
    createFooterWithMetadata(reportId, generatedAt) {
        return [
            new Paragraph({
                text: `Report ID: ${reportId} | Generated: ${generatedAt}`,
                alignment: AlignmentType.CENTER,
                spacing: { before: 1000, after: 100 },
                border: {
                    top: {
                        color: '999999',
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6
                    }
                },
                children: [
                    new TextRun({
                        text: `Report ID: ${reportId} | Generated: ${generatedAt}`,
                        italics: true,
                        size: 20,
                        color: '666666'
                    })
                ]
            })
        ];
    }

    /**
     * Create original title page (kept for backward compatibility)
     */
    createTitlePage(title, userName, startDate, endDate, colorScheme) {
        const colors = this.getColorScheme(colorScheme);
        
        return [
            new Paragraph({
                text: title,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { before: 3000, after: 1000 },
                children: [
                    new TextRun({
                        text: title,
                        bold: true,
                        size: 48,
                        color: colors.primary
                    })
                ]
            }),
            new Paragraph({
                text: '',
                spacing: { before: 500, after: 500 }
            }),
            new Paragraph({
                text: `Patient: ${userName}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
                children: [
                    new TextRun({
                        text: `Patient: ${userName}`,
                        size: 28,
                        color: colors.secondary
                    })
                ]
            }),
            new Paragraph({
                text: `Report Date: ${new Date().toLocaleDateString()}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
                children: [
                    new TextRun({
                        text: `Report Date: ${new Date().toLocaleDateString()}`,
                        size: 24
                    })
                ]
            }),
            startDate && new Paragraph({
                text: `Analysis Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate || Date.now()).toLocaleDateString()}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 2000 },
                children: [
                    new TextRun({
                        text: `Analysis Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate || Date.now()).toLocaleDateString()}`,
                        size: 24
                    })
                ]
            }),
            new Paragraph({
                text: '',
                pageBreakBefore: true
            })
        ].filter(Boolean);
    }

    /**
     * Create executive summary
     */
    createExecutiveSummary(stats, predictions, colorScheme) {
        const colors = this.getColorScheme(colorScheme);
        const topPrediction = predictions[0] || {};

        return [
            new Paragraph({
                text: 'Executive Summary',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 300 },
                children: [
                    new TextRun({
                        text: 'Executive Summary',
                        bold: true,
                        size: 32,
                        color: colors.primary
                    })
                ]
            }),
            new Paragraph({
                text: `This report presents a comprehensive analysis of sleep monitoring data collected over the specified period. A total of ${stats.totalRecords} data points were analyzed using advanced machine learning algorithms and clinical rule-based systems.`,
                spacing: { after: 300 }
            }),
            new Paragraph({
                text: `Primary Finding: ${topPrediction.disorder || 'No significant disorder detected'}`,
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: 'Primary Finding: ',
                        bold: true
                    }),
                    new TextRun({
                        text: topPrediction.disorder || 'No significant disorder detected',
                        color: topPrediction.severity === 'Severe' ? 'DC2626' : topPrediction.severity === 'Moderate' ? 'F59E0B' : '10B981'
                    })
                ]
            }),
            topPrediction.severity && new Paragraph({
                text: `Severity Level: ${topPrediction.severity}`,
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: 'Severity Level: ',
                        bold: true
                    }),
                    new TextRun({
                        text: topPrediction.severity
                    })
                ]
            }),
            topPrediction.confidence && new Paragraph({
                text: `Confidence: ${(topPrediction.confidence * 100).toFixed(1)}%`,
                spacing: { after: 400 },
                children: [
                    new TextRun({
                        text: 'Confidence: ',
                        bold: true
                    }),
                    new TextRun({
                        text: `${(topPrediction.confidence * 100).toFixed(1)}%`
                    })
                ]
            }),
            new Paragraph({
                text: '',
                spacing: { after: 400 }
            })
        ].filter(Boolean);
    }

    /**
     * Create metrics section
     */
    createMetricsSection(stats, colorScheme) {
        const colors = this.getColorScheme(colorScheme);

        return [
            new Paragraph({
                text: 'Key Health Metrics',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 300 },
                children: [
                    new TextRun({
                        text: 'Key Health Metrics',
                        bold: true,
                        size: 32,
                        color: colors.primary
                    })
                ]
            }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: 'Metric', bold: true })] })],
                                shading: { fill: colors.tableHeader }
                            }),
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: 'Average Value', bold: true })] })],
                                shading: { fill: colors.tableHeader }
                            }),
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })],
                                shading: { fill: colors.tableHeader }
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph('Heart Rate Variability (HRV)')] }),
                            new TableCell({ children: [new Paragraph(`${stats.avgHRV.toFixed(1)} ms`)] }),
                            new TableCell({ children: [new Paragraph(this.getHRVStatus(stats.avgHRV))] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph('Blood Oxygen (SpO2)')] }),
                            new TableCell({ children: [new Paragraph(`${stats.avgBloodOxygen.toFixed(1)}%`)] }),
                            new TableCell({ children: [new Paragraph(this.getSpO2Status(stats.avgBloodOxygen))] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph('Breathing Rate')] }),
                            new TableCell({ children: [new Paragraph(`${stats.avgBreathing.toFixed(1)} breaths/min`)] }),
                            new TableCell({ children: [new Paragraph(this.getBreathingStatus(stats.avgBreathing))] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph('Most Common Sleep Stage')] }),
                            new TableCell({ children: [new Paragraph(stats.mostCommonStage)] }),
                            new TableCell({ children: [new Paragraph('N/A')] })
                        ]
                    })
                ]
            }),
            new Paragraph({
                text: '',
                spacing: { after: 400 }
            })
        ];
    }

    /**
     * Create detection results section
     */
    createDetectionResults(predictions, colorScheme) {
        const colors = this.getColorScheme(colorScheme);

        const sections = [
            new Paragraph({
                text: 'Detection Results',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 300 },
                children: [
                    new TextRun({
                        text: 'Detection Results',
                        bold: true,
                        size: 32,
                        color: colors.primary
                    })
                ]
            }),
            new Paragraph({
                text: 'The following disorders were detected and ranked by confidence:',
                spacing: { after: 300 }
            })
        ];

        // Add each prediction
        predictions.slice(0, 5).forEach((pred, index) => {
            sections.push(
                new Paragraph({
                    text: `${index + 1}. ${pred.disorder}`,
                    spacing: { before: 200, after: 100 },
                    children: [
                        new TextRun({
                            text: `${index + 1}. ${pred.disorder}`,
                            bold: true,
                            size: 24
                        })
                    ]
                }),
                new Paragraph({
                    text: `   Severity: ${pred.severity || 'N/A'}`,
                    spacing: { after: 50 }
                }),
                pred.confidence && new Paragraph({
                    text: `   Confidence: ${(pred.confidence * 100).toFixed(1)}%`,
                    spacing: { after: 200 }
                })
            );
        });

        sections.push(
            new Paragraph({
                text: '',
                spacing: { after: 400 }
            })
        );

        return sections.filter(Boolean);
    }

    /**
     * Create detailed data table
     */
    createDetailedDataTable(data, colorScheme) {
        const colors = this.getColorScheme(colorScheme);

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Time', bold: true })] })], shading: { fill: colors.tableHeader } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'HRV', bold: true })] })], shading: { fill: colors.tableHeader } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SpO2', bold: true })] })], shading: { fill: colors.tableHeader } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Breathing', bold: true })] })], shading: { fill: colors.tableHeader } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Stage', bold: true })] })], shading: { fill: colors.tableHeader } })
                ]
            })
        ];

        data.forEach(item => {
            tableRows.push(
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(new Date(item.timestamp).toLocaleTimeString())] }),
                        new TableCell({ children: [new Paragraph(item.hrv ? item.hrv.toFixed(0) : 'N/A')] }),
                        new TableCell({ children: [new Paragraph(item.blood_oxygen ? item.blood_oxygen.toFixed(1) : 'N/A')] }),
                        new TableCell({ children: [new Paragraph(item.breathing ? item.breathing.toFixed(1) : 'N/A')] }),
                        new TableCell({ children: [new Paragraph(item.sleepStage || 'N/A')] })
                    ]
                })
            );
        });

        return [
            new Paragraph({
                text: 'Detailed Monitoring Data',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 300 },
                children: [
                    new TextRun({
                        text: 'Detailed Monitoring Data',
                        bold: true,
                        size: 32,
                        color: colors.primary
                    })
                ]
            }),
            new Paragraph({
                text: `Showing last ${data.length} data points:`,
                spacing: { after: 300 }
            }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: tableRows
            }),
            new Paragraph({
                text: '',
                spacing: { after: 400 }
            })
        ];
    }

    /**
     * Create recommendations section
     */
    createRecommendations(predictions, stats, colorScheme) {
        const colors = this.getColorScheme(colorScheme);
        const recommendations = this.generateRecommendations(predictions, stats);

        const sections = [
            new Paragraph({
                text: 'Clinical Recommendations',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 300 },
                children: [
                    new TextRun({
                        text: 'Clinical Recommendations',
                        bold: true,
                        size: 32,
                        color: colors.primary
                    })
                ]
            }),
            new Paragraph({
                text: 'Based on the analysis, the following recommendations are provided:',
                spacing: { after: 300 }
            })
        ];

        recommendations.forEach((rec, index) => {
            sections.push(
                new Paragraph({
                    text: `${index + 1}. ${rec}`,
                    spacing: { before: 150, after: 150 },
                    bullet: { level: 0 }
                })
            );
        });

        sections.push(
            new Paragraph({
                text: '',
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: 'Disclaimer: This report is generated by an automated system for informational purposes only. Always consult with qualified healthcare professionals for medical advice, diagnosis, or treatment.',
                italics: true,
                spacing: { before: 400, after: 400 }
            })
        );

        return sections;
    }

    /**
     * Create custom section
     */
    createCustomSection(section, colorScheme) {
        const colors = this.getColorScheme(colorScheme);

        return [
            new Paragraph({
                text: section.title || 'Custom Section',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 300 },
                children: [
                    new TextRun({
                        text: section.title || 'Custom Section',
                        bold: true,
                        size: 28,
                        color: colors.secondary
                    })
                ]
            }),
            new Paragraph({
                text: section.content || '',
                spacing: { after: 400 }
            })
        ];
    }

    /**
     * Create footer
     */
    createFooter() {
        return [
            new Paragraph({
                text: '',
                pageBreakBefore: true
            }),
            new Paragraph({
                text: '_______________________________________________',
                alignment: AlignmentType.CENTER,
                spacing: { before: 1000, after: 200 }
            }),
            new Paragraph({
                text: 'Sleep Disorder Monitoring System',
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: `Generated on ${new Date().toLocaleString()}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: 'This is an automated report. For medical emergencies, contact emergency services.',
                alignment: AlignmentType.CENTER,
                italics: true,
                spacing: { after: 400 }
            })
        ];
    }

    /**
     * Calculate statistics from data
     */
    calculateStatistics(data) {
        const stats = {
            totalRecords: data.length,
            avgHRV: 0,
            avgBloodOxygen: 0,
            avgBreathing: 0,
            mostCommonStage: 'Unknown',
            anomalyCount: 0
        };

        if (data.length === 0) return stats;

        let hrvSum = 0, spo2Sum = 0, breathSum = 0;
        const stageCounts = {};

        data.forEach(item => {
            if (item.hrv) hrvSum += item.hrv;
            if (item.blood_oxygen) spo2Sum += item.blood_oxygen;
            if (item.breathing) breathSum += item.breathing;
            if (item.sleepStage) {
                stageCounts[item.sleepStage] = (stageCounts[item.sleepStage] || 0) + 1;
            }
            if (item.anomaly) stats.anomalyCount++;
        });

        stats.avgHRV = hrvSum / data.length;
        stats.avgBloodOxygen = spo2Sum / data.length;
        stats.avgBreathing = breathSum / data.length;

        let maxCount = 0;
        Object.entries(stageCounts).forEach(([stage, count]) => {
            if (count > maxCount) {
                maxCount = count;
                stats.mostCommonStage = stage;
            }
        });

        return stats;
    }

    /**
     * Extract predictions from data
     */
    extractPredictions(data) {
        const predictions = [];
        const disorderMap = new Map();

        data.forEach(item => {
            if (item.prediction && item.prediction.disorder) {
                const disorder = item.prediction.disorder;
                if (!disorderMap.has(disorder)) {
                    disorderMap.set(disorder, {
                        disorder: disorder,
                        severity: item.prediction.severity,
                        confidence: item.prediction.confidence,
                        count: 1
                    });
                } else {
                    const existing = disorderMap.get(disorder);
                    existing.count++;
                }
            }
        });

        disorderMap.forEach(pred => predictions.push(pred));
        predictions.sort((a, b) => b.count - a.count);

        return predictions;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(predictions, stats) {
        const recommendations = [];

        // Based on top prediction
        const topPrediction = predictions[0];
        if (topPrediction) {
            if (topPrediction.disorder === 'Sleep Apnea' || topPrediction.disorder === 'Apnea') {
                recommendations.push('Consider consulting a sleep specialist for sleep apnea evaluation');
                recommendations.push('Maintain a healthy weight and avoid alcohol before bedtime');
                recommendations.push('Sleep on your side instead of your back');
            } else if (topPrediction.disorder === 'Insomnia') {
                recommendations.push('Establish a consistent sleep schedule');
                recommendations.push('Create a relaxing bedtime routine');
                recommendations.push('Limit screen time before bed');
            }
        }

        // Based on metrics
        if (stats.avgBloodOxygen < 94) {
            recommendations.push('Monitor oxygen levels regularly and consult a physician if persistently low');
        }
        if (stats.avgHRV < 40) {
            recommendations.push('Practice stress-reduction techniques such as meditation or yoga');
        }
        if (stats.avgBreathing < 12 || stats.avgBreathing > 20) {
            recommendations.push('Consult a healthcare provider about breathing irregularities');
        }

        // General recommendations
        recommendations.push('Maintain a regular sleep schedule (7-9 hours per night)');
        recommendations.push('Create a comfortable sleep environment (cool, dark, quiet)');
        recommendations.push('Exercise regularly but avoid vigorous activity close to bedtime');
        recommendations.push('Follow up with your healthcare provider for comprehensive evaluation');

        return recommendations;
    }

    /**
     * Create Severity-Based Recommendations Section (Phase 2)
     */
    createSeverityBasedSection(predictions, stats, colorScheme, language = 'en', severityThresholds = {}) {
        const colors = this.getColorScheme(colorScheme);
        const translations = this.getTranslations(language);
        
        const sections = [];
        
        // Severity scoring
        const severityScore = this.calculateSeverityScore(predictions, stats, severityThresholds);
        
        // Title
        sections.push(new Paragraph({
            text: translations.severityAnalysis || 'SEVERITY ANALYSIS & PERSONALIZED RECOMMENDATIONS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
            border: {
                bottom: {
                    color: colors.primary,
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 12
                }
            }
        }));

        // Severity Level Indicator
        const severityLevel = this.getSeverityLevel(severityScore);
        const severityColor = severityLevel === 'Critical' ? 'FF0000' 
                            : severityLevel === 'High' ? 'FF6600'
                            : severityLevel === 'Moderate' ? 'FFBB00'
                            : '00BB00';
        
        sections.push(new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            shading: { fill: severityColor },
                            children: [new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { line: 300 },
                                children: [new TextRun({
                                    text: severityLevel,
                                    bold: true,
                                    color: 'FFFFFF'
                                })]
                            })]
                        }),
                        new TableCell({
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({
                                spacing: { line: 300 },
                                children: [new TextRun({
                                    text: `${translations.severityScore || 'Severity Score'}: ${severityScore.toFixed(1)}/100`
                                })]
                            })]
                        })
                    ]
                })
            ]
        }));

        sections.push(new Paragraph({ text: '' }));

        // Personalized Recommendations
        sections.push(new Paragraph({
            text: translations.personalizedRecommendations || 'Personalized Recommendations',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        const recommendations = this.generateSeverityBasedRecommendations(
            predictions,
            stats,
            severityScore,
            language
        );

        recommendations.forEach((rec, index) => {
            sections.push(new Paragraph({
                text: `${index + 1}. ${rec}`,
                spacing: { before: 50, after: 50 },
                bullet: { level: 0 }
            }));
        });

        sections.push(new Paragraph({ text: '' }));

        return sections;
    }

    /**
     * Calculate Severity Score (Phase 2)
     */
    calculateSeverityScore(predictions, stats, thresholds = {}) {
        let score = 0;
        const maxScore = 100;

        // Default thresholds
        const defaultThresholds = {
            hrvMin: 20,
            hrvMax: 60,
            spo2Min: 90,
            breathingMin: 12,
            breathingMax: 20
        };
        const t = { ...defaultThresholds, ...thresholds };

        // Evaluate HRV (Heart Rate Variability)
        if (stats.avgHRV < t.hrvMin) score += 25;
        else if (stats.avgHRV < t.hrvMax * 0.7) score += 15;
        else score += 5;

        // Evaluate SpO2 (Blood Oxygen)
        if (stats.avgBloodOxygen < 90) score += 30;
        else if (stats.avgBloodOxygen < 95) score += 15;
        else score += 5;

        // Evaluate Breathing
        if (stats.avgBreathing < t.breathingMin || stats.avgBreathing > t.breathingMax) score += 20;
        else score += 5;

        // Evaluate Disorder Predictions
        if (predictions && predictions.length > 0) {
            const topPrediction = predictions[0];
            if (topPrediction.severity === 'High') score += 15;
            else if (topPrediction.severity === 'Moderate') score += 8;
            else score += 2;
        }

        // Clamp score between 0-100
        return Math.min(maxScore, Math.max(0, score));
    }

    /**
     * Get Severity Level (Phase 2)
     */
    getSeverityLevel(score) {
        if (score >= 80) return 'Critical';
        if (score >= 60) return 'High';
        if (score >= 40) return 'Moderate';
        if (score >= 20) return 'Mild';
        return 'Minimal';
    }

    /**
     * Generate Severity-Based Recommendations (Phase 2)
     */
    generateSeverityBasedRecommendations(predictions, stats, severityScore, language = 'en') {
        const recommendations = [];
        const translations = this.getTranslations(language);

        // Critical level recommendations
        if (severityScore >= 80) {
            recommendations.push(translations.criticalRecommendation || 'Seek immediate medical attention from a sleep specialist');
            recommendations.push(translations.sleepStudyRecommendation || 'Polysomnography (sleep study) is highly recommended for accurate diagnosis');
        }

        // High severity recommendations
        if (severityScore >= 60) {
            recommendations.push(translations.specialistRecommendation || 'Consult a sleep medicine specialist soon');
            recommendations.push(translations.treatmentRecommendation || 'Consider treatment options based on specialist evaluation');
        }

        // HRV-specific recommendations
        if (stats.avgHRV < 20) {
            recommendations.push(translations.hrvRecommendation || 'Your HRV is low - practice stress reduction techniques daily (meditation, yoga, deep breathing)');
        } else if (stats.avgHRV < 40) {
            recommendations.push(translations.hrvWarning || 'Elevated stress detected - increase relaxation activities');
        }

        // SpO2-specific recommendations
        if (stats.avgBloodOxygen < 90) {
            recommendations.push(translations.spo2Critical || 'Oxygen levels are low - seek immediate medical evaluation');
        } else if (stats.avgBloodOxygen < 95) {
            recommendations.push(translations.spo2Warning || 'Monitor oxygen levels closely and consult your doctor');
        }

        // Breathing-specific recommendations
        if (stats.avgBreathing < 12 || stats.avgBreathing > 20) {
            recommendations.push(translations.breathingRecommendation || 'Breathing pattern is irregular - consult a respiratory specialist');
        }

        // Lifestyle recommendations based on severity
        if (severityScore >= 40) {
            recommendations.push(translations.lifestyleRecommendation || 'Implement comprehensive lifestyle changes: sleep schedule, exercise, diet, stress management');
            recommendations.push(translations.sleepHygieneRecommendation || 'Follow strict sleep hygiene protocols: consistent bedtime, avoid stimulants');
        }

        // Follow-up recommendations
        recommendations.push(translations.followUpRecommendation || `Follow up with your healthcare provider within ${severityScore >= 60 ? '1-2 weeks' : '2-4 weeks'}`);

        return recommendations;
    }

    /**
     * Create Baseline Comparison Section (Phase 2)
     */
    createBaselineComparisonSection(currentStats, baselineData, colorScheme, language = 'en') {
        const colors = this.getColorScheme(colorScheme);
        const translations = this.getTranslations(language);
        const sections = [];

        // Title
        sections.push(new Paragraph({
            text: translations.baselineComparison || 'BASELINE COMPARISON ANALYSIS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
            border: {
                bottom: {
                    color: colors.primary,
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 12
                }
            }
        }));

        // Comparison Table
        const comparisonTable = this.createComparisonTable(
            currentStats,
            baselineData,
            colors,
            translations
        );

        sections.push(comparisonTable);
        sections.push(new Paragraph({ text: '' }));

        // Trend Analysis
        sections.push(new Paragraph({
            text: translations.trendAnalysis || 'Trend Analysis',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        const trends = this.analyzeBaseliningTrends(currentStats, baselineData);
        
        trends.forEach((trend, index) => {
            const arrow = trend.change > 2 ? '↑' : trend.change < -2 ? '↓' : '→';
            const status = trend.change > 2 ? translations.increasing || 'Increased'
                        : trend.change < -2 ? translations.decreasing || 'Decreased'
                        : translations.stable || 'Stable';
            
            sections.push(new Paragraph({
                text: `${arrow} ${trend.metric}: ${status} (${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%)`,
                spacing: { before: 50, after: 50 }
            }));
        });

        sections.push(new Paragraph({ text: '' }));

        return sections;
    }

    /**
     * Create Comparison Table (Phase 2)
     */
    createComparisonTable(currentStats, baselineData, colors, translations) {
        const metrics = [
            { key: 'avgHRV', label: translations.hrv || 'Heart Rate Variability (ms)' },
            { key: 'avgBloodOxygen', label: translations.spo2 || 'Blood Oxygen (%)' },
            { key: 'avgBreathing', label: translations.breathing || 'Breathing Rate (/min)' },
            { key: 'avgSleepDuration', label: translations.sleepDuration || 'Sleep Duration (hrs)' },
            { key: 'deepSleepPercentage', label: translations.deepSleep || 'Deep Sleep (%)' },
            { key: 'remPercentage', label: translations.rem || 'REM Sleep (%)' }
        ];

        const rows = [
            // Header row
            new TableRow({
                children: [
                    this.createHeaderCell(translations.metric || 'Metric', colors),
                    this.createHeaderCell(translations.baseline || 'Baseline', colors),
                    this.createHeaderCell(translations.current || 'Current', colors),
                    this.createHeaderCell(translations.change || 'Change', colors)
                ]
            })
        ];

        // Data rows
        metrics.forEach(metric => {
            const baseline = baselineData[metric.key] || 0;
            const current = currentStats[metric.key] || 0;
            const change = baseline !== 0 ? ((current - baseline) / baseline * 100) : 0;
            const changeColor = change > 5 ? 'FF6600' : change < -5 ? 'FFBB00' : '00BB00';

            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'F3F4F6' },
                        children: [new Paragraph({ children: [new TextRun({ text: metric.label })] })]
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: baseline.toFixed(1) })] })]
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: current.toFixed(1) })] })]
                    }),
                    new TableCell({
                        shading: { fill: changeColor },
                        children: [new Paragraph({
                            text: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
                            color: 'FFFFFF',
                            bold: true
                        })]
                    })
                ]
            }));
        });

        return new Table({ rows });
    }

    /**
     * Analyze Baseline Trends (Phase 2)
     */
    analyzeBaseliningTrends(currentStats, baselineData) {
        const trends = [];

        const metrics = [
            { key: 'avgHRV', label: 'Heart Rate Variability' },
            { key: 'avgBloodOxygen', label: 'Blood Oxygen Level' },
            { key: 'avgBreathing', label: 'Breathing Rate' },
            { key: 'avgSleepDuration', label: 'Sleep Duration' }
        ];

        metrics.forEach(metric => {
            const baseline = baselineData[metric.key] || 0;
            const current = currentStats[metric.key] || 0;
            const change = baseline !== 0 ? ((current - baseline) / baseline * 100) : 0;
            
            trends.push({
                metric: metric.label,
                change: change,
                baseline,
                current
            });
        });

        return trends;
    }

    /**
     * Create Header Cell Helper (Phase 2)
     */
    createHeaderCell(text, colors) {
        return new TableCell({
            shading: { fill: colors.tableHeader },
            children: [new Paragraph({
                text: text,
                bold: true,
                color: colors.primary
            })]
        });
    }

    /**
     * Get Translations (Phase 2)
     */
    getTranslations(language = 'en') {
        const translations = {
            en: {
                severityAnalysis: 'SEVERITY ANALYSIS & PERSONALIZED RECOMMENDATIONS',
                severityScore: 'Severity Score',
                personalizedRecommendations: 'Personalized Recommendations',
                criticalRecommendation: 'Seek immediate medical attention from a sleep specialist',
                sleepStudyRecommendation: 'Polysomnography (sleep study) is highly recommended for accurate diagnosis',
                specialistRecommendation: 'Consult a sleep medicine specialist soon',
                treatmentRecommendation: 'Consider treatment options based on specialist evaluation',
                hrvRecommendation: 'Your HRV is low - practice stress reduction techniques daily (meditation, yoga, deep breathing)',
                hrvWarning: 'Elevated stress detected - increase relaxation activities',
                spo2Critical: 'Oxygen levels are low - seek immediate medical evaluation',
                spo2Warning: 'Monitor oxygen levels closely and consult your doctor',
                breathingRecommendation: 'Breathing pattern is irregular - consult a respiratory specialist',
                lifestyleRecommendation: 'Implement comprehensive lifestyle changes: sleep schedule, exercise, diet, stress management',
                sleepHygieneRecommendation: 'Follow strict sleep hygiene protocols: consistent bedtime, avoid stimulants',
                followUpRecommendation: 'Follow up with your healthcare provider within 2-4 weeks',
                baselineComparison: 'BASELINE COMPARISON ANALYSIS',
                trendAnalysis: 'Trend Analysis',
                metric: 'Metric',
                baseline: 'Baseline',
                current: 'Current',
                change: 'Change',
                hrv: 'Heart Rate Variability (ms)',
                spo2: 'Blood Oxygen (%)',
                breathing: 'Breathing Rate (/min)',
                sleepDuration: 'Sleep Duration (hrs)',
                deepSleep: 'Deep Sleep (%)',
                rem: 'REM Sleep (%)',
                increasing: 'Increased',
                decreasing: 'Decreased',
                stable: 'Stable'
            },
            es: {
                severityAnalysis: 'ANÁLISIS DE SEVERIDAD Y RECOMENDACIONES PERSONALIZADAS',
                severityScore: 'Puntuación de Severidad',
                personalizedRecommendations: 'Recomendaciones Personalizadas',
                criticalRecommendation: 'Busque atención médica inmediata de un especialista en sueño',
                sleepStudyRecommendation: 'Se recomienda altamente la polisomnografía para un diagnóstico preciso',
                specialistRecommendation: 'Consulte a un especialista en medicina del sueño pronto',
                treatmentRecommendation: 'Considere opciones de tratamiento basadas en evaluación del especialista',
                hrvRecommendation: 'Su VFC es bajo - practique técnicas de reducción de estrés diariamente',
                hrvWarning: 'Estrés elevado detectado - aumente actividades de relajación',
                spo2Critical: 'Los niveles de oxígeno son bajos - busque evaluación médica inmediata',
                spo2Warning: 'Monitoree los niveles de oxígeno y consulte su médico',
                breathingRecommendation: 'El patrón de respiración es irregular - consulte a un especialista respiratorio',
                lifestyleRecommendation: 'Implemente cambios de estilo de vida integral: horario de sueño, ejercicio, dieta, manejo del estrés',
                sleepHygieneRecommendation: 'Siga protocolos estrictos de higiene del sueño',
                followUpRecommendation: 'Haga seguimiento con su proveedor de atención médica dentro de 2-4 semanas',
                baselineComparison: 'ANÁLISIS DE COMPARACIÓN CON LÍNEA BASE',
                trendAnalysis: 'Análisis de Tendencias',
                metric: 'Métrica',
                baseline: 'Línea Base',
                current: 'Actual',
                change: 'Cambio',
                hrv: 'Variabilidad de Frecuencia Cardíaca (ms)',
                spo2: 'Oxígeno en Sangre (%)',
                breathing: 'Frecuencia Respiratoria (/min)',
                sleepDuration: 'Duración del Sueño (hrs)',
                deepSleep: 'Sueño Profundo (%)',
                rem: 'Sueño REM (%)',
                increasing: 'Aumentado',
                decreasing: 'Disminuido',
                stable: 'Estable'
            },
            fr: {
                severityAnalysis: 'ANALYSE DE GRAVITÉ ET RECOMMANDATIONS PERSONNALISÉES',
                severityScore: 'Score de Gravité',
                personalizedRecommendations: 'Recommandations Personnalisées',
                criticalRecommendation: 'Cherchez une attention médicale immédiate d\'un spécialiste du sommeil',
                sleepStudyRecommendation: 'Une polysomnographie est fortement recommandée pour un diagnostic précis',
                specialistRecommendation: 'Consultez bientôt un spécialiste de la médecine du sommeil',
                treatmentRecommendation: 'Envisagez des options de traitement basées sur l\'évaluation du spécialiste',
                hrvRecommendation: 'Votre VFC est faible - pratiquez des techniques de réduction du stress quotidiennement',
                hrvWarning: 'Stress élevé détecté - augmentez les activités de relaxation',
                spo2Critical: 'Les niveaux d\'oxygène sont bas - consultez immédiatement un médecin',
                spo2Warning: 'Surveillez les niveaux d\'oxygène et consultez votre médecin',
                breathingRecommendation: 'Le schéma respiratoire est irrégulier - consultez un spécialiste respiratoire',
                lifestyleRecommendation: 'Mettez en œuvre des changements de mode de vie complets',
                sleepHygieneRecommendation: 'Suivez des protocoles stricts d\'hygiène du sommeil',
                followUpRecommendation: 'Consultez votre fournisseur de soins de santé dans 2 à 4 semaines',
                baselineComparison: 'ANALYSE COMPARATIVE DE RÉFÉRENCE',
                trendAnalysis: 'Analyse des Tendances',
                metric: 'Métrique',
                baseline: 'Référence',
                current: 'Actuel',
                change: 'Changement',
                hrv: 'Variabilité de la Fréquence Cardiaque (ms)',
                spo2: 'Oxygène Sanguin (%)',
                breathing: 'Fréquence Respiratoire (/min)',
                sleepDuration: 'Durée du Sommeil (hrs)',
                deepSleep: 'Sommeil Profond (%)',
                rem: 'Sommeil REM (%)',
                increasing: 'Augmenté',
                decreasing: 'Diminué',
                stable: 'Stable',
                // Phase 3 translations
                detailedSleepAnalysis: 'DETAILED SLEEP STAGE ANALYSIS',
                sleepStageBreakdown: 'Sleep Stage Distribution',
                sleepCycleAnalysis: 'Sleep Cycle Characteristics',
                averageCycleDuration: 'Average Cycle Duration',
                cyclesPerNight: 'Cycles per Night',
                deepSleepQuality: 'Deep Sleep Quality',
                remSleepQuality: 'REM Sleep Quality',
                weeklyTrend: 'Weekly Trend Analysis',
                patientActionPlan: 'PATIENT ACTION PLAN',
                planDuration: 'Recommended Implementation Period',
                weekOne: 'Week 1: Immediate Actions',
                weeksTwo: 'Weeks 2-4: Short-term Goals',
                successMetrics: 'Success Metrics',
                followUpSchedule: 'Follow-up Schedule',
                hipaaCompliance: 'HIPAA COMPLIANCE & CONFIDENTIALITY',
                confidentialityNotice: 'CONFIDENTIAL MEDICAL RECORD',
                hipaaStatement: 'This document contains protected health information (PHI) subject to the Health Insurance Portability and Accountability Act (HIPAA). Unauthorized access, use, or disclosure of this information is prohibited by law.',
                privacySafeguards: 'Privacy Safeguards',
                safeguard1: 'Encrypted transmission and storage of patient data',
                safeguard2: 'Limited access to authorized healthcare providers only',
                safeguard3: 'Secure audit trails for all data access',
                safeguard4: 'Regular security assessments and compliance audits',
                safeguard5: 'Immediate breach notification procedures',
                safeguard6: 'Patient rights to access, amend, and receive account of disclosures',
                patientRights: 'Patient Rights Under HIPAA',
                right1: 'Right to Access: You have the right to access, inspect, and receive a copy of your health information',
                right2: 'Right to Amend: You may request amendments to your health information',
                right3: 'Right to Accounting: You have the right to receive an accounting of disclosures of your health information',
                right4: 'Right to Confidential Communications: You can request to receive health information by alternative means',
                right5: 'Right to Complain: You may file a complaint with the U.S. Department of Health and Human Services',
                dataRetention: 'Data Retention Policy',
                retentionPolicy: 'Patient health records are retained for a minimum of 6 years in accordance with medical record regulations. After retention period, records are securely destroyed using certified data destruction methods.',
                reportAuthentication: 'Report Authentication',
                reportID: 'Report ID',
                generatedDate: 'Generated Date',
                physicianCertification: 'PHYSICIAN CERTIFICATION',
                certificationStatement: 'I certify that I have reviewed this sleep disorder detection report and that the findings, recommendations, and action plan are medically appropriate for this patient based on current clinical standards.',
                physicianSignature: 'Physician Signature',
                date: 'Date',
                physicianInformation: 'Physician Information',
                name: 'Name',
                licenseNumber: 'License #',
                specialty: 'Specialty',
                sleepMedicine: 'Sleep Medicine',
                clinicStamp: '[CLINIC STAMP / SEAL]',
                legalDisclaimer: 'Legal Disclaimer',
                disclaimerText: 'This report is intended for the use of the named patient and their healthcare providers only. This report is not a substitute for professional medical advice, diagnosis, or treatment. Any action taken based on this report should be done in consultation with a qualified healthcare professional.',
                awakening: 'Awakening',
                lightSleep: 'Light Sleep',
                sleepStage: 'Sleep Stage',
                percentage: 'Percentage',
                duration: 'Duration',
                quality: 'Quality',
                week: 'Week',
                action1: 'Establish consistent sleep schedule (same bedtime/wake time daily)',
                action2: 'Create sleep log to track sleep duration and quality',
                action3: 'Eliminate screen time 1 hour before bedtime',
                action4: 'Reduce caffeine intake after 2:00 PM',
                action5: 'Schedule consultation with sleep specialist if not already done',
                goal1: 'Achieve 7-9 hours of sleep per night consistently',
                goal2: 'Increase deep sleep percentage by 5-10%',
                goal3: 'Improve sleep efficiency (time asleep / time in bed) to >85%',
                goal4: 'Reduce nighttime awakenings by 50%',
                goal5: 'Implement relaxation techniques (meditation, breathing exercises)',
                metricsleep: 'Sleep Duration',
                metricsdeep: 'Deep Sleep %',
                metricsrem: 'REM Sleep %',
                metricsawake: 'Awakenings/Night',
                target: 'Target'
            }
        };

        // Add Spanish Phase 3 translations
        translations.es = {
            ...translations.es,
            detailedSleepAnalysis: 'ANÁLISIS DETALLADO DE ETAPAS DEL SUEÑO',
            sleepStageBreakdown: 'Distribución de Etapas del Sueño',
            sleepCycleAnalysis: 'Características del Ciclo del Sueño',
            patientActionPlan: 'PLAN DE ACCIÓN DEL PACIENTE',
            hipaaCompliance: 'CUMPLIMIENTO DE HIPAA Y CONFIDENCIALIDAD',
            physicianCertification: 'CERTIFICACIÓN DEL MÉDICO',
            awakenings: 'Despertares',
            lightSleep: 'Sueño Ligero',
            sleepStage: 'Etapa del Sueño',
            percentage: 'Porcentaje',
            duration: 'Duración',
            quality: 'Calidad',
            target: 'Objetivo',
            action1: 'Establecer horario consistente de sueño (misma hora de acostarse/despertar)',
            action2: 'Crear registro de sueño para rastrear duración y calidad',
            action3: 'Eliminar tiempo de pantalla 1 hora antes de acostarse',
            action4: 'Reducir consumo de cafeína después de las 2:00 PM',
            action5: 'Programar consulta con especialista en sueño si aún no lo ha hecho'
        };

        // Add French Phase 3 translations
        translations.fr = {
            ...translations.fr,
            detailedSleepAnalysis: 'ANALYSE DÉTAILLÉE DES STADES DU SOMMEIL',
            sleepStageBreakdown: 'Distribution des Stades du Sommeil',
            sleepCycleAnalysis: 'Caractéristiques du Cycle du Sommeil',
            patientActionPlan: 'PLAN D\'ACTION DU PATIENT',
            hipaaCompliance: 'CONFORMITÉ HIPAA ET CONFIDENTIALITÉ',
            physicianCertification: 'CERTIFICATION DU MÉDECIN',
            awakening: 'Réveils',
            lightSleep: 'Sommeil Léger',
            sleepStage: 'Stade du Sommeil',
            percentage: 'Pourcentage',
            duration: 'Durée',
            quality: 'Qualité',
            target: 'Cible',
            action1: 'Établir un horaire de sommeil cohérent (même heure de coucher/lever)',
            action2: 'Créer un registre de sommeil pour suivre la durée et la qualité',
            action3: 'Éliminer le temps d\'écran 1 heure avant le coucher',
            action4: 'Réduire la consommation de caféine après 14 h',
            action5: 'Consulter un spécialiste du sommeil si ce n\'est déjà fait'
        };

        return translations[language] || translations.en;
    }

    /**
     * Get color scheme
     */
    getColorScheme(scheme) {
        const schemes = {
            professional: {
                primary: '1E3A8A',      // Dark blue
                secondary: '3B82F6',    // Blue
                tableHeader: 'DBEAFE'   // Light blue
            },
            medical: {
                primary: '065F46',      // Dark teal
                secondary: '10B981',    // Teal
                tableHeader: 'D1FAE5'   // Light green
            },
            modern: {
                primary: '6366F1',      // Indigo
                secondary: '8B5CF6',    // Purple
                tableHeader: 'E0E7FF'   // Light indigo
            }
        };

        return schemes[scheme] || schemes.professional;
    }

    // Status helper methods
    getHRVStatus(hrv) {
        if (hrv >= 60) return 'Excellent';
        if (hrv >= 40) return 'Good';
        if (hrv >= 20) return 'Fair';
        return 'Needs Attention';
    }

    getSpO2Status(spo2) {
        if (spo2 >= 95) return 'Normal';
        if (spo2 >= 90) return 'Acceptable';
        return 'Low - Consult Doctor';
    }

    getBreathingStatus(breathing) {
        if (breathing >= 12 && breathing <= 20) return 'Normal';
        return 'Irregular';
    }

    /**
     * Create Detailed Sleep Analysis Section (Phase 3)
     */
    createDetailedSleepAnalysis(data, stats, colorScheme, language = 'en', weeklyComparison = false) {
        const colors = this.getColorScheme(colorScheme);
        const translations = this.getTranslations(language);
        const sections = [];

        // Title
        sections.push(new Paragraph({
            text: translations.detailedSleepAnalysis || 'DETAILED SLEEP STAGE ANALYSIS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
            border: {
                bottom: {
                    color: colors.primary,
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 12
                }
            }
        }));

        // Sleep Stage Breakdown
        sections.push(new Paragraph({
            text: translations.sleepStageBreakdown || 'Sleep Stage Distribution',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        const sleepStageTable = this.createSleepStageTable(stats, colors, translations);
        sections.push(sleepStageTable);
        sections.push(new Paragraph({ text: '' }));

        // Sleep Cycles Analysis
        sections.push(new Paragraph({
            text: translations.sleepCycleAnalysis || 'Sleep Cycle Characteristics',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        const cycleAnalysis = [
            { label: translations.averageCycleDuration || 'Average Cycle Duration', value: '90 minutes', status: 'Normal' },
            { label: translations.cyclesPerNight || 'Cycles per Night', value: `${Math.round((stats.avgSleepDuration || 7) / 1.5)}`, status: 'Normal' },
            { label: translations.deepSleepQuality || 'Deep Sleep Quality', value: `${(stats.deepSleepPercentage || 15).toFixed(1)}%`, status: this.getDeepSleepStatus(stats.deepSleepPercentage) },
            { label: translations.remSleepQuality || 'REM Sleep Quality', value: `${(stats.remPercentage || 20).toFixed(1)}%`, status: this.getREMSleepStatus(stats.remPercentage) }
        ];

        cycleAnalysis.forEach(item => {
            const statusColor = item.status === 'Normal' ? '10B981' : item.status === 'Low' ? 'F59E0B' : 'EF4444';
            sections.push(new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                shading: { fill: 'F3F4F6' },
                                children: [new Paragraph({ children: [new TextRun({ text: item.label, bold: true })] })]
                            }),
                            new TableCell({
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                children: [new Paragraph({ children: [new TextRun({ text: item.value })] })]
                            }),
                            new TableCell({
                                width: { size: 20, type: WidthType.PERCENTAGE },
                                shading: { fill: statusColor },
                                children: [new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({
                                        text: item.status,
                                        color: 'FFFFFF',
                                        bold: true
                                    })]
                                })]
                            })
                        ]
                    })
                ]
            }));
        });

        sections.push(new Paragraph({ text: '' }));

        // Weekly Comparison (if enabled)
        if (weeklyComparison && data.length >= 7) {
            sections.push(new Paragraph({
                text: translations.weeklyTrend || 'Weekly Trend Analysis',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 100, after: 100 }
            }));

            const weeklyStats = this.calculateWeeklyStats(data);
            const weeklyTable = this.createWeeklyComparisonTable(weeklyStats, colors, translations);
            sections.push(weeklyTable);
            sections.push(new Paragraph({ text: '' }));
        }

        return sections;
    }

    /**
     * Create Patient Action Plan (Phase 3)
     */
    createPatientActionPlan(predictions, stats, colorScheme, language = 'en', days = 30) {
        const colors = this.getColorScheme(colorScheme);
        const translations = this.getTranslations(language);
        const sections = [];

        // Title
        sections.push(new Paragraph({
            text: translations.patientActionPlan || 'PATIENT ACTION PLAN',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
            border: {
                bottom: {
                    color: colors.primary,
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 12
                }
            }
        }));

        sections.push(new Paragraph({
            text: `${translations.planDuration || 'Recommended Implementation Period'}: ${days} days`,
            spacing: { before: 50, after: 100 },
            italics: true
        }));

        // Phase 1: Immediate Actions (Week 1)
        sections.push(new Paragraph({
            text: translations.weekOne || 'Week 1: Immediate Actions',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        const weekOneActions = this.generateWeekOneActions(stats, language);
        weekOneActions.forEach((action, idx) => {
            sections.push(new Paragraph({
                text: `${idx + 1}. ${action}`,
                spacing: { before: 50, after: 50 },
                bullet: { level: 0 }
            }));
        });

        // Phase 2: Short-term Goals (Week 2-4)
        sections.push(new Paragraph({
            text: translations.weeksTwo || 'Weeks 2-4: Short-term Goals',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        const shortTermGoals = this.generateShortTermGoals(stats, language);
        shortTermGoals.forEach((goal, idx) => {
            sections.push(new Paragraph({
                text: `${idx + 1}. ${goal}`,
                spacing: { before: 50, after: 50 },
                bullet: { level: 0 }
            }));
        });

        // Success Metrics
        sections.push(new Paragraph({
            text: translations.successMetrics || 'Success Metrics',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        const metricsTable = this.createActionPlanMetricsTable(stats, colors, translations);
        sections.push(metricsTable);
        sections.push(new Paragraph({ text: '' }));

        // Follow-up Schedule
        sections.push(new Paragraph({
            text: translations.followUpSchedule || 'Follow-up Schedule',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        const followUpDates = [
            { week: translations.week || 'Week 1', date: 'Check-in with sleep log', action: 'Review initial changes' },
            { week: translations.week || 'Week 2', date: 'Mid-week assessment', action: 'Adjust lifestyle changes as needed' },
            { week: translations.week || 'Week 4', date: 'End of phase assessment', action: 'Measure improvement, plan next steps' }
        ];

        followUpDates.forEach(followUp => {
            sections.push(new Paragraph({
                text: `${followUp.week}: ${followUp.date}`,
                spacing: { before: 50, after: 30 },
                bold: true
            }));
            sections.push(new Paragraph({
                text: followUp.action,
                spacing: { before: 0, after: 50 },
                indent: { left: 720 }
            }));
        });

        return sections;
    }

    /**
     * Create HIPAA Compliance Section (Phase 3)
     */
    createHIPAAComplianceSection(reportId, colorScheme, language = 'en') {
        const colors = this.getColorScheme(colorScheme);
        const translations = this.getTranslations(language);
        const sections = [];

        // Title
        sections.push(new Paragraph({
            text: translations.hipaaCompliance || 'HIPAA COMPLIANCE & CONFIDENTIALITY',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
            border: {
                bottom: {
                    color: colors.primary,
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 12
                }
            }
        }));

        // Confidentiality Notice
        sections.push(new Paragraph({
            text: translations.confidentialityNotice || 'CONFIDENTIAL MEDICAL RECORD',
            bold: true,
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 50 },
            shading: { fill: 'FEF3C7' }
        }));

        sections.push(new Paragraph({
            text: translations.hipaaStatement || 'This document contains protected health information (PHI) subject to the Health Insurance Portability and Accountability Act (HIPAA). Unauthorized access, use, or disclosure of this information is prohibited by law.',
            spacing: { before: 50, after: 100 },
            italics: true
        }));

        // Privacy Safeguards
        sections.push(new Paragraph({
            text: translations.privacySafeguards || 'Privacy Safeguards',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        const safeguards = [
            translations.safeguard1 || 'Encrypted transmission and storage of patient data',
            translations.safeguard2 || 'Limited access to authorized healthcare providers only',
            translations.safeguard3 || 'Secure audit trails for all data access',
            translations.safeguard4 || 'Regular security assessments and compliance audits',
            translations.safeguard5 || 'Immediate breach notification procedures',
            translations.safeguard6 || 'Patient rights to access, amend, and receive account of disclosures'
        ];

        safeguards.forEach((safeguard, idx) => {
            sections.push(new Paragraph({
                text: `${idx + 1}. ${safeguard}`,
                spacing: { before: 50, after: 50 },
                bullet: { level: 0 }
            }));
        });

        // Patient Rights
        sections.push(new Paragraph({
            text: translations.patientRights || 'Patient Rights Under HIPAA',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        const rights = [
            translations.right1 || 'Right to Access: You have the right to access, inspect, and receive a copy of your health information',
            translations.right2 || 'Right to Amend: You may request amendments to your health information',
            translations.right3 || 'Right to Accounting: You have the right to receive an accounting of disclosures of your health information',
            translations.right4 || 'Right to Confidential Communications: You can request to receive health information by alternative means',
            translations.right5 || 'Right to Complain: You may file a complaint with the U.S. Department of Health and Human Services'
        ];

        rights.forEach((right, idx) => {
            sections.push(new Paragraph({
                text: `${idx + 1}. ${right}`,
                spacing: { before: 50, after: 50 },
                bullet: { level: 0 }
            }));
        });

        // Data Retention
        sections.push(new Paragraph({
            text: translations.dataRetention || 'Data Retention Policy',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        sections.push(new Paragraph({
            text: translations.retentionPolicy || 'Patient health records are retained for a minimum of 6 years in accordance with medical record regulations. After retention period, records are securely destroyed using certified data destruction methods.',
            spacing: { before: 50, after: 100 }
        }));

        // Report Authentication
        sections.push(new Paragraph({
            text: translations.reportAuthentication || 'Report Authentication',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        sections.push(new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            shading: { fill: colors.tableHeader },
                            children: [new Paragraph({ children: [new TextRun({ text: translations.reportID || 'Report ID', bold: true })] })]
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({ children: [new TextRun({ text: reportId })] })]
                        })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            shading: { fill: colors.tableHeader },
                            children: [new Paragraph({ children: [new TextRun({ text: translations.generatedDate || 'Generated Date', bold: true })] })]
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({ children: [new TextRun({ text: new Date().toLocaleDateString() })] })]
                        })
                    ]
                })
            ]
        }));

        sections.push(new Paragraph({ text: '' }));

        return sections;
    }

    /**
     * Create Digital Signature Section (Phase 3)
     */
    createDigitalSignatureSection(physicianName, physicianLicense, clinicStamp, colorScheme, language = 'en') {
        const colors = this.getColorScheme(colorScheme);
        const translations = this.getTranslations(language);
        const sections = [];

        // Title
        sections.push(new Paragraph({
            text: translations.physicianCertification || 'PHYSICIAN CERTIFICATION',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
            border: {
                bottom: {
                    color: colors.primary,
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 12
                }
            }
        }));

        sections.push(new Paragraph({
            text: translations.certificationStatement || 'I certify that I have reviewed this sleep disorder detection report and that the findings, recommendations, and action plan are medically appropriate for this patient based on current clinical standards.',
            spacing: { before: 100, after: 150 },
            italics: true
        }));

        // Signature Area
        sections.push(new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.SINGLE, size: 6 },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE }
                            },
                            children: [new Paragraph({ children: [new TextRun({ text: '' })] })]
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({ children: [new TextRun({ text: '' })] })]
                        })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({
                                text: translations.physicianSignature || 'Physician Signature',
                                spacing: { before: 50 }
                            })]
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({
                                text: translations.date || 'Date',
                                spacing: { before: 50 }
                            })]
                        })
                    ]
                })
            ]
        }));

        sections.push(new Paragraph({ text: '' }));
        sections.push(new Paragraph({ text: '' }));

        // Physician Information
        sections.push(new Paragraph({
            text: translations.physicianInformation || 'Physician Information',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        sections.push(new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F3F4F6' },
                            children: [new Paragraph({ children: [new TextRun({ text: translations.name || 'Name', bold: true })] })]
                        }),
                        new TableCell({
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({ children: [new TextRun({ text: physicianName || '_________________________________' })] })]
                        })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F3F4F6' },
                            children: [new Paragraph({ children: [new TextRun({ text: translations.licenseNumber || 'License #', bold: true })] })]
                        }),
                        new TableCell({
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({ children: [new TextRun({ text: physicianLicense || '_________________________________' })] })]
                        })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F3F4F6' },
                            children: [new Paragraph({ children: [new TextRun({ text: translations.specialty || 'Specialty', bold: true })] })]
                        }),
                        new TableCell({
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({ children: [new TextRun({ text: translations.sleepMedicine || 'Sleep Medicine' })] })]
                        })
                    ]
                })
            ]
        }));

        // Spacer
        sections.push(new Paragraph({ children: [new TextRun({ text: '' })] }));

        // Clinic Stamp (if enabled)
        if (clinicStamp) {
            sections.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 100 },
                border: {
                    top: { style: BorderStyle.SINGLE },
                    bottom: { style: BorderStyle.SINGLE },
                    left: { style: BorderStyle.SINGLE },
                    right: { style: BorderStyle.SINGLE }
                },
                children: [
                    new TextRun({
                        text: translations.clinicStamp || '[CLINIC STAMP / SEAL]'
                    })
                ]
            }));
        }

        // Legal Disclaimer
        sections.push(new Paragraph({
            text: translations.legalDisclaimer || 'Legal Disclaimer',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 }
        }));

        sections.push(new Paragraph({
            text: translations.disclaimerText || 'This report is intended for the use of the named patient and their healthcare providers only. This report is not a substitute for professional medical advice, diagnosis, or treatment. Any action taken based on this report should be done in consultation with a qualified healthcare professional.',
            spacing: { before: 50, after: 100 },
            italics: true
        }));

        return sections;
    }

    /**
     * Create Sleep Stage Table (Phase 3)
     */
    createSleepStageTable(stats, colors, translations) {
        const stages = [
            { name: translations.awakening || 'Awakening', percent: stats.awakePercentage || 5, color: 'FEE2E2' },
            { name: translations.lightSleep || 'Light Sleep', percent: stats.lightSleepPercentage || 50, color: 'DBEAFE' },
            { name: translations.deepSleep || 'Deep Sleep', percent: stats.deepSleepPercentage || 20, color: '10B981' },
            { name: translations.remSleep || 'REM Sleep', percent: stats.remPercentage || 25, color: '8B5CF6' }
        ];

        const rows = [
            new TableRow({
                children: [
                    this.createHeaderCell(translations.sleepStage || 'Sleep Stage', colors),
                    this.createHeaderCell(translations.percentage || 'Percentage', colors),
                    this.createHeaderCell(translations.duration || 'Duration', colors),
                    this.createHeaderCell(translations.quality || 'Quality', colors)
                ]
            })
        ];

        stages.forEach(stage => {
            const duration = (stats.avgSleepDuration || 7) * stage.percent / 100;
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: stage.color },
                        children: [new Paragraph({ children: [new TextRun({ text: stage.name, bold: true })] })]
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: `${stage.percent.toFixed(1)}%` })] })]
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: `${duration.toFixed(1)}h` })] })]
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: this.getSleepQualityStatus(stage.percent) })] })]
                    })
                ]
            }));
        });

        return new Table({ rows });
    }

    /**
     * Helper Methods for Phase 3
     */
    getDeepSleepStatus(percentage) {
        if ((percentage || 0) >= 20) return 'Normal';
        if ((percentage || 0) >= 15) return 'Acceptable';
        return 'Low';
    }

    getREMSleepStatus(percentage) {
        if ((percentage || 0) >= 20) return 'Normal';
        if ((percentage || 0) >= 15) return 'Acceptable';
        return 'Low';
    }

    getSleepQualityStatus(percentage) {
        if (percentage >= 20) return 'Optimal';
        if (percentage >= 10) return 'Good';
        return 'Needs Improvement';
    }

    calculateWeeklyStats(data) {
        const weekly = [];
        for (let i = 0; i < 4 && i * 7 < data.length; i++) {
            const week = data.slice(i * 7, (i + 1) * 7);
            weekly.push({
                week: i + 1,
                avgHRV: week.reduce((a, b) => a + (b.hrv || 0), 0) / week.length,
                avgSleep: week.reduce((a, b) => a + (b.sleep_duration || 0), 0) / week.length,
                avgDeep: week.reduce((a, b) => a + (b.deep_sleep || 0), 0) / week.length
            });
        }
        return weekly;
    }

    createWeeklyComparisonTable(weeklyStats, colors, translations) {
        const rows = [
            new TableRow({
                children: [
                    this.createHeaderCell(translations.week || 'Week', colors),
                    this.createHeaderCell('Avg HRV (ms)', colors),
                    this.createHeaderCell('Avg Sleep (h)', colors),
                    this.createHeaderCell('Deep Sleep %', colors)
                ]
            })
        ];

        weeklyStats.forEach((week, idx) => {
            rows.push(new TableRow({
                children: [
                    new TableCell({
                            shading: { fill: 'F3F4F6' },
                            children: [new Paragraph({ children: [new TextRun({ text: `Week ${week.week}` })] })]
                    }),
                    new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: week.avgHRV.toFixed(1) })] })]
                    }),
                    new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: week.avgSleep.toFixed(1) })] })]
                    }),
                    new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: `${week.avgDeep.toFixed(1)}%` })] })]
                    })
                ]
            }));
        });

        return new Table({ rows });
    }

    generateWeekOneActions(stats, language = 'en') {
        const translations = this.getTranslations(language);
        return [
            translations.action1 || 'Establish consistent sleep schedule (same bedtime/wake time daily)',
            translations.action2 || 'Create sleep log to track sleep duration and quality',
            translations.action3 || 'Eliminate screen time 1 hour before bedtime',
            translations.action4 || 'Reduce caffeine intake after 2:00 PM',
            translations.action5 || 'Schedule consultation with sleep specialist if not already done'
        ];
    }

    generateShortTermGoals(stats, language = 'en') {
        const translations = this.getTranslations(language);
        return [
            translations.goal1 || 'Achieve 7-9 hours of sleep per night consistently',
            translations.goal2 || 'Increase deep sleep percentage by 5-10%',
            translations.goal3 || 'Improve sleep efficiency (time asleep / time in bed) to >85%',
            translations.goal4 || 'Reduce nighttime awakenings by 50%',
            translations.goal5 || 'Implement relaxation techniques (meditation, breathing exercises)'
        ];
    }

    createActionPlanMetricsTable(stats, colors, translations) {
        const metrics = [
            { name: translations.metricsleep || 'Sleep Duration', baseline: `${(stats.avgSleepDuration || 6).toFixed(1)}h`, target: '7-9h' },
            { name: translations.metricsdeep || 'Deep Sleep %', baseline: `${(stats.deepSleepPercentage || 15).toFixed(1)}%`, target: '20-25%' },
            { name: translations.metricsrem || 'REM Sleep %', baseline: `${(stats.remPercentage || 20).toFixed(1)}%`, target: '20-25%' },
            { name: translations.metricsawake || 'Awakenings/Night', baseline: stats.awakeningsPerNight || 3, target: '<2' }
        ];

        const rows = [
            new TableRow({
                children: [
                    this.createHeaderCell(translations.metric || 'Metric', colors),
                    this.createHeaderCell(translations.baseline || 'Baseline', colors),
                    this.createHeaderCell(translations.target || 'Target', colors)
                ]
            })
        ];

        metrics.forEach(metric => {
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'F3F4F6' },
                        children: [new Paragraph({ children: [new TextRun({ text: metric.name })] })]
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: metric.baseline.toString() })] })]
                    }),
                    new TableCell({
                        shading: { fill: 'DCFCE7' },
                        children: [new Paragraph({
                            children: [new TextRun({
                                text: metric.target,
                                bold: true,
                                color: '15803D'
                            })]
                        })]
                    })
                ]
            }));
        });

        return new Table({ rows });
    }

    /**
     * Get color scheme
     */
    getColorScheme(scheme) {
        const schemes = {
            professional: {
                primary: '1E3A8A',      // Dark blue
                secondary: '3B82F6',    // Blue
                tableHeader: 'DBEAFE'   // Light blue
            },
            medical: {
                primary: '065F46',      // Dark teal
                secondary: '10B981',    // Teal
                tableHeader: 'D1FAE5'   // Light green
            },
            modern: {
                primary: '6366F1',      // Indigo
                secondary: '8B5CF6',    // Purple
                tableHeader: 'E0E7FF'   // Light indigo
            }
        };

        return schemes[scheme] || schemes.professional;
    }

    // Status helper methods
    getHRVStatus(hrv) {
        if (hrv >= 60) return 'Excellent';
        if (hrv >= 40) return 'Good';
        if (hrv >= 20) return 'Fair';
        return 'Needs Attention';
    }

    getSpO2Status(spo2) {
        if (spo2 >= 95) return 'Normal';
        if (spo2 >= 90) return 'Acceptable';
        return 'Low - Consult Doctor';
    }

    getBreathingStatus(breathing) {
        if (breathing >= 12 && breathing <= 20) return 'Normal';
        return 'Irregular';
    }
}

// Singleton instance
const docxReportService = new DocxReportService();

module.exports = docxReportService;
