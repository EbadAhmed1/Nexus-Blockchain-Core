const express = require("express");
const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  verifyEmail,
  resendVerification,
  requestDeleteAccount,
  deleteAccount,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/request-delete-account", requestDeleteAccount);
router.post("/delete-account", deleteAccount);
router.get("/", getAllUsers);
router.get("/:id", getUserProfile);
router.put("/:id", updateUserProfile);

module.exports = router;

