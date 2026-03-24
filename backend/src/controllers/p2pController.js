/**
 * P2P Controller
 * Handles peer-to-peer trading operations including order management and transaction processing
 * @module p2pController
 */

const { pool } = require("../config/connectDB");
const asyncHandler = require("../utils/asyncHandler");
const { sendP2PRequestNotification, sendP2PFulfillmentNotification } = require("../utils/emailService");
const crypto = require("crypto");

/**
 * Generate a random transaction hash
 * @returns {string} Transaction hash in format 0x[64 hex characters]
 */
const generateTxHash = () => `0x${crypto.randomBytes(32).toString("hex")}`;

const createOrder = asyncHandler(async (req, res) => {
  const { userId, tokenId, orderType, amount, price, paymentMethod, minLimit, maxLimit } = req.body;

  if (!userId || !tokenId || !orderType || !amount || !price) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!["buy", "sell"].includes(orderType)) {
    return res.status(400).json({ message: "Order type must be 'buy' or 'sell'" });
  }

  const total = amount * price;

  const result = await pool.query(
    `INSERT INTO p2p_orders (user_id, token_id, order_type, amount, price, total, payment_method, min_limit, max_limit, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
     RETURNING order_id, user_id, token_id, order_type, amount, price, total, payment_method, min_limit, max_limit, status, created_at`,
    [userId, tokenId, orderType, amount, price, total, paymentMethod || null, minLimit || null, maxLimit || null]
  );

  res.status(201).json({
    message: "P2P order created successfully",
    order: result.rows[0],
  });
});


const getOrders = asyncHandler(async (req, res) => {
  const { orderType, tokenId, status, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT 
      order_id,
      user_id,
      username,
      email,
      token_symbol,
      token_name,
      order_type,
      amount,
      price,
      total,
      payment_method,
      min_limit,
      max_limit,
      status,
      created_at,
      updated_at,
      completed_at,
      transaction_count
    FROM p2p_order_summary
    WHERE 1=1
  `;

  const params = [];
  let paramCount = 1;

  if (orderType) {
    query += ` AND order_type = $${paramCount++}`;
    params.push(orderType);
  }

  if (tokenId) {
    query += ` AND token_id = $${paramCount++}`;
    params.push(tokenId);
  }

  if (status) {
    query += ` AND status = $${paramCount++}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(Number(limit), Number(offset));

  const result = await pool.query(query, params);

  res.status(200).json({
    message: "P2P orders retrieved",
    orders: result.rows,
    pagination: {
      limit: Number(limit),
      offset: Number(offset),
      total: result.rows.length,
    },
  });
});


const getOrderDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT 
      order_id,
      user_id,
      username,
      email,
      token_symbol,
      token_name,
      order_type,
      amount,
      price,
      total,
      payment_method,
      min_limit,
      max_limit,
      status,
      created_at,
      updated_at,
      completed_at,
      transaction_count
     FROM p2p_order_summary
     WHERE order_id = $1`,
    [id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.status(200).json({
    message: "Order details retrieved",
    order: result.rows[0],
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const order = await pool.query(
    `SELECT order_id, user_id, status FROM p2p_orders WHERE order_id = $1`,
    [id]
  );

  if (!order.rows.length) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.rows[0].user_id !== parseInt(userId)) {
    return res.status(403).json({ message: "Not authorized to cancel this order" });
  }

  if (order.rows[0].status !== "active") {
    return res.status(400).json({ message: "Order cannot be cancelled" });
  }

  await pool.query(
    `UPDATE p2p_orders SET status = 'cancelled', updated_at = NOW() WHERE order_id = $1`,
    [id]
  );

  res.status(200).json({
    message: "Order cancelled successfully",
  });
});

const getUsersWithTokens = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      u.user_id,
      u.username,
      u.full_name,
      u.email,
      u.email_verified,
      u.status AS user_status,
      w.wallet_id,
      w.address AS wallet_address,
      tok.token_id,
      tok.token_symbol,
      tok.token_name,
      tok.decimals,
      th.amount AS available_amount,
      COALESCE(po.price, tok.price_usd, 0) AS selling_price,
      po.order_id,
      po.payment_method,
      po.min_limit,
      po.max_limit
    FROM users u
    JOIN wallets w ON w.user_id = u.user_id
    JOIN token_holdings th ON th.wallet_id = w.wallet_id
    JOIN tokens tok ON th.token_id = tok.token_id
    LEFT JOIN p2p_orders po ON po.user_id = u.user_id 
      AND po.token_id = tok.token_id 
      AND po.order_type = 'sell' 
      AND po.status = 'active'
    WHERE u.status = 'active' AND th.amount > 0
    ORDER BY u.user_id, tok.token_symbol;
  `;

  const result = await pool.query(query);

  const usersMap = new Map();
  result.rows.forEach((row) => {
    if (!usersMap.has(row.user_id)) {
      usersMap.set(row.user_id, {
        user_id: row.user_id,
        username: row.username,
        full_name: row.full_name,
        email: row.email,
        email_verified: row.email_verified,
        user_status: row.user_status,
        wallet_address: row.wallet_address,
        tokens: [],
      });
    }

    const user = usersMap.get(row.user_id);
    user.tokens.push({
      token_id: row.token_id,
      token_symbol: row.token_symbol,
      token_name: row.token_name,
      decimals: row.decimals,
      available_amount: parseFloat(row.available_amount),
      selling_price: parseFloat(row.selling_price),
      order_id: row.order_id,
      payment_method: row.payment_method,
      min_limit: row.min_limit ? parseFloat(row.min_limit) : null,
      max_limit: row.max_limit ? parseFloat(row.max_limit) : null,
    });
  });

  const users = Array.from(usersMap.values());

  res.status(200).json({
    message: "Users with tokens retrieved",
    users,
  });
});

