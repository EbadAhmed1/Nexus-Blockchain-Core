// Seed token holdings for users
const { pool } = require("./src/config/connectDB");

async function seedTokenHoldings() {
  try {
    console.log("🌱 Seeding token holdings for users...");

    // Get all users with wallets
    const usersResult = await pool.query(`
      SELECT u.user_id, w.wallet_id 
      FROM users u
      JOIN wallets w ON w.user_id = u.user_id
      WHERE u.status = 'active'
    `);

    // Get all tokens
    const tokensResult = await pool.query(`
      SELECT token_id, token_symbol, price_usd 
      FROM tokens
    `);

    if (tokensResult.rows.length === 0) {
      console.log("❌ No tokens found. Please seed tokens first.");
      process.exit(1);
    }

    console.log(`Found ${usersResult.rows.length} users with wallets`);
    console.log(`Found ${tokensResult.rows.length} tokens`);

    let holdingsCreated = 0;

    for (const user of usersResult.rows) {
      for (const token of tokensResult.rows) {
        // Random amount between 10 and 1000
        const amount = Math.random() * 990 + 10;
        
        // Check if holding already exists
        const existing = await pool.query(
          `SELECT holding_id FROM token_holdings WHERE wallet_id = $1 AND token_id = $2`,
          [user.wallet_id, token.token_id]
        );

        if (existing.rows.length === 0) {
          await pool.query(
            `INSERT INTO token_holdings (wallet_id, token_id, amount)
             VALUES ($1, $2, $3)`,
            [user.wallet_id, token.token_id, amount.toFixed(8)]
          );
          holdingsCreated++;
        }
      }
    }

    console.log(`✅ Created ${holdingsCreated} token holdings`);
    console.log("✅ Token holdings seeded successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding token holdings:", error);
    process.exit(1);
  }
}

seedTokenHoldings();

