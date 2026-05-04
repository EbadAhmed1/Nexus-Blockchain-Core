# API Endpoints and Frontend Pages

## Backend API Endpoints

### Users API (/api/users)
- POST /register - Register new user
- POST /login - Login (returns requiresCode if verification needed)
- POST /verify-login-code - Verify login code and complete login
- POST /verify-email - Verify email with 6-digit code
- POST /resend-verification - Resend verification code
- POST /request-delete-account - Request account deletion (sends code)
- POST /delete-account - Delete account with verification code
- GET / - Get all users (optional ?stats=true)
- GET /:id - Get user profile (optional ?stats=true)
- PUT /:id - Update user profile

### Wallets API (/api/wallets)
- GET / - Get all wallets (optional ?userId=)
- POST / - Create wallet
- GET /:address - Get wallet details
- GET /:address/holdings - Get wallet token holdings
- GET /:address/transactions - Get wallet transactions
- GET /:address/balance - Get wallet balance (optional ?tokenSymbol=)
- POST /:address/deposit - Deposit tokens
- POST /:address/withdraw - Withdraw tokens
- POST /:address/transfer - Transfer between wallets

### Blocks API (/api/blocks)
- GET /latest - Get latest blocks (optional ?limit=)
- GET /:blockId - Get block details
- GET /:blockId/transactions - Get block transactions

### Tokens API (/api/tokens)
- GET / - Get all tokens (optional ?limit= &offset=)
- GET /:symbol - Get token details
- GET /:symbol/holders - Get token holders

### Transactions API (/api/transactions)
- GET / - Get all transactions (optional ?limit= &offset=)
- GET /:txHash - Get transaction details
- POST / - Create transaction

### P2P API (/api/p2p)
- GET /users-with-tokens - Get users with available tokens
- POST /orders - Create P2P order
- GET /orders - Get orders (optional filters: ?orderType= &tokenId= &status= &limit= &offset=)
- GET /orders/:id - Get order details
- POST /orders/:id/cancel - Cancel order
- POST /transactions - Create P2P transaction
- GET /transactions - Get P2P transactions (optional ?userId= &status= &limit= &offset=)
- POST /transactions/:id/accept - Accept P2P transaction (status -> paid)
- POST /transactions/:id/reject - Reject P2P transaction
- POST /transactions/:id/transfer - Transfer tokens (status -> completed)
- PUT /transactions/:id/status - Update transaction status

### Market API (/api/market)
- GET /trading-pairs - Get all trading pairs
- GET /pair/:symbol - Get pair details
- GET /price-history/:symbol - Get price history (optional ?interval= &limit=)
- GET /orderbook/:symbol - Get order book
- POST /buy - Buy tokens with USDT

### Conversion API (/api/conversion)
- POST /swap - Swap tokens
- GET /rate - Get conversion rate (required: ?fromTokenId= &toTokenId=, optional: ?amount=)

### Email API (/api/email)
- GET /notifications - Get email notifications (required: ?userId=)
- POST /mark-read - Mark notification as read

### Search API (/api/search)
- GET /wallets?q= - Search wallets
- GET /transactions?q= - Search transactions

## Frontend Pages

### Public Pages
- / - Home (redirects to /dashboard or /login)
- /login - Login page (with code verification)
- /register - Registration page
- /verify-email - Email verification page

### Dashboard Pages (/(dashboard))
- /dashboard - Main dashboard with analytics
- /blocks - Blocks list
- /blocks/[id] - Block details
- /tokens - Tokens list
- /tokens/[id] - Token details
- /transactions - Transactions list
- /transactions/[id] - Transaction details
- /transactions-history - User transaction history
- /wallets - Wallets list
- /wallets/[id] - Wallet details
- /wallet-management - Wallet management (deposit/withdraw/transfer)
- /users - Users list
- /users/[id] - User profile
- /p2p - P2P trading page
- /p2p-transactions - P2P transaction history
- /market - Market page
- /market/[symbol] - Market pair details
- /convert - Token conversion/swap page
- /settings - User settings (profile, notifications, delete account)

## Frontend API Client (lib/api.ts)

### blocksApi
- getLatest(limit)
- getById(blockId)
- getTransactions(blockId)

### walletsApi
- getAll(userId?)
- getByAddress(address)
- getHoldings(address)
- getTransactions(address, limit, offset)
- getBalance(address, tokenSymbol?)
- create(label, userId)

### tokensApi
- getAll(limit, offset)
- getBySymbol(symbol)
- getHolders(symbol)

### transactionsApi
- getAll(limit, offset)
- getByHash(txHash)
- create(data)

### validatorsApi
- getById(id)
- getBlocks(id)

### searchApi
- wallets(query)
- transactions(query)

### usersApi
- getAll(limit, offset)
- register(data)
- login(email, password)
- getProfile(userId)
- updateProfile(userId, data)
- verifyEmail(code)
- resendVerification(email)
- verifyLoginCode(email, code)
- requestDeleteAccount(userId)
- deleteAccount(userId, code)

### p2pApi
- getUsersWithTokens()
- createOrder(data)
- getOrders(params?)
- getOrderDetails(orderId)
- cancelOrder(orderId, userId)
- createTransaction(data)
- acceptTransaction(transactionId, userId)
- rejectTransaction(transactionId, userId)
- transferTokens(transactionId, userId)
- getTransactions(params?)
- updateTransactionStatus(transactionId, data)

### emailApi
- getNotifications(userId)
- markAsRead(verificationId)

### marketApi
- getTradingPairs()
- getPairDetails(symbol)
- getPriceHistory(symbol, interval, limit)
- getOrderBook(symbol)
- buyWithUSDT(data)

### conversionApi
- swap(data)
- getRate(fromTokenId, toTokenId, amount?)

### walletManagementApi
- deposit(address, tokenId, amount)
- withdraw(address, tokenId, amount, toAddress?)
- transfer(address, toAddress, tokenId, amount)

