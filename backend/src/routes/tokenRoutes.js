const express = require("express");
const {
  getAllTokens,
  getTokenDetails,
  getTokenHolders,
} = require("../controllers/tokenController");

const router = express.Router();

router.get("/", getAllTokens);
router.get("/:symbol/holders", getTokenHolders);
router.get("/:symbol", getTokenDetails);

module.exports = router;
