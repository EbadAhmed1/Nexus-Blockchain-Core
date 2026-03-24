/**
 * Conversion Controller
 * Handles token conversion (swap) operations
 * @module conversionController
 */

const { pool } = require("../config/connectDB");
const asyncHandler = require("../utils/asyncHandler");
const { sendTransactionNotification } = require("../utils/emailService");

/**
 * Swap tokens - Convert one token to another
 * POST /api/conversion/swap
 * 
 * @param {Object} req.body - Request body
 * @param {number} req.body.userId - User ID
 * @param {number} req.body.fromTokenId - Source token ID
 * @param {number} req.body.toTokenId - Target token ID
 * @param {number} req.body.amount - Amount to convert
 * 
 * @returns {Object} Conversion result with details
 */
const swapTokens = asyncHandler(async (req, res) => {
  const { userId, fromTokenId, toTokenId, amount } = req.body;

  if (!userId || !fromTokenId || !toTokenId || !amount) {
    return res.status(400).json({ 
      success: false,
      message: "Missing required fields: userId, fromTokenId, toTokenId, amount" 
    });
  }

  if (fromTokenId === toTokenId) {
    return res.status(400).json({ 
      success: false,
      message: "Cannot convert token to itself" 
    });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ 
      success: false,
      message: "Amount must be greater than 0" 
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const walletResult = await client.query(
      `SELECT wallet_id FROM wallets WHERE user_id = $1 LIMIT 1`,
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

    const tokensResult = await client.query(
      `SELECT token_id, token_symbol, token_name, price_usd, decimals 
       FROM tokens 
       WHERE token_id IN ($1, $2)`,
      [fromTokenId, toTokenId]
    );

    if (tokensResult.rows.length !== 2) {
      await client.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        message: "One or both tokens not found" 
      });
    }

    const fromToken = tokensResult.rows.find(t => t.token_id === parseInt(fromTokenId));
    const toToken = tokensResult.rows.find(t => t.token_id === parseInt(toTokenId));

    const balanceResult = await client.query(
      `SELECT amount FROM token_holdings 
       WHERE wallet_id = $1 AND token_id = $2`,
      [walletId, fromTokenId]
    );

    const currentBalance = balanceResult.rows.length 
      ? parseFloat(balanceResult.rows[0].amount) 
      : 0;

    if (currentBalance < parseFloat(amount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        success: false,
        message: `Insufficient balance. Available: ${currentBalance} ${fromToken.token_symbol}` 
      });
    }

    const fromPrice = parseFloat(fromToken.price_usd);
    const toPrice = parseFloat(toToken.price_usd);

    if (fromPrice <= 0 || toPrice <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        success: false,
        message: "Invalid token prices" 
      });
    }

    const usdValue = parseFloat(amount) * fromPrice;
    const outputAmount = usdValue / toPrice;

    const feePercent = 0.003;
    const fee = outputAmount * feePercent;
    const finalOutputAmount = outputAmount - fee;

    const newFromBalance = currentBalance - parseFloat(amount);
    
    if (newFromBalance <= 0) {

      await client.query(
        `DELETE FROM token_holdings WHERE wallet_id = $1 AND token_id = $2`,
        [walletId, fromTokenId]
      );
    } else {

      await client.query(
        `UPDATE token_holdings SET amount = $1 WHERE wallet_id = $2 AND token_id = $3`,
        [newFromBalance.toFixed(8), walletId, fromTokenId]
      );
    }

    const toBalanceResult = await client.query(
      `SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2`,
      [walletId, toTokenId]
    );

    if (toBalanceResult.rows.length) {
      const currentToBalance = parseFloat(toBalanceResult.rows[0].amount);
      const newToBalance = currentToBalance + finalOutputAmount;
      await client.query(
        `UPDATE token_holdings SET amount = $1 WHERE wallet_id = $2 AND token_id = $3`,
        [newToBalance.toFixed(8), walletId, toTokenId]
      );
    } else {

      await client.query(
        `INSERT INTO token_holdings (wallet_id, token_id, amount) 
         VALUES ($1, $2, $3)`,
        [walletId, toTokenId, finalOutputAmount.toFixed(8)]
      );
    }

    const txHashOut = `0x${require('crypto').randomBytes(32).toString('hex')}`;
    const txHashIn = `0x${require('crypto').randomBytes(32).toString('hex')}`;

    await client.query(
      `INSERT INTO transactions (
        tx_hash, from_wallet_id, to_wallet_id, token_id, amount, fee, 
        status, method, timestamp
      ) VALUES ($1, $2, $2, $3, $4, $5, 'confirmed', 'swap_out', NOW())`,
      [
        txHashOut,
        walletId,
        fromTokenId,
        (-parseFloat(amount)).toFixed(8),
        fee.toFixed(8)
      ]
    );

    await client.query(
      `INSERT INTO transactions (
        tx_hash, from_wallet_id, to_wallet_id, token_id, amount, fee, 
        status, method, timestamp
      ) VALUES ($1, $2, $2, $3, $4, $5, 'confirmed', 'swap_in', NOW())`,
      [
        txHashIn,
        walletId,
        toTokenId,
        finalOutputAmount.toFixed(8),
        0
      ]
    );

    await client.query("COMMIT");

    const userResult = await client.query(
      `SELECT u.user_id, u.email, u.full_name, u.username, w.address
       FROM users u
       JOIN wallets w ON u.user_id = w.user_id
       WHERE w.wallet_id = $1`,
      [walletId]
    );

    if (userResult.rows.length && userResult.rows[0].email) {
      try {
        await sendTransactionNotification(
          userResult.rows[0].email,
          userResult.rows[0].full_name || userResult.rows[0].username,
          {
            txHash: txHashIn,
            fromAddress: userResult.rows[0].address,
            toAddress: userResult.rows[0].address,
            tokenSymbol: toToken.token_symbol,
            amount: finalOutputAmount,
            fee: fee,
            status: "confirmed",
            timestamp: new Date(),
            method: "swap",
            isOutgoing: false,
            conversionDetails: {
              fromToken: fromToken.token_symbol,
              fromAmount: parseFloat(amount),
              toToken: toToken.token_symbol,
              toAmount: finalOutputAmount,
              rate: fromPrice / toPrice
            }
          }
        );
      } catch (emailError) {
        console.error("Failed to send conversion notification email:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Token conversion successful",
      conversion: {
        fromToken: {
          token_id: fromToken.token_id,
          token_symbol: fromToken.token_symbol,
          amount: parseFloat(amount)
        },
        toToken: {
          token_id: toToken.token_id,
          token_symbol: toToken.token_symbol,
          amount: finalOutputAmount
        },
        rate: fromPrice / toPrice,
        fee: fee,
        feePercent: feePercent * 100,
        usdValue: usdValue
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

/**
 * Get conversion rate between two tokens
 * GET /api/conversion/rate
 * 
 * @param {string} req.query.fromTokenId - Source token ID
 * @param {string} req.query.toTokenId - Target token ID
 * @param {string} req.query.amount - Optional amount (default: 1)
 * 
 * @returns {Object} Conversion rate details
 */
const getConversionRate = asyncHandler(async (req, res) => {
  const { fromTokenId, toTokenId, amount = 1 } = req.query;

  if (!fromTokenId || !toTokenId) {
    return res.status(400).json({ 
      success: false,
      message: "Missing required fields: fromTokenId, toTokenId" 
    });
  }

  const tokensResult = await pool.query(
    `SELECT token_id, token_symbol, token_name, price_usd, decimals 
     FROM tokens 
     WHERE token_id IN ($1, $2)`,
    [fromTokenId, toTokenId]
  );

  if (tokensResult.rows.length !== 2) {
    return res.status(404).json({ 
      success: false,
      message: "One or both tokens not found" 
    });
  }

  const fromToken = tokensResult.rows.find(t => t.token_id === parseInt(fromTokenId));
  const toToken = tokensResult.rows.find(t => t.token_id === parseInt(toTokenId));

  const fromPrice = parseFloat(fromToken.price_usd);
  const toPrice = parseFloat(toToken.price_usd);

  if (fromPrice <= 0 || toPrice <= 0) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid token prices" 
    });
  }

  const inputAmount = parseFloat(amount);
  const usdValue = inputAmount * fromPrice;
  const outputAmount = usdValue / toPrice;

  const feePercent = 0.003;
  const fee = outputAmount * feePercent;
  const finalOutputAmount = outputAmount - fee;

  res.status(200).json({
    success: true,
    message: "Conversion rate retrieved",
    rate: {
      fromToken: {
        token_id: fromToken.token_id,
        token_symbol: fromToken.token_symbol,
        token_name: fromToken.token_name
      },
      toToken: {
        token_id: toToken.token_id,
        token_symbol: toToken.token_symbol,
        token_name: toToken.token_name
      },
      exchangeRate: fromPrice / toPrice,
      inputAmount: inputAmount,
      outputAmount: finalOutputAmount,
      fee: fee,
      feePercent: feePercent * 100,
      usdValue: usdValue
    }
  });
});

module.exports = {
  swapTokens,
  getConversionRate,
};