const createP2PTransaction = asyncHandler(async (req, res) => {
  const { buyerId, sellerId, tokenId, amount, price } = req.body;

  if (!buyerId || !sellerId || !tokenId || !amount || !price) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (buyerId === sellerId) {
    return res.status(400).json({ message: "Cannot create transaction with yourself" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sellerBalance = await client.query(
      `SELECT th.amount, w.wallet_id 
       FROM token_holdings th
       JOIN wallets w ON th.wallet_id = w.wallet_id
       WHERE w.user_id = $1 AND th.token_id = $2`,
      [sellerId, tokenId]
    );

    if (!sellerBalance.rows.length || parseFloat(sellerBalance.rows[0].amount) < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Seller does not have sufficient balance" });
    }

    const total = amount * price;

    const txResult = await client.query(
      `INSERT INTO p2p_transactions (buyer_id, seller_id, token_id, amount, price, total, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING p2p_tx_id, buyer_id, seller_id, token_id, amount, price, total, status, created_at`,
      [buyerId, sellerId, tokenId, amount, price, total]
    );

    await client.query("COMMIT");

    const buyerUser = await client.query(
      `SELECT user_id, email, full_name, username FROM users WHERE user_id = $1`,
      [buyerId]
    );
    
    const sellerUser = await client.query(
      `SELECT user_id, email, full_name, username FROM users WHERE user_id = $1`,
      [sellerId]
    );

    const tokenInfo = await client.query(
      `SELECT token_symbol FROM tokens WHERE token_id = $1`,
      [tokenId]
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const notificationToken = `p2p_${txResult.rows[0].p2p_tx_id}_${Date.now()}`;

    if (sellerUser.rows.length && sellerUser.rows[0].email) {
      await pool.query(
        `INSERT INTO email_verifications (user_id, email, token, type, related_id, expires_at)
         VALUES ($1, $2, $3, 'p2p_request', $4, $5)`,
        [sellerId, sellerUser.rows[0].email, notificationToken, txResult.rows[0].p2p_tx_id, expiresAt]
      );
    }

    const p2pRequestData = {
      p2pTxId: txResult.rows[0].p2p_tx_id,
      buyerName: buyerUser.rows[0]?.username || `User ${buyerId}`,
      sellerName: sellerUser.rows[0]?.username || `User ${sellerId}`,
      tokenSymbol: tokenInfo.rows[0]?.token_symbol || "TOKEN",
      amount: amount,
      price: price,
      total: total
    };

    if (sellerUser.rows.length && sellerUser.rows[0].email) {
      try {
        await sendP2PRequestNotification(
          sellerUser.rows[0].email,
          sellerUser.rows[0].full_name || sellerUser.rows[0].username,
          {
            ...p2pRequestData,
            isSeller: true
          }
        );
      } catch (emailError) {
        console.error("Failed to send P2P request notification to seller:", emailError);
      }
    }

    if (buyerUser.rows.length && buyerUser.rows[0].email) {
      try {
        await sendP2PRequestNotification(
          buyerUser.rows[0].email,
          buyerUser.rows[0].full_name || buyerUser.rows[0].username,
          {
            ...p2pRequestData,
            isSeller: false
          }
        );
      } catch (emailError) {
        console.error("Failed to send P2P request notification to buyer:", emailError);
      }
    }

    res.status(201).json({
      message: "Transaction request created. Waiting for seller acceptance.",
      transaction: txResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

const getP2PTransactions = asyncHandler(async (req, res) => {
  const { userId, status, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT 
      t.p2p_tx_id,
      t.order_id,
      t.buyer_id,
      buyer.username AS buyer_username,
      t.seller_id,
      seller.username AS seller_username,
      tok.token_symbol,
      tok.token_name,
      t.amount,
      t.price,
      t.total,
      t.status,
      t.payment_proof,
      t.created_at,
      t.updated_at
    FROM p2p_transactions t
    JOIN users buyer ON t.buyer_id = buyer.user_id
    JOIN users seller ON t.seller_id = seller.user_id
    JOIN tokens tok ON t.token_id = tok.token_id
    WHERE 1=1
  `;

  const params = [];
  let paramCount = 1;

  if (userId) {
    query += ` AND (t.buyer_id = $${paramCount} OR t.seller_id = $${paramCount})`;
    params.push(userId);
    paramCount++;
  }

  if (status) {
    query += ` AND t.status = $${paramCount++}`;
    params.push(status);
  }

  query += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(Number(limit), Number(offset));

  const result = await pool.query(query, params);

  res.status(200).json({
    message: "P2P transactions retrieved",
    transactions: result.rows,
  });
});

const acceptTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tx = await client.query(
      `SELECT p2p_tx_id, buyer_id, seller_id, token_id, amount, price, total, status 
       FROM p2p_transactions WHERE p2p_tx_id = $1`,
      [id]
    );

    if (!tx.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Transaction not found" });
    }

    const txData = tx.rows[0];

    if (parseInt(txData.seller_id) !== parseInt(userId)) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Only the seller can accept this transaction" });
    }

    if (txData.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Transaction is not pending" });
    }

    const sellerBalance = await client.query(
      `SELECT th.amount, w.wallet_id 
       FROM token_holdings th
       JOIN wallets w ON th.wallet_id = w.wallet_id
       WHERE w.user_id = $1 AND th.token_id = $2`,
      [txData.seller_id, txData.token_id]
    );

    if (!sellerBalance.rows.length || parseFloat(sellerBalance.rows[0].amount) < parseFloat(txData.amount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient balance" });
    }

    await client.query(
      `UPDATE p2p_transactions SET status = 'paid', updated_at = NOW() WHERE p2p_tx_id = $1`,
      [id]
    );

    await client.query(
      `UPDATE email_verifications SET verified = true WHERE type = 'p2p_request' AND related_id = $1`,
      [id]
    );

    await client.query("COMMIT");

    const buyerUser = await client.query(
      `SELECT user_id, email, full_name, username FROM users WHERE user_id = $1`,
      [txData.buyer_id]
    );
    
    const sellerUser = await client.query(
      `SELECT user_id, email, full_name, username FROM users WHERE user_id = $1`,
      [txData.seller_id]
    );

    const tokenInfo = await client.query(
      `SELECT token_symbol FROM tokens WHERE token_id = $1`,
      [txData.token_id]
    );

    const fulfillmentData = {
      p2pTxId: id,
      buyerName: buyerUser.rows[0]?.username || `User ${txData.buyer_id}`,
      sellerName: sellerUser.rows[0]?.username || `User ${txData.seller_id}`,
      tokenSymbol: tokenInfo.rows[0]?.token_symbol || "TOKEN",
      amount: txData.amount,
      price: txData.price,
      total: txData.total,
      status: "completed"
    };

    if (buyerUser.rows.length && buyerUser.rows[0].email) {
      try {
        await sendP2PFulfillmentNotification(
          buyerUser.rows[0].email,
          buyerUser.rows[0].full_name || buyerUser.rows[0].username,
          {
            ...fulfillmentData,
            isSeller: false
          }
        );
      } catch (emailError) {
        console.error("Failed to send P2P fulfillment notification to buyer:", emailError);
      }
    }

    if (sellerUser.rows.length && sellerUser.rows[0].email) {
      try {
        await sendP2PFulfillmentNotification(
          sellerUser.rows[0].email,
          sellerUser.rows[0].full_name || sellerUser.rows[0].username,
          {
            ...fulfillmentData,
            isSeller: true
          }
        );
      } catch (emailError) {
        console.error("Failed to send P2P fulfillment notification to seller:", emailError);
      }
    }

    res.status(200).json({
      message: "Transaction accepted. Please transfer tokens to complete the transaction.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

const rejectTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tx = await client.query(
      `SELECT seller_id, status FROM p2p_transactions WHERE p2p_tx_id = $1`,
      [id]
    );

    if (!tx.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (parseInt(tx.rows[0].seller_id) !== parseInt(userId)) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Only the seller can reject this transaction" });
    }

    if (tx.rows[0].status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Transaction is not pending" });
    }

    await client.query(
      `UPDATE p2p_transactions SET status = 'cancelled', updated_at = NOW() WHERE p2p_tx_id = $1`,
      [id]
    );

    await client.query(
      `UPDATE email_verifications SET verified = true WHERE type = 'p2p_request' AND related_id = $1`,
      [id]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Transaction rejected",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

const transferTokens = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tx = await client.query(
      `SELECT p2p_tx_id, buyer_id, seller_id, token_id, amount, price, total, status 
       FROM p2p_transactions WHERE p2p_tx_id = $1`,
      [id]
    );

    if (!tx.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Transaction not found" });
    }

    const txData = tx.rows[0];

    if (parseInt(txData.seller_id) !== parseInt(userId)) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Only the seller can transfer tokens" });
    }

    if (txData.status !== "paid") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Transaction must be accepted (paid) before transferring tokens" });
    }

    const sellerBalance = await client.query(
      `SELECT th.amount, w.wallet_id 
       FROM token_holdings th
       JOIN wallets w ON th.wallet_id = w.wallet_id
       WHERE w.user_id = $1 AND th.token_id = $2`,
      [txData.seller_id, txData.token_id]
    );

    if (!sellerBalance.rows.length || parseFloat(sellerBalance.rows[0].amount) < parseFloat(txData.amount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const buyerWallet = await client.query(
      `SELECT wallet_id FROM wallets WHERE user_id = $1 LIMIT 1`,
      [txData.buyer_id]
    );

    const sellerWallet = await client.query(
      `SELECT wallet_id FROM wallets WHERE user_id = $1 LIMIT 1`,
      [txData.seller_id]
    );

    if (!buyerWallet.rows.length || !sellerWallet.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Wallets not found" });
    }

    await client.query(
      `UPDATE token_holdings SET amount = amount - $1 WHERE wallet_id = $2 AND token_id = $3`,
      [txData.amount, sellerWallet.rows[0].wallet_id, txData.token_id]
    );

    const buyerBalance = await client.query(
      `SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2`,
      [buyerWallet.rows[0].wallet_id, txData.token_id]
    );

    if (buyerBalance.rows.length) {
      await client.query(
        `UPDATE token_holdings SET amount = amount + $1 WHERE wallet_id = $2 AND token_id = $3`,
        [txData.amount, buyerWallet.rows[0].wallet_id, txData.token_id]
      );
    } else {
      await client.query(
        `INSERT INTO token_holdings (wallet_id, token_id, amount) VALUES ($1, $2, $3)`,
        [buyerWallet.rows[0].wallet_id, txData.token_id, txData.amount]
      );
    }

    const txHash = generateTxHash();
    const latestBlock = await client.query(
      "SELECT block_id FROM blocks ORDER BY timestamp DESC LIMIT 1"
    );
    const blockId = latestBlock.rows.length ? latestBlock.rows[0].block_id : null;

    await client.query(
      `INSERT INTO transactions (tx_hash, from_wallet_id, to_wallet_id, token_id, block_id, amount, fee, method, status, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'p2p', 'confirmed', NOW())`,
      [
        txHash,
        sellerWallet.rows[0].wallet_id,
        buyerWallet.rows[0].wallet_id,
        txData.token_id,
        blockId,
        txData.amount,
        txData.amount * 0.001,
      ]
    );

    await client.query(
      `UPDATE p2p_transactions SET status = 'completed', updated_at = NOW(), email_notified = true WHERE p2p_tx_id = $1`,
      [id]
    );

    await client.query("COMMIT");

    const buyerUser = await pool.query(
      `SELECT user_id, email, full_name, username FROM users WHERE user_id = $1`,
      [txData.buyer_id]
    );
    
    const sellerUser = await pool.query(
      `SELECT user_id, email, full_name, username FROM users WHERE user_id = $1`,
      [txData.seller_id]
    );

    const tokenInfo = await pool.query(
      `SELECT token_symbol FROM tokens WHERE token_id = $1`,
      [txData.token_id]
    );

    const fulfillmentData = {
      p2pTxId: id,
      buyerName: buyerUser.rows[0]?.username || `User ${txData.buyer_id}`,
      sellerName: sellerUser.rows[0]?.username || `User ${txData.seller_id}`,
      tokenSymbol: tokenInfo.rows[0]?.token_symbol || "TOKEN",
      amount: txData.amount,
      price: txData.price,
      total: txData.total,
      status: "completed"
    };

    if (buyerUser.rows.length && buyerUser.rows[0].email) {
      try {
        await sendP2PFulfillmentNotification(
          buyerUser.rows[0].email,
          buyerUser.rows[0].full_name || buyerUser.rows[0].username,
          {
            ...fulfillmentData,
            isSeller: false
          }
        );
      } catch (emailError) {
        console.error("Failed to send P2P completion notification to buyer:", emailError);
      }
    }

    if (sellerUser.rows.length && sellerUser.rows[0].email) {
      try {
        await sendP2PFulfillmentNotification(
          sellerUser.rows[0].email,
          sellerUser.rows[0].full_name || sellerUser.rows[0].username,
          {
            ...fulfillmentData,
            isSeller: true
          }
        );
      } catch (emailError) {
        console.error("Failed to send P2P completion notification to seller:", emailError);
      }
    }

    res.status(200).json({
      message: "Tokens transferred successfully. Transaction completed.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

const updateTransactionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, paymentProof, userId } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  const validStatuses = ["pending", "paid", "completed", "disputed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const tx = await pool.query(
    `SELECT buyer_id, seller_id, status FROM p2p_transactions WHERE p2p_tx_id = $1`,
    [id]
  );

  if (!tx.rows.length) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  if (tx.rows[0].buyer_id !== parseInt(userId) && tx.rows[0].seller_id !== parseInt(userId)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const updates = [`status = $1`, `updated_at = NOW()`];
  const values = [status];
  let paramCount = 2;

  if (paymentProof) {
    updates.push(`payment_proof = $${paramCount++}`);
    values.push(paymentProof);
  }

  if (status === "completed") {
    updates.push(`email_notified = true`);
  }

  values.push(id);

  await pool.query(
    `UPDATE p2p_transactions SET ${updates.join(", ")} WHERE p2p_tx_id = $${paramCount}`,
    values
  );

  if (status === "completed") {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const completedTx = await client.query(
        `SELECT buyer_id, seller_id, token_id, amount, price, total FROM p2p_transactions WHERE p2p_tx_id = $1`,
        [id]
      );

      if (!completedTx.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Transaction not found" });
      }

      const txData = completedTx.rows[0];

      const buyerWallet = await client.query(
        `SELECT wallet_id FROM wallets WHERE user_id = $1 LIMIT 1`,
        [txData.buyer_id]
      );

      const sellerWallet = await client.query(
        `SELECT wallet_id FROM wallets WHERE user_id = $1 LIMIT 1`,
        [txData.seller_id]
      );

      if (!buyerWallet.rows.length || !sellerWallet.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Wallets not found" });
      }

      const sellerBalance = await client.query(
        `SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2`,
        [sellerWallet.rows[0].wallet_id, txData.token_id]
      );

      if (!sellerBalance.rows.length || parseFloat(sellerBalance.rows[0].amount) < parseFloat(txData.amount)) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Insufficient seller balance" });
      }

      await client.query(
        `UPDATE token_holdings SET amount = amount - $1 WHERE wallet_id = $2 AND token_id = $3`,
        [txData.amount, sellerWallet.rows[0].wallet_id, txData.token_id]
      );

      const buyerBalance = await client.query(
        `SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2`,
        [buyerWallet.rows[0].wallet_id, txData.token_id]
      );

      if (buyerBalance.rows.length) {
        await client.query(
          `UPDATE token_holdings SET amount = amount + $1 WHERE wallet_id = $2 AND token_id = $3`,
          [txData.amount, buyerWallet.rows[0].wallet_id, txData.token_id]
        );
      } else {
        await client.query(
          `INSERT INTO token_holdings (wallet_id, token_id, amount) VALUES ($1, $2, $3)`,
          [buyerWallet.rows[0].wallet_id, txData.token_id, txData.amount]
        );
      }

      const txHash = generateTxHash();
      const latestBlock = await client.query(
        "SELECT block_id FROM blocks ORDER BY timestamp DESC LIMIT 1"
      );
      const blockId = latestBlock.rows.length ? latestBlock.rows[0].block_id : null;

      await client.query(
        `INSERT INTO transactions (tx_hash, from_wallet_id, to_wallet_id, token_id, block_id, amount, fee, method, status, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'p2p', 'confirmed', NOW())`,
        [
          txHash,
          sellerWallet.rows[0].wallet_id,
          buyerWallet.rows[0].wallet_id,
          txData.token_id,
          blockId,
          txData.amount,
          txData.amount * 0.001,
        ]
      );

      await client.query("COMMIT");

      await pool.query(
        `UPDATE email_verifications SET verified = true WHERE type = 'p2p_request' AND related_id = $1`,
        [id]
      );

      if (status === "completed") {
        const buyerUser = await pool.query(
          `SELECT user_id, email, full_name, username FROM users WHERE user_id = $1`,
          [txData.buyer_id]
        );
        
        const sellerUser = await client.query(
          `SELECT user_id, email, full_name, username FROM users WHERE user_id = $1`,
          [txData.seller_id]
        );

        const tokenInfo = await client.query(
          `SELECT token_symbol FROM tokens WHERE token_id = $1`,
          [txData.token_id]
        );

        const fulfillmentData = {
          p2pTxId: id,
          buyerName: buyerUser.rows[0]?.username || `User ${txData.buyer_id}`,
          sellerName: sellerUser.rows[0]?.username || `User ${txData.seller_id}`,
          tokenSymbol: tokenInfo.rows[0]?.token_symbol || "TOKEN",
          amount: txData.amount,
          price: txData.price || 0,
          total: txData.total || 0,
          status: "completed"
        };

        if (buyerUser.rows.length && buyerUser.rows[0].email) {
          try {
            await sendP2PFulfillmentNotification(
              buyerUser.rows[0].email,
              buyerUser.rows[0].full_name || buyerUser.rows[0].username,
              {
                ...fulfillmentData,
                isSeller: false
              }
            );
          } catch (emailError) {
            console.error("Failed to send P2P completion notification to buyer:", emailError);
          }
        }

        if (sellerUser.rows.length && sellerUser.rows[0].email) {
          try {
            await sendP2PFulfillmentNotification(
              sellerUser.rows[0].email,
              sellerUser.rows[0].full_name || sellerUser.rows[0].username,
              {
                ...fulfillmentData,
                isSeller: true
              }
            );
          } catch (emailError) {
            console.error("Failed to send P2P completion notification to seller:", emailError);
          }
        }
      }
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  res.status(200).json({
    message: "Transaction status updated successfully",
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderDetails,
  cancelOrder,
  getUsersWithTokens,
  createP2PTransaction,
  getP2PTransactions,
  acceptTransaction,
  rejectTransaction,
  transferTokens,
  updateTransactionStatus,
};

