const { pool } = require("../config/connectDB");
const asyncHandler = require("../utils/asyncHandler");
const { sendVerificationEmail, sendDeleteAccountCode } = require("../utils/emailService");
const crypto = require("crypto");

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, phone } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Missing required fields: username, email, password" });
  }

  const existing = await pool.query(
    "SELECT user_id FROM users WHERE email = $1 OR username = $2",
    [email, username]
  );

  if (existing.rows.length) {
    return res.status(409).json({ message: "User with this email or username already exists" });
  }

  // Store password hash (in production, use bcrypt)
  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, full_name, phone, email_verified, status)
     VALUES ($1, $2, $3, $4, $5, false, 'active')
     RETURNING user_id, username, email, full_name, phone, email_verified, status, created_at`,
    [username, email, passwordHash, fullName || null, phone || null]
  );

  const user = result.rows[0];

  // Send verification email
  const verificationCode = generateCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await pool.query(
    `INSERT INTO email_verifications (user_id, email, token, type, expires_at)
     VALUES ($1, $2, $3, 'signup', $4)`,
    [user.user_id, email, verificationCode, expiresAt]
  );

  try {
    await sendVerificationEmail(email, verificationCode, fullName || username);
  } catch (emailErr) {
    console.error("Verification email failed:", emailErr.message);
  }

  res.status(201).json({
    message: "User registered successfully. Please verify your email.",
    user,
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing required fields: email, password" });
  }

  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

  const result = await pool.query(
    `SELECT user_id, username, email, full_name, phone, email_verified, status, created_at
     FROM users WHERE email = $1 AND password_hash = $2`,
    [email, passwordHash]
  );

  if (!result.rows.length) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const user = result.rows[0];

  if (user.status !== "active") {
    return res.status(403).json({ message: "Account is not active" });
  }

  res.status(200).json({
    message: "Login successful",
    user,
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;

  const query = `
    SELECT 
      u.user_id,
      u.username,
      u.email,
      u.full_name,
      u.email_verified,
      u.status,
      u.created_at,
      COUNT(DISTINCT w.wallet_id) AS wallet_count
    FROM users u
    LEFT JOIN wallets w ON w.user_id = u.user_id
    GROUP BY u.user_id, u.username, u.email, u.full_name, u.email_verified, u.status, u.created_at
    ORDER BY u.created_at DESC
    LIMIT $1 OFFSET $2;
  `;

  const result = await pool.query(query, [limit, offset]);

  res.status(200).json({
    message: "Users retrieved",
    users: result.rows,
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT user_id, username, email, full_name, phone, email_verified, status, created_at, updated_at
     FROM users WHERE user_id = $1`,
    [id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: "User not found" });
  }

  // Get user stats
  const stats = await pool.query(
    `SELECT * FROM get_user_statistics($1)`,
    [id]
  );

  res.status(200).json({
    message: "User profile retrieved",
    user: result.rows[0],
    statistics: stats.rows[0] || null,
  });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phone } = req.body;

  const result = await pool.query(
    `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), updated_at = NOW()
     WHERE user_id = $3
     RETURNING user_id, username, email, full_name, phone, email_verified, status, updated_at`,
    [fullName || null, phone || null, id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({
    message: "Profile updated successfully",
    user: result.rows[0],
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Missing required fields: email, code" });
  }

  const verification = await pool.query(
    `SELECT v.verification_id, v.user_id, v.expires_at
     FROM email_verifications v
     WHERE v.email = $1 AND v.token = $2 AND v.type = 'signup' AND v.verified = false`,
    [email, code]
  );

  if (!verification.rows.length) {
    return res.status(400).json({ message: "Invalid verification code" });
  }

  if (new Date() > new Date(verification.rows[0].expires_at)) {
    return res.status(400).json({ message: "Verification code has expired" });
  }

  await pool.query(
    "UPDATE email_verifications SET verified = true WHERE verification_id = $1",
    [verification.rows[0].verification_id]
  );

  await pool.query(
    "UPDATE users SET email_verified = true, updated_at = NOW() WHERE user_id = $1",
    [verification.rows[0].user_id]
  );

  res.status(200).json({
    message: "Email verified successfully",
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await pool.query(
    "SELECT user_id, username, full_name, email_verified FROM users WHERE email = $1",
    [email]
  );

  if (!user.rows.length) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.rows[0].email_verified) {
    return res.status(400).json({ message: "Email is already verified" });
  }

  // Invalidate old verifications
  await pool.query(
    "UPDATE email_verifications SET verified = true WHERE email = $1 AND type = 'signup' AND verified = false",
    [email]
  );

  const verificationCode = generateCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO email_verifications (user_id, email, token, type, expires_at)
     VALUES ($1, $2, $3, 'signup', $4)`,
    [user.rows[0].user_id, email, verificationCode, expiresAt]
  );

  try {
    await sendVerificationEmail(email, verificationCode, user.rows[0].full_name || user.rows[0].username);
  } catch (emailErr) {
    console.error("Resend verification email failed:", emailErr.message);
  }

  res.status(200).json({
    message: "Verification code resent successfully",
  });
});

const requestDeleteAccount = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await pool.query(
    "SELECT user_id, full_name, username FROM users WHERE email = $1",
    [email]
  );

  if (!user.rows.length) {
    return res.status(404).json({ message: "User not found" });
  }

  const deleteCode = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await pool.query(
    `INSERT INTO email_verifications (user_id, email, token, type, expires_at)
     VALUES ($1, $2, $3, 'account_deletion', $4)`,
    [user.rows[0].user_id, email, deleteCode, expiresAt]
  );

  try {
    await sendDeleteAccountCode(email, deleteCode, user.rows[0].full_name || user.rows[0].username);
  } catch (emailErr) {
    console.error("Delete account email failed:", emailErr.message);
  }

  res.status(200).json({
    message: "Account deletion verification code sent",
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Missing required fields: email, code" });
  }

  const verification = await pool.query(
    `SELECT v.verification_id, v.user_id, v.expires_at
     FROM email_verifications v
     WHERE v.email = $1 AND v.token = $2 AND v.type = 'account_deletion' AND v.verified = false`,
    [email, code]
  );

  if (!verification.rows.length) {
    return res.status(400).json({ message: "Invalid verification code" });
  }

  if (new Date() > new Date(verification.rows[0].expires_at)) {
    return res.status(400).json({ message: "Verification code has expired" });
  }

  const userId = verification.rows[0].user_id;

  // Delete user (cascades to wallets, holdings, orders, etc.)
  await pool.query("DELETE FROM users WHERE user_id = $1", [userId]);

  res.status(200).json({
    message: "Account deleted successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  verifyEmail,
  resendVerification,
  requestDeleteAccount,
  deleteAccount,
};
