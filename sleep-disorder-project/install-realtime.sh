#!/bin/bash
# Real-Time Features Installation Script
# Run this script to install all dependencies for real-time monitoring

echo "=========================================="
echo "Sleep Disorder Real-Time Features Setup"
echo "=========================================="
echo ""

# Check if we're in the correct directory
if [ ! -d "sleep-disorder-project" ]; then
    echo "Error: Please run this script from the PROJECT WEBSITE directory"
    exit 1
fi

# Install Node.js backend dependencies
echo "[1/3] Installing Node.js backend dependencies..."
cd sleep-disorder-project/server
npm install ws axios
if [ $? -eq 0 ]; then
    echo "✓ Backend dependencies installed successfully"
else
    echo "✗ Failed to install backend dependencies"
    exit 1
fi
echo ""

# Install React frontend dependencies
echo "[2/3] Installing React frontend dependencies..."
cd ../client
npm install chart.js react-chartjs-2
if [ $? -eq 0 ]; then
    echo "✓ Frontend dependencies installed successfully"
else
    echo "✗ Failed to install frontend dependencies"
    exit 1
fi
echo ""

# Install Python ML dependencies
echo "[3/3] Installing Python ML dependencies..."
cd ../ml
pip install flask-cors
if [ $? -eq 0 ]; then
    echo "✓ ML dependencies installed successfully"
else
    echo "✗ Failed to install ML dependencies"
    exit 1
fi
echo ""

echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "To start the services:"
echo ""
echo "Terminal 1 - Backend Server:"
echo "  cd sleep-disorder-project/server && npm start"
echo ""
echo "Terminal 2 - ML Service:"
echo "  cd sleep-disorder-project/ml && python realtime_app.py"
echo ""
echo "Terminal 3 - Frontend:"
echo "  cd sleep-disorder-project/client && npm start"
echo ""
echo "Then navigate to: http://localhost:3000/live-monitoring"
echo ""
