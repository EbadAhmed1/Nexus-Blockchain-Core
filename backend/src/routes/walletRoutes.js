const express = require("express");
const {
  getWalletDetails,
  getWalletHoldings,
  getWalletTransactions,
  getAllWallets,
  createWallet,
  getWalletBalance,
  depositToWallet,
  withdrawFromWallet,
  transferBetweenWallets,
} = require("../controllers/walletController");

const router = express.Router();

router.get("/", getAllWallets);
router.post("/", createWallet);
router.post("/:address/deposit", depositToWallet);
router.post("/:address/withdraw", withdrawFromWallet);
router.post("/:address/transfer", transferBetweenWallets);
router.get("/:address/holdings", getWalletHoldings);
router.get("/:address/transactions", getWalletTransactions);
router.get("/:address/balance", getWalletBalance);
router.get("/:address", getWalletDetails);

module.exports = router;