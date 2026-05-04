# SQL Transaction Management Functions

This document contains all SQL transaction control statements (BEGIN, COMMIT, ROLLBACK, SAVEPOINT) and their usage patterns in the codebase.

## Table of Contents
1. [SQL Transaction Control Statements](#sql-transaction-control-statements)
2. [Transaction Management Pattern](#transaction-management-pattern)
3. [Usage Examples from Codebase](#usage-examples-from-codebase)
4. [Best Practices](#best-practices)

---

## SQL Transaction Control Statements

### 1. BEGIN
**Purpose**: Starts a new transaction block. All subsequent SQL statements will be part of this transaction until COMMIT or ROLLBACK.

**Syntax**:
```sql
BEGIN;
-- or
BEGIN TRANSACTION;
```

**Usage in Code**:
```javascript
await client.query("BEGIN");
```

---

### 2. COMMIT
**Purpose**: Commits the current transaction, making all changes permanent. All changes made since BEGIN are saved to the database.

**Syntax**:
```sql
COMMIT;
-- or
COMMIT TRANSACTION;
```

**Usage in Code**:
```javascript
await client.query("COMMIT");
```

---

### 3. ROLLBACK
**Purpose**: Rolls back (undoes) all changes made in the current transaction. The database returns to the state it was in before BEGIN.

**Syntax**:
```sql
ROLLBACK;
-- or
ROLLBACK TRANSACTION;
```

**Usage in Code**:
```javascript
await client.query("ROLLBACK");
```

---

### 4. SAVEPOINT
**Purpose**: Creates a named savepoint within a transaction. Allows partial rollback to a specific point.

**Syntax**:
```sql
SAVEPOINT savepoint_name;
```

**Usage**:
```javascript
await client.query("SAVEPOINT before_update");
```

---

### 5. RELEASE SAVEPOINT
**Purpose**: Releases (removes) a previously defined savepoint.

**Syntax**:
```sql
RELEASE SAVEPOINT savepoint_name;
```

**Usage**:
```javascript
await client.query("RELEASE SAVEPOINT before_update");
```

---

### 6. ROLLBACK TO SAVEPOINT
**Purpose**: Rolls back to a specific savepoint, undoing all changes made after that savepoint.

**Syntax**:
```sql
ROLLBACK TO SAVEPOINT savepoint_name;
```

**Usage**:
```javascript
await client.query("ROLLBACK TO SAVEPOINT before_update");
```

---

## Transaction Management Pattern

### Standard Pattern Used in Codebase

All transaction operations in the codebase follow this consistent pattern:

```javascript
const client = await pool.connect();
try {
  // Start transaction
  await client.query("BEGIN");

  // Perform database operations
  const result1 = await client.query("SELECT ...");
  
  // Validation checks
  if (!result1.rows.length) {
    await client.query("ROLLBACK");
    return res.status(404).json({ message: "Not found" });
  }

  // More operations
  await client.query("UPDATE ...");
  await client.query("INSERT ...");

  // Commit transaction if all operations succeed
  await client.query("COMMIT");

  // Send response (after commit)
  res.status(200).json({ message: "Success" });

} catch (error) {
  // Rollback on any error
  await client.query("ROLLBACK");
  throw error;
} finally {
  // Always release the client connection
  client.release();
}
```

---

## Usage Examples from Codebase

### Example 1: Creating a Transaction (transactionController.js)

```javascript
const createTransaction = asyncHandler(async (req, res) => {
  const { fromAddress, toAddress, tokenSymbol, amount, method = "transfer" } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Validate wallets exist
    const fromWallet = await client.query("SELECT wallet_id FROM wallets WHERE address = $1", [fromAddress]);
    const toWallet = await client.query("SELECT wallet_id FROM wallets WHERE address = $1", [toAddress]);

    if (!fromWallet.rows.length || !toWallet.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        message: "One or both wallets not found" 
      });
    }

    // Validate token exists
    const token = await client.query("SELECT token_id FROM tokens WHERE token_symbol = $1", [tokenSymbol]);
    if (!token.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        message: `Token with symbol '${tokenSymbol}' not found` 
      });
    }

    // Check balance
    const balanceCheck = await client.query(
      "SELECT validate_wallet_balance($1, $2, $3) as has_sufficient_balance",
      [fromWalletId, tokenId, totalRequired]
    );

    if (!balanceCheck.rows[0].has_sufficient_balance) {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        success: false,
        message: "Insufficient balance"
      });
    }

    // Create transaction record
    const txResult = await client.query(
      `INSERT INTO transactions (...) VALUES (...) RETURNING ...`,
      [...]
    );

    // Update sender balance
    await client.query(
      `UPDATE token_holdings SET amount = amount - $1 WHERE wallet_id = $2 AND token_id = $3`,
      [totalRequired, fromWalletId, tokenId]
    );

    // Update receiver balance
    await client.query(
      `UPDATE token_holdings SET amount = amount + $1 WHERE wallet_id = $2 AND token_id = $3`,
      [amount, toWalletId, tokenId]
    );

    // Update transaction status
    await client.query(
      `UPDATE transactions SET status = 'confirmed' WHERE transaction_id = $1`,
      [txResult.rows[0].transaction_id]
    );

    // Commit all changes
    await client.query("COMMIT");

    // Send response
    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      transaction: txResult.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
```

**Key Points**:
- ✅ BEGIN starts the transaction
- ✅ Multiple ROLLBACK points for validation failures
- ✅ COMMIT only if all operations succeed
- ✅ ROLLBACK in catch block for error handling
- ✅ Client released in finally block

---

### Example 2: P2P Transaction Creation (p2pController.js)

```javascript
const createP2PTransaction = asyncHandler(async (req, res) => {
  const { buyerId, sellerId, tokenId, amount, price } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check seller balance
    const sellerBalance = await client.query(
      `SELECT th.amount, w.wallet_id 
       FROM token_holdings th
       JOIN wallets w ON th.wallet_id = w.wallet_id
       WHERE w.user_id = $1 AND th.token_id = $2`,
      [sellerId, tokenId]
    );

    if (!sellerBalance.rows.length || parseFloat(sellerBalance.rows[0].amount) < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Seller does not have sufficient balance" });
    }

    // Create P2P transaction
    const txResult = await client.query(
      `INSERT INTO p2p_transactions (buyer_id, seller_id, token_id, amount, price, total, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING ...`,
      [buyerId, sellerId, tokenId, amount, price, total]
    );

    // Commit transaction
    await client.query("COMMIT");

    // Email notifications (outside transaction)
    // ...

    res.status(201).json({
      message: "Transaction request created.",
      transaction: txResult.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
```

---

### Example 3: Wallet Deposit (walletController.js)

```javascript
const depositToWallet = asyncHandler(async (req, res) => {
  const { address } = req.params;
  const { tokenId, amount } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Validate wallet exists
    const wallet = await client.query("SELECT wallet_id FROM wallets WHERE address = $1", [address]);
    if (!wallet.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Wallet not found" });
    }

    const walletId = wallet.rows[0].wallet_id;

    // Check if holding exists
    const existing = await client.query(
      "SELECT holding_id, amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2",
      [walletId, tokenIdInt]
    );

    if (existing.rows.length) {
      // Update existing holding
      await client.query(
        "UPDATE token_holdings SET amount = amount + $1 WHERE holding_id = $2",
        [amountNum, existing.rows[0].holding_id]
      );
    } else {
      // Create new holding
      await client.query(
        "INSERT INTO token_holdings (wallet_id, token_id, amount) VALUES ($1, $2, $3)",
        [walletId, tokenIdInt, amountNum]
      );
    }

    // Commit transaction
    await client.query("COMMIT");

    res.status(200).json({
      message: "Deposit successful",
      amount: amountNum,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
```

---

### Example 4: Transfer Tokens (p2pController.js - transferTokens)

```javascript
const transferTokens = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Validate transaction exists
    const tx = await client.query(
      `SELECT p2p_tx_id, buyer_id, seller_id, token_id, amount, status 
       FROM p2p_transactions WHERE p2p_tx_id = $1`,
      [id]
    );

    if (!tx.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Validate permissions
    if (parseInt(tx.rows[0].seller_id) !== parseInt(userId)) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Only the seller can transfer tokens" });
    }

    // Validate status
    if (tx.rows[0].status !== "paid") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Transaction must be accepted (paid) before transferring tokens" });
    }

    // Check seller balance
    const sellerBalance = await client.query(
      `SELECT th.amount, w.wallet_id 
       FROM token_holdings th
       JOIN wallets w ON th.wallet_id = w.wallet_id
       WHERE w.user_id = $1 AND th.token_id = $2`,
      [txData.seller_id, txData.token_id]
    );

    if (!sellerBalance.rows.length || parseFloat(sellerBalance.rows[0].amount) < parseFloat(txData.amount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Get wallets
    const buyerWallet = await client.query(
      `SELECT wallet_id FROM wallets WHERE user_id = $1 LIMIT 1`,
      [txData.buyer_id]
    );

    const sellerWallet = await client.query(
      `SELECT wallet_id FROM wallets WHERE user_id = $1 LIMIT 1`,
      [txData.seller_id]
    );

    if (!buyerWallet.rows.length || !sellerWallet.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Wallets not found" });
    }

    // Deduct from seller
    await client.query(
      `UPDATE token_holdings SET amount = amount - $1 WHERE wallet_id = $2 AND token_id = $3`,
      [txData.amount, sellerWallet.rows[0].wallet_id, txData.token_id]
    );

    // Add to buyer
    const buyerBalance = await client.query(
      `SELECT amount FROM token_holdings WHERE wallet_id = $1 AND token_id = $2`,
      [buyerWallet.rows[0].wallet_id, txData.token_id]
    );

    if (buyerBalance.rows.length) {
      await client.query(
        `UPDATE token_holdings SET amount = amount + $1 WHERE wallet_id = $2 AND token_id = $3`,
        [txData.amount, buyerWallet.rows[0].wallet_id, txData.token_id]
      );
    } else {
      await client.query(
        `INSERT INTO token_holdings (wallet_id, token_id, amount) VALUES ($1, $2, $3)`,
        [buyerWallet.rows[0].wallet_id, txData.token_id, txData.amount]
      );
    }

    // Create blockchain transaction record
    const txHash = generateTxHash();
    await client.query(
      `INSERT INTO transactions (tx_hash, from_wallet_id, to_wallet_id, token_id, block_id, amount, fee, method, status, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'p2p', 'confirmed', NOW())`,
      [txHash, sellerWallet.rows[0].wallet_id, buyerWallet.rows[0].wallet_id, txData.token_id, blockId, txData.amount, 0]
    );

    // Update P2P transaction status
    await client.query(
      `UPDATE p2p_transactions SET status = 'completed', updated_at = NOW() WHERE p2p_tx_id = $1`,
      [id]
    );

    // Commit all changes
    await client.query("COMMIT");

    res.status(200).json({
      message: "Tokens transferred successfully",
      transactionHash: txHash,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
```

---

## Best Practices

### 1. Always Use Try-Catch-Finally Pattern
```javascript
const client = await pool.connect();
try {
  await client.query("BEGIN");
  // ... operations ...
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release(); // Always release connection
}
```

### 2. Rollback on Validation Failures
```javascript
if (!validation) {
  await client.query("ROLLBACK");
  return res.status(400).json({ message: "Validation failed" });
}
```

### 3. Commit Only After All Operations Succeed
```javascript
// All operations must succeed before commit
await client.query("INSERT ...");
await client.query("UPDATE ...");
await client.query("UPDATE ...");
await client.query("COMMIT"); // Only commit if all succeed
```

### 4. Never Commit After Error
```javascript
try {
  await client.query("BEGIN");
  await client.query("INSERT ...");
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK"); // Always rollback on error
  throw error;
}
```

### 5. Keep Transactions Short
- Start transaction just before operations
- Commit immediately after operations
- Don't include email sending or external API calls inside transaction

### 6. Use Single Client for Transaction
```javascript
// ✅ Correct: Use same client for all operations
const client = await pool.connect();
await client.query("BEGIN");
await client.query("SELECT ...", [], client);
await client.query("UPDATE ...", [], client);
await client.query("COMMIT");

// ❌ Wrong: Using pool.query inside transaction
await client.query("BEGIN");
await pool.query("SELECT ..."); // This won't be part of transaction!
await client.query("COMMIT");
```

### 7. Release Client in Finally Block
```javascript
finally {
  client.release(); // Always release, even if error occurs
}
```

---

## Transaction Isolation Levels

PostgreSQL supports different transaction isolation levels:

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

**Note**: The codebase uses default isolation level (READ COMMITTED).

---

## Summary

All transaction operations in the codebase follow this pattern:

1. **Connect**: Get client from pool
2. **BEGIN**: Start transaction
3. **Validate**: Check conditions, rollback if invalid
4. **Operate**: Perform database operations
5. **COMMIT**: Save changes if all succeed
6. **ROLLBACK**: Undo changes on error or validation failure
7. **Release**: Always release client in finally block

This ensures:
- ✅ Data consistency (all or nothing)
- ✅ No partial updates
- ✅ Proper error handling
- ✅ Connection pool management
- ✅ ACID compliance

---

## Files Using Transactions

1. `transactionController.js` - createTransaction
2. `p2pController.js` - createP2PTransaction, acceptTransaction, rejectTransaction, transferTokens
3. `walletController.js` - depositToWallet, withdrawFromWallet, transferBetweenWallets
4. `userController.js` - registerUser, verifyEmail, resendVerification, requestDeleteAccount, deleteAccount
5. `marketController.js` - executeMarketOrder
6. `conversionController.js` - convertTokens

---

## SQL Transaction Commands Reference

| Command | Purpose | Usage |
|---------|---------|-------|
| `BEGIN` | Start transaction | `await client.query("BEGIN")` |
| `COMMIT` | Save changes | `await client.query("COMMIT")` |
| `ROLLBACK` | Undo changes | `await client.query("ROLLBACK")` |
| `SAVEPOINT name` | Create savepoint | `await client.query("SAVEPOINT sp1")` |
| `ROLLBACK TO SAVEPOINT name` | Rollback to savepoint | `await client.query("ROLLBACK TO SAVEPOINT sp1")` |
| `RELEASE SAVEPOINT name` | Remove savepoint | `await client.query("RELEASE SAVEPOINT sp1")` |

---

