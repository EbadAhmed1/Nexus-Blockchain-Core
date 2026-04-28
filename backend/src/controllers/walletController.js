const { pool } = require("../config/connectDB");
const asyncHandler = require("../utils/asyncHandler");
const crypto = require("crypto");

const generateAddress = () => `0x${crypto.randomBytes(20).toString("hex")}`;

const getAllWallets = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;

  const query = `
    SELECT 
      w.wallet_id,
      w.address,
      w.label,
      w.user_id,
      u.username,
      w.status,
      w.created_at,
      COUNT(DISTINCT th.token_id) AS token_count,
      COALESCE(SUM(th.amount * tok.price_usd), 0) AS total_balance_usd
    FROM wallets w
    LEFT JOIN users u ON u.user_id = w.user_id
    LEFT JOIN token_holdings th ON th.wallet_id = w.wallet_id
    LEFT JOIN tokens tok ON tok.token_id = th.token_id
    GROUP BY w.wallet_id, w.address, w.label, w.user_id, u.username, w.status, w.created_at
    ORDER BY total_balance_usd DESC
    LIMIT $1 OFFSET $2;
  `;

  const result = await pool.query(query, [limit, offset]);

  res.status(200).json({
    message: "Wallets retrieved",
    wallets: result.rows,
  });
});

const createWallet = asyncHandler(async (req, res) => {
  const { userId, label } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const user = await pool.query("SELECT user_id FROM users WHERE user_id = $1", [userId]);
  if (!user.rows.length) {
    return res.status(404).json({ message: "User not found" });
  }

  const address = generateAddress();
  const publicKey = `0x${crypto.randomBytes(32).toString("hex")}`;

  const result = await pool.query(
    `INSERT INTO wallets (address, label, user_id, public_key, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING wallet_id, address, label, user_id, public_key, status, created_at`,
    [address, label || null, userId, publicKey]
  );

  res.status(201).json({
    message: "Wallet created successfully",
    wallet: result.rows[0],
  });
});

const getWalletDetails = asyncHandler(async (req, res) => {
  const { address } = req.params;

  const query = `
    SELECT 
      w.wallet_id,
      w.address,
      w.label,
      w.user_id,
      u.username,
      u.email,
      w.public_key,
      w.status,
      w.created_at,
      COUNT(DISTINCT th.token_id) AS token_count,
      COALESCE(SUM(th.amount * tok.price_usd), 0) AS total_balance_usd
    FROM wallets w
    LEFT JOIN users u ON u.user_id = w.user_id
    LEFT JOIN token_holdings th ON th.wallet_id = w.wallet_id
    LEFT JOIN tokens tok ON tok.token_id = th.token_id
    WHERE w.address = $1
    GROUP BY w.wallet_id, w.address, w.label, w.user_id, u.username, u.email, w.public_key, w.status, w.created_at;
  `;

  const result = await pool.query(query, [address]);

  if (!result.rows.length) {
    return res.status(404).json({ message: "Wallet not found" });
  }

  res.status(200).json({
    message: "Wallet details retrieved",
    wallet: result.rows[0],
  });
});

const getWalletHoldings = asyncHandler(async (req, res) => {
  const { address } = req.params;

  const wallet = await pool.query("SELECT wallet_id FROM wallets WHERE address = $1", [address]);
  if (!wallet.rows.length) {
    return res.status(404).json({ message: "Wallet not found" });
  }

  const query = `
    SELECT 
      tok.token_id,
      tok.token_symbol,
      tok.token_name,
      tok.decimals,
      tok.price_usd,
      tok.change_24h,
      th.amount,
      (th.amount * tok.price_usd) AS value_usd
    FROM token_holdings th
    JOIN tokens tok ON tok.token_id = th.token_id
    WHERE th.wallet_id = $1 AND th.amount > 0
    ORDER BY value_usd DESC;
  `;

  const result = await pool.query(query, [wallet.rows[0].wallet_id]);

  res.status(200).json({
    message: "Wallet holdings retrieved",
    address,
    holdings: result.rows,
  });
});

