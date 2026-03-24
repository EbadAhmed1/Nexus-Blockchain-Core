
const { pool } = require("../config/connectDB");
const asyncHandler = require("../utils/asyncHandler");

const searchWallets = asyncHandler(async (req, res) => {
  const q = req.query.q || "";

  const query = `
    SELECT 
      w.address,
      u.username
    FROM wallets w
    LEFT JOIN users u ON w.user_id = u.user_id
    WHERE w.address ILIKE '%' || $1 || '%'
    ORDER BY w.address
    LIMIT 20;
  `;

  const result = await pool.query(query, [q]);

  res.status(200).json({
    message: "Wallet search results",
    wallets: result.rows,
  });
});

const searchTransactions = asyncHandler(async (req, res) => {
  const q = req.query.q || "";

  const query = `
    SELECT 
      t.tx_hash,
      fw.address AS from_address,
      tw.address AS to_address,
      tok.token_symbol,
      t.amount,
      t.timestamp
    FROM transactions t
    LEFT JOIN wallets fw ON t.from_wallet_id = fw.wallet_id
    LEFT JOIN wallets tw ON t.to_wallet_id = tw.wallet_id
    LEFT JOIN tokens tok ON t.token_id = tok.token_id
    WHERE t.tx_hash ILIKE '%' || $1 || '%'
    ORDER BY t.timestamp DESC
    LIMIT 20;
  `;

  const result = await pool.query(query, [q]);

  res.status(200).json({
    message: "Transaction search results",
    transactions: result.rows,
  });
});

module.exports = {
  searchWallets,
  searchTransactions,
};
