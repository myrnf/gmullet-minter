"use client"

import { createContext, useContext } from "react"
import { createPublicClient, createWalletClient, custom, formatEther, http } from "viem"
import { scroll } from "viem/chains"
import { useWallet } from "../hooks/useWallet"

interface WalletContextType {
  account: string | null
  balance: string
  isConnecting: boolean
  isBalanceLoading: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  updateBalance: (address: string) => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet()

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWalletContext() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider")
  }
  return context
} 