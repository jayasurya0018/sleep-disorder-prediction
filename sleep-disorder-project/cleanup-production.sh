#!/bin/bash
# Production Cleanup Script
# Removes test files, dev artifacts, and prepares for deployment

echo "🧹 Starting production cleanup..."
echo ""

# Remove test files
echo "📦 Removing test files..."
rm -f server/test-export-mongodb.js
rm -f server/test-features.js
rm -f server/test-fixes.js
rm -f server/test-integration.js
rm -f server/test-mongodb-data.js
rm -f server/test-report-generation.js
rm -f server/test-token.js
rm -f server/test-wearable.js
rm -f server/test-websocket.js
rm -f server/quick-test.js
echo "✓ Test files removed"

# Remove utility scripts
echo "📦 Removing utility scripts..."
rm -f server/clean_sleepdata.js
rm -f server/get-token.js
rm -f server/NUL
echo "✓ Utility scripts removed"

# Remove model training scripts
echo "📦 Removing ML dev files..."
rm -f ml/cheat_train.py
rm -f ml/overfit_train.py
rm -f ml/test_severity.py
echo "✓ ML dev files removed"

# Remove archived documentation
echo "📦 Removing archived documentation..."
rm -f PHASE1_IMPLEMENTATION_COMPLETE.md
rm -f PHASE2_IMPLEMENTATION_COMPLETE.md
rm -f PHASE3_IMPLEMENTATION_COMPLETE.md
rm -f QUICK_TEST_SUMMARY.md
rm -f QUICKSTART.md
rm -f QUICKSTART_2MIN.md
rm -f INTEGRATION_VERIFICATION_REPORT.md
rm -f REPORT_GENERATOR_STATUS.md
rm -f WEARABLE_MODULE_STATUS.md
rm -f WEARABLE_TEST_RESULTS.txt
rm -f WEARABLE_QUICK_REFERENCE.md
rm -f WEARABLE_QUICK_START.md
rm -f WEARABLE_INTEGRATION_GUIDE.md
rm -f FEATURES_INTEGRATION_SUMMARY.md
rm -f FIXES_SUMMARY.md
rm -f FIXES_QUICK_REFERENCE.md
rm -f EXPORT_DIAGRAMS.md
rm -f EXPORT_QUICK_FIX.md
rm -f EXPORT_FIX_DETAILED.md
rm -f ZEPP_MIFITNESS_INTEGRATION.md
rm -f ZEPP_MIFITNESS_QUICKSTART.md
rm -f ZEPP_MIFITNESS_IMPLEMENTATION.md
rm -f ZEPP_MIFITNESS_README.md
rm -f ZEPP_MIFITNESS_VERIFICATION_CHECKLIST.md
echo "✓ Archived documentation removed"

# Clean build artifacts
echo "📦 Cleaning build artifacts..."
rm -rf client/build/
rm -rf server/test-outputs/
rm -rf ml/outputs/
rm -rf ml/outputs_*/
echo "✓ Build artifacts removed"

# Keep only essential documentation
echo "✅ Essential files kept:"
echo "  ✓ README.md"
echo "  ✓ DEPLOYMENT_CHECKLIST.md"
echo "  ✓ SETUP_GUIDE.md"
echo "  ✓ OAUTH2_SETUP_GUIDE.md"
echo "  ✓ ADVANCED_FEATURES_README.md"
echo "  ✓ PRODUCTION_ANALYSIS.md"

echo ""
echo "✨ Cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Run: npm audit (check for CVEs)"
echo "  2. Build frontend: cd client && npm run build"
echo "  3. Configure .env with production values"
echo "  4. Set NODE_ENV=production"
echo "  5. Run production server: npm start"
echo ""
echo "🚀 System ready for production deployment!"
