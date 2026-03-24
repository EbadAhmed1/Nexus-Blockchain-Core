const express = require("express");
const cors = require("cors");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const walletRoutes = require("./routes/walletRoutes.js");
const blockRoutes = require("./routes/blockRoutes.js");
const tokenRoutes = require("./routes/tokenRoutes.js");
const searchRoutes = require("./routes/searchRoutes.js");
const transactionRoutes = require("./routes/transactionRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const p2pRoutes = require("./routes/p2pRoutes.js");
const emailRoutes = require("./routes/emailRoutes.js");
const marketRoutes = require("./routes/marketRoutes.js");
const conversionRoutes = require("./routes/conversionRoutes.js");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/wallets", walletRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/p2p", p2pRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/conversion", conversionRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Blockchain Explorer API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      wallets: "/api/wallets",
      blocks: "/api/blocks",
      tokens: "/api/tokens",
      transactions: "/api/transactions",
      users: "/api/users",
      p2p: "/api/p2p",
      search: "/api/search",
      email: "/api/email",
      market: "/api/market",
      conversion: "/api/conversion",
    },
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
