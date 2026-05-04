/**
 * Run Login Verification Type Migration
 */

require('dotenv').config();
const { pool } = require('./src/config/connectDB');

async function runMigration() {
  console.log('\n📋 Running Login Verification Type Migration...\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Dropping existing constraint...');
    await client.query(`
      ALTER TABLE email_verifications 
      DROP CONSTRAINT IF EXISTS email_verifications_type_check;
    `);

    console.log('Adding new constraint with login_verification...');
    await client.query(`
      ALTER TABLE email_verifications 
      ADD CONSTRAINT email_verifications_type_check 
      CHECK (type IN ('signup', 'transaction', 'password_reset', 'account_deletion', 'p2p_request', 'login_verification'));
    `);

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
    console.log("The 'login_verification' type is now allowed in email_verifications table.\n");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

