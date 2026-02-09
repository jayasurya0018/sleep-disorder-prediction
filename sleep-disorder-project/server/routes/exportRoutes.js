/**
 * Export Routes
 * API endpoints for exporting data to CSV and PDF
 */

const express = require('express');
const router = express.Router();
const exportService = require('../services/exportService');
const docxReportService = require('../services/docxReportService');
const streamingService = require('../services/streamingService');
const SleepData = require('../models/SleepData');

/**
 * POST /api/export/csv
 * Export data to CSV format
 */
router.post('/csv', async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate } = req.body;

        console.log('CSV Export - userId:', userId);

        // Get data from MongoDB first (primary source)
        let mongoData = await SleepData.find({ userId: userId });
        
        console.log('MongoDB data found:', mongoData.length, 'records');

        // If no MongoDB data, try streaming buffer as fallback
        let data = mongoData;
        if (data.length === 0) {
            console.log('No MongoDB data, checking streaming buffer...');
            data = streamingService.getUserData(userId);
        }

        if (!data || data.length === 0) {
            console.log('No data available for export (MongoDB + Buffer)');
            return res.status(404).json({ error: 'No data available for export' });
        }

        console.log('Using', mongoData.length > 0 ? 'MongoDB' : 'Streaming Buffer', 'data:', data.length, 'records');

        // Filter by date range if provided
        let filteredData = data;
        if (startDate || endDate) {
            filteredData = data.filter(item => {
                const timestamp = new Date(item.timestamp);
                if (startDate && timestamp < new Date(startDate)) return false;
                if (endDate && timestamp > new Date(endDate)) return false;
                return true;
            });
        }

        const filename = `sleep-data-${userId}-${Date.now()}.csv`;
        const filepath = await exportService.exportToCSV(filteredData, filename);

        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download file' });
            }
        });

    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/export/pdf
 * Export data to PDF format
 */
router.post('/pdf', async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate, userName } = req.body;

        console.log('PDF Export - userId:', userId);

        // Get data from MongoDB first (primary source)
        let mongoData = await SleepData.find({ userId: userId });
        
        console.log('MongoDB data found:', mongoData.length, 'records');

        // If no MongoDB data, try streaming buffer as fallback
        let data = mongoData;
        if (data.length === 0) {
            console.log('No MongoDB data, checking streaming buffer...');
            data = streamingService.getUserData(userId);
        }

        if (!data || data.length === 0) {
            console.log('No data available for PDF export');
            return res.status(404).json({ error: 'No data available for export' });
        }

        console.log('Using', mongoData.length > 0 ? 'MongoDB' : 'Streaming Buffer', 'data:', data.length, 'records');

        // Filter by date range if provided
        let filteredData = data;
        if (startDate || endDate) {
            filteredData = data.filter(item => {
                const timestamp = new Date(item.timestamp);
                if (startDate && timestamp < new Date(startDate)) return false;
                if (endDate && timestamp > new Date(endDate)) return false;
                return true;
            });
        }

        const metadata = {
            userName,
            startDate: startDate ? new Date(startDate).toLocaleDateString() : 'N/A',
            endDate: endDate ? new Date(endDate).toLocaleDateString() : 'N/A'
        };

        const filename = `sleep-report-${userId}-${Date.now()}.pdf`;
        const filepath = await exportService.exportToPDF(filteredData, metadata, filename);

        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download file' });
            }
        });

    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/export/available
 * Check if data is available for export
 */
