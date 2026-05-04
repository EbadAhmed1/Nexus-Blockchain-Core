# Script to rename DB folder to frontend
# Run this after closing the DB folder in your IDE

Write-Host "Renaming DB folder to frontend..." -ForegroundColor Yellow

if (Test-Path "DB") {
    try {
        Rename-Item -Path "DB" -NewName "frontend" -Force
        Write-Host "✅ Folder renamed successfully from DB to frontend!" -ForegroundColor Green
        
        # Stage the rename in git
        git add frontend
        git add DB
        git commit -m "Rename DB folder to frontend"
        Write-Host "✅ Changes committed to git" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please make sure the DB folder is closed in your IDE and try again." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ DB folder not found. It may have already been renamed." -ForegroundColor Yellow
}

