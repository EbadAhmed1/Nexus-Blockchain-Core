const { pool } = require("../src/config/connectDB");

async function viewDatabase() {
  try {
    console.log("📊 Database Tables Overview\n");
    console.log("=".repeat(80));

    const tables = [
      "users",
      "tokens",
      "wallets",
      "token_holdings",
      "blocks",
      "transactions",
      "p2p_orders",
      "p2p_transactions",
      "email_verifications"
    ];

    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result.rows[0].count;
      console.log(`📋 ${table.padEnd(25)} : ${count} rows`);
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n📝 Sample Data:\n");

    const users = await pool.query("SELECT user_id, username, email, email_verified, status FROM users LIMIT 5");
    console.log("👤 Users (first 5):");
    console.table(users.rows);

    const tokens = await pool.query("SELECT token_id, token_symbol, token_name, price_usd FROM tokens LIMIT 5");
    console.log("\n🪙 Tokens (first 5):");
    console.table(tokens.rows);

    const wallets = await pool.query("SELECT wallet_id, address, user_id, status FROM wallets LIMIT 5");
    console.log("\n💼 Wallets (first 5):");
    console.table(wallets.rows);

    const transactions = await pool.query("SELECT transaction_id, tx_hash, amount, status, method FROM transactions LIMIT 5");
    console.log("\n💸 Transactions (first 5):");
    console.table(transactions.rows);

    await pool.end();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

viewDatabase();

