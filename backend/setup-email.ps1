# Email Setup Script for Blockchain Explorer
# This script helps you configure Gmail SMTP for sending real emails

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Email Setup for Blockchain Explorer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    New-Item -ItemType File -Path .env | Out-Null
}

# Read current .env
$envContent = Get-Content .env -ErrorAction SilentlyContinue

Write-Host "To send real emails, you need to set up Gmail SMTP:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://myaccount.google.com/apppasswords" -ForegroundColor Green
Write-Host "2. Sign in with your Gmail account" -ForegroundColor Green
Write-Host "3. Select 'Mail' and 'Other (Custom name)'" -ForegroundColor Green
Write-Host "4. Enter 'Blockchain Explorer' as the name" -ForegroundColor Green
Write-Host "5. Click 'Generate' and copy the 16-character password" -ForegroundColor Green
Write-Host ""

$gmail = Read-Host "Enter your Gmail address (or press Enter to skip)"
if ($gmail) {
    $appPassword = Read-Host "Enter your Gmail App Password (16 characters)" -AsSecureString
    $appPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($appPassword)
    )
    
    # Remove existing SMTP config
    $envContent = $envContent | Where-Object { 
        $_ -notmatch "^SMTP_" -and 
        $_ -notmatch "^EMAIL_FROM" -and 
        $_ -notmatch "^FRONTEND_URL"
    }
    
    # Add new SMTP config
    $envContent += ""
    $envContent += "# Email Configuration"
    $envContent += "SMTP_HOST=smtp.gmail.com"
    $envContent += "SMTP_PORT=587"
    $envContent += "SMTP_SECURE=false"
    $envContent += "SMTP_USER=$gmail"
    $envContent += "SMTP_PASS=$appPasswordPlain"
    $envContent += "EMAIL_FROM=$gmail"
    $envContent += "FRONTEND_URL=http://localhost:3000"
    
    # Write to .env
    $envContent | Set-Content .env
    
    Write-Host ""
    Write-Host "✅ Email configuration added to .env file!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Restart your backend server for changes to take effect." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Skipped email setup. Using console logging mode." -ForegroundColor Yellow
    Write-Host "Verification tokens will be logged to the console." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

