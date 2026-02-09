@echo off
REM Kill all node processes using port 5000
echo Killing all node.exe processes...

for /f "tokens=2" %%a in ('wmic process where name^="node.exe" get processid ^| findstr [0-9]') do (
  echo Killing process %%a
  taskkill /PID %%a /F /T
)

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak

echo.
echo Checking if port 5000 is free...
netstat -ano | findstr :5000

echo.
echo Done! Port 5000 should now be free.
