"use client"

import { createContext, useContext } from "react"
import { createPublicClient, createWalletClient, custom, formatEther, http } from "viem"
import { scroll, base, arbitrum, optimism, polygon, linea } from "viem/chains"
import { useWallet } from "../hooks/useWallet"
import { createConfig, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected } from 'wagmi/connectors'
import { CAProvider } from '@arcana/ca-wagmi'

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

// Configure wagmi
const config = createConfig({
  chains: [scroll],
  transports: {
    [scroll.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [linea.id]: http(),
  },
  connectors: [
    injected()
  ]
})

// Create a client for react-query
const queryClient = new QueryClient()

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet()

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <CAProvider>
          <WalletContext.Provider value={wallet}>
            {children}
          </WalletContext.Provider>
        </CAProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export function useWalletContext() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider")
  }
  return context
} 