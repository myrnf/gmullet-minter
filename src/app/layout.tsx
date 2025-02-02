import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { WalletProvider } from '@/contexts/WalletProvider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GMullet NFT Minter',
  description: 'Mint your GMullet NFT',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          {children}
        </WalletProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}