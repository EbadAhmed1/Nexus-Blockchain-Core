import type { Block, Wallet, Token, Transaction } from "@/types/blockchain";

export const transformBlock = (data: any): Block => ({
  id: data.block_id?.toString() || "",
  height: parseInt(data.height) || 0,
  hash: data.block_hash || "",
  timestamp: data.timestamp || new Date().toISOString(),
  status: (data.status === "finalized" ? "finalized" : "pending") as "finalized" | "pending",
  gasUsed: parseFloat(data.gas_used) || 0,
  gasLimit: parseFloat(data.gas_limit) || 0,
  sizeKb: parseInt(data.size_kb) || 0,
  reward: parseFloat(data.reward) || 0,
  transactionIds: (data.transaction_ids || []).map((id: any) => id?.toString() || ""),
});

export const transformWallet = (data: any): Wallet => ({
  id: data.wallet_id?.toString() || "",
  label: data.label || "",
  address: data.address || "",
  publicKey: data.public_key || "",
  userId: data.user_id?.toString() || "",
  status: data.status || "active",
  createdAt: data.created_at || new Date().toISOString(),
  tokenHoldings: data.holdings?.map((h: any) => ({
    tokenId: h.token_id?.toString() || "",
    amount: parseFloat(h.amount) || 0,
  })) || [],
});

export const transformToken = (data: any): Token => ({
  id: data.token_id?.toString() || "",
  symbol: data.token_symbol || "",
  name: data.token_name || "",
  type: data.type || "",
  priceUsd: parseFloat(data.price_usd) || 0,
  change24h: parseFloat(data.change_24h) || 0,
  supply: parseFloat(data.total_supply) || 0,
  marketCapUsd: parseFloat(data.market_cap_usd) || 0,
  volume24h: parseFloat(data.volume_24h) || 0,
});

export const transformTransaction = (data: any): Transaction => ({
  id: data.transaction_id?.toString() || "",
  hash: data.tx_hash || data.hash || "",
  fromWalletId: data.from_wallet_id?.toString() || "",
  toWalletId: data.to_wallet_id?.toString() || "",
  fromAddress: data.from_address || "",
  toAddress: data.to_address || "",
  tokenId: data.token_id?.toString() || "",
  blockId: data.block_id?.toString() || "",
  amount: parseFloat(data.amount) || 0,
  fee: parseFloat(data.fee) || 0,
  status: data.status || "pending",
  timestamp: data.timestamp || new Date().toISOString(),
  method: data.method || "transfer",
});

