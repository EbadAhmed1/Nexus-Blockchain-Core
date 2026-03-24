const express = require("express");
const {
  swapTokens,
  getConversionRate,
} = require("../controllers/conversionController");

const router = express.Router();

router.post("/swap", swapTokens);
router.get("/rate", getConversionRate);

module.exports = router;

