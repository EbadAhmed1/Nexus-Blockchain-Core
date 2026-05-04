@echo off
echo ========================================
echo PostgreSQL Password Reset Script
echo Run this as Administrator
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Stopping PostgreSQL service...
net stop postgresql-x64-18
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Modifying pg_hba.conf...
powershell -Command "$config = Get-Content 'C:\Program Files\PostgreSQL\18\data\pg_hba.conf'; $config = $config -replace '127\.0\.0\.1/32.*scram-sha-256', 'host    all             all             127.0.0.1/32            trust'; Set-Content 'C:\Program Files\PostgreSQL\18\data\pg_hba.conf' $config"

echo.
echo Step 3: Starting PostgreSQL service...
net start postgresql-x64-18
timeout /t 3 /nobreak >nul

echo.
echo Step 4: Resetting password...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "ALTER USER postgres WITH PASSWORD '1234';"

echo.
echo Step 5: Restoring pg_hba.conf...
powershell -Command "$config = Get-Content 'C:\Program Files\PostgreSQL\18\data\pg_hba.conf'; $config = $config -replace '127\.0\.0\.1/32.*trust', 'host    all             all             127.0.0.1/32            scram-sha-256'; Set-Content 'C:\Program Files\PostgreSQL\18\data\pg_hba.conf' $config"

echo.
echo Step 6: Restarting PostgreSQL service...
net stop postgresql-x64-18
timeout /t 2 /nobreak >nul
net start postgresql-x64-18
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Done! Password is now: 1234
echo ========================================
echo.
echo Testing connection...
node check-db.js
pause

