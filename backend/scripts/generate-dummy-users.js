// generate-dummy-users.js - Generate 20 dummy users for testing
const { pool } = require("./src/config/connectDB");
const crypto = require("crypto");

const dummyUsers = [
  { username: "alice_crypto", email: "alice.crypto@example.com", fullName: "Alice Johnson", phone: "+1234567890", password: "password123" },
  { username: "bob_trader", email: "bob.trader@example.com", fullName: "Bob Smith", phone: "+1234567891", password: "password123" },
  { username: "charlie_investor", email: "charlie.investor@example.com", fullName: "Charlie Brown", phone: "+1234567892", password: "password123" },
  { username: "diana_miner", email: "diana.miner@example.com", fullName: "Diana Williams", phone: "+1234567893", password: "password123" },
  { username: "edward_holder", email: "edward.holder@example.com", fullName: "Edward Davis", phone: "+1234567894", password: "password123" },
  { username: "fiona_validator", email: "fiona.validator@example.com", fullName: "Fiona Miller", phone: "+1234567895", password: "password123" },
  { username: "george_dealer", email: "george.dealer@example.com", fullName: "George Wilson", phone: "+1234567896", password: "password123" },
  { username: "helen_buyer", email: "helen.buyer@example.com", fullName: "Helen Moore", phone: "+1234567897", password: "password123" },
  { username: "ivan_seller", email: "ivan.seller@example.com", fullName: "Ivan Taylor", phone: "+1234567898", password: "password123" },
  { username: "julia_whale", email: "julia.whale@example.com", fullName: "Julia Anderson", phone: "+1234567899", password: "password123" },
  { username: "kevin_daytrader", email: "kevin.daytrader@example.com", fullName: "Kevin Thomas", phone: "+1234567900", password: "password123" },
  { username: "lisa_hodler", email: "lisa.hodler@example.com", fullName: "Lisa Jackson", phone: "+1234567901", password: "password123" },
  { username: "mike_swing", email: "mike.swing@example.com", fullName: "Mike White", phone: "+1234567902", password: "password123" },
  { username: "nina_scalper", email: "nina.scalper@example.com", fullName: "Nina Harris", phone: "+1234567903", password: "password123" },
  { username: "oscar_arbitrage", email: "oscar.arbitrage@example.com", fullName: "Oscar Martin", phone: "+1234567904", password: "password123" },
  { username: "patricia_yield", email: "patricia.yield@example.com", fullName: "Patricia Thompson", phone: "+1234567905", password: "password123" },
  { username: "quentin_staker", email: "quentin.staker@example.com", fullName: "Quentin Garcia", phone: "+1234567906", password: "password123" },
  { username: "rachel_liquidity", email: "rachel.liquidity@example.com", fullName: "Rachel Martinez", phone: "+1234567907", password: "password123" },
  { username: "steve_flashloan", email: "steve.flashloan@example.com", fullName: "Steve Robinson", phone: "+1234567908", password: "password123" },
  { username: "tina_defi", email: "tina.defi@example.com", fullName: "Tina Clark", phone: "+1234567909", password: "password123" },
];

async function generateUsers() {
  console.log("🚀 Generating 20 dummy users...\n");

  const createdUsers = [];
  const errors = [];

  for (const user of dummyUsers) {
    try {
      // Check if user exists
      const existing = await pool.query(
        "SELECT user_id FROM users WHERE email = $1 OR username = $1",
        [user.email]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  User ${user.email} already exists, skipping...`);
        continue;
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Insert user
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name, phone, verification_token, verification_expires, email_verified, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'active')
         RETURNING user_id, username, email, full_name, phone, email_verified, status, created_at`,
        [user.username, user.email, user.password, user.fullName, user.phone, verificationToken, expiresAt]
      );

      const newUser = result.rows[0];

      // Create email verification record
      await pool.query(
        `INSERT INTO email_verifications (user_id, email, token, type, verified, expires_at)
         VALUES ($1, $2, $3, 'signup', true, $4)`,
        [newUser.user_id, user.email, verificationToken, expiresAt]
      );

      // Create a default wallet for the user
      const address = `0x${crypto.randomBytes(20).toString("hex")}`;
      const publicKey = `0x${crypto.randomBytes(32).toString("hex")}`;

      await pool.query(
        `INSERT INTO wallets (address, label, user_id, public_key, status, created_at)
         VALUES ($1, $2, $3, $4, 'active', NOW())`,
        [address, `${user.fullName}'s Wallet`, newUser.user_id, publicKey]
      );

      createdUsers.push({
        ...newUser,
        password: user.password,
        address,
      });

      console.log(`✅ Created user: ${user.email}`);
    } catch (error) {
      errors.push({ user: user.email, error: error.message });
      console.error(`❌ Error creating ${user.email}:`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${createdUsers.length} users`);
  console.log(`   Errors: ${errors.length}`);

  if (createdUsers.length > 0) {
    console.log(`\n✅ Successfully created ${createdUsers.length} users!`);
  }

  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    errors.forEach((e) => console.log(`   - ${e.user}: ${e.error}`));
  }

  return createdUsers;
}

// Run if called directly
if (require.main === module) {
  generateUsers()
    .then((users) => {
      console.log("\n✨ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { generateUsers, dummyUsers };

