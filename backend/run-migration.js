/**
 * Run P2P Request Type Migration
 * This script adds 'p2p_request' to the email_verifications table constraint
 */

require('dotenv').config();
const { pool } = require('./src/config/connectDB');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('\n📋 Running P2P Request Type Migration...\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop existing constraint
    console.log('Dropping existing constraint...');
    await client.query(`
      ALTER TABLE email_verifications 
      DROP CONSTRAINT IF EXISTS email_verifications_type_check;
    `);

    // Add new constraint with p2p_request
    console.log('Adding new constraint with p2p_request...');
    await client.query(`
      ALTER TABLE email_verifications 
      ADD CONSTRAINT email_verifications_type_check 
      CHECK (type IN ('signup', 'transaction', 'password_reset', 'account_deletion', 'p2p_request'));
    `);

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
    console.log("The 'p2p_request' type is now allowed in email_verifications table.\n");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease run the SQL manually:');
    console.log('\n' + fs.readFileSync(path.join(__dirname, 'add-p2p-request-type.sql'), 'utf8'));
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

