const dotenv = require("dotenv");
const app = require("./app.js");
const { pool } = require("./config/connectDB");

dotenv.config();

const PORT = process.env.PORT || 5000;

pool.connect()
  .then(() => console.log("✅ PostgreSQL Connected"))
  .catch((err) => {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
});