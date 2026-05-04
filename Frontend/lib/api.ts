import { api } from "./api-client";
import {
  transformBlock,
  transformWallet,
  transformToken,
  transformTransaction,
} from "./transformers";
import type { Block, Wallet, Token, Transaction } from "@/types/blockchain";

export const blocksApi = {
  getLatest: async (limit = 10): Promise<Block[]> => {
    const response = await api.get<{ blocks: any[] }>(`/api/blocks/latest?limit=${limit}`);
    return response.blocks.map(transformBlock);
  },
  getById: async (blockId: string): Promise<Block> => {
    const response = await api.get<{ block: any }>(`/api/blocks/${blockId}`);
    return transformBlock(response.block);
  },
  getTransactions: async (blockId: string): Promise<Transaction[]> => {
    const response = await api.get<{ transactions: any[] }>(`/api/blocks/${blockId}/transactions`);
    return response.transactions.map(transformTransaction);
  },
};



export const walletsApi = {
  getAll: async (userId?: string): Promise<Wallet[]> => {
    const url = userId ? `/api/wallets?userId=${userId}` : "/api/wallets";
    const response = await api.get<{ wallets: any[] }>(url);
    const wallets = response.wallets.map(transformWallet);

    const walletsWithHoldings = await Promise.all(
      wallets.map(async (wallet) => {
        try {
          const holdingsResponse = await api.get<{ holdings: any[] }>(
            `/api/wallets/${wallet.address}/holdings`
          );
          return {
            ...wallet,
            tokenHoldings: holdingsResponse.holdings.map((h: any) => ({
              tokenId: h.token_id?.toString() || "",
              amount: parseFloat(h.amount) || 0,
            })),
          };
        } catch {
          return wallet;
        }
      })
    );
    
    return walletsWithHoldings;
  },
  getByAddress: async (address: string): Promise<Wallet> => {
    const response = await api.get<{ wallet: any }>(`/api/wallets/${address}`);
    const wallet = transformWallet(response.wallet);

    try {
      const holdingsResponse = await api.get<{ holdings: any[] }>(
        `/api/wallets/${address}/holdings`
      );
      wallet.tokenHoldings = holdingsResponse.holdings.map((h: any) => ({
        tokenId: h.token_id?.toString() || "",
        amount: parseFloat(h.amount) || 0,
      }));
    } catch {
    }
    
    return wallet;
  },
  getHoldings: async (address: string): Promise<any[]> => {
    const response = await api.get<{ holdings: any[] }>(`/api/wallets/${address}/holdings`);
    return response.holdings;
  },
  getTransactions: async (address: string, limit = 20, offset = 0): Promise<Transaction[]> => {
    const response = await api.get<{ transactions: any[] }>(
      `/api/wallets/${address}/transactions?limit=${limit}&offset=${offset}`
    );
    return response.transactions.map(transformTransaction);
  },
  getBalance: async (address: string, tokenSymbol?: string): Promise<any[]> => {
    const url = tokenSymbol
      ? `/api/wallets/${address}/balance?tokenSymbol=${tokenSymbol}`
      : `/api/wallets/${address}/balance`;
    const response = await api.get<{ balances: any[] }>(url);
    return response.balances;
  },
  create: async (label: string, userId: string): Promise<Wallet> => {
    const response = await api.post<{ wallet: any }>("/api/wallets", { label, userId });
    return transformWallet(response.wallet);
  },
};



export const tokensApi = {
  getAll: async (limit = 100, offset = 0): Promise<Token[]> => {
    const response = await api.get<{ tokens: any[] }>(`/api/tokens?limit=${limit}&offset=${offset}`);
    return response.tokens.map(transformToken);
  },
  getBySymbol: async (symbol: string): Promise<Token> => {
    const response = await api.get<{ token: any }>(`/api/tokens/${symbol}`);
    return transformToken(response.token);
  },
  getHolders: async (symbol: string): Promise<any[]> => {
    const response = await api.get<{ holders: any[] }>(`/api/tokens/${symbol}/holders`);
    return response.holders;
  },
};



