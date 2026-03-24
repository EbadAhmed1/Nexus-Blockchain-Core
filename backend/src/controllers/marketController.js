/**
 * Market Controller
 * Handles market operations including trading pairs, price history, and token purchases
 * @module marketController
 */

const { pool } = require("../config/connectDB");
const asyncHandler = require("../utils/asyncHandler");
const { sendTransactionNotification } = require("../utils/emailService");

/**
 * Get all trading pairs
 * GET /api/market/trading-pairs
 * 
 * @returns {Object} List of trading pairs with market data
 */
const getTradingPairs = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      t.token_id,
      t.token_symbol,
      t.token_name,
      t.price_usd,
      t.change_24h,
      t.volume_24h,
      t.market_cap_usd,
      t.total_supply,
      COUNT(DISTINCT th.wallet_id) AS holders_count
    FROM tokens t
    LEFT JOIN token_holdings th ON t.token_id = th.token_id
    GROUP BY t.token_id, t.token_symbol, t.token_name, t.price_usd, t.change_24h, t.volume_24h, t.market_cap_usd, t.total_supply
    ORDER BY t.market_cap_usd DESC;
  `;

  const result = await pool.query(query);

  res.status(200).json({
    message: "Trading pairs retrieved",
    pairs: result.rows,
  });
});

/**
 * Get trading pair details by symbol
 * GET /api/market/pair/:symbol
 * 
 * @param {string} req.params.symbol - Token symbol
 * 
 * @returns {Object} Trading pair details
 */
const getPairDetails = asyncHandler(async (req, res) => {
  const { symbol } = req.params;

  const query = `
    SELECT 
      t.token_id,
      t.token_symbol,
      t.token_name,
      t.decimals,
      t.price_usd,
      t.change_24h,
      t.volume_24h,
      t.market_cap_usd,
      t.total_supply,
      COUNT(DISTINCT th.wallet_id) AS holders_count,
      COUNT(DISTINCT tx.transaction_id) AS transactions_24h
    FROM tokens t
    LEFT JOIN token_holdings th ON t.token_id = th.token_id
    LEFT JOIN transactions tx ON t.token_id = tx.token_id AND tx.timestamp > NOW() - INTERVAL '24 hours'
    WHERE t.token_symbol = $1
    GROUP BY t.token_id, t.token_symbol, t.token_name, t.decimals, t.price_usd, t.change_24h, t.volume_24h, t.market_cap_usd, t.total_supply;
  `;

  const result = await pool.query(query, [symbol]);

  if (!result.rows.length) {
    return res.status(404).json({ message: "Trading pair not found" });
  }

  res.status(200).json({
    message: "Trading pair details retrieved",
    pair: result.rows[0],
  });
});

/**
 * Get price history for charting
 * GET /api/market/price-history/:symbol
 * 
 * @param {string} req.params.symbol - Token symbol
 * @param {string} req.query.interval - Time interval (default: "1h")
 * @param {number} req.query.limit - Number of data points (default: 100)
 * 
 * @returns {Object} Price history data
 */
const getPriceHistory = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { interval = "1h", limit = 100 } = req.query;

  const token = await pool.query(
    "SELECT token_id, price_usd FROM tokens WHERE token_symbol = $1",
    [symbol]
  );

  if (!token.rows.length) {
    return res.status(404).json({ message: "Token not found" });
  }

  const basePrice = parseFloat(token.rows[0].price_usd);
  const history = [];
  const now = new Date();

  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setHours(timestamp.getHours() - i);

    const variation = (Math.random() - 0.5) * 0.1;
    const price = basePrice * (1 + variation);

    history.push({
      timestamp: timestamp.toISOString(),
      price: price.toFixed(8),
      volume: (Math.random() * 1000000).toFixed(2),
    });
  }

  res.status(200).json({
    message: "Price history retrieved",
    symbol,
    interval,
    history,
  });
});

/**
 * Get order book for a trading pair
 * GET /api/market/orderbook/:symbol
 * 
 * @param {string} req.params.symbol - Token symbol
 * 
 * @returns {Object} Order book with buy and sell orders
 */
const getOrderBook = asyncHandler(async (req, res) => {
  const { symbol } = req.params;

  const token = await pool.query(
    "SELECT token_id FROM tokens WHERE token_symbol = $1",
    [symbol]
  );

  if (!token.rows.length) {
    return res.status(404).json({ message: "Token not found" });
  }

  const tokenId = token.rows[0].token_id;

  const buyOrders = await pool.query(
    `SELECT 
      o.order_id,
      o.price,
      o.amount,
      o.total,
      u.username
    FROM p2p_orders o
    JOIN users u ON o.user_id = u.user_id
    WHERE o.token_id = $1 AND o.order_type = 'buy' AND o.status = 'active'
    ORDER BY o.price DESC
    LIMIT 20`,
    [tokenId]
  );

  const sellOrders = await pool.query(
    `SELECT 
      o.order_id,
      o.price,
      o.amount,
      o.total,
      u.username
    FROM p2p_orders o
    JOIN users u ON o.user_id = u.user_id
    WHERE o.token_id = $1 AND o.order_type = 'sell' AND o.status = 'active'
    ORDER BY o.price ASC
    LIMIT 20`,
    [tokenId]
  );

  res.status(200).json({
    message: "Order book retrieved",
    symbol,
    buys: buyOrders.rows,
    sells: sellOrders.rows,
  });
});

/**
 * Buy tokens using USDT
 * POST /api/market/buy
 * 
 * @param {Object} req.body - Request body
 * @param {number} req.body.userId - User ID
 * @param {number} req.body.tokenId - Token ID to purchase
 * @param {number} req.body.usdtAmount - Amount of USDT to spend
 * 
 * @returns {Object} Purchase result with details
 */
const buyWithUSDT = asyncHandler(async (req, res) => {
  const { userId, tokenId, usdtAmount } = req.body;

  if (!userId || !tokenId || !usdtAmount) {
    return res.status(400).json({ 
      success: false,
      message: "Missing required fields: userId, tokenId, usdtAmount" 
    });
  }

  if (parseFloat(usdtAmount) <= 0) {
    return res.status(400).json({ 
      success: false,
      message: "USDT amount must be greater than 0" 
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const usdtResult = await client.query(
      `SELECT token_id, token_symbol, price_usd FROM tokens WHERE token_symbol = 'USDT' LIMIT 1`
    );

    if (!usdtResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        message: "USDT token not found" 
      });
    }

    const usdtTokenId = usdtResult.rows[0].token_id;

    const targetTokenResult = await client.query(
      `SELECT token_id, token_symbol, token_name, price_usd, decimals 
       FROM tokens WHERE token_id = $1`,
      [tokenId]
    );

    if (!targetTokenResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        message: "Target token not found" 
      });
    }

    const targetToken = targetTokenResult.rows[0];
    const targetPrice = parseFloat(targetToken.price_usd);

    if (targetPrice <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        success: false,
        message: "Invalid token price" 
      });
    }

    const walletResult = await client.query(
      `SELECT wallet_id, address FROM wallets WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (!walletResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        message: "Wallet not found for user" 
      });
    }

    const walletId = walletResult.rows[0].wallet_id;
    const walletAddress = walletResult.rows[0].address;

    const usdtBalanceResult = await client.query(
      `SELECT amount FROM token_holdings 
       WHERE wallet_id = $1 AND token_id = $2`,
      [walletId, usdtTokenId]
    );

    const usdtBalance = usdtBalanceResult.rows.length 
      ? parseFloat(usdtBalanceResult.rows[0].amount) 
      : 0;

    const usdtAmountNum = parseFloat(usdtAmount);

    if (usdtBalance < usdtAmountNum) {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        success: false,
        message: `Insufficient USDT balance. Available: ${usdtBalance} USDT` 
      });
    }

    const tokensToReceive = usdtAmountNum / targetPrice;

    const feePercent = 0.003;
    const fee = tokensToReceive * feePercent;
    const finalTokensAmount = tokensToReceive - fee;

    const newUsdtBalance = usdtBalance - usdtAmountNum;
    
    if (newUsdtBalance <= 0) {
      await client.query(
        `DELETE FROM token_holdings WHERE wallet_id = $1 AND token_id = $2`,
        [walletId, usdtTokenId]
      );
    } else {
      await client.query(
        `UPDATE token_holdings SET amount = $1 WHERE wallet_id = $2 AND token_id = $3`,
        [newUsdtBalance.toFixed(8), walletId, usdtTokenId]
      );
    }

    const targetBalanceResult = await client.query(
      `SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2`,
      [walletId, tokenId]
    );

    if (targetBalanceResult.rows.length) {
      const currentTargetBalance = parseFloat(targetBalanceResult.rows[0].amount);
      const newTargetBalance = currentTargetBalance + finalTokensAmount;
      await client.query(
        `UPDATE token_holdings SET amount = $1 WHERE wallet_id = $2 AND token_id = $3`,
        [newTargetBalance.toFixed(8), walletId, tokenId]
      );
    } else {
      await client.query(
        `INSERT INTO token_holdings (wallet_id, token_id, amount) 
         VALUES ($1, $2, $3)`,
        [walletId, tokenId, finalTokensAmount.toFixed(8)]
      );
    }

    const txHash = `0x${require('crypto').randomBytes(32).toString('hex')}`;
    
    await client.query(
      `INSERT INTO transactions (
        tx_hash, from_wallet_id, to_wallet_id, token_id, amount, fee, 
        status, method, timestamp
      ) VALUES ($1, $2, $2, $3, $4, $5, 'confirmed', 'market_buy', NOW())`,
      [
        txHash,
        walletId,
        tokenId,
        finalTokensAmount.toFixed(8),
        fee.toFixed(8)
      ]
    );

    await client.query("COMMIT");

    const userResult = await client.query(
      `SELECT u.user_id, u.email, u.full_name, u.username
       FROM users u
       WHERE u.user_id = $1`,
      [userId]
    );

    if (userResult.rows.length && userResult.rows[0].email) {
      try {
        await sendTransactionNotification(
          userResult.rows[0].email,
          userResult.rows[0].full_name || userResult.rows[0].username,
          {
            txHash: txHash,
            fromAddress: walletAddress,
            toAddress: walletAddress,
            tokenSymbol: targetToken.token_symbol,
            amount: finalTokensAmount,
            fee: fee,
            status: "confirmed",
            timestamp: new Date(),
            method: "market_buy",
            isOutgoing: false,
            purchaseDetails: {
              usdtSpent: usdtAmountNum,
              tokensReceived: finalTokensAmount,
              price: targetPrice
            }
          }
        );
      } catch (emailError) {
        console.error("Failed to send market purchase notification email:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Purchase successful",
      purchase: {
        token: {
          token_id: targetToken.token_id,
          token_symbol: targetToken.token_symbol,
          token_name: targetToken.token_name
        },
        usdtSpent: usdtAmountNum,
        tokensReceived: finalTokensAmount,
        price: targetPrice,
        fee: fee,
        feePercent: feePercent * 100
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

module.exports = {
  getTradingPairs,
  getPairDetails,
  getPriceHistory,
  getOrderBook,
  buyWithUSDT,
};

