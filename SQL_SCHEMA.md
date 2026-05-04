# SQL Database Schema

## Tables

### users
- user_id (SERIAL PRIMARY KEY)
- username (VARCHAR(100) UNIQUE NOT NULL)
- email (VARCHAR(255) UNIQUE NOT NULL)
- password_hash (VARCHAR(255) NOT NULL)
- full_name (VARCHAR(255))
- phone (VARCHAR(20))
- email_verified (BOOLEAN DEFAULT FALSE)
- verification_token (VARCHAR(255))
- verification_expires (TIMESTAMP)
- status (VARCHAR(20) DEFAULT 'active')
- created_at (TIMESTAMP DEFAULT NOW())
- updated_at (TIMESTAMP DEFAULT NOW())

### tokens
- token_id (SERIAL PRIMARY KEY)
- token_symbol (VARCHAR(10) UNIQUE NOT NULL)
- token_name (VARCHAR(100) NOT NULL)
- decimals (INTEGER DEFAULT 18)
- total_supply (NUMERIC(30, 8) DEFAULT 0)
- price_usd (NUMERIC(20, 8) DEFAULT 0)
- change_24h (NUMERIC(10, 4) DEFAULT 0)
- volume_24h (NUMERIC(20, 8) DEFAULT 0)
- market_cap_usd (NUMERIC(20, 8) DEFAULT 0)
- created_at (TIMESTAMP DEFAULT NOW())

### wallets
- wallet_id (SERIAL PRIMARY KEY)
- address (VARCHAR(100) UNIQUE NOT NULL)
- label (VARCHAR(100))
- user_id (INTEGER REFERENCES users(user_id) ON DELETE CASCADE)
- public_key (VARCHAR(255))
- status (VARCHAR(20) DEFAULT 'active')
- created_at (TIMESTAMP DEFAULT NOW())

### token_holdings
- holding_id (SERIAL PRIMARY KEY)
- wallet_id (INTEGER REFERENCES wallets(wallet_id) ON DELETE CASCADE)
- token_id (INTEGER REFERENCES tokens(token_id) ON DELETE CASCADE)
- amount (NUMERIC(30, 8) DEFAULT 0)
- UNIQUE(wallet_id, token_id)

### blocks
- block_id (SERIAL PRIMARY KEY)
- block_hash (VARCHAR(100) UNIQUE NOT NULL)
- previous_hash (VARCHAR(100))
- height (INTEGER NOT NULL)
- timestamp (TIMESTAMP DEFAULT NOW())
- gas_used (NUMERIC(20, 0) DEFAULT 0)
- gas_limit (NUMERIC(20, 0) DEFAULT 0)
- size_kb (INTEGER DEFAULT 0)
- reward (NUMERIC(20, 8) DEFAULT 0)
- status (VARCHAR(20) DEFAULT 'finalized')

### transactions
- transaction_id (SERIAL PRIMARY KEY)
- tx_hash (VARCHAR(100) UNIQUE NOT NULL)
- from_wallet_id (INTEGER REFERENCES wallets(wallet_id))
- to_wallet_id (INTEGER REFERENCES wallets(wallet_id))
- token_id (INTEGER REFERENCES tokens(token_id))
- block_id (INTEGER REFERENCES blocks(block_id))
- amount (NUMERIC(30, 8) NOT NULL)
- fee (NUMERIC(20, 8) DEFAULT 0)
- method (VARCHAR(50) DEFAULT 'transfer')
- status (VARCHAR(20) DEFAULT 'pending')
- email_notified (BOOLEAN DEFAULT FALSE)
- timestamp (TIMESTAMP DEFAULT NOW())

### p2p_orders
- order_id (SERIAL PRIMARY KEY)
- user_id (INTEGER REFERENCES users(user_id) ON DELETE CASCADE)
- token_id (INTEGER REFERENCES tokens(token_id))
- order_type (VARCHAR(10) NOT NULL CHECK (order_type IN ('buy', 'sell')))
- amount (NUMERIC(30, 8) NOT NULL)
- price (NUMERIC(20, 8) NOT NULL)
- total (NUMERIC(30, 8) NOT NULL)
- payment_method (VARCHAR(100))
- min_limit (NUMERIC(20, 8))
- max_limit (NUMERIC(20, 8))
- status (VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'pending')))
- completed_at (TIMESTAMP)
- created_at (TIMESTAMP DEFAULT NOW())
- updated_at (TIMESTAMP DEFAULT NOW())

### p2p_transactions
- p2p_tx_id (SERIAL PRIMARY KEY)
- order_id (INTEGER REFERENCES p2p_orders(order_id) ON DELETE CASCADE)
- buyer_id (INTEGER REFERENCES users(user_id))
- seller_id (INTEGER REFERENCES users(user_id))
- token_id (INTEGER REFERENCES tokens(token_id))
- amount (NUMERIC(30, 8) NOT NULL)
- price (NUMERIC(20, 8) NOT NULL)
- total (NUMERIC(30, 8) NOT NULL)
- status (VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'disputed', 'cancelled')))
- payment_proof (TEXT)
- email_notified (BOOLEAN DEFAULT FALSE)
- created_at (TIMESTAMP DEFAULT NOW())
- updated_at (TIMESTAMP DEFAULT NOW())

