"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import WalletConnect from "@/components/wallet-connect";
import { useState, useRef, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletProvider";
import { Loader2 } from "lucide-react";
import {
  createWalletClient,
  createPublicClient,
  custom,
  parseEther,
} from "viem";
import { scroll } from "viem/chains";
import { GMULLET_ABI, GMULLET_CONTRACT_ADDRESS } from "@/contracts/GMulletNFT";
import { toast } from "sonner";
import { EthereumProvider } from "@arcana/ca-sdk";
import { getCA, setAsyncInterval, clearAsyncInterval } from "@/lib/utils";
import { Intent } from "@arcana/ca-sdk";

export default function NFTMinter() {
  const [nftPrice] = useState<number>(0.0005); // ETH price
  const { account, balance, isConnecting, isBalanceLoading, updateBalance } =
    useWalletContext();
  const [isMinting, setIsMinting] = useState(false);

  // CA: Start
  const [intentOpen, setIntentOpen] = useState(false);
  const [intentRefreshing, setIntentRefreshing] = useState(false);
  const intentData = useRef({
    allow: () => {},
    deny: () => {},
    intent: null as Intent | null,
    intervalHandler: null as number | null,
  });

  useEffect(() => {
    if (window.ethereum) {
      const ca = getCA(window.ethereum as unknown as EthereumProvider);
      ca.setOnIntentHook(({ allow, deny, intent, refresh }) => {
        intentData.current.allow = allow;
        intentData.current.deny = deny;
        intentData.current.intent = intent;
        setIntentOpen(true);
        setTimeout(() => {
          intentData.current.intervalHandler = setAsyncInterval(async () => {
            console.time("intentRefresh");
            setIntentRefreshing(true);
            intentData.current.intent = await refresh();
            setIntentRefreshing(false);
            console.timeEnd("intentRefresh");
          }, 5000);
        }, 5000);
      });
    }
  }, []);
  // CA: End

  // Don't show any balance-related messages while loading
  const isLoading = isConnecting || isBalanceLoading || isMinting;

  // Only check balance after loading is complete
  const hasInsufficientBalance =
    !isLoading && account && parseFloat(balance) < nftPrice;

  // Button should be disabled during loading or if requirements aren't met
  const isMintDisabled = !account || hasInsufficientBalance || isLoading;

  const handleMint = async () => {
    if (!window.ethereum || !account) return;

    try {
      // CA: Create wallet client and public client
      const ca = getCA(window.ethereum as unknown as EthereumProvider);
      setIsMinting(true);

      const walletClient = createWalletClient({
        chain: scroll,
        transport: custom(ca),
      });

      const publicClient = createPublicClient({
        chain: scroll,
        transport: custom(window.ethereum),
      });

      // Create transaction
      const hash = await walletClient.writeContract({
        address: GMULLET_CONTRACT_ADDRESS,
        abi: GMULLET_ABI,
        functionName: "mint",
        value: parseEther(nftPrice.toString()),
        account: account as `0x${string}`,
      });

      // Show pending toast
      toast.loading("Minting your GMullet NFT...", {
        id: hash,
      });

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Update balance after successful mint
      await updateBalance(account);

      // Show success toast
      toast.success("Successfully minted your GMullet NFT!", {
        id: hash,
      });

      // Add link to transaction
      toast.message("View on ScrollScan", {
        action: {
          label: "View",
          onClick: () =>
            window.open(
              `https://scrollscan.com/tx/${receipt.transactionHash}`,
              "_blank"
            ),
        },
      });
    } catch (error: any) {
      console.error("Minting error:", error);
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
          <span>{isMinting ? "Minting..." : "Checking balance..."}</span>
        </div>
      );
    }

    if (!account) {
      return (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Connect wallet to mint
        </div>
      );
    }

    if (hasInsufficientBalance) {
      return (
        <div className="mt-4 text-center text-red-500 text-sm">
          Insufficient Balance
        </div>
      );
    }

    return null;
  };

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
        {intentOpen ? (
          <>
            <div>
              Total Source(including fees):{" "}
              {intentData.current.intent?.sourcesTotal}
            </div>
            <div>
              {intentData.current.intent?.sources.map((s) => {
                return (
                  <div key={s.chainID}>
                    <div>Chain: {s.chainName}</div>
                    <div>
                      Chain:{" "}
                      {s.amount + " " + intentData.current.intent?.token.symbol}
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <div>Solver Fees: {intentData.current.intent?.fees.solver}</div>
              <div>CA Fees: {intentData.current.intent?.fees.caGas}</div>
              <div>
                Gas supplied: {intentData.current.intent?.fees.gasSupplied}
              </div>
              <div>Total Fees: {intentData.current.intent?.fees.total}</div>
            </div>
            <div>
              <button
                onClick={() => {
                  setIntentOpen(false);
                  intentData.current.deny();
                  if (intentData.current.intervalHandler) {
                    clearAsyncInterval(intentData.current.intervalHandler);
                  }
                }}
              >
                Deny
              </button>
              <button
                onClick={() => {
                  setIntentOpen(false);
                  intentData.current.allow();
                  if (intentData.current.intervalHandler) {
                    clearAsyncInterval(intentData.current.intervalHandler);
                  }
                }}
              >
                {intentRefreshing ? "Refreshing" : "Allow"}
              </button>
            </div>
          </>
        ) : (
          ""
        )}
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
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Price
                </div>
                <Input
                  type="text"
                  value={`${nftPrice.toFixed(4)} ETH`}
                  className="bg-gray-50"
                  readOnly
                />
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
                    <span>{isMinting ? "Minting..." : "Loading..."}</span>
                  </div>
                ) : (
                  "Mint"
                )}
              </Button>
            </div>

            {getStatusMessage()}
          </div>
        </div>
      </main>
    </div>
  );
}