const getWalletTransactions = asyncHandler(async (req, res) => {
  const { address } = req.params;
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;

  const wallet = await pool.query("SELECT wallet_id FROM wallets WHERE address = $1", [address]);
  if (!wallet.rows.length) {
    return res.status(404).json({ message: "Wallet not found" });
  }

  const walletId = wallet.rows[0].wallet_id;

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
      CASE WHEN t.from_wallet_id = $1 THEN 'sent' ELSE 'received' END AS direction
    FROM transactions t
    LEFT JOIN wallets fw ON fw.wallet_id = t.from_wallet_id
    LEFT JOIN wallets tw ON tw.wallet_id = t.to_wallet_id
    LEFT JOIN tokens tok ON tok.token_id = t.token_id
    WHERE t.from_wallet_id = $1 OR t.to_wallet_id = $1
    ORDER BY t.timestamp DESC
    LIMIT $2 OFFSET $3;
  `;

  const result = await pool.query(query, [walletId, limit, offset]);

  res.status(200).json({
    message: "Wallet transactions retrieved",
    address,
    transactions: result.rows,
  });
});

const getWalletBalance = asyncHandler(async (req, res) => {
  const { address } = req.params;

  const wallet = await pool.query("SELECT wallet_id FROM wallets WHERE address = $1", [address]);
  if (!wallet.rows.length) {
    return res.status(404).json({ message: "Wallet not found" });
  }

  const query = `
    SELECT 
      COALESCE(SUM(th.amount * tok.price_usd), 0) AS total_balance_usd,
      COUNT(DISTINCT th.token_id) AS token_count
    FROM token_holdings th
    JOIN tokens tok ON tok.token_id = th.token_id
    WHERE th.wallet_id = $1 AND th.amount > 0;
  `;

  const result = await pool.query(query, [wallet.rows[0].wallet_id]);

  res.status(200).json({
    message: "Wallet balance retrieved",
    address,
    balance: result.rows[0],
  });
});

const depositToWallet = asyncHandler(async (req, res) => {
  const { address } = req.params;
  const { tokenId, amount } = req.body;

  if (!tokenId || !amount) {
    return res.status(400).json({ message: "Missing required fields: tokenId, amount" });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  const wallet = await pool.query("SELECT wallet_id FROM wallets WHERE address = $1", [address]);
  if (!wallet.rows.length) {
    return res.status(404).json({ message: "Wallet not found" });
  }

  const walletId = wallet.rows[0].wallet_id;

  const existing = await pool.query(
    "SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2",
    [walletId, tokenId]
  );

  if (existing.rows.length) {
    const newBalance = parseFloat(existing.rows[0].amount) + parseFloat(amount);
    await pool.query(
      "UPDATE token_holdings SET amount = $1 WHERE wallet_id = $2 AND token_id = $3",
      [newBalance.toFixed(8), walletId, tokenId]
    );
  } else {
    await pool.query(
      "INSERT INTO token_holdings (wallet_id, token_id, amount) VALUES ($1, $2, $3)",
      [walletId, tokenId, parseFloat(amount).toFixed(8)]
    );
  }

  const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;
  await pool.query(
    `INSERT INTO transactions (tx_hash, to_wallet_id, token_id, amount, fee, method, status, timestamp)
     VALUES ($1, $2, $3, $4, 0, 'deposit', 'confirmed', NOW())`,
    [txHash, walletId, tokenId, amount]
  );

  res.status(200).json({
    message: "Deposit successful",
    txHash,
    address,
    tokenId,
    amount,
  });
});

const withdrawFromWallet = asyncHandler(async (req, res) => {
  const { address } = req.params;
  const { tokenId, amount } = req.body;

  if (!tokenId || !amount) {
    return res.status(400).json({ message: "Missing required fields: tokenId, amount" });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  const wallet = await pool.query("SELECT wallet_id FROM wallets WHERE address = $1", [address]);
  if (!wallet.rows.length) {
    return res.status(404).json({ message: "Wallet not found" });
  }

  const walletId = wallet.rows[0].wallet_id;

  const holding = await pool.query(
    "SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2",
    [walletId, tokenId]
  );

  const currentBalance = holding.rows.length ? parseFloat(holding.rows[0].amount) : 0;

  if (currentBalance < parseFloat(amount)) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  const newBalance = currentBalance - parseFloat(amount);
  if (newBalance <= 0) {
    await pool.query(
      "DELETE FROM token_holdings WHERE wallet_id = $1 AND token_id = $2",
      [walletId, tokenId]
    );
  } else {
    await pool.query(
      "UPDATE token_holdings SET amount = $1 WHERE wallet_id = $2 AND token_id = $3",
      [newBalance.toFixed(8), walletId, tokenId]
    );
  }

  const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;
  await pool.query(
    `INSERT INTO transactions (tx_hash, from_wallet_id, token_id, amount, fee, method, status, timestamp)
     VALUES ($1, $2, $3, $4, 0, 'withdraw', 'confirmed', NOW())`,
    [txHash, walletId, tokenId, amount]
  );

  res.status(200).json({
    message: "Withdrawal successful",
    txHash,
    address,
    tokenId,
    amount,
  });
});

const transferBetweenWallets = asyncHandler(async (req, res) => {
  const { address } = req.params;
  const { toAddress, tokenId, amount } = req.body;

  if (!toAddress || !tokenId || !amount) {
    return res.status(400).json({ message: "Missing required fields: toAddress, tokenId, amount" });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  if (address === toAddress) {
    return res.status(400).json({ message: "Cannot transfer to the same wallet" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const fromWallet = await client.query("SELECT wallet_id FROM wallets WHERE address = $1", [address]);
    if (!fromWallet.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Sender wallet not found" });
    }

    const toWallet = await client.query("SELECT wallet_id FROM wallets WHERE address = $1", [toAddress]);
    if (!toWallet.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Recipient wallet not found" });
    }

    const fromWalletId = fromWallet.rows[0].wallet_id;
    const toWalletId = toWallet.rows[0].wallet_id;

    const holding = await client.query(
      "SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2",
      [fromWalletId, tokenId]
    );

    const currentBalance = holding.rows.length ? parseFloat(holding.rows[0].amount) : 0;

    if (currentBalance < parseFloat(amount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Debit sender
    const newFromBalance = currentBalance - parseFloat(amount);
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

    // Credit receiver
    const toHolding = await client.query(
      "SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2",
      [toWalletId, tokenId]
    );

    if (toHolding.rows.length) {
      const newToBalance = parseFloat(toHolding.rows[0].amount) + parseFloat(amount);
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

    const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;
    await client.query(
      `INSERT INTO transactions (tx_hash, from_wallet_id, to_wallet_id, token_id, amount, fee, method, status, timestamp)
       VALUES ($1, $2, $3, $4, $5, 0, 'transfer', 'confirmed', NOW())`,
      [txHash, fromWalletId, toWalletId, tokenId, amount]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Transfer successful",
      txHash,
      from: address,
      to: toAddress,
      tokenId,
      amount,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

module.exports = {
  getWalletDetails,
  getWalletHoldings,
  getWalletTransactions,
  getAllWallets,
  createWallet,
  getWalletBalance,
  depositToWallet,
  withdrawFromWallet,
  transferBetweenWallets,
};
