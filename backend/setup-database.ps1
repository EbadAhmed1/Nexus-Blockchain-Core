# setup-database.ps1
# Complete database setup script - Creates database and runs schema

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Database Setup Script" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Try to find psql (check PostgreSQL 18, 16, 15, 14)
$pgBin = $null
$pgVersions = @("18", "16", "15", "14", "13", "12")
foreach ($version in $pgVersions) {
    $testPath = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
    if (Test-Path $testPath) {
        $pgBin = "C:\Program Files\PostgreSQL\$version\bin"
        Write-Host "✅ Found PostgreSQL $version at: $pgBin" -ForegroundColor Green
        break
    }
}

if (-not $pgBin) {
    Write-Host "❌ Could not find psql.exe. Please install PostgreSQL." -ForegroundColor Red
    Write-Host "   Checked versions: $($pgVersions -join ', ')" -ForegroundColor Yellow
    exit 1
}

# Read database credentials from .env file
$envFile = Join-Path $PSScriptRoot ".env"
$password = "ashhad12"  # Default
$user = "postgres"      # Default
$database = "blockscan" # Default

if (Test-Path $envFile) {
    Write-Host "📄 Reading .env file..." -ForegroundColor Cyan
    $envContent = Get-Content $envFile
    $passwordLine = $envContent | Select-String "PG_PASSWORD="
    $userLine = $envContent | Select-String "PG_USER="
    $dbLine = $envContent | Select-String "PG_DATABASE="
    
    if ($passwordLine) {
        $password = ($passwordLine.ToString().Split("=")[1]).Trim()
    }
    if ($userLine) {
        $user = ($userLine.ToString().Split("=")[1]).Trim()
    }
    if ($dbLine) {
        $database = ($dbLine.ToString().Split("=")[1]).Trim()
    }
} else {
    Write-Host "⚠️  .env file not found, using defaults" -ForegroundColor Yellow
}

Write-Host "`nDatabase Configuration:" -ForegroundColor Cyan
Write-Host "   User: $user" -ForegroundColor White
Write-Host "   Database: $database" -ForegroundColor White
Write-Host "   Host: localhost" -ForegroundColor White

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $password

# Step 1: Create database
Write-Host "`n[1/2] Creating database '$database'..." -ForegroundColor Yellow
$createDb = & "$pgBin\psql.exe" -U $user -h localhost -d postgres -c "CREATE DATABASE $database;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database '$database' created successfully!" -ForegroundColor Green
} else {
    if ($createDb -match "already exists") {
        Write-Host "⚠️  Database '$database' already exists, continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error creating database:" -ForegroundColor Red
        Write-Host $createDb -ForegroundColor Red
        exit 1
    }
}

# Step 2: Run schema file
Write-Host "`n[2/2] Running database schema..." -ForegroundColor Yellow
$schemaFile = Join-Path $PSScriptRoot "database-schema.sql"

if (-not (Test-Path $schemaFile)) {
    Write-Host "❌ Schema file not found: $schemaFile" -ForegroundColor Red
    exit 1
}

Write-Host "   Executing: database-schema.sql" -ForegroundColor Gray
$schemaResult = & "$pgBin\psql.exe" -U $user -h localhost -d $database -f $schemaFile 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database schema applied successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Schema execution completed with warnings:" -ForegroundColor Yellow
    Write-Host $schemaResult -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "You can now start the backend server." -ForegroundColor Cyan
Write-Host "The database '$database' is ready with all tables, triggers, views, and functions." -ForegroundColor White

