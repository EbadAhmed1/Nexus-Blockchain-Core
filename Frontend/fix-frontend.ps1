# fix-frontend.ps1
# Script to fix frontend server issues (port conflicts, lock files)

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Frontend Server Fix Script" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Step 1: Kill processes on port 3000
Write-Host "[1/3] Checking for processes on port 3000..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "   Found process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Terminated process $processId" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ✅ No processes found on port 3000" -ForegroundColor Green
}

# Step 2: Kill all Node.js processes (optional - be careful)
Write-Host "`n[2/3] Checking for Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Yellow
    $response = Read-Host "   Kill all Node.js processes? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        foreach ($proc in $nodeProcesses) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Terminated Node.js process (PID: $($proc.Id))" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ✅ No Node.js processes found" -ForegroundColor Green
}

# Step 3: Remove lock files
Write-Host "`n[3/3] Cleaning up lock files..." -ForegroundColor Yellow
$lockFile = Join-Path $PSScriptRoot ".next\dev\lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Removed lock file" -ForegroundColor Green
} else {
    Write-Host "   ✅ No lock file found" -ForegroundColor Green
}

# Also clean .next directory if needed
$nextDir = Join-Path $PSScriptRoot ".next"
if (Test-Path $nextDir) {
    Write-Host "`n   Cleaning .next directory..." -ForegroundColor Yellow
    Remove-Item "$nextDir\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleaned .next directory" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Frontend cleanup complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "You can now start the frontend server with:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "`nOr use the start-all.ps1 script from the project root.`n" -ForegroundColor Gray

