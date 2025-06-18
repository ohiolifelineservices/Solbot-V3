'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  Plus, 
  Upload, 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  AlertCircle,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { WalletData } from '@/types'

interface WalletCreatorProps {
  onWalletCreated?: (wallet: WalletData) => void
}

export function WalletCreator({ onWalletCreated }: WalletCreatorProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'generate'>('import')
  const [privateKey, setPrivateKey] = useState('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createdWallet, setCreatedWallet] = useState<WalletData | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const createWallet = async (type: 'import' | 'generate') => {
    if (type === 'import' && !privateKey.trim()) {
      toast.error('Please enter a private key')
      return
    }

    setIsCreating(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/wallets/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          privateKey: type === 'import' ? privateKey.trim() : undefined,
          userWallet: '11111111111111111111111111111111' // Default user wallet
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedWallet(data.wallet)
        toast.success(data.message)
        onWalletCreated?.(data.wallet)
        
        // Clear form if importing
        if (type === 'import') {
          setPrivateKey('')
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create wallet')
      }
    } catch (error) {
      console.error('Create wallet error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create wallet')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      toast.success(`${type} copied to clipboard`)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadWalletInfo = () => {
    if (!createdWallet) return

    const walletInfo = {
      address: createdWallet.address,
      privateKey: createdWallet.privateKey,
      walletNumber: createdWallet.walletNumber,
      createdAt: new Date().toISOString(),
      solBalance: createdWallet.solBalance,
      tokenBalance: createdWallet.tokenBalance
    }

    const blob = new Blob([JSON.stringify(walletInfo, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wallet_${createdWallet.walletNumber}_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Wallet information downloaded')
  }

  const resetForm = () => {
    setCreatedWallet(null)
    setPrivateKey('')
    setShowPrivateKey(false)
    setCopied(null)
  }

  return (
    <div className="space-y-6">
      {!createdWallet ? (
        <>
          {/* Tab Selection */}
          <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'import'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Import Wallet</span>
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'generate'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Generate New</span>
            </button>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'import' ? (
              <div className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Security Notice</span>
                  </div>
                  <p className="text-yellow-300 text-sm">
                    Only import private keys from wallets you own. Never share your private keys with anyone.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Private Key (Base58)
                  </label>
                  <div className="relative">
                    <input
                      type={showPrivateKey ? 'text' : 'password'}
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="Enter your private key..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => createWallet('import')}
                  disabled={isCreating || !privateKey.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Importing Wallet...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Import Wallet</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">New Wallet Generation</span>
                  </div>
                  <p className="text-green-300 text-sm">
                    A new wallet will be generated with a unique private key. Make sure to save the private key securely.
                  </p>
                </div>

                <button
                  onClick={() => createWallet('generate')}
                  disabled={isCreating}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating Wallet...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Generate New Wallet</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      ) : (
        /* Wallet Created Success */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-400 mb-2">
              <Check className="w-5 h-5" />
              <span className="font-medium">Wallet Created Successfully!</span>
            </div>
            <p className="text-green-300 text-sm">
              Your wallet has been {activeTab === 'import' ? 'imported' : 'generated'} and is ready to use.
            </p>
          </div>

          {/* Wallet Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Address
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={createdWallet.address}
                  readOnly
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(createdWallet.address, 'Address')}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                >
                  {copied === 'Address' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Private Key
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type={showPrivateKey ? 'text' : 'password'}
                  value={createdWallet.privateKey || ''}
                  readOnly
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                >
                  {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(createdWallet.privateKey || '', 'Private Key')}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                >
                  {copied === 'Private Key' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Wallet Balances */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm">SOL Balance</div>
                <div className="text-white font-semibold text-lg">{createdWallet.solBalance.toFixed(6)}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Token Balance</div>
                <div className="text-white font-semibold text-lg">{createdWallet.tokenBalance.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={downloadWalletInfo}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Info</span>
            </button>
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Create Another
            </button>
          </div>

          {/* Security Warning */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Important Security Notice</span>
            </div>
            <p className="text-red-300 text-sm">
              Save your private key securely. Anyone with access to your private key can control your wallet and funds.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}