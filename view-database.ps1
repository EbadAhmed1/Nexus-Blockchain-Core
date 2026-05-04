# view-database.ps1
# Quick script to view database data using psql

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Database Data Viewer" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Database connection info
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "test"
$dbUser = "postgres"
$dbPassword = "1234"

# Find psql
$pgBin = $null
$pgVersions = @("18", "16", "15", "14", "13", "12")
foreach ($version in $pgVersions) {
    $testPath = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
    if (Test-Path $testPath) {
        $pgBin = "C:\Program Files\PostgreSQL\$version\bin"
        break
    }
}

if (-not $pgBin) {
    Write-Host "❌ Could not find psql.exe. Please install PostgreSQL." -ForegroundColor Red
    exit 1
}

# Set password
$env:PGPASSWORD = $dbPassword

Write-Host "Database: $dbName" -ForegroundColor Cyan
Write-Host "Host: $dbHost:$dbPort" -ForegroundColor Cyan
Write-Host "User: $dbUser`n" -ForegroundColor Cyan

# Menu
Write-Host "What would you like to view?" -ForegroundColor Yellow
Write-Host "1. Users (first 10)" -ForegroundColor White
Write-Host "2. Wallets (first 10)" -ForegroundColor White
Write-Host "3. Transactions (first 10)" -ForegroundColor White
Write-Host "4. Tokens (all)" -ForegroundColor White
Write-Host "5. Wallet Summary View (first 10)" -ForegroundColor White
Write-Host "6. Transaction History View (first 10)" -ForegroundColor White
Write-Host "7. User Statistics View (all)" -ForegroundColor White
Write-Host "8. Token Market Summary View (all)" -ForegroundColor White
Write-Host "9. P2P Orders (active)" -ForegroundColor White
Write-Host "10. Blocks (latest 10)" -ForegroundColor White
Write-Host "11. Count all records" -ForegroundColor White
Write-Host "12. Open interactive psql session" -ForegroundColor White
Write-Host "0. Exit`n" -ForegroundColor White

$choice = Read-Host "Enter your choice (0-12)"

switch ($choice) {
    "1" {
        Write-Host "`nUsers:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c "SELECT user_id, username, email, email_verified, status, created_at FROM users ORDER BY created_at DESC LIMIT 10;"
    }
    "2" {
        Write-Host "`nWallets:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c "SELECT wallet_id, address, label, user_id, status, created_at FROM wallets ORDER BY created_at DESC LIMIT 10;"
    }
    "3" {
        Write-Host "`nTransactions:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c "SELECT transaction_id, tx_hash, amount, fee, status, timestamp FROM transactions ORDER BY timestamp DESC LIMIT 10;"
    }
    "4" {
        Write-Host "`nTokens:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c "SELECT token_id, token_symbol, token_name, price_usd, market_cap_usd, volume_24h FROM tokens ORDER BY market_cap_usd DESC NULLS LAST;"
    }
    "5" {
        Write-Host "`nWallet Summary:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c "SELECT wallet_id, address, username, token_count, total_balance_usd FROM wallet_summary ORDER BY total_balance_usd DESC LIMIT 10;"
    }
    "6" {
        Write-Host "`nTransaction History:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c "SELECT tx_hash, from_username, to_username, token_symbol, amount, status, timestamp FROM transaction_history ORDER BY timestamp DESC LIMIT 10;"
    }
    "7" {
        Write-Host "`nUser Statistics:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c "SELECT user_id, username, total_wallets, total_transactions, total_p2p_orders, total_balance_usd FROM user_statistics ORDER BY total_balance_usd DESC;"
    }
    "8" {
        Write-Host "`nToken Market Summary:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c "SELECT token_symbol, token_name, price_usd, market_cap_usd, holder_count, transaction_count FROM token_market_summary ORDER BY market_cap_usd DESC NULLS LAST;"
    }
    "9" {
        Write-Host "`nActive P2P Orders:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c "SELECT order_id, username, token_symbol, order_type, amount, price, total, status FROM p2p_order_summary WHERE status = 'active' ORDER BY created_at DESC;"
    }
    "10" {
        Write-Host "`nLatest Blocks:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c "SELECT block_id, block_hash, height, validator_name, transaction_count, total_fees, timestamp FROM block_summary ORDER BY height DESC LIMIT 10;"
    }
    "11" {
        Write-Host "`nRecord Counts:" -ForegroundColor Green
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName -c @"
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'tokens', COUNT(*) FROM tokens
UNION ALL
SELECT 'blocks', COUNT(*) FROM blocks
UNION ALL
SELECT 'p2p_orders', COUNT(*) FROM p2p_orders
UNION ALL
SELECT 'p2p_transactions', COUNT(*) FROM p2p_transactions
ORDER BY table_name;
"@
    }
    "12" {
        Write-Host "`nOpening interactive psql session..." -ForegroundColor Yellow
        Write-Host "Type \q to exit`n" -ForegroundColor Gray
        & "$pgBin\psql.exe" -U $dbUser -h $dbHost -d $dbName
    }
    "0" {
        Write-Host "`nExiting...`n" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "`nInvalid choice. Please run the script again.`n" -ForegroundColor Red
    }
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

