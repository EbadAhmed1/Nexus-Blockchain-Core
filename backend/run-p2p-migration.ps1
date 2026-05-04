# Run P2P Request Type Migration
# This adds 'p2p_request' to the email_verifications table constraint

Write-Host "`n📋 Running P2P Request Type Migration..." -ForegroundColor Yellow
Write-Host ""

# Read .env file to get database connection details
$envContent = Get-Content .env -Raw
$dbUser = ($envContent | Select-String -Pattern "DB_USER=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$dbPassword = ($envContent | Select-String -Pattern "DB_PASSWORD=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$dbName = ($envContent | Select-String -Pattern "DB_NAME=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$dbHost = ($envContent | Select-String -Pattern "DB_HOST=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$dbPort = ($envContent | Select-String -Pattern "DB_PORT=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()

# Default values if not found
if (-not $dbUser) { $dbUser = "postgres" }
if (-not $dbName) { $dbName = "blockscan" }
if (-not $dbHost) { $dbHost = "localhost" }
if (-not $dbPort) { $dbPort = "5432" }

Write-Host "Database: $dbName on ${dbHost}:${dbPort}" -ForegroundColor Cyan
Write-Host "User: $dbUser" -ForegroundColor Cyan
Write-Host ""

# Set password environment variable
if ($dbPassword) {
    $env:PGPASSWORD = $dbPassword
}

# Try to find psql
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        break
    }
}

if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL psql not found. Please run the SQL manually:" -ForegroundColor Red
    Write-Host ""
    Get-Content add-p2p-request-type.sql | Write-Host -ForegroundColor White
    Write-Host ""
    Write-Host "Or install PostgreSQL and add it to your PATH." -ForegroundColor Yellow
    exit 1
}

# Run the migration
Write-Host "Running migration..." -ForegroundColor Yellow
& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f add-p2p-request-type.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host "The 'p2p_request' type is now allowed in email_verifications table." -ForegroundColor Gray
} else {
    Write-Host "`n❌ Migration failed. Please run the SQL manually:" -ForegroundColor Red
    Write-Host ""
    Get-Content add-p2p-request-type.sql | Write-Host -ForegroundColor White
    Write-Host ""
}
