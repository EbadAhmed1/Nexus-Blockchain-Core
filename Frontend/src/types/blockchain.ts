export type UserRole = "user"

export interface AppUser {
  id: string
  name: string
  email: string
  password: string
  role?: UserRole
  title: string
  organization: string
  status: "active" | "away" | "suspended"
  lastLogin: string
  createdAt: string
  avatar: string
}

export interface TokenHolding {
  tokenId: string
  amount: number
}

export interface Wallet {
  id: string
  label: string
  address: string
  publicKey: string
  userId: string
  status: "active" | "suspended"
  createdAt: string
  tokenHoldings: TokenHolding[]
}

export interface Token {
  id: string
  symbol: string
  name: string
  type: string
  priceUsd: number
  change24h: number
  supply: number
  marketCapUsd: number
  volume24h?: number
}

export interface Transaction {
  id: string
  hash: string
  fromWalletId: string
  toWalletId: string
  fromAddress?: string
  toAddress?: string
  tokenId: string
  blockId: string
  amount: number
  fee: number
  status: "confirmed" | "pending" | "failed"
  timestamp: string
  method: string
}

export interface Block {
  id: string
  height: number
  hash: string
  timestamp: string
  status: "finalized" | "pending"
  gasUsed: number
  gasLimit: number
  sizeKb: number
  reward: number
  transactionIds: string[]
}

export type CreateWalletInput = {
  label: string
  userId: string
  tokenHoldings?: TokenHolding[]
}

export type CreateTokenInput = {
  symbol: string
  name: string
  type: string
  priceUsd: number
  supply: number
}

export type CreateTransactionInput = {
  fromWalletId: string
  toWalletId: string
  tokenId: string
  amount: number
  blockId?: string
  status?: Transaction["status"]
  method?: string
}

export type CreateUserInput = {
  name: string
  email: string
  password: string
  role?: UserRole
}