export const transactionsApi = {
  getAll: async (limit = 50, offset = 0): Promise<Transaction[]> => {
    const response = await api.get<{ transactions: any[] }>(
      `/api/transactions?limit=${limit}&offset=${offset}`
    );
    return response.transactions.map(transformTransaction);
  },
  getByHash: async (txHash: string): Promise<Transaction> => {
    const response = await api.get<{ transaction: any }>(`/api/transactions/${txHash}`);
    return transformTransaction(response.transaction);
  },
  create: async (data: {
    fromAddress: string;
    toAddress: string;
    tokenSymbol: string;
    amount: number;
    method?: string;
  }): Promise<Transaction> => {
    const response = await api.post<{ transaction: any }>("/api/transactions", data);
    return transformTransaction(response.transaction);
  },
};






export const searchApi = {
  wallets: async (query: string): Promise<any[]> => {
    const response = await api.get<{ wallets: any[] }>(`/api/search/wallets?q=${encodeURIComponent(query)}`);
    return response.wallets;
  },
  transactions: async (query: string): Promise<any[]> => {
    const response = await api.get<{ transactions: any[] }>(
      `/api/search/transactions?q=${encodeURIComponent(query)}`
    );
    return response.transactions;
  },
};



export const usersApi = {
  getAll: async (limit = 100, offset = 0): Promise<any[]> => {
    const response = await api.get<{ users: any[] }>(`/api/users?limit=${limit}&offset=${offset}`);
    return response.users;
  },
  register: async (data: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }): Promise<any> => {
    const response = await api.post<{ user: any; verificationToken: string }>("/api/users/register", data);
    return response;
  },
  login: async (email: string, password: string): Promise<any> => {
    const response = await api.post<{ user: any; message?: string }>("/api/users/login", { email, password });
    return response;
  },
  getProfile: async (userId: string): Promise<any> => {

    let numericId = userId;
    if (userId.includes("user-")) {
      numericId = userId.replace("user-", "");
    }

    if (isNaN(Number(numericId))) {

      numericId = numericId.replace(/\D/g, '');
    }

    if (!numericId || isNaN(Number(numericId))) {
      throw new Error(`Invalid user ID format: ${userId}`);
    }
    const response = await api.get<{ user: any }>(`/api/users/${numericId}`);
    return response.user;
  },
  updateProfile: async (userId: string, data: { fullName?: string; phone?: string }): Promise<any> => {

    const numericId = userId.includes("user-") ? userId.replace("user-", "") : userId;
    const response = await api.put<{ user: any }>(`/api/users/${numericId}`, data);
    return response.user;
  },
  verifyEmail: async (code: string): Promise<void> => {
    await api.post("/api/users/verify-email", { code });
  },
  resendVerification: async (email: string): Promise<void> => {
    await api.post("/api/users/resend-verification", { email });
  },
  requestDeleteAccount: async (userId: string): Promise<void> => {
    const numericId = userId.includes("user-") ? userId.replace("user-", "") : userId;
    await api.post("/api/users/request-delete-account", { userId: parseInt(numericId) });
  },
  deleteAccount: async (userId: string, code: string): Promise<void> => {
    const numericId = userId.includes("user-") ? userId.replace("user-", "") : userId;
    await api.post("/api/users/delete-account", { userId: parseInt(numericId), code });
  },
};



