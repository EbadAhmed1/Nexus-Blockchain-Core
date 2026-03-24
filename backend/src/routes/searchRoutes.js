const express = require("express");

const {
  searchWallets,
  searchTransactions,
} = require("../controllers/searchController");

const router = express.Router();

router.get("/wallets", searchWallets);
router.get("/transactions", searchTransactions);

module.exports = router;
