const express = require("express");
const {
  getTradingPairs,
  getPairDetails,
  getPriceHistory,
  getOrderBook,
  buyWithUSDT,
} = require("../controllers/marketController");

const router = express.Router();

router.get("/trading-pairs", getTradingPairs);
router.get("/pair/:symbol", getPairDetails);
router.get("/price-history/:symbol", getPriceHistory);
router.get("/orderbook/:symbol", getOrderBook);
router.post("/buy", buyWithUSDT);

module.exports = router;

