// reset-password.js - Reset PostgreSQL password by temporarily enabling trust auth
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pgHbaPath = 'C:\\Program Files\\PostgreSQL\\18\\data\\pg_hba.conf';
const pgBin = 'C:\\Program Files\\PostgreSQL\\18\\bin';

console.log('🔧 Attempting to reset PostgreSQL password...\n');

// Backup pg_hba.conf
try {
    if (fs.existsSync(pgHbaPath)) {
        const backupPath = pgHbaPath + '.backup';
        fs.copyFileSync(pgHbaPath, backupPath);
        console.log('✅ Backed up pg_hba.conf\n');
        
        // Read current config
        let config = fs.readFileSync(pgHbaPath, 'utf8');
        
        // Find and modify localhost line to use trust
        const lines = config.split('\n');
        let modified = false;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('127.0.0.1/32') && lines[i].includes('scram-sha-256') && !lines[i].trim().startsWith('#')) {
                lines[i] = lines[i].replace('scram-sha-256', 'trust');
                modified = true;
                console.log(`✅ Modified line ${i + 1} to use trust authentication\n`);
                break;
            }
        }
        
        if (modified) {
            // Write modified config
            fs.writeFileSync(pgHbaPath, lines.join('\n'));
            console.log('✅ Updated pg_hba.conf to use trust authentication\n');
            console.log('⚠️  Restarting PostgreSQL service to apply changes...\n');
            
            // Restart PostgreSQL service
            try {
                execSync('net stop postgresql-x64-18', { stdio: 'ignore' });
                execSync('timeout /t 2 /nobreak >nul', { stdio: 'ignore' });
                execSync('net start postgresql-x64-18', { stdio: 'ignore' });
                execSync('timeout /t 3 /nobreak >nul', { stdio: 'ignore' });
                console.log('✅ PostgreSQL service restarted\n');
                
                // Now reset password
                console.log('🔐 Resetting password to "1234"...\n');
                try {
                    execSync(`"${pgBin}\\psql.exe" -U postgres -h localhost -c "ALTER USER postgres WITH PASSWORD '1234';"`, {
                        stdio: 'inherit'
                    });
                    console.log('\n✅ Password reset successfully!\n');
                } catch (err) {
                    console.error('❌ Failed to reset password:', err.message);
                }
                
                // Restore original config
                console.log('\n🔄 Restoring original pg_hba.conf...\n');
                fs.copyFileSync(backupPath, pgHbaPath);
                
                // Restart again
                execSync('net stop postgresql-x64-18', { stdio: 'ignore' });
                execSync('timeout /t 2 /nobreak >nul', { stdio: 'ignore' });
                execSync('net start postgresql-x64-18', { stdio: 'ignore' });
                execSync('timeout /t 3 /nobreak >nul', { stdio: 'ignore' });
                console.log('✅ Restored original authentication settings\n');
                
                console.log('✅ Done! Password is now "1234"\n');
                console.log('Testing connection...\n');
                
            } catch (err) {
                console.error('❌ Failed to restart service:', err.message);
                console.log('\n⚠️  Restoring backup manually...');
                fs.copyFileSync(backupPath, pgHbaPath);
            }
        } else {
            console.log('⚠️  Could not find localhost line to modify');
            console.log('Please manually edit pg_hba.conf or use pgAdmin');
        }
    } else {
        console.log('❌ pg_hba.conf not found at:', pgHbaPath);
    }
} catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  This requires administrator privileges');
    console.log('Please run as administrator or use pgAdmin instead');
}

