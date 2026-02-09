@echo off
REM Real-Time Features Installation Script for Windows
REM Run this script to install all dependencies for real-time monitoring

echo ==========================================
echo Sleep Disorder Real-Time Features Setup
echo ==========================================
echo.

REM Check if we're in the correct directory
if not exist "sleep-disorder-project" (
    echo Error: Please run this script from the PROJECT WEBSITE directory
    exit /b 1
)

REM Install Node.js backend dependencies
echo [1/3] Installing Node.js backend dependencies...
cd sleep-disorder-project\server
call npm install ws axios
if %errorlevel% equ 0 (
    echo ✓ Backend dependencies installed successfully
) else (
    echo ✗ Failed to install backend dependencies
    exit /b 1
)
echo.

REM Install React frontend dependencies
echo [2/3] Installing React frontend dependencies...
cd ..\client
call npm install chart.js react-chartjs-2
if %errorlevel% equ 0 (
    echo ✓ Frontend dependencies installed successfully
) else (
    echo ✗ Failed to install frontend dependencies
    exit /b 1
)
echo.

REM Install Python ML dependencies
echo [3/3] Installing Python ML dependencies...
cd ..\ml
pip install flask-cors
if %errorlevel% equ 0 (
    echo ✓ ML dependencies installed successfully
) else (
    echo ✗ Failed to install ML dependencies
    exit /b 1
)
echo.

cd ..\..

echo ==========================================
echo Installation Complete!
echo ==========================================
echo.
echo To start the services:
echo.
echo Terminal 1 - Backend Server:
echo   cd sleep-disorder-project\server ^&^& npm start
echo.
echo Terminal 2 - ML Service:
echo   cd sleep-disorder-project\ml ^&^& python realtime_app.py
echo.
echo Terminal 3 - Frontend:
echo   cd sleep-disorder-project\client ^&^& npm start
echo.
echo Then navigate to: http://localhost:3000/live-monitoring
echo.
pause
