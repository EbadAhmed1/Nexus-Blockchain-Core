// Fix unverified users by creating email_verifications records
const { pool } = require("./src/config/connectDB");

async function fixUnverifiedUsers() {
  try {
    console.log("🔍 Checking for unverified users...");
    
    // Get unverified users with verification tokens
    const users = await pool.query(
      `SELECT user_id, email, verification_token, verification_expires 
       FROM users 
       WHERE email_verified = false 
       AND verification_token IS NOT NULL`
    );

    console.log(`Found ${users.rows.length} unverified users with tokens`);

    for (const user of users.rows) {
      // Check if email_verifications record already exists
      const existing = await pool.query(
        `SELECT verification_id FROM email_verifications 
         WHERE user_id = $1 AND type = 'signup'`,
        [user.user_id]
      );

      if (existing.rows.length === 0) {
        // Create email_verifications record
        const expiresAt = user.verification_expires || new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        try {
          await pool.query(
            `INSERT INTO email_verifications (user_id, email, token, type, expires_at)
             VALUES ($1, $2, $3, 'signup', $4)`,
            [user.user_id, user.email, user.verification_token, 'signup', expiresAt]
          );
          console.log(`✅ Created verification record for user ${user.user_id} (${user.email})`);
        } catch (insertError) {
          if (insertError.code === '23505') {
            console.log(`⚠️  Verification record already exists for user ${user.user_id}`);
          } else {
            console.error(`❌ Error creating verification for user ${user.user_id}:`, insertError.message);
          }
        }
      } else {
        console.log(`ℹ️  Verification record already exists for user ${user.user_id}`);
      }
    }

    console.log("\n✅ Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixUnverifiedUsers();

