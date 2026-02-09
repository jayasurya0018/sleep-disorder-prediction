/**
 * Data Export Service
 * Generate CSV and PDF reports from sleep monitoring data
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

class ExportService {
    constructor() {
        this.exportDir = path.join(__dirname, '../../exports');
        this.ensureExportDir();
    }

    /**
     * Ensure exports directory exists
     */
    ensureExportDir() {
        if (!fs.existsSync(this.exportDir)) {
            fs.mkdirSync(this.exportDir, { recursive: true });
        }
    }

    /**
     * Export data to CSV
     */
    async exportToCSV(data, filename) {
        try {
            // Define CSV fields
            const fields = [
                { label: 'Timestamp', value: 'timestamp' },
                { label: 'Heart Rate Variability', value: 'hrv' },
                { label: 'Blood Oxygen (%)', value: 'blood_oxygen' },
                { label: 'Movement', value: 'movement' },
                { label: 'Breathing Rate', value: 'breathing' },
                { label: 'Sleep Stage', value: 'sleepStage' },
                { label: 'Disorder', value: 'disorder' },
                { label: 'Severity', value: 'severity' },
                { label: 'Confidence (%)', value: 'confidence' }
            ];

            // Transform data for export
            const exportData = data.map(item => ({
                timestamp: new Date(item.timestamp).toLocaleString(),
                hrv: item.hrv || 'N/A',
                blood_oxygen: item.blood_oxygen || 'N/A',
                movement: item.movement || 'N/A',
                breathing: item.breathing || 'N/A',
                sleepStage: item.sleepStage || 'N/A',
                disorder: item.prediction?.disorder || 'N/A',
                severity: item.prediction?.severity || 'N/A',
                confidence: item.prediction?.confidence ? (item.prediction.confidence * 100).toFixed(1) : 'N/A'
            }));

            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(exportData);

            const filepath = path.join(this.exportDir, filename);
            fs.writeFileSync(filepath, csv);

            return filepath;

        } catch (error) {
            console.error('CSV export error:', error);
            throw new Error('Failed to export CSV: ' + error.message);
        }
    }

    /**
     * Export data to PDF
     */
    async exportToPDF(data, metadata, filename) {
        return new Promise((resolve, reject) => {
            try {
                const filepath = path.join(this.exportDir, filename);
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(filepath);

                doc.pipe(stream);

                // Header
                doc.fontSize(20)
                    .font('Helvetica-Bold')
                    .text('Sleep Disorder Monitoring Report', { align: 'center' });

                doc.moveDown();

                // Metadata
                doc.fontSize(12)
                    .font('Helvetica')
                    .text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });

                if (metadata.userName) {
                    doc.text(`Patient: ${metadata.userName}`, { align: 'right' });
                }

                if (metadata.startDate && metadata.endDate) {
                    doc.text(`Period: ${metadata.startDate} to ${metadata.endDate}`, { align: 'right' });
                }

                doc.moveDown(2);

                // Summary Statistics
                doc.fontSize(16)
                    .font('Helvetica-Bold')
                    .text('Summary Statistics');

                doc.moveDown();

                const stats = this.calculateStatistics(data);
                doc.fontSize(10)
                    .font('Helvetica')
                    .text(`Total Records: ${stats.totalRecords}`)
                    .text(`Average HRV: ${stats.avgHRV.toFixed(1)} ms`)
                    .text(`Average Blood Oxygen: ${stats.avgBloodOxygen.toFixed(1)}%`)
                    .text(`Average Breathing Rate: ${stats.avgBreathing.toFixed(1)} breaths/min`)
                    .text(`Most Common Sleep Stage: ${stats.mostCommonStage}`)
                    .text(`Detected Disorders: ${stats.detectedDisorders.join(', ') || 'None'}`)
                    .text(`Anomalies Detected: ${stats.anomalyCount}`);

                doc.moveDown(2);

                // Detailed Data Table
                doc.fontSize(16)
                    .font('Helvetica-Bold')
                    .text('Detailed Monitoring Data');

                doc.moveDown();

                // Table header
                const tableTop = doc.y;
                const rowHeight = 20;
                const colWidth = 70;

                doc.fontSize(8)
                    .font('Helvetica-Bold');

                const headers = ['Time', 'HRV', 'SpO2', 'Move', 'Breath', 'Stage', 'Disorder'];
                headers.forEach((header, i) => {
                    doc.text(header, 50 + i * colWidth, tableTop, { width: colWidth });
                });

                // Draw header underline
                doc.moveTo(50, tableTop + 15)
                    .lineTo(550, tableTop + 15)
                    .stroke();

                // Table rows (limit to recent 50 for space)
                doc.font('Helvetica');
                const recentData = data.slice(-50);
                recentData.forEach((item, index) => {
                    const y = tableTop + rowHeight + (index * rowHeight);

                    if (y > 700) {
                        doc.addPage();
                        return;
                    }

                    const time = new Date(item.timestamp).toLocaleTimeString();
                    const values = [
                        time,
                        item.hrv?.toFixed(0) || '-',
                        item.blood_oxygen?.toFixed(0) || '-',
                        item.movement?.toFixed(1) || '-',
                        item.breathing?.toFixed(0) || '-',
                        item.sleepStage || '-',
                        item.prediction?.disorder?.substring(0, 8) || '-'
                    ];

                    values.forEach((value, i) => {
                        doc.text(value, 50 + i * colWidth, y, { width: colWidth });
                    });
                });

                // Add new page for alerts
                doc.addPage();

                doc.fontSize(16)
                    .font('Helvetica-Bold')
                    .text('Alerts & Anomalies');

                doc.moveDown();

                const alerts = data.filter(item => item.alert || item.anomaly);
                if (alerts.length > 0) {
                    alerts.slice(-20).forEach((alert, index) => {
                        doc.fontSize(10)
                            .font('Helvetica');

                        const time = new Date(alert.timestamp).toLocaleString();
                        const type = alert.alert ? 'Alert' : 'Anomaly';
                        const message = alert.alert?.message || alert.anomaly?.message || 'N/A';

                        doc.fillColor('red')
                            .text(`[${type}] ${time}`, { continued: true })
                            .fillColor('black')
                            .text(` - ${message}`);

                        doc.moveDown(0.5);
                    });
                } else {
                    doc.fontSize(10)
                        .font('Helvetica')
                        .text('No alerts or anomalies detected during this period.');
                }

                // Footer
                doc.fontSize(8)
                    .font('Helvetica')
                    .text(
                        'This report is generated automatically. Consult healthcare professionals for medical advice.',
                        50,
                        doc.page.height - 50,
                        { align: 'center' }
                    );

                doc.end();

                stream.on('finish', () => {
                    resolve(filepath);
                });

                stream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                console.error('PDF export error:', error);
                reject(new Error('Failed to export PDF: ' + error.message));
            }
        });
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
            detectedDisorders: [],
            anomalyCount: 0
        };

        if (data.length === 0) return stats;

        // Calculate averages
        let hrvSum = 0, spo2Sum = 0, breathSum = 0;
        const stageCounts = {};
        const disorders = new Set();

        data.forEach(item => {
            if (item.hrv) hrvSum += item.hrv;
            if (item.blood_oxygen) spo2Sum += item.blood_oxygen;
            if (item.breathing) breathSum += item.breathing;

            if (item.sleepStage) {
                stageCounts[item.sleepStage] = (stageCounts[item.sleepStage] || 0) + 1;
            }

            if (item.prediction?.disorder && item.prediction.disorder !== 'None') {
                disorders.add(item.prediction.disorder);
            }

            if (item.anomaly) {
                stats.anomalyCount++;
            }
        });

        stats.avgHRV = hrvSum / data.length;
        stats.avgBloodOxygen = spo2Sum / data.length;
        stats.avgBreathing = breathSum / data.length;

        // Find most common sleep stage
        let maxCount = 0;
        Object.entries(stageCounts).forEach(([stage, count]) => {
            if (count > maxCount) {
                maxCount = count;
                stats.mostCommonStage = stage;
            }
        });

        stats.detectedDisorders = Array.from(disorders);

        return stats;
    }

    /**
     * Get export file
     */
    getExportFile(filename) {
        const filepath = path.join(this.exportDir, filename);
        if (!fs.existsSync(filepath)) {
            throw new Error('Export file not found');
        }
        return filepath;
    }

    /**
     * Clean old exports (older than 7 days)
     */
    cleanOldExports() {
        const files = fs.readdirSync(this.exportDir);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        files.forEach(file => {
            const filepath = path.join(this.exportDir, file);
            const stats = fs.statSync(filepath);
            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filepath);
                console.log(`Deleted old export: ${file}`);
            }
        });
    }
}

// Singleton instance
const exportService = new ExportService();

module.exports = exportService;
