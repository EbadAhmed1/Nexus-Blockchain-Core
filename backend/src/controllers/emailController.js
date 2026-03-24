
const { pool } = require("../config/connectDB");
const asyncHandler = require("../utils/asyncHandler");

const getNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const query = `
    SELECT 
      ev.verification_id,
      ev.type,
      ev.related_id,
      ev.verified,
      ev.created_at,
      t.tx_hash,
      t.amount,
      tok.token_symbol,
      pt.p2p_tx_id,
      pt.buyer_id,
      pt.seller_id,
      pt.status as p2p_status,
      buyer.username as buyer_username,
      seller.username as seller_username,
      pt.amount as p2p_amount,
      pt.price as p2p_price,
      pt.total as p2p_total
    FROM email_verifications ev
    LEFT JOIN transactions t ON ev.type = 'transaction' AND ev.related_id = t.transaction_id
    LEFT JOIN tokens tok ON t.token_id = tok.token_id
    LEFT JOIN p2p_transactions pt ON ev.type = 'p2p_request' AND ev.related_id = pt.p2p_tx_id
    LEFT JOIN users buyer ON pt.buyer_id = buyer.user_id
    LEFT JOIN users seller ON pt.seller_id = seller.user_id
    WHERE ev.user_id = $1 AND ev.verified = false
    ORDER BY ev.created_at DESC
    LIMIT 50;
  `;

  const result = await pool.query(query, [userId]);

  res.status(200).json({
    message: "Email notifications retrieved",
    notifications: result.rows,
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const { verificationId } = req.body;

  if (!verificationId) {
    return res.status(400).json({ message: "verificationId is required" });
  }

  await pool.query(
    `UPDATE email_verifications SET verified = true WHERE verification_id = $1`,
    [verificationId]
  );

  res.status(200).json({
    message: "Notification marked as read",
  });
});

module.exports = {
  getNotifications,
  markAsRead,
};

