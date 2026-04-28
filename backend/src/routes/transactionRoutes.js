const express = require("express");
const {
  createTransaction,
  getAllTransactions,
  getTransactionDetails,
} = require("../controllers/transactionController");

const router = express.Router();

router.post("/", createTransaction);
router.get("/", getAllTransactions);
router.get("/:txHash", getTransactionDetails);

module.exports = router;

