# How to View Database Data

## Method 1: Using the View Script (Easiest)

Run the provided script to see a quick overview:

```bash
cd Blockscan-Backend-main
node scripts/view-database.js
```

This will show:
- Row counts for all tables
- Sample data from users, tokens, wallets, and transactions

## Method 2: Using psql (Command Line)

### Connect to Database:
```bash
psql -U postgres -d blockscan
```

Or if you have custom credentials:
```bash
psql -h localhost -U your_username -d blockscan
```

### Useful Commands:
```sql
-- List all tables
\dt

-- View all users
SELECT * FROM users;

-- View all tokens
SELECT * FROM tokens;

-- View all wallets
SELECT * FROM wallets;

-- View all transactions
SELECT * FROM transactions;

-- View user statistics
SELECT * FROM user_statistics LIMIT 10;

-- View wallet summary
SELECT * FROM wallet_summary LIMIT 10;

-- View transaction history
SELECT * FROM transaction_history LIMIT 10;

-- Count records in each table
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'tokens', COUNT(*) FROM tokens
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'p2p_orders', COUNT(*) FROM p2p_orders
UNION ALL
SELECT 'p2p_transactions', COUNT(*) FROM p2p_transactions;
```

## Method 3: Using pgAdmin (GUI Tool)

1. **Download pgAdmin**: https://www.pgadmin.org/download/
2. **Install and open pgAdmin**
3. **Add Server**:
   - Right-click "Servers" → "Create" → "Server"
   - General tab: Name = "Blockscan Local"
   - Connection tab:
     - Host: `localhost`
     - Port: `5432`
     - Database: `blockscan`
     - Username: `postgres` (or your username)
     - Password: (your password from .env file)
4. **Browse Data**:
   - Expand: Servers → Blockscan Local → Databases → blockscan → Schemas → public → Tables
   - Right-click any table → "View/Edit Data" → "All Rows"

## Method 4: Using DBeaver (Free GUI Tool)

1. **Download DBeaver**: https://dbeaver.io/download/
2. **Create New Connection**:
   - Database: PostgreSQL
   - Host: `localhost`
   - Port: `5432`
   - Database: `blockscan`
   - Username: `postgres`
   - Password: (your password)
3. **Browse Tables**: Navigate to tables in the left sidebar and view data

## Method 5: Using TablePlus (Modern GUI)

1. **Download TablePlus**: https://tableplus.com/
2. **Create Connection**:
   - Database: PostgreSQL
   - Host: `localhost`
   - Port: `5432`
   - Database: `blockscan`
   - Username: `postgres`
   - Password: (your password)
3. **View Data**: Click on any table to see its data

## Method 6: Using VS Code Extension

1. **Install Extension**: "PostgreSQL" by Chris Kolkman
2. **Add Connection**:
   - Click the PostgreSQL icon in sidebar
   - Add connection with your credentials
3. **Browse**: Expand database → tables → view data

## Quick Database Info

Your database connection details (from .env):
- **Host**: `localhost` (or PG_HOST from .env)
- **Port**: `5432` (or PG_PORT from .env)
- **Database**: `blockscan` (or PG_DATABASE from .env)
- **Username**: `postgres` (or PG_USER from .env)
- **Password**: (from PG_PASSWORD in .env)

## Useful SQL Queries

### View all users with their wallet count:
```sql
SELECT 
  u.user_id,
  u.username,
  u.email,
  u.email_verified,
  COUNT(w.wallet_id) as wallet_count
FROM users u
LEFT JOIN wallets w ON w.user_id = u.user_id
GROUP BY u.user_id, u.username, u.email, u.email_verified;
```

### View token holdings:
```sql
SELECT 
  w.address,
  t.token_symbol,
  th.amount,
  (th.amount * t.price_usd) as value_usd
FROM token_holdings th
JOIN wallets w ON w.wallet_id = th.wallet_id
JOIN tokens t ON t.token_id = th.token_id
ORDER BY value_usd DESC;
```

### View recent transactions:
```sql
SELECT 
  tx_hash,
  from_address,
  to_address,
  token_symbol,
  amount,
  status,
  timestamp
FROM transaction_history
ORDER BY timestamp DESC
LIMIT 20;
```

### View P2P orders:
```sql
SELECT 
  order_id,
  username,
  token_symbol,
  order_type,
  amount,
  price,
  total,
  status
FROM p2p_order_summary
ORDER BY created_at DESC
LIMIT 20;
```

