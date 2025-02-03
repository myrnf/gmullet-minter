"use client"

import { useWalletContext } from '@/contexts/WalletProvider';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Copy, ChevronDown, LogOut } from "lucide-react"

export default function WalletConnect() {
  const { account, balance, isConnecting, connectWallet, disconnectWallet } = useWalletContext();

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
    }
  };

  if (!account) {
    return (
      <Button
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-blue-600 text-white hover:bg-blue-700"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-gray-600">
        {parseFloat(balance).toFixed(5)} ETH
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {`${account.slice(0, 6)}...${account.slice(-4)}`}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={disconnectWallet}>
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}