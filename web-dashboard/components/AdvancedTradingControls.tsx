'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Wallet,
  DollarSign,
  Percent,
  Timer,
  Zap,
  Database,
  TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AdvancedTradingControlsProps {
  isTrading: boolean
  onTradingChange: (trading: boolean) => void
  onSessionChange: (sessionId: string | null) => void
  currentWallet?: any
  sessionData?: any
}

interface TradingConfig {
  // Basic Configuration
  tokenAddress: string
  strategy: 'VOLUME_ONLY' | 'MAKERS_VOLUME'
  walletCount: number
  solAmount: number
  
  // Advanced Configuration
  slippagePercent: number
  maxRetries: number
  retryInterval: number
  maxLamports: number
  
  // Trading Durations
  tradeDurationVolume: number
  tradeDurationMaker: number
  loopInterval: number
  
  // Percentage Configuration
  minPercentage: number
  maxPercentage: number
  minSellPercentage: number
  maxSellPercentage: number
  buyDuration: number
  sellDuration: number
  
  // Pool Configuration
  poolSearchMaxRetries: number
  poolSearchRetryInterval: number
  
  // Fee Configuration
  rentExemptFee: number
  tokenTransferThreshold: number
}

export function AdvancedTradingControls({ 
  isTrading, 
  onTradingChange, 
  onSessionChange, 
  currentWallet,
  sessionData 
}: AdvancedTradingControlsProps) {
  const [config, setConfig] = useState<TradingConfig>({
    tokenAddress: '',
    strategy: 'VOLUME_ONLY',
    walletCount: 5,
    solAmount: 0.1,
    slippagePercent: 5,
    maxRetries: 15,
    retryInterval: 1000,
    maxLamports: 6000,
    tradeDurationVolume: 1200000000,
    tradeDurationMaker: 181000,
    loopInterval: 8000,
    minPercentage: 5,
    maxPercentage: 15,
    minSellPercentage: 50,
    maxSellPercentage: 100,
    buyDuration: 61000,
    sellDuration: 30000,
    poolSearchMaxRetries: 10,
    poolSearchRetryInterval: 2000,
    rentExemptFee: 900000,
    tokenTransferThreshold: 0
  })

  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [poolKeys, setPoolKeys] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Load default configuration from backend
  useEffect(() => {
    loadDefaultConfig()
  }, [])

  const loadDefaultConfig = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/config/default`)
      if (response.ok) {
        const defaultConfig = await response.json()
        setConfig(prev => ({ ...prev, ...defaultConfig }))
      }
    } catch (error) {
      console.error('Failed to load default config:', error)
    }
  }

  const validateToken = async () => {
    if (!config.tokenAddress) {
      toast.error('Please enter a token address')
      return
    }
    
    setIsValidating(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/tokens/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tokenAddress: config.tokenAddress,
          fetchPoolKeys: true 
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.valid) {
        setTokenInfo(data.tokenInfo)
        setPoolKeys(data.poolKeys)
        toast.success(`Token validated: ${data.tokenInfo.name} (${data.tokenInfo.symbol})`)
      } else {
        toast.error(data.error || 'Token validation failed')
        setTokenInfo(null)
        setPoolKeys(null)
      }
    } catch (error) {
      console.error('Token validation error:', error)
      toast.error('Failed to validate token')
      setTokenInfo(null)
      setPoolKeys(null)
    } finally {
      setIsValidating(false)
    }
  }

  const startAdvancedTrading = async () => {
    if (!currentWallet) {
      toast.error('Please create a wallet first')
      return
    }

    if (!tokenInfo || !poolKeys) {
      toast.error('Please validate a token first')
      return
    }

    setIsStarting(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/sessions/advanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: currentWallet.publicKey,
          adminWallet: currentWallet,
          tokenAddress: config.tokenAddress,
          tokenInfo,
          poolKeys,
          config,
          timestamp: new Date().toISOString()
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setCurrentSessionId(data.sessionId)
        onSessionChange(data.sessionId)
        onTradingChange(true)
        toast.success('Advanced trading session started!')
      } else {
        toast.error(data.error || 'Failed to start trading session')
      }
    } catch (error) {
      console.error('Start trading error:', error)
      toast.error('Failed to start trading session')
    } finally {
      setIsStarting(false)
    }
  }

  const stopTrading = async () => {
    if (!currentSessionId) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      await fetch(`${apiUrl}/api/sessions/${currentSessionId}/stop`, {
        method: 'POST'
      })
      
      onTradingChange(false)
      setCurrentSessionId(null)
      onSessionChange(null)
      toast.success('Trading session stopped')
    } catch (error) {
      console.error('Stop trading error:', error)
      toast.error('Failed to stop trading session')
    }
  }

  const pauseTrading = async () => {
    if (!currentSessionId) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      await fetch(`${apiUrl}/api/sessions/${currentSessionId}/pause`, {
        method: 'POST'
      })
      
      onTradingChange(false)
      toast.info('Trading session paused')
    } catch (error) {
      console.error('Pause trading error:', error)
      toast.error('Failed to pause trading session')
    }
  }

  const resumeTrading = async () => {
    if (!currentSessionId) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      await fetch(`${apiUrl}/api/sessions/${currentSessionId}/resume`, {
        method: 'POST'
      })
      
      onTradingChange(true)
      toast.success('Trading session resumed')
    } catch (error) {
      console.error('Resume trading error:', error)
      toast.error('Failed to resume trading session')
    }
  }

  const updateConfig = (field: keyof TradingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const tabs = [
    { id: 'basic', label: 'Basic', icon: Play },
    { id: 'advanced', label: 'Advanced', icon: Settings },
    { id: 'timing', label: 'Timing', icon: Timer },
    { id: 'fees', label: 'Fees', icon: DollarSign },
    { id: 'pool', label: 'Pool', icon: Database }
  ]

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Advanced Trading Controls
        </h2>
        
        <div className="flex items-center gap-2">
          {isTrading ? (
            <>
              <button
                onClick={pauseTrading}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button
                onClick={stopTrading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          ) : currentSessionId ? (
            <button
              onClick={resumeTrading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          ) : (
            <button
              onClick={startAdvancedTrading}
              disabled={!tokenInfo || !currentWallet || isStarting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              {isStarting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isStarting ? 'Starting...' : 'Start Trading'}
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {/* Token Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.tokenAddress}
                  onChange={(e) => updateConfig('tokenAddress', e.target.value)}
                  placeholder="Enter token address..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={validateToken}
                  disabled={isValidating || !config.tokenAddress}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  {isValidating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Validate
                </button>
              </div>
              
              {tokenInfo && (
                <div className="mt-2 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Token Validated: {tokenInfo.name} ({tokenInfo.symbol})</span>
                  </div>
                  {tokenInfo.price && (
                    <div className="mt-1 text-xs text-gray-400">
                      Price: ${tokenInfo.price} | 24h Volume: ${tokenInfo.volume24h}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Strategy Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trading Strategy
              </label>
              <select
                value={config.strategy}
                onChange={(e) => updateConfig('strategy', e.target.value as 'VOLUME_ONLY' | 'MAKERS_VOLUME')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="VOLUME_ONLY">Volume Only</option>
                <option value="MAKERS_VOLUME">Makers + Volume</option>
              </select>
            </div>

            {/* Wallet Count */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Trading Wallets
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.walletCount}
                onChange={(e) => updateConfig('walletCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* SOL Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SOL Amount per Wallet
              </label>
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={config.solAmount}
                onChange={(e) => updateConfig('solAmount', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Slippage */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Slippage Percentage
              </label>
              <input
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={config.slippagePercent}
                onChange={(e) => updateConfig('slippagePercent', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Max Retries */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Retries
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.maxRetries}
                onChange={(e) => updateConfig('maxRetries', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Retry Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Retry Interval (ms)
              </label>
              <input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={config.retryInterval}
                onChange={(e) => updateConfig('retryInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Max Lamports */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Lamports per Transaction
              </label>
              <input
                type="number"
                min="1000"
                max="100000"
                value={config.maxLamports}
                onChange={(e) => updateConfig('maxLamports', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Percentage Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Buy %
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.minPercentage}
                  onChange={(e) => updateConfig('minPercentage', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Buy %
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.maxPercentage}
                  onChange={(e) => updateConfig('maxPercentage', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Sell %
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.minSellPercentage}
                  onChange={(e) => updateConfig('minSellPercentage', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Sell %
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.maxSellPercentage}
                  onChange={(e) => updateConfig('maxSellPercentage', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timing' && (
          <div className="space-y-4">
            {/* Trading Durations */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Volume Strategy Duration (ms)
              </label>
              <input
                type="number"
                min="1000"
                max="86400000"
                value={config.tradeDurationVolume}
                onChange={(e) => updateConfig('tradeDurationVolume', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maker Strategy Duration (ms)
              </label>
              <input
                type="number"
                min="1000"
                max="86400000"
                value={config.tradeDurationMaker}
                onChange={(e) => updateConfig('tradeDurationMaker', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Loop Interval (ms)
              </label>
              <input
                type="number"
                min="1000"
                max="60000"
                value={config.loopInterval}
                onChange={(e) => updateConfig('loopInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buy Duration (ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="300000"
                  value={config.buyDuration}
                  onChange={(e) => updateConfig('buyDuration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sell Duration (ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="300000"
                  value={config.sellDuration}
                  onChange={(e) => updateConfig('sellDuration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rent Exempt Fee (lamports)
              </label>
              <input
                type="number"
                min="0"
                max="10000000"
                value={config.rentExemptFee}
                onChange={(e) => updateConfig('rentExemptFee', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Transfer Threshold
              </label>
              <input
                type="number"
                min="0"
                step="0.000001"
                value={config.tokenTransferThreshold}
                onChange={(e) => updateConfig('tokenTransferThreshold', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'pool' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pool Search Max Retries
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.poolSearchMaxRetries}
                onChange={(e) => updateConfig('poolSearchMaxRetries', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pool Search Retry Interval (ms)
              </label>
              <input
                type="number"
                min="100"
                max="10000"
                value={config.poolSearchRetryInterval}
                onChange={(e) => updateConfig('poolSearchRetryInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {poolKeys && (
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Pool Information</h4>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Pool ID: {poolKeys.id?.toString()}</div>
                  <div>Base Mint: {poolKeys.baseMint?.toString()}</div>
                  <div>Quote Mint: {poolKeys.quoteMint?.toString()}</div>
                  <div>Market ID: {poolKeys.marketId?.toString()}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}