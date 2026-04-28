"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { toast } from "sonner"

import { blocksApi, walletsApi, tokensApi, transactionsApi, usersApi } from "@/lib/api"
import type {
  AppUser,
  Block,
  CreateWalletInput,
  Token,
  Transaction,
  Wallet,
} from "@/types/blockchain"

type ThemeMode = "light" | "dark"

interface AppStoreState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  hasHydrated: boolean
  markHydrated: () => void

  currentUser: AppUser | null
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void

  users: AppUser[]
  wallets: Wallet[]
  tokens: Token[]
  transactions: Transaction[]
  blocks: Block[]

  isLoading: {
    blocks: boolean
    wallets: boolean
    tokens: boolean
    transactions: boolean
  }

  fetchBlocks: () => Promise<void>
  fetchWallets: (userId?: string) => Promise<void>
  fetchTokens: () => Promise<void>
  fetchTransactions: () => Promise<void>

  addWallet: (payload: CreateWalletInput) => Promise<Wallet>
  sendTransaction: (data: {
    fromAddress: string
    toAddress: string
    tokenSymbol: string
    amount: number
    method?: string
  }) => Promise<Transaction | null>

  p2pEnabled: boolean
  setP2pEnabled: (enabled: boolean) => void
}

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(16).slice(2, 8)}`

const randomHex = (length: number) => {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
  return uuid.replace(/-/g, "").padEnd(length, "0").slice(0, length)
}

const generateHash = () => `0x${randomHex(64)}`

const generateAddress = () => `0x${randomHex(40)}`

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      hasHydrated: false,
      markHydrated: () => set({ hasHydrated: true }),

      currentUser: null,
      login: async (email, password, userData?: any) => {
        try {
          let user: any;
          
          if (userData) {
            user = userData;
          } else {
            const loginResponse = await usersApi.login(email, password)
            if (!loginResponse || !loginResponse.user) {
              console.error("Login response:", loginResponse)
              return { success: false, message: loginResponse?.message || "Invalid login response" }
            }
            user = loginResponse.user;
          }
          
          if (!user || (!user.userId && !user.id)) {
            return { success: false, message: "User data not available" }
          }
          
          const numericUserId = user.userId || user.id;
          const appUser: AppUser = {
            id: numericUserId.toString(),
            name: user.fullName || user.username,
            email: user.email,
            password: "",
            role: "user" as const,
            title: "User",
            organization: "BlockChain Explorer",
            status: user.status === "active" ? "active" : "suspended",
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            avatar: "/placeholder-user.jpg",
          }
          set({ currentUser: appUser })

          await get().fetchWallets(numericUserId.toString())
          await get().fetchTokens()
          return { success: true }
        } catch (error: any) {
          const message = error.data?.message || error.message || "Login failed"
          return { success: false, message }
        }
      },
      logout: () => set({ currentUser: null }),

      users: [],
      wallets: [],
      tokens: [],
      transactions: [],
      blocks: [],

      isLoading: {
        blocks: false,
        wallets: false,
        tokens: false,
        transactions: false,
      },

      fetchBlocks: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, blocks: true } }))
        try {
          const blocks = await blocksApi.getLatest(50)
          set({ blocks })
        } catch (error) {
          console.error("Failed to fetch blocks:", error)
          toast.error("Failed to load blocks")
        } finally {
          set((state) => ({ isLoading: { ...state.isLoading, blocks: false } }))
        }
      },

      fetchWallets: async (userId?: string) => {
        set((state) => ({ isLoading: { ...state.isLoading, wallets: true } }))
        try {
          const targetUserId = userId || get().currentUser?.id
          const wallets = await walletsApi.getAll(targetUserId)
          set({ wallets })
        } catch (error) {
          console.error("Failed to fetch wallets:", error)
          toast.error("Failed to load wallets")
        } finally {
          set((state) => ({ isLoading: { ...state.isLoading, wallets: false } }))
        }
      },

      fetchTokens: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, tokens: true } }))
        try {
          const tokenList = await tokensApi.getAll(100)
          set({ tokens: tokenList })
        } catch (error) {
          console.error("Failed to fetch tokens:", error)

        } finally {
          set((state) => ({ isLoading: { ...state.isLoading, tokens: false } }))
        }
      },

      fetchTransactions: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, transactions: true } }))
        try {
          const transactions = await transactionsApi.getAll(100)
          set({ transactions })
        } catch (error) {
          console.error("Failed to fetch transactions:", error)
          toast.error("Failed to load transactions")
        } finally {
          set((state) => ({ isLoading: { ...state.isLoading, transactions: false } }))
        }
      },

      addWallet: async (payload) => {
        if (!get().currentUser) {
          toast.error("Please login to create a wallet")
          throw new Error("Not authenticated")
        }

        try {

          const userProfile = await usersApi.getProfile(get().currentUser!.id)
          const wallet = await walletsApi.create(payload.label, userProfile.user_id.toString())
          set((state) => ({ wallets: [wallet, ...state.wallets] }))
          toast.success(`Wallet ${wallet.label} created`)
          return wallet
        } catch (error) {
          console.error("Failed to create wallet:", error)
          toast.error("Failed to create wallet")
          throw error
        }
      },

      sendTransaction: async (data) => {
        try {
          const transaction = await transactionsApi.create(data)
          set((state) => ({ transactions: [transaction, ...state.transactions] }))

          await get().fetchWallets()
          
          toast.success("Transaction sent successfully")
          return transaction
        } catch (error: any) {
          console.error("Failed to send transaction:", error)
          const message = error.data?.message || "Failed to send transaction"
          toast.error(message)
          return null
        }
      },

      p2pEnabled: false,
      setP2pEnabled: (enabled) => set({ p2pEnabled: enabled }),
    }),
    {
      name: "blockview-app-store",
      onRehydrateStorage: () => (state) => {
        state?.markHydrated()
      },
      partialize: (state) => ({
        theme: state.theme,
        currentUser: state.currentUser,
        users: state.users,
        wallets: state.wallets,
        tokens: state.tokens,
        transactions: state.transactions,
        blocks: state.blocks,
        p2pEnabled: state.p2pEnabled,
      }),
    },
  ),
)

