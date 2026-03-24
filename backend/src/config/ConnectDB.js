const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE || "blockscan",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

if (process.env.NODE_ENV !== "test") {
pool.connect()
    .then((client) => {
      console.log("✅ Connected to PostgreSQL");
      client.release();
    })
    .catch((err) => {
    console.error("❌ DB Connection Error:", err.message);
      if (err.code === "ECONNREFUSED") {
      console.error("\n💡 PostgreSQL is not running!");
      console.error("   Please start PostgreSQL service or check your connection settings.");
      console.error("   Windows: Open Services (services.msc) and start PostgreSQL service");
      } else if (err.code === "28P01") {
      console.error("\n💡 Authentication failed! Check your .env file credentials.");
      } else if (err.code === "3D000") {
      console.error(`\n💡 Database "${process.env.PG_DATABASE}" does not exist!`);
        console.error(`   Create it with: CREATE DATABASE ${process.env.PG_DATABASE};`);
    }
  });
}

module.exports = { pool };

