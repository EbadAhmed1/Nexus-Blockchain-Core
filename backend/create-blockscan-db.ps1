# create-blockscan-db.ps1
# Script to create the 'blockscan' database in PostgreSQL

Write-Host "Creating 'blockscan' database..." -ForegroundColor Yellow

# Try to find psql
$pgBin = "C:\Program Files\PostgreSQL\16\bin"
if (-not (Test-Path "$pgBin\psql.exe")) {
    $pgBin = "C:\Program Files\PostgreSQL\15\bin"
}
if (-not (Test-Path "$pgBin\psql.exe")) {
    $pgBin = "C:\Program Files\PostgreSQL\14\bin"
}
if (-not (Test-Path "$pgBin\psql.exe")) {
    Write-Host "❌ Could not find psql.exe. Please install PostgreSQL or update the path." -ForegroundColor Red
    exit 1
}

# Read password from .env
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $password = ($envContent | Select-String "PG_PASSWORD=").ToString().Split("=")[1]
    $user = ($envContent | Select-String "PG_USER=").ToString().Split("=")[1]
} else {
    $password = "ashhad12"
    $user = "postgres"
}

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $password

# Create database
Write-Host "Creating database 'blockscan'..." -ForegroundColor Cyan
$createDb = & "$pgBin\psql.exe" -U $user -h localhost -d postgres -c "CREATE DATABASE blockscan;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database 'blockscan' created successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Run the database-schema.sql file on the 'blockscan' database" -ForegroundColor White
    Write-Host "2. If you want to migrate data from 'test', use pg_dump/pg_restore" -ForegroundColor White
} else {
    if ($createDb -match "already exists") {
        Write-Host "⚠️  Database 'blockscan' already exists" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error creating database:" -ForegroundColor Red
        Write-Host $createDb -ForegroundColor Red
    }
}





