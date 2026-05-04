# Start Both Backend and Frontend Servers
# Run this script from the project root directory

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Starting Blockchain Explorer" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "1234"
    $result = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d test -c "SELECT 1;" 2>&1 | Out-String
    if ($result -match "1 row") {
        Write-Host "PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL may not be running. Please start it first." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not verify PostgreSQL. Please ensure it's running." -ForegroundColor Yellow
}

Write-Host "`nStarting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\ShiKari\Desktop\SEEEEEEEEEEEEEEEEEE\Nexus-Blockchain-Core\backend'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; Write-Host 'Port: 5000' -ForegroundColor Cyan; Write-Host 'URL: http://localhost:5000' -ForegroundColor Cyan; Write-Host ''; npm start"

Start-Sleep -Seconds 5

Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\ShiKari\Desktop\SEEEEEEEEEEEEEEEEEE\Nexus-Blockchain-Core\Frontend'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; Write-Host 'Port: 3000' -ForegroundColor Cyan; Write-Host 'URL: http://localhost:3000' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Servers Starting!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White

Write-Host "`nPlease wait 10-15 seconds for servers to fully start" -ForegroundColor Yellow
Write-Host "   Backend should show: Connected to PostgreSQL" -ForegroundColor Gray
Write-Host "   Backend should show: Server running on port 5000" -ForegroundColor Gray
Write-Host "   Frontend should show: ready started server on 0.0.0.0:3000" -ForegroundColor Gray

Write-Host "`nLogin Credentials:" -ForegroundColor Cyan
Write-Host "   Email: Any from DUMMY_USERS_DOCUMENTATION.md" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White

Write-Host "`nFor detailed instructions, see: starting-guide.md`n" -ForegroundColor Yellow
