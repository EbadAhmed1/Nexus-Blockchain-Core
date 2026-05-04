# clean-frontend.ps1
# Automated script to clean frontend server issues (no user input required)

Write-Host "`nCleaning frontend server issues..." -ForegroundColor Yellow

# Kill processes on port 3000
$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Cleared port 3000" -ForegroundColor Green
}

# Remove .next directory
$nextDir = Join-Path $PSScriptRoot ".next"
if (Test-Path $nextDir) {
    Remove-Item $nextDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cleaned .next directory" -ForegroundColor Green
}

# Remove lock file if exists
$lockFile = Join-Path $PSScriptRoot ".next\dev\lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Removed lock file" -ForegroundColor Green
}

Write-Host "`n✅ Frontend cleanup complete! You can now run 'npm run dev'`n" -ForegroundColor Green

