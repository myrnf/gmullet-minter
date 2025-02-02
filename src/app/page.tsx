"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import WalletConnect from "@/components/wallet-connect"
import { useState } from "react"
import { useWalletContext } from "@/contexts/WalletProvider"
import { Loader2 } from "lucide-react"
import { ethers } from "ethers"
import { GMULLET_ABI, GMULLET_CONTRACT_ADDRESS } from "@/contracts/GMulletNFT"
import { toast } from "sonner"

export default function NFTMinter() {
  const [nftPrice] = useState<number>(0.0005) // ETH price
  const { account, balance, isConnecting, isBalanceLoading, updateBalance } = useWalletContext()
  const [isMinting, setIsMinting] = useState(false)

  // Don't show any balance-related messages while loading
  const isLoading = isConnecting || isBalanceLoading || isMinting
  
  // Only check balance after loading is complete
  const hasInsufficientBalance = !isLoading && account && parseFloat(balance) < nftPrice
  
  // Button should be disabled during loading or if requirements aren't met
  const isMintDisabled = !account || hasInsufficientBalance || isLoading

  const handleMint = async () => {
    if (!window.ethereum || !account) return;

    try {
      setIsMinting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(
        GMULLET_CONTRACT_ADDRESS,
        GMULLET_ABI,
        signer
      );

      // Create transaction
      const tx = await contract.mint({
        value: ethers.parseEther(nftPrice.toString())
      });

      // Show pending toast
      toast.loading("Minting your GMullet NFT...", {
        id: tx.hash,
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Update balance after successful mint
      await updateBalance(account);

      // Show success toast
      toast.success("Successfully minted your GMullet NFT!", {
        id: tx.hash,
      });

      // Add link to transaction
      toast.message("View on ScrollScan", {
        action: {
          label: "View",
          onClick: () => window.open(`https://scrollscan.com/tx/${receipt.hash}`, '_blank'),
        },
      });

    } catch (error: any) {
      console.error('Minting error:', error);
      toast.error(error.message || "Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };

  const getStatusMessage = () => {
    if (isLoading) {
      return (
        <div className="mt-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{isMinting ? 'Minting...' : 'Checking balance...'}</span>
        </div>
      )
    }
    
    if (!account) {
      return (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Connect wallet to mint
        </div>
      )
    }
    
    if (hasInsufficientBalance) {
      return (
        <div className="mt-4 text-center text-red-500 text-sm">
          Insufficient Balance
        </div>
      )
    }
    
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-800">GMullet</span>
          </div>

          <WalletConnect />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="aspect-square relative mb-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Mullet%20Guy%202-01-jUnBDjE5qHyYpTyl8H6MMcVA9WjDbQ.png"
                alt="NFT Preview"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 mb-2">Price</div>
                <Input type="text" value={`${nftPrice.toFixed(4)} ETH`} className="bg-gray-50" readOnly />
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isMintDisabled}
                onClick={handleMint}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isMinting ? 'Minting...' : 'Loading...'}</span>
                  </div>
                ) : (
                  'Mint'
                )}
              </Button>
            </div>

            {getStatusMessage()}
          </div>
        </div>
      </main>
    </div>
  )
}