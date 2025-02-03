import { getCA } from '@/lib/utils';
import { EthereumProvider } from '@arcana/ca-sdk';
import { useState, useEffect } from 'react';
import { createPublicClient, createWalletClient, custom, formatEther, http } from 'viem';
import { scroll } from 'viem/chains';

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const publicClient = createPublicClient({
    chain: scroll,
    transport: http()
  });

  const updateBalance = async (address: string) => {
    if (!window.ethereum) return;
    
    try {
      setIsBalanceLoading(true);
      // CA: Get unified balance
      const ca = getCA(window.ethereum as unknown as EthereumProvider);
      await ca.init();

      const balance = await ca.getUnifiedBalance("ETH")
      setBalance(balance?.balance ?? '0');
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this feature');
      return;
    }

    try {
      setIsConnecting(true);
      const walletClient = createWalletClient({
        chain: scroll,
        transport: custom(window.ethereum)
      });
      
      // Request account access
      const [address] = await walletClient.requestAddresses();
      setAccount(address);

      // Switch to Scroll network if not already on it
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x82750' }], // Scroll Mainnet chainId
        });
      } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x82750',
              chainName: 'Scroll',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://rpc.scroll.io'],
              blockExplorerUrls: ['https://scrollscan.com']
            }]
          });
        }
      }

      // Get and set balance
      await updateBalance(address);

    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance('0');
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await updateBalance(accounts[0]);
        } else {
          setAccount(null);
          setBalance('0');
        }
      });

      window.ethereum.on('chainChanged', () => {
        // window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  return { 
    account, 
    balance, 
    isConnecting, 
    isBalanceLoading,
    connectWallet, 
    disconnectWallet,
    updateBalance
  };
} 