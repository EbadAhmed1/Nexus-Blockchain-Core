const { pool } = require("../config/connectDB");
const asyncHandler = require("../utils/asyncHandler");
const { sendTransactionNotification } = require("../utils/emailService");
const crypto = require("crypto");

const generateTxHash = () => `0x${crypto.randomBytes(32).toString("hex")}`;

const createTransaction = asyncHandler(async (req, res) => {
  const { fromAddress, toAddress, tokenId, amount, fee, method } = req.body;

  if (!fromAddress || !toAddress || !tokenId || !amount) {
    return res.status(400).json({ message: "Missing required fields: fromAddress, toAddress, tokenId, amount" });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const fromWallet = await client.query(
      "SELECT wallet_id FROM wallets WHERE address = $1",
      [fromAddress]
    );
    if (!fromWallet.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Sender wallet not found" });
    }

    const toWallet = await client.query(
      "SELECT wallet_id FROM wallets WHERE address = $1",
      [toAddress]
    );
    if (!toWallet.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Recipient wallet not found" });
    }

    const fromWalletId = fromWallet.rows[0].wallet_id;
    const toWalletId = toWallet.rows[0].wallet_id;

    const balanceResult = await client.query(
      "SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2",
      [fromWalletId, tokenId]
    );

    const currentBalance = balanceResult.rows.length ? parseFloat(balanceResult.rows[0].amount) : 0;
    const totalNeeded = parseFloat(amount) + parseFloat(fee || 0);

    if (currentBalance < totalNeeded) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const txHash = generateTxHash();
    const txFee = parseFloat(fee || 0);

    const result = await client.query(
      `INSERT INTO transactions (tx_hash, from_wallet_id, to_wallet_id, token_id, amount, fee, method, status, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', NOW())
       RETURNING transaction_id, tx_hash, amount, fee, status, timestamp`,
      [txHash, fromWalletId, toWalletId, tokenId, amount, txFee, method || "transfer"]
    );

    // Update sender balance
    const newFromBalance = currentBalance - totalNeeded;
    if (newFromBalance <= 0) {
      await client.query(
        "DELETE FROM token_holdings WHERE wallet_id = $1 AND token_id = $2",
        [fromWalletId, tokenId]
      );
    } else {
      await client.query(
        "UPDATE token_holdings SET amount = $1 WHERE wallet_id = $2 AND token_id = $3",
        [newFromBalance.toFixed(8), fromWalletId, tokenId]
      );
    }

    // Update receiver balance
    const toBalanceResult = await client.query(
      "SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2",
      [toWalletId, tokenId]
    );

    if (toBalanceResult.rows.length) {
      const newToBalance = parseFloat(toBalanceResult.rows[0].amount) + parseFloat(amount);
      await client.query(
        "UPDATE token_holdings SET amount = $1 WHERE wallet_id = $2 AND token_id = $3",
        [newToBalance.toFixed(8), toWalletId, tokenId]
      );
    } else {
      await client.query(
        "INSERT INTO token_holdings (wallet_id, token_id, amount) VALUES ($1, $2, $3)",
        [toWalletId, tokenId, parseFloat(amount).toFixed(8)]
      );
    }

    await client.query("COMMIT");

    // Send email notification (non-blocking)
    try {
      const userResult = await pool.query(
        `SELECT u.email, u.full_name, u.username, w.address
         FROM users u JOIN wallets w ON u.user_id = w.user_id
         WHERE w.wallet_id = $1`,
        [toWalletId]
      );
      if (userResult.rows.length && userResult.rows[0].email) {
        const tokenResult = await pool.query(
          "SELECT token_symbol FROM tokens WHERE token_id = $1",
          [tokenId]
        );
        await sendTransactionNotification(
          userResult.rows[0].email,
          userResult.rows[0].full_name || userResult.rows[0].username,
          {
            txHash,
            amount,
            tokenSymbol: tokenResult.rows[0]?.token_symbol || "TOKEN",
            fromAddress,
            toAddress,
          }
        );
      }
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr.message);
    }

    res.status(201).json({
      message: "Transaction created successfully",
      transaction: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

const getAllTransactions = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;

  const query = `
    SELECT 
      t.transaction_id,
      t.tx_hash,
      t.amount,
      t.fee,
      t.method,
      t.status,
      t.timestamp,
      fw.address AS from_address,
      tw.address AS to_address,
      tok.token_symbol,
      tok.token_name,
      b.block_hash,
      b.height AS block_height
    FROM transactions t
    LEFT JOIN wallets fw ON fw.wallet_id = t.from_wallet_id
    LEFT JOIN wallets tw ON tw.wallet_id = t.to_wallet_id
    LEFT JOIN tokens tok ON tok.token_id = t.token_id
    LEFT JOIN blocks b ON b.block_id = t.block_id
    ORDER BY t.timestamp DESC
    LIMIT $1 OFFSET $2;
  `;

  const result = await pool.query(query, [limit, offset]);

  res.status(200).json({
    message: "Transactions retrieved",
    transactions: result.rows,
  });
});

const getTransactionDetails = asyncHandler(async (req, res) => {
  const { txHash } = req.params;

  const query = `
    SELECT 
      t.transaction_id,
      t.tx_hash,
      t.amount,
      t.fee,
      t.method,
      t.status,
      t.timestamp,
      fw.address AS from_address,
      fw.label AS from_label,
      tw.address AS to_address,
      tw.label AS to_label,
      tok.token_id,
      tok.token_symbol,
      tok.token_name,
      tok.price_usd AS token_price,
      b.block_id,
      b.block_hash,
      b.height AS block_height
    FROM transactions t
    LEFT JOIN wallets fw ON fw.wallet_id = t.from_wallet_id
    LEFT JOIN wallets tw ON tw.wallet_id = t.to_wallet_id
    LEFT JOIN tokens tok ON tok.token_id = t.token_id
    LEFT JOIN blocks b ON b.block_id = t.block_id
    WHERE t.tx_hash = $1;
  `;

  const result = await pool.query(query, [txHash]);

  if (!result.rows.length) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  res.status(200).json({
    message: "Transaction details retrieved",
    transaction: result.rows[0],
  });
});

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionDetails,
};
