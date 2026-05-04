# quick-fix.ps1 - Quick database setup script
Write-Host "=== PostgreSQL Quick Fix ===" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL service is running
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host "✅ PostgreSQL service is running" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL service is not running. Starting..." -ForegroundColor Red
    Start-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# Try to connect and set password
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$env:PGPASSWORD = ""

Write-Host ""
Write-Host "Attempting to connect and set password..." -ForegroundColor Yellow
Write-Host "If this fails, you'll need to:" -ForegroundColor Yellow
Write-Host "1. Open pgAdmin" -ForegroundColor White
Write-Host "2. Connect to server (use your current password)" -ForegroundColor White
Write-Host "3. Run: ALTER USER postgres WITH PASSWORD '1234';" -ForegroundColor White
Write-Host ""

# Try connecting with empty password first (sometimes works for local connections)
$result = & "$pgBin\psql.exe" -U postgres -h localhost -c "ALTER USER postgres WITH PASSWORD '1234';" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Password updated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Could not update password automatically" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please do one of the following:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OPTION 1: Use pgAdmin (Easiest)" -ForegroundColor Cyan
    Write-Host "  1. Open pgAdmin from Start menu" -ForegroundColor White
    Write-Host "  2. Connect to PostgreSQL (enter your current password)" -ForegroundColor White
    Write-Host "  3. Tools → Query Tool" -ForegroundColor White
    Write-Host "  4. Run: ALTER USER postgres WITH PASSWORD '1234';" -ForegroundColor White
    Write-Host "  5. Click Execute (F5)" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTION 2: Tell me your PostgreSQL password" -ForegroundColor Cyan
    Write-Host "  I can update the .env file with your actual password" -ForegroundColor White
    Write-Host ""
}

# Check database
Write-Host ""
Write-Host "Checking database..." -ForegroundColor Yellow
$dbCheck = & "$pgBin\psql.exe" -U postgres -h localhost -lqt 2>&1 | Select-String "blockscan"

if ($dbCheck) {
    Write-Host "✅ Database 'blockscan' exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database 'blockscan' may not exist" -ForegroundColor Yellow
    Write-Host "   Run: CREATE DATABASE blockscan; in pgAdmin" -ForegroundColor White
}

Write-Host ""
Write-Host "After fixing password, test connection with:" -ForegroundColor Cyan
Write-Host "  node check-db.js" -ForegroundColor White
Write-Host ""