### email_verifications
- verification_id (SERIAL PRIMARY KEY)
- user_id (INTEGER REFERENCES users(user_id) ON DELETE CASCADE)
- email (VARCHAR(255) NOT NULL)
- token (VARCHAR(255) UNIQUE NOT NULL)
- type (VARCHAR(50) NOT NULL CHECK (type IN ('signup', 'transaction', 'password_reset', 'account_deletion', 'p2p_request', 'login_verification')))
- related_id (INTEGER)
- verified (BOOLEAN DEFAULT FALSE)
- expires_at (TIMESTAMP NOT NULL)
- created_at (TIMESTAMP DEFAULT NOW())

## Indexes

- idx_wallets_user_id ON wallets(user_id)
- idx_wallets_address ON wallets(address)
- idx_token_holdings_wallet_id ON token_holdings(wallet_id)
- idx_token_holdings_token_id ON token_holdings(token_id)
- idx_transactions_from_wallet ON transactions(from_wallet_id)
- idx_transactions_to_wallet ON transactions(to_wallet_id)
- idx_transactions_token_id ON transactions(token_id)
- idx_transactions_tx_hash ON transactions(tx_hash)
- idx_p2p_orders_user_id ON p2p_orders(user_id)
- idx_p2p_orders_status ON p2p_orders(status)
- idx_p2p_orders_type ON p2p_orders(order_type)
- idx_users_email ON users(email)
- idx_email_verifications_token ON email_verifications(token)

## Functions

### update_updated_at_column()
- **Type**: Trigger Function
- **Returns**: TRIGGER
- **Description**: Automatically updates the `updated_at` timestamp column when a row is updated. Used by triggers on `users`, `p2p_orders`, and `p2p_transactions` tables.

### get_wallet_balance(p_wallet_id INTEGER, p_token_id INTEGER)
- **Type**: Scalar Function
- **Returns**: NUMERIC(30, 8)
- **Description**: Calculates and returns the balance of a specific token in a wallet. Returns 0 if no balance exists.
- **Parameters**:
  - `p_wallet_id`: The wallet ID to check
  - `p_token_id`: The token ID to check balance for
- **Usage**: Used by transaction validation and balance checks

### validate_wallet_balance(p_wallet_id INTEGER, p_token_id INTEGER, p_amount NUMERIC(30, 8))
- **Type**: Scalar Function
- **Returns**: BOOLEAN
- **Description**: Validates if a wallet has sufficient balance for a transaction. Returns `true` if balance is sufficient, `false` otherwise.
- **Parameters**:
  - `p_wallet_id`: The wallet ID to validate
  - `p_token_id`: The token ID to check
  - `p_amount`: The amount required (including fees)
- **Usage**: Called before creating transactions to ensure sufficient funds

### get_user_statistics(p_user_id INTEGER)
- **Type**: Table Function
- **Returns**: TABLE with columns:
  - `total_wallets` INTEGER
  - `total_transactions` INTEGER
  - `total_p2p_orders` INTEGER
  - `total_balance_usd` NUMERIC(30, 8)
- **Description**: Aggregates user statistics including wallet count, transaction count, P2P orders, and total USD balance across all tokens.
- **Parameters**:
  - `p_user_id`: The user ID to get statistics for

### update_token_volume()
- **Type**: Trigger Function
- **Returns**: TRIGGER
- **Description**: Automatically updates the `volume_24h` field in the `tokens` table when a transaction status changes to 'confirmed'. Adds the transaction amount to the token's 24-hour volume.
- **Trigger**: `trigger_update_token_volume` on `transactions` table (AFTER INSERT OR UPDATE)
- **Logic**: Only updates volume when status changes from non-confirmed to 'confirmed'

### check_transaction_balance()
- **Type**: Trigger Function
- **Returns**: TRIGGER
- **Description**: Validates wallet balance before a transaction is inserted or updated. Logs a warning if balance is insufficient but does not block the transaction (for monitoring purposes).
- **Trigger**: `trigger_check_transaction_balance` on `transactions` table (BEFORE INSERT OR UPDATE)
- **Logic**: 
  - Calculates current balance using `get_wallet_balance()`
  - Compares with required amount (amount + fee)
  - Raises WARNING if insufficient (does not prevent transaction)
- **Note**: This is a monitoring function. Actual balance validation should be done in application code before creating transactions.

## Triggers

### update_users_updated_at
BEFORE UPDATE ON users - Auto-updates updated_at

### update_p2p_orders_updated_at
BEFORE UPDATE ON p2p_orders - Auto-updates updated_at

### update_p2p_transactions_updated_at
BEFORE UPDATE ON p2p_transactions - Auto-updates updated_at

### trigger_update_token_volume
AFTER INSERT OR UPDATE ON transactions - Updates token volume

### trigger_check_transaction_balance
BEFORE INSERT OR UPDATE ON transactions - Validates balance

## Views

### wallet_summary
Wallet details with token counts and USD balance

### transaction_history
Transaction details with wallet and token info

### user_statistics
User stats including wallets, transactions, P2P orders, balance

### token_market_summary
Token market data with holder count and transaction stats

### p2p_order_summary
P2P order details with user and token info

### block_summary
Block details with transaction counts

