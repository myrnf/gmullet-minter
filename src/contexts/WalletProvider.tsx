"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createPublicClient, custom, formatEther, http } from "viem"
import { scroll } from "viem/chains"

interface WalletContextType {
  account: string | null
  balance: string
  isConnecting: boolean
  isBalanceLoading: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  updateBalance: (address: string) => Promise<void>
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState("0")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)

  const updateBalance = async (address: string) => {
    setIsBalanceLoading(true)
    const publicClient = createPublicClient({
        chain: scroll,
        transport: http(),
      });
    try {
      const balance = await publicClient.getBalance({ 
        address: address as `0x${string}` 
      })
      setBalance(formatEther(balance))
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance("0")
    } finally {
      setIsBalanceLoading(false)
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!")
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      
      const address = accounts[0]
      setAccount(address)
      await updateBalance(address)
    } catch (error) {
      console.error('Connection error:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setBalance("0")
  }

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0])
            updateBalance(accounts[0])
          }
        })

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          updateBalance(accounts[0])
        } else {
          disconnectWallet()
        }
      })
    }
  }, [])

  return (
    <WalletContext.Provider value={{
      account,
      balance,
      isConnecting,
      isBalanceLoading,
      connectWallet,
      disconnectWallet,
      updateBalance
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWalletContext = () => useContext(WalletContext) 