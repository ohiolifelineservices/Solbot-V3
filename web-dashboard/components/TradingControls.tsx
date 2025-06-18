'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, Settings, Search, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { TokenInfo } from '@/types'

interface TradingControlsProps {
  isTrading: boolean
  onTradingChange: (trading: boolean) => void
  onSessionChange: (sessionId: string | null) => void
  currentWallet?: any
  onCreateWallet?: () => void
}

export function TradingControls({ isTrading, onTradingChange, onSessionChange, currentWallet, onCreateWallet }: TradingControlsProps) {
  const { publicKey, connected } = useWallet()
  const [tokenAddress, setTokenAddress] = useState('')
  const [strategy, setStrategy] = useState('volume_only')
  const [walletCount, setWalletCount] = useState(5)
  const [solAmount, setSolAmount] = useState(0.1)
  const [isValidating, setIsValidating] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const validateToken = async () => {
    if (!tokenAddress) return
    
    setIsValidating(true)
    try {
      // Call backend token validation endpoint (includes pool key fetching)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/tokens/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenAddress }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.valid && data.tokenInfo) {
        const tokenInfo = {
          address: data.tokenInfo.address,
          name: data.tokenInfo.name,
          symbol: data.tokenInfo.symbol,
          price: data.tokenInfo.price,
          volume24h: data.tokenInfo.volume24h,
          marketCap: data.tokenInfo.marketCap,
          verified: data.tokenInfo.verified,
          hasPool: data.tokenInfo.hasPool,
          poolKeys: data.tokenInfo.poolKeys
        }
        
        setTokenInfo(tokenInfo)
        toast.success(`Token validated: ${tokenInfo.name} (${tokenInfo.symbol})`)
      } else {
        toast.error(data.error || 'Token validation failed')
        setTokenInfo(null)
      }
    } catch (error) {
      console.error('Token validation error:', error)
      toast.error('Failed to validate token - please check the address')
      setTokenInfo(null)
    } finally {
      setIsValidating(false)
    }
  }

  const startTrading = async () => {
    if (!currentWallet) {
      toast.error('Please create a wallet first')
      return
    }

    if (!tokenAddress || !tokenInfo) {
      toast.error('Please validate a token first')
      return
    }

    setIsStarting(true)
    try {
      // Create real backend session
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet: currentWallet.publicKey,
          tokenAddress,
          tokenName: tokenInfo.name,
          tokenSymbol: tokenInfo.symbol,
          strategy: strategy === 'volume_only' ? 'VOLUME_ONLY' : 'MAKERS_VOLUME',
          walletCount,
          solAmount
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.sessionId) {
        setCurrentSessionId(data.sessionId)
        onSessionChange(data.sessionId)
        onTradingChange(true)
        toast.success(`Trading session started! Session: ${data.sessionId}`)
        console.log('Session created:', data)
      } else {
        throw new Error(data.error || 'Failed to create session')
      }
    } catch (error) {
      console.error('Start trading error:', error)
      toast.error('Failed to start trading session')
    } finally {
      setIsStarting(false)
    }
  }

  const pauseTrading = async () => {
    if (!currentSessionId) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/sessions/${currentSessionId}/pause`, {
        method: 'POST',
      })
      
      if (response.ok) {
        onTradingChange(false)
        toast.success('Trading paused')
      } else {
        throw new Error('Failed to pause session')
      }
    } catch (error) {
      console.error('Pause trading error:', error)
      toast.error('Failed to pause trading')
    }
  }

  const stopTrading = async () => {
    if (!currentSessionId) {
      // If no session, just reset UI
      onTradingChange(false)
      setTokenInfo(null)
      setTokenAddress('')
      setCurrentSessionId(null)
      onSessionChange(null)
      toast.success('Trading stopped')
      return
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/sessions/${currentSessionId}/stop`, {
        method: 'POST',
      })
      
      if (response.ok) {
        onTradingChange(false)
        setTokenInfo(null)
        setTokenAddress('')
        setCurrentSessionId(null)
        onSessionChange(null)
        toast.success('Trading stopped')
      } else {
        throw new Error('Failed to stop session')
      }
    } catch (error) {
      console.error('Stop trading error:', error)
      toast.error('Failed to stop trading')
      // Reset UI anyway
      onTradingChange(false)
      setTokenInfo(null)
      setTokenAddress('')
      setCurrentSessionId(null)
      onSessionChange(null)
    }
  }

  const restartTrading = async () => {
    if (!currentSessionId) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/sessions/${currentSessionId}/restart`, {
        method: 'POST',
      })
      
      if (response.ok) {
        onTradingChange(true)
        toast.success('Trading restarted')
      } else {
        throw new Error('Failed to restart session')
      }
    } catch (error) {
      console.error('Restart trading error:', error)
      toast.error('Failed to restart trading')
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Trading Controls</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isTrading ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          <span className="text-sm text-gray-300">
            {isTrading ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Wallet Connection Status */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Trading Wallet Status</h3>
            {currentWallet ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-400">Connected</span>
                <span className="text-xs text-gray-400 font-mono">
                  {currentWallet.publicKey.slice(0, 8)}...{currentWallet.publicKey.slice(-8)}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-400">No wallet connected</span>
              </div>
            )}
          </div>
          {!currentWallet && (
            <button
              onClick={() => onCreateWallet?.()}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            >
              Create Wallet
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Token Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Token Address
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="Enter Solana token address..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isTrading}
            />
            <button
              onClick={validateToken}
              disabled={isValidating || isTrading || !tokenAddress}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              {isValidating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Validate</span>
            </button>
          </div>
          
          {tokenInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg"
            >
              <div className="flex items-center space-x-2 text-green-400 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Token Validated</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white ml-2">{tokenInfo.name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Symbol:</span>
                  <span className="text-white ml-2">{tokenInfo.symbol}</span>
                </div>
                <div>
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white ml-2">{tokenInfo.price}</span>
                </div>
                <div>
                  <span className="text-gray-400">24h Volume:</span>
                  <span className="text-white ml-2">{tokenInfo.volume24h}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Strategy Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Trading Strategy
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            disabled={isTrading}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="volume_only">Volume Only</option>
            <option value="makers_volume">Makers + Volume</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {strategy === 'volume_only' 
              ? 'Focus purely on generating trading volume'
              : 'Create market depth while generating volume'
            }
          </p>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Wallets
            </label>
            <input
              type="number"
              value={walletCount}
              onChange={(e) => setWalletCount(Number(e.target.value))}
              min="1"
              max="20"
              disabled={isTrading}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              SOL Amount
            </label>
            <input
              type="number"
              value={solAmount}
              onChange={(e) => setSolAmount(Number(e.target.value))}
              min="0.01"
              step="0.01"
              disabled={isTrading}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Session Information */}
        {currentSessionId && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Active Session:</span>
              <span className="text-green-400 font-semibold font-mono">{currentSessionId}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-300">Status:</span>
              <span className="text-green-400 font-semibold">Ready for Trading</span>
            </div>
          </div>
        )}

        {/* Fee Information */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Estimated fee per transaction:</span>
            <span className="text-blue-400 font-semibold">0.001 SOL</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-300">Free trades remaining:</span>
            <span className="text-green-400 font-semibold">8</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-3">
          {!isTrading ? (
            <div className="flex space-x-3 w-full">
              <button
                onClick={startTrading}
                disabled={!tokenInfo || isStarting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isStarting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Session...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Start Trading</span>
                  </>
                )}
              </button>
              {currentSessionId && (
                <button
                  onClick={restartTrading}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Restart</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={pauseTrading}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </button>
              <button
                onClick={stopTrading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Square className="w-5 h-5" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}