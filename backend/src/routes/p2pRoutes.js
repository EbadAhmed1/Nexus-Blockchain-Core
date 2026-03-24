const express = require("express");
const {
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
} = require("../controllers/p2pController");

const router = express.Router();

router.post("/orders", createOrder);
router.get("/orders", getOrders);
router.get("/orders/:id", getOrderDetails);
router.post("/orders/:id/cancel", cancelOrder);
router.get("/users-with-tokens", getUsersWithTokens);
router.post("/transactions", createP2PTransaction);
router.get("/transactions", getP2PTransactions);
router.post("/transactions/:id/accept", acceptTransaction);
router.post("/transactions/:id/reject", rejectTransaction);
router.post("/transactions/:id/transfer", transferTokens);
router.put("/transactions/:id/status", updateTransactionStatus);

module.exports = router;