router.get('/available', async (req, res) => {
    try {
        const userId = req.userId;
        
        // Check MongoDB first
        let mongoCount = await SleepData.countDocuments({ userId: userId });
        
        // Check streaming buffer as fallback
        let bufferData = streamingService.getUserData(userId);
        let bufferCount = bufferData ? bufferData.length : 0;
        
        const available = mongoCount > 0 || bufferCount > 0;
        const totalCount = Math.max(mongoCount, bufferCount);

        res.json({
            success: true,
            available: available,
            recordCount: totalCount,
            mongoCount: mongoCount,
            bufferCount: bufferCount
        });

    } catch (error) {
        console.error('Export availability check error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/export/docx
 * Export customizable DOCX report
 */
router.post('/docx', async (req, res) => {
    try {
        const userId = req.userId;
        const { 
            userName,
            reportTitle,
            startDate, 
            endDate,
            includeCharts = true,
            includeRecommendations = true,
            includeSummary = true,
            includeDetailedData = true,
            includeMetrics = true,
            customSections = [],
            fontSize = 'medium',
            colorScheme = 'professional',
            // Phase 1 options
            includeDemographics = false,
            patientAge = null,
            patientGender = null,
            patientWeight = null,
            patientHeight = null,
            includeTrendCharts = false,
            organizationName = 'Sleep Disorder Monitoring System',
            logoPath = null,
            // Phase 2 options
            includeSeverityRecommendations = false,
            includeBaselineComparison = false,
            baselineData = null,
            language = 'en',
            severityThresholds = {},
            // Phase 3 options
            includeDetailedSleepAnalysis = false,
            includeDigitalSignature = false,
            physicianName = '',
            physicianLicense = '',
            clinicStamp = false,
            includeHIPAACompliance = false,
            includePatientActionPlan = false,
            actionPlanDays = 30,
            weeklyComparison = false
        } = req.body;

        console.log('DOCX Export - userId:', userId);
        console.log('Phase 1 Options:', { includeDemographics, includeTrendCharts });
        console.log('Phase 2 Options:', { includeSeverityRecommendations, includeBaselineComparison, language });
        console.log('Phase 3 Options:', { includeDetailedSleepAnalysis, includePatientActionPlan, includeHIPAACompliance, includeDigitalSignature });

        // Get data from MongoDB first (primary source)
        let mongoData = await SleepData.find({ userId: userId });
        
        console.log('MongoDB data found:', mongoData.length, 'records');

        // If no MongoDB data, try streaming buffer as fallback
        let data = mongoData;
        if (data.length === 0) {
            console.log('No MongoDB data, checking streaming buffer...');
            data = streamingService.getUserData(userId);
        }

        if (!data || data.length === 0) {
            console.log('No data available for DOCX export');
            return res.status(404).json({ error: 'No data available for export' });
        }

        console.log('Using', mongoData.length > 0 ? 'MongoDB' : 'Streaming Buffer', 'data:', data.length, 'records');

        // Filter by date range if provided
        let filteredData = data;
        if (startDate || endDate) {
            filteredData = data.filter(item => {
                const timestamp = new Date(item.timestamp);
                if (startDate && timestamp < new Date(startDate)) return false;
                if (endDate && timestamp > new Date(endDate)) return false;
                return true;
            });
        }

        // Generate DOCX report with custom options (including all Phase 1, 2, 3 options)
        const options = {
            userName,
            reportTitle,
            startDate,
            endDate,
            includeCharts,
            includeRecommendations,
            includeSummary,
            includeDetailedData,
            includeMetrics,
            customSections,
            fontSize,
            colorScheme,
            // Phase 1
            includeDemographics,
            patientAge,
            patientGender,
            patientWeight,
            patientHeight,
            includeTrendCharts,
            organizationName,
            logoPath,
            // Phase 2
            includeSeverityRecommendations,
            includeBaselineComparison,
            baselineData,
            language,
            severityThresholds,
            // Phase 3
            includeDetailedSleepAnalysis,
            includeDigitalSignature,
            physicianName,
            physicianLicense,
            clinicStamp,
            includeHIPAACompliance,
            includePatientActionPlan,
            actionPlanDays,
            weeklyComparison
        };

        const filepath = await docxReportService.generateReport(filteredData, options);
        const filename = filepath.split(/[\\/]/).pop();

        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download file' });
            }
        });

    } catch (error) {
        console.error('DOCX export error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