export const p2pApi = {
  getUsersWithTokens: async (): Promise<any[]> => {
    const response = await api.get<{ users: any[] }>("/api/p2p/users-with-tokens");
    return response.users;
  },
  createOrder: async (data: {
    userId: number;
    tokenId: number;
    orderType: "buy" | "sell";
    amount: number;
    price: number;
    paymentMethod?: string;
    minLimit?: number;
    maxLimit?: number;
  }): Promise<any> => {
    const response = await api.post<{ order: any }>("/api/p2p/orders", data);
    return response.order;
  },
  getOrders: async (params?: {
    orderType?: "buy" | "sell";
    tokenId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const queryParams = new URLSearchParams();
    if (params?.orderType) queryParams.append("orderType", params.orderType);
    if (params?.tokenId) queryParams.append("tokenId", params.tokenId.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    
    const response = await api.get<{ orders: any[] }>(`/api/p2p/orders?${queryParams.toString()}`);
    return response.orders;
  },
  getOrderDetails: async (orderId: string): Promise<any> => {
    const response = await api.get<{ order: any }>(`/api/p2p/orders/${orderId}`);
    return response.order;
  },
  cancelOrder: async (orderId: string, userId: number): Promise<void> => {
    await api.post(`/api/p2p/orders/${orderId}/cancel`, { userId });
  },
  createTransaction: async (data: {
    buyerId: number;
    sellerId: number;
    tokenId: number;
    amount: number;
    price: number;
  }): Promise<any> => {
    const response = await api.post<{ transaction: any }>("/api/p2p/transactions", data);
    return response.transaction;
  },
  acceptTransaction: async (transactionId: string, userId: number): Promise<void> => {
    await api.post(`/api/p2p/transactions/${transactionId}/accept`, { userId });
  },
  rejectTransaction: async (transactionId: string, userId: number): Promise<void> => {
    await api.post(`/api/p2p/transactions/${transactionId}/reject`, { userId });
  },
  transferTokens: async (transactionId: string, userId: number): Promise<void> => {
    await api.post(`/api/p2p/transactions/${transactionId}/transfer`, { userId });
  },
  getTransactions: async (params?: {
    userId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append("userId", params.userId.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    
    const response = await api.get<{ transactions: any[] }>(`/api/p2p/transactions?${queryParams.toString()}`);
    return response.transactions;
  },
  updateTransactionStatus: async (
    transactionId: string,
    data: { status: string; paymentProof?: string; userId: number }
  ): Promise<void> => {
    await api.put(`/api/p2p/transactions/${transactionId}/status`, data);
  },
};



export const emailApi = {
  getNotifications: async (userId: number): Promise<any[]> => {
    const response = await api.get<{ notifications: any[] }>(`/api/email/notifications?userId=${userId}`);
    return response.notifications;
  },
  markAsRead: async (verificationId: number): Promise<void> => {
    await api.post("/api/email/mark-read", { verificationId });
  },
};



export const marketApi = {
  getTradingPairs: async (): Promise<any[]> => {
    const response = await api.get<{ pairs: any[] }>("/api/market/trading-pairs");
    return response.pairs;
  },
  getPairDetails: async (symbol: string): Promise<any> => {
    const response = await api.get<{ pair: any }>(`/api/market/pair/${symbol}`);
    return response.pair;
  },
  getPriceHistory: async (symbol: string, interval = "1h", limit = 100): Promise<any> => {
    const response = await api.get<{ history: any[] }>(
      `/api/market/price-history/${symbol}?interval=${interval}&limit=${limit}`
    );
    return response.history;
  },
  getOrderBook: async (symbol: string): Promise<any> => {
    const response = await api.get<{ buys: any[]; sells: any[] }>(`/api/market/orderbook/${symbol}`);
    return response;
  },
  buyWithUSDT: async (data: {
    userId: number;
    tokenId: number;
    usdtAmount: number;
  }): Promise<any> => {
    const response = await api.post<{ purchase: any }>("/api/market/buy", data);
    return response.purchase;
  },
};



export const conversionApi = {
  swap: async (data: {
    userId: number;
    fromTokenId: number;
    toTokenId: number;
    amount: number;
  }): Promise<any> => {
    const response = await api.post<{ conversion: any }>("/api/conversion/swap", data);
    return response.conversion;
  },
  getRate: async (fromTokenId: number, toTokenId: number, amount?: number): Promise<any> => {
    const queryParams = new URLSearchParams();
    queryParams.append("fromTokenId", fromTokenId.toString());
    queryParams.append("toTokenId", toTokenId.toString());
    if (amount) queryParams.append("amount", amount.toString());
    
    const response = await api.get<{ rate: any }>(`/api/conversion/rate?${queryParams.toString()}`);
    return response.rate;
  },
};



export const walletManagementApi = {
  deposit: async (address: string, tokenId: number, amount: number): Promise<void> => {
    await api.post(`/api/wallets/${address}/deposit`, { tokenId, amount });
  },
  withdraw: async (address: string, tokenId: number, amount: number, toAddress?: string): Promise<void> => {
    await api.post(`/api/wallets/${address}/withdraw`, { tokenId, amount, toAddress });
  },
  transfer: async (address: string, toAddress: string, tokenId: number, amount: number): Promise<any> => {
    const response = await api.post<{ transactionHash: string }>(`/api/wallets/${address}/transfer`, {
      toAddress,
      tokenId,
      amount,
    });
    return response;
  },
};

