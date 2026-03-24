const express = require("express");
const {
  getNotifications,
  markAsRead,
} = require("../controllers/emailController");

const router = express.Router();

router.get("/notifications", getNotifications);
router.post("/mark-read", markAsRead);

module.exports = router;

