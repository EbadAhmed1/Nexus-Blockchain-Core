const { pool } = require("../config/connectDB");
const asyncHandler = require("../utils/asyncHandler");

const getAllTokens = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      tok.token_id,
      tok.token_symbol,
      tok.token_name,
      tok.decimals,
      tok.price_usd,
      tok.change_24h,
      tok.volume_24h,
      tok.market_cap_usd,
      tok.total_supply,
      COUNT(DISTINCT th.wallet_id) AS holder_count,
      COUNT(DISTINCT t.transaction_id) AS transaction_count
    FROM tokens tok
    LEFT JOIN token_holdings th ON th.token_id = tok.token_id
    LEFT JOIN transactions t ON t.token_id = tok.token_id
    GROUP BY tok.token_id, tok.token_symbol, tok.token_name, tok.decimals,
             tok.price_usd, tok.change_24h, tok.volume_24h, tok.market_cap_usd, tok.total_supply
    ORDER BY tok.market_cap_usd DESC;
  `;

  const result = await pool.query(query);

  res.status(200).json({
    message: "Tokens retrieved",
    tokens: result.rows,
  });
});

const getTokenDetails = asyncHandler(async (req, res) => {
  const { symbol } = req.params;

  const query = `
    SELECT 
      tok.token_id,
      tok.token_symbol,
      tok.token_name,
      tok.decimals,
      tok.price_usd,
      tok.change_24h,
      tok.volume_24h,
      tok.market_cap_usd,
      tok.total_supply,
      COUNT(DISTINCT th.wallet_id) AS holder_count,
      COUNT(DISTINCT t.transaction_id) AS transaction_count,
      COALESCE(SUM(th.amount), 0) AS circulating_supply
    FROM tokens tok
    LEFT JOIN token_holdings th ON th.token_id = tok.token_id
    LEFT JOIN transactions t ON t.token_id = tok.token_id
    WHERE tok.token_symbol = $1
    GROUP BY tok.token_id, tok.token_symbol, tok.token_name, tok.decimals,
             tok.price_usd, tok.change_24h, tok.volume_24h, tok.market_cap_usd, tok.total_supply;
  `;

  const result = await pool.query(query, [symbol]);

  if (!result.rows.length) {
    return res.status(404).json({ message: "Token not found" });
  }

  res.status(200).json({
    message: "Token details retrieved",
    token: result.rows[0],
  });
});

const getTokenHolders = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;

  const token = await pool.query(
    "SELECT token_id FROM tokens WHERE token_symbol = $1",
    [symbol]
  );

  if (!token.rows.length) {
    return res.status(404).json({ message: "Token not found" });
  }

  const tokenId = token.rows[0].token_id;

  const query = `
    SELECT 
      w.address,
      w.label,
      u.username,
      th.amount,
      (th.amount / NULLIF(tok.total_supply, 0) * 100) AS percentage
    FROM token_holdings th
    JOIN wallets w ON w.wallet_id = th.wallet_id
    JOIN tokens tok ON tok.token_id = th.token_id
    LEFT JOIN users u ON u.user_id = w.user_id
    WHERE th.token_id = $1 AND th.amount > 0
    ORDER BY th.amount DESC
    LIMIT $2 OFFSET $3;
  `;

  const result = await pool.query(query, [tokenId, limit, offset]);

  res.status(200).json({
    message: "Token holders retrieved",
    symbol,
    holders: result.rows,
  });
});

module.exports = {
  getAllTokens,
  getTokenDetails,
  getTokenHolders,
};
