-- Seed 20 Dummy Users
-- Password for all users: password123 (hashed with bcrypt would be ideal, but using simple hash for demo)
-- For production, use proper password hashing

INSERT INTO users (username, email, password_hash, full_name, phone, email_verified, status) VALUES
('alice_crypto', 'alice.crypto@example.com', 'password123', 'Alice Johnson', '+1-555-0101', true, 'active'),
('bob_trader', 'bob.trader@example.com', 'password123', 'Bob Smith', '+1-555-0102', true, 'active'),
('charlie_holder', 'charlie.holder@example.com', 'password123', 'Charlie Brown', '+1-555-0103', true, 'active'),
('diana_investor', 'diana.investor@example.com', 'password123', 'Diana Prince', '+1-555-0104', true, 'active'),
('eve_miner', 'eve.miner@example.com', 'password123', 'Eve Williams', '+1-555-0105', true, 'active'),
('frank_dealer', 'frank.dealer@example.com', 'password123', 'Frank Miller', '+1-555-0106', true, 'active'),
('grace_buyer', 'grace.buyer@example.com', 'password123', 'Grace Lee', '+1-555-0107', true, 'active'),
('henry_seller', 'henry.seller@example.com', 'password123', 'Henry Davis', '+1-555-0108', true, 'active'),
('ivy_trader', 'ivy.trader@example.com', 'password123', 'Ivy Martinez', '+1-555-0109', true, 'active'),
('jack_investor', 'jack.investor@example.com', 'password123', 'Jack Wilson', '+1-555-0110', true, 'active'),
('kate_holder', 'kate.holder@example.com', 'password123', 'Kate Anderson', '+1-555-0111', true, 'active'),
('liam_crypto', 'liam.crypto@example.com', 'password123', 'Liam Taylor', '+1-555-0112', true, 'active'),
('mia_trader', 'mia.trader@example.com', 'password123', 'Mia Thomas', '+1-555-0113', true, 'active'),
('noah_buyer', 'noah.buyer@example.com', 'password123', 'Noah Jackson', '+1-555-0114', true, 'active'),
('olivia_seller', 'olivia.seller@example.com', 'password123', 'Olivia White', '+1-555-0115', true, 'active'),
('peter_miner', 'peter.miner@example.com', 'password123', 'Peter Harris', '+1-555-0116', true, 'active'),
('quinn_dealer', 'quinn.dealer@example.com', 'password123', 'Quinn Martin', '+1-555-0117', true, 'active'),
('ruby_investor', 'ruby.investor@example.com', 'password123', 'Ruby Thompson', '+1-555-0118', true, 'active'),
('sam_holder', 'sam.holder@example.com', 'password123', 'Sam Garcia', '+1-555-0119', true, 'active'),
('tina_crypto', 'tina.crypto@example.com', 'password123', 'Tina Martinez', '+1-555-0120', true, 'active');

-- Seed some tokens
INSERT INTO tokens (token_symbol, token_name, decimals, total_supply, price_usd, change_24h, volume_24h, market_cap_usd) VALUES
('BTC', 'Bitcoin', 8, 21000000, 45000.00, 2.5, 25000000000, 945000000000),
('ETH', 'Ethereum', 18, 120000000, 2800.00, -1.2, 15000000000, 336000000000),
('BNB', 'Binance Coin', 18, 200000000, 350.00, 0.8, 2000000000, 70000000000),
('SOL', 'Solana', 9, 500000000, 120.00, 3.5, 5000000000, 60000000000),
('USDT', 'Tether', 6, 100000000000, 1.00, 0.01, 50000000000, 100000000000);


