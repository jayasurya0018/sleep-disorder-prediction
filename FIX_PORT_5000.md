# Fix Port 5000 Issue

## The Problem
Port 5000 is already in use by another Node.js process.

## Quick Fix - Open PowerShell and run:

```powershell
# Stop all Node.js processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2

# Verify port is free
netstat -ano | Select-String ":5000"

# If still shows results, get the PID and kill it:
# taskkill /PID <PID_NUMBER> /F
```

## Then Start Server

```powershell
cd "C:\Users\Jayas\PROJECT WEBSITE\sleep-disorder-project\server"
npm start
```

---

## Alternative: Change Port

If you want to use a different port instead:

Edit `server/.env`:
```bash
PORT=5001
```

Then start:
```bash
npm start
```

---

## Verify Server is Running

Once server starts, you should see:
```
🚀 Starting server in development mode...
✅ Environment validation passed
✅ Email service initialized with Gmail SMTP
WebSocket server initialized
✅ Server running on port 5000
```

Then in another PowerShell window, test:
```powershell
# Get JWT token
$token = "your-jwt-token-here"

# Test email endpoint
curl -X POST http://localhost:5000/api/email/test `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" | ConvertFrom-Json
```

---

Still having issues? 
- Make sure no other terminal has `npm start` running
- Check: `netstat -ano | findstr :5000`
- Kill the PID shown: `taskkill /PID <number> /F`
