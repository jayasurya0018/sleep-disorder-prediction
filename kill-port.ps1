$processes = Get-Process -Name node -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "Found node processes: $($processes | ForEach-Object { $_.Id })"
    foreach ($proc in $processes) {
        Write-Host "Killing PID: $($proc.Id)"
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "✅ All node processes killed"
} else {
    Write-Host "⚠️ No node processes found"
}

Write-Host "Checking port 5000..."
netstat -ano | Select-String ":5000"
