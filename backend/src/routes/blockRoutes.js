const express = require("express");
const {
  getLatestBlocks,
  getBlockDetails,
  getBlockTransactions,
} = require("../controllers/blockController");

const router = express.Router();

router.get("/latest", getLatestBlocks);
router.get("/:blockId/transactions", getBlockTransactions);
router.get("/:blockId", getBlockDetails);

module.exports = router;
