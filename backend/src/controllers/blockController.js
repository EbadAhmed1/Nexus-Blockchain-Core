
const { pool } = require("../config/connectDB");
const asyncHandler = require("../utils/asyncHandler");


const getLatestBlocks = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 10;

  const query = `
    SELECT 
      block_id,
      block_hash,
      previous_hash,
      height,
      timestamp,
      gas_used,
      gas_limit,
      size_kb,
      reward,
      status,
      transaction_count,
      total_transaction_amount,
      total_fees
    FROM block_summary
    LIMIT $1;
  `;

  const result = await pool.query(query, [limit]);

  res.status(200).json({
    message: "Latest blocks retrieved",
    blocks: result.rows,
  });
});


const getBlockDetails = asyncHandler(async (req, res) => {
  const { blockId } = req.params;

  const query = `
    SELECT 
      block_id,
      block_hash,
      previous_hash,
      height,
      timestamp,
      gas_used,
      gas_limit,
      size_kb,
      reward,
      status,
      transaction_count,
      total_transaction_amount,
      total_fees
    FROM block_summary
    WHERE block_id = $1;
  `;

  const result = await pool.query(query, [blockId]);

  if (!result.rows.length) {
    return res.status(404).json({ message: "Block not found" });
  }

  res.status(200).json({
    message: "Block details retrieved",
    block: result.rows[0],
  });
});

const getBlockTransactions = asyncHandler(async (req, res) => {
  const { blockId } = req.params;

  const query = `
    SELECT
      t.transaction_id,
      t.tx_hash,
      fw.address AS from_address,
      tw.address AS to_address,
      tok.token_symbol,
      tok.token_name,
      t.amount,
      t.fee,
      t.timestamp
    FROM transactions t
    LEFT JOIN wallets fw ON t.from_wallet_id = fw.wallet_id
    LEFT JOIN wallets tw ON t.to_wallet_id = tw.wallet_id
    LEFT JOIN tokens tok ON t.token_id = tok.token_id
    WHERE t.block_id = $1
    ORDER BY t.timestamp DESC;
  `;

  const result = await pool.query(query, [blockId]);

  res.status(200).json({
    message: "Block transactions retrieved",
    transactions: result.rows,
  });
});

module.exports = {
  getLatestBlocks,
  getBlockDetails,
  getBlockTransactions,
};
