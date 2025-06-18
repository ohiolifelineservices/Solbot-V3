'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Wallet,
  Users,
  DollarSign,
  Zap,
  Settings,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../lib/api'

interface BackendFlowTradingControlsProps {
  isTrading: boolean
  onTradingChange: (trading: boolean) => void
  onSessionChange: (sessionId: string) => void
  currentWallet?: any
  sessionData?: any
  onWalletCreated?: (wallet: any) => void
}

interface TradingConfig {
  strategy: 'VOLUME_ONLY' | 'MAKERS_VOLUME'
  walletCount: number
  solAmount: number
  slippagePercent: number
  maxRetries: number
  retryInterval: number
  maxLamports: number
  tradeDurationVolume: number
  tradeDurationMaker: number
  loopInterval: number
  minPercentage: number
  maxPercentage: number
  minSellPercentage: number
  maxSellPercentage: number
  buyDuration: number
  sellDuration: number
  poolSearchMaxRetries: number
  poolSearchRetryInterval: number
  rentExemptFee: number
  tokenTransferThreshold: number
}

export function BackendFlowTradingControls({ 
  isTrading, 
  onTradingChange, 
  onSessionChange,
  currentWallet,
  sessionData,
  onWalletCreated
}: BackendFlowTradingControlsProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [poolKeys, setPoolKeys] = useState<any>(null)
  const [adminWallet, setAdminWallet] = useState<any>(null)
  const [tradingWallets, setTradingWallets] = useState<any[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isCreatingWallets, setIsCreatingWallets] = useState(false)
  const [isDistributing, setIsDistributing] = useState(false)
  const [config, setConfig] = useState<TradingConfig>({
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

  // Steps that match the exact backend flow from index.ts
  const steps = [
    { 
      id: 1, 
      title: 'Token Discovery', 
      description: 'Validate token address and fetch pool keys',
      icon: CheckCircle,
      color: 'blue'
    },
    { 
      id: 2, 
      title: 'Admin Wallet Setup', 
      description: 'Create or import admin wallet (this wallet funds all trading wallets)',
      icon: Wallet,
      color: 'purple'
    },
    { 
      id: 3, 
      title: 'Generate Trading Wallets', 
      description: 'Create the specified number of trading wallets',
      icon: Users,
      color: 'green'
    },
    { 
      id: 4, 
      title: 'Distribute SOL', 
      description: 'Admin wallet distributes SOL to all trading wallets',
      icon: DollarSign,
      color: 'yellow'
    },
    { 
      id: 5, 
      title: 'Distribute Tokens (Optional)', 
      description: 'If admin has tokens, distribute them to trading wallets',
      icon: Zap,
      color: 'orange'
    },
    { 
      id: 6, 
      title: 'Start Trading', 
      description: 'Choose strategy and begin automated trading',
      icon: Play,
      color: 'red'
    }
  ]

  // Step 1: Token Discovery
  const validateToken = async () => {
    if (!tokenAddress.trim()) {
      toast.error('Please enter a token address')
      return
    }

    setIsValidating(true)
    try {
      // Call with fetchPoolKeys=true to match backend flow
      const data = await api.validateToken(tokenAddress.trim(), true)
      
      if (data.valid && data.tokenInfo) {
        setTokenInfo(data.tokenInfo)
        setPoolKeys(data.poolKeys) // Pool keys returned separately from backend
        toast.success(`Token validated: ${data.tokenInfo.name} (${data.tokenInfo.symbol})`)
        setCurrentStep(2) // Move to Admin Wallet step
      } else {
        toast.error(data.error || 'Token validation failed')
      }
    } catch (error) {
      toast.error(`Token validation failed: ${error.message}`)
      console.error('Token validation error:', error)
    } finally {
      setIsValidating(false)
    }
  }

  // Step 2: Admin Wallet Setup
  const createAdminWallet = async () => {
    try {
      const data = await api.createWallet('generate')
      
      if (data.success && data.publicKey) {
        const wallet = {
          address: data.publicKey,
          publicKey: data.publicKey,
          privateKey: data.privateKey,
          balance: 0,
          fromBackendFlow: true
        }
        setAdminWallet(wallet)
        
        // Notify parent component about wallet creation
        if (onWalletCreated) {
          onWalletCreated(wallet)
        }
        
        toast.success('Admin wallet created successfully')
        setCurrentStep(3)
      } else {
        toast.error(data.error || 'Failed to create admin wallet')
      }
    } catch (error) {
      toast.error(`Failed to create admin wallet: ${error.message}`)
      console.error('Admin wallet creation error:', error)
    }
  }

  const importAdminWallet = async (privateKey: string) => {
    try {
      const data = await api.createWallet('import', privateKey)
      
      if (data.success && data.publicKey) {
        const wallet = {
          address: data.publicKey,
          publicKey: data.publicKey,
          privateKey: privateKey,
          balance: 0,
          fromBackendFlow: true
        }
        setAdminWallet(wallet)
        
        // Notify parent component about wallet creation
        if (onWalletCreated) {
          onWalletCreated(wallet)
        }
        
        toast.success('Admin wallet imported successfully')
        setCurrentStep(3)
      } else {
        toast.error(data.error || 'Failed to import admin wallet')
      }
    } catch (error) {
      toast.error(`Failed to import admin wallet: ${error.message}`)
      console.error('Admin wallet import error:', error)
    }
  }

  // Step 3: Generate Trading Wallets
  const generateTradingWallets = async () => {
    setIsCreatingWallets(true)
    try {
      const data = await api.createMultipleWallets(config.walletCount)
      
      if (Array.isArray(data) && data.length > 0) {
        setTradingWallets(data)
        toast.success(`Created ${data.length} trading wallets`)
        setCurrentStep(4)
      } else {
        toast.error('Failed to create trading wallets')
      }
    } catch (error) {
      toast.error(`Failed to create trading wallets: ${error.message}`)
      console.error('Trading wallets creation error:', error)
    } finally {
      setIsCreatingWallets(false)
    }
  }

  // Create session file
  const createSessionFile = async () => {
    if (!adminWallet || !tokenInfo || !poolKeys || tradingWallets.length === 0) {
      console.error('Missing required data for session creation')
      return false
    }

    try {
      const timestamp = new Date().toISOString()
      const sessionData = {
        admin: {
          number: 0,
          address: adminWallet.publicKey,
          privateKey: adminWallet.privateKey
        },
        wallets: tradingWallets.map((wallet, index) => ({
          number: index + 1,
          address: wallet.publicKey,
          privateKey: wallet.privateKey,
          generationTimestamp: timestamp
        })),
        tokenAddress,
        poolKeys,
        tokenName: tokenInfo.name,
        timestamp
      }

      const result = await api.createSessionFile({
        sessionData,
        tokenName: tokenInfo.name
      })
      
      if (result.success) {
        console.log('Session file created:', result.filename)
        return true
      } else {
        console.error('Failed to create session file:', result.error)
        return false
      }
    } catch (error) {
      console.error('Error creating session file:', error)
      return false
    }
  }

  // Step 4: Distribute SOL
  const distributeSol = async () => {
    if (!adminWallet || tradingWallets.length === 0) {
      toast.error('Admin wallet and trading wallets required')
      return
    }

    setIsDistributing(true)
    try {
      const totalAmount = config.solAmount * config.walletCount
      const walletAddresses = tradingWallets.map(w => w.address)

      const data = await api.distributeSol({
        fromWallet: adminWallet,
        toWallets: walletAddresses,
        totalAmount
      })
      
      if (data.successCount > 0) {
        toast.success(`Distributed SOL to ${data.successCount}/${data.totalWallets} wallets`)
        
        // Create session file after successful SOL distribution
        const sessionCreated = await createSessionFile()
        if (sessionCreated) {
          toast.success('Session file created - wallets now available in Session Manager!')
        }
        
        setCurrentStep(5)
      } else {
        toast.error('Failed to distribute SOL')
      }
    } catch (error) {
      toast.error('Network error distributing SOL')
      console.error('SOL distribution error:', error)
    } finally {
      setIsDistributing(false)
    }
  }

  // Step 5: Distribute Tokens (Optional)
  const distributeTokens = async () => {
    // This step is optional - user can skip to step 6
    setCurrentStep(6)
    toast.info('Token distribution skipped - proceeding to trading')
  }

  // Step 6: Start Trading
  const startTrading = async () => {
    if (!adminWallet || !tokenInfo || !poolKeys || tradingWallets.length === 0) {
      toast.error('All previous steps must be completed')
      return
    }

    try {
      // Create advanced session
      const response = await fetch('https://work-2-uxwtyonxjkkirrey.prod-runtime.all-hands.dev/api/sessions/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: adminWallet.address,
          adminWallet,
          tokenAddress,
          tokenInfo,
          poolKeys,
          config,
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()
      
      if (data.sessionId) {
        setSessionId(data.sessionId)
        onSessionChange(data.sessionId)
        
        // Start the trading session
        const startResponse = await fetch(`https://work-2-uxwtyonxjkkirrey.prod-runtime.all-hands.dev/api/sessions/${data.sessionId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })

        if (startResponse.ok) {
          onTradingChange(true)
          toast.success('Trading started successfully!')
        } else {
          toast.error('Failed to start trading session')
        }
      } else {
        toast.error('Failed to create trading session')
      }
    } catch (error) {
      toast.error('Network error starting trading')
      console.error('Trading start error:', error)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">Step 1: Token Discovery</h4>
              <p className="text-gray-300 text-sm mb-4">
                Enter the token address you want to trade. We'll validate it and fetch the required pool keys for trading.
              </p>
            </div>

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
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={validateToken}
                  disabled={isValidating || !tokenAddress.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {isValidating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>{isValidating ? 'Validating...' : 'Validate'}</span>
                </button>
              </div>
            </div>

            {tokenInfo && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h5 className="text-green-400 font-semibold mb-2">Token Validated ✓</h5>
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
                    <span className="text-white ml-2">${tokenInfo.price?.toFixed(6) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Pool:</span>
                    <span className="text-green-400 ml-2">{poolKeys ? 'Found' : 'Not Found'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-purple-400 font-semibold mb-2">Step 2: Admin Wallet Setup</h4>
              <p className="text-gray-300 text-sm mb-2">
                <strong className="text-yellow-400">CRITICAL:</strong> The admin wallet will fund all trading wallets.
              </p>
              <p className="text-gray-300 text-sm">
                Make sure this wallet has sufficient SOL to distribute to {config.walletCount} trading wallets 
                ({(config.solAmount * config.walletCount).toFixed(3)} SOL total + fees).
              </p>
            </div>

            {!adminWallet ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={createAdminWallet}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors"
                  >
                    <Wallet className="w-6 h-6" />
                    <span className="font-semibold">Generate New</span>
                    <span className="text-xs text-purple-200">Create a new admin wallet</span>
                  </button>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-white">Import Existing</span>
                    </div>
                    <input
                      type="password"
                      placeholder="Enter private key..."
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-xs mb-2"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const privateKey = (e.target as HTMLInputElement).value
                          if (privateKey.trim()) {
                            importAdminWallet(privateKey.trim())
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Enter private key..."]') as HTMLInputElement
                        if (input?.value.trim()) {
                          importAdminWallet(input.value.trim())
                        }
                      }}
                      className="w-full bg-gray-600 hover:bg-gray-500 text-white py-1 rounded text-sm transition-colors"
                    >
                      Import
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h5 className="text-green-400 font-semibold mb-3">Admin Wallet Ready ✓</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Address:</span>
                    <span className="text-white ml-2 font-mono">{adminWallet.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Private Key:</span>
                    <button
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showPrivateKey ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  {showPrivateKey && (
                    <div className="bg-gray-800 rounded p-2 font-mono text-xs text-yellow-400 break-all">
                      {adminWallet.privateKey}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ Make sure this wallet has at least {(config.solAmount * config.walletCount + 0.01).toFixed(3)} SOL 
                    before proceeding to the next step.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Continue to Trading Wallets</span>
                </button>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-green-400 font-semibold mb-2">Step 3: Generate Trading Wallets</h4>
              <p className="text-gray-300 text-sm">
                Create {config.walletCount} trading wallets that will execute the actual trades.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Trading Wallets
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.walletCount}
                  onChange={(e) => setConfig(prev => ({ ...prev, walletCount: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SOL per Wallet
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={config.solAmount}
                  onChange={(e) => setConfig(prev => ({ ...prev, solAmount: parseFloat(e.target.value) || 0.001 }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-400 text-sm">
                Total SOL needed: {(config.solAmount * config.walletCount).toFixed(3)} SOL + fees
              </p>
            </div>

            {tradingWallets.length === 0 ? (
              <button
                onClick={generateTradingWallets}
                disabled={isCreatingWallets}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                {isCreatingWallets ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Users className="w-5 h-5" />
                )}
                <span>{isCreatingWallets ? 'Creating Wallets...' : `Generate ${config.walletCount} Trading Wallets`}</span>
              </button>
            ) : (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h5 className="text-green-400 font-semibold mb-2">Trading Wallets Created ✓</h5>
                <p className="text-gray-300 text-sm mb-3">
                  Successfully created {tradingWallets.length} trading wallets.
                </p>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Continue to SOL Distribution</span>
                </button>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-yellow-400 font-semibold mb-2">Step 4: Distribute SOL</h4>
              <p className="text-gray-300 text-sm">
                Admin wallet will distribute {config.solAmount} SOL to each of the {config.walletCount} trading wallets.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-3">Distribution Summary</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">From:</span>
                  <span className="text-white font-mono">{adminWallet?.address.slice(0, 8)}...{adminWallet?.address.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">To:</span>
                  <span className="text-white">{tradingWallets.length} trading wallets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount per wallet:</span>
                  <span className="text-white">{config.solAmount} SOL</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">Total amount:</span>
                  <span className="text-yellow-400">{(config.solAmount * config.walletCount).toFixed(3)} SOL</span>
                </div>
              </div>
            </div>

            <button
              onClick={distributeSol}
              disabled={isDistributing}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              {isDistributing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <DollarSign className="w-5 h-5" />
              )}
              <span>{isDistributing ? 'Distributing SOL...' : 'Distribute SOL to Trading Wallets'}</span>
            </button>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
              <h4 className="text-orange-400 font-semibold mb-2">Step 5: Distribute Tokens (Optional)</h4>
              <p className="text-gray-300 text-sm">
                If your admin wallet has {tokenInfo?.symbol} tokens, you can distribute them to trading wallets. 
                This step is optional and can be skipped.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={distributeTokens}
                className="bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
                <span>Skip Token Distribution</span>
              </button>
              
              <button
                onClick={() => {
                  // TODO: Implement token distribution
                  toast.info('Token distribution not yet implemented')
                  setCurrentStep(6)
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Zap className="w-5 h-5" />
                <span>Distribute Tokens</span>
              </button>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-red-400 font-semibold mb-2">Step 6: Start Trading</h4>
              <p className="text-gray-300 text-sm">
                Choose your trading strategy and begin automated trading with your configured wallets.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trading Strategy
              </label>
              <select
                value={config.strategy}
                onChange={(e) => setConfig(prev => ({ ...prev, strategy: e.target.value as any }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="VOLUME_ONLY">Volume Only</option>
                <option value="MAKERS_VOLUME">Makers + Volume</option>
              </select>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-3">Trading Session Summary</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Token:</span>
                  <span className="text-white">{tokenInfo?.name} ({tokenInfo?.symbol})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Strategy:</span>
                  <span className="text-white">{config.strategy.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trading Wallets:</span>
                  <span className="text-white">{tradingWallets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SOL per Wallet:</span>
                  <span className="text-white">{config.solAmount} SOL</span>
                </div>
              </div>
            </div>

            <button
              onClick={startTrading}
              disabled={isTrading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Play className="w-5 h-5" />
              <span>{isTrading ? 'Trading Active' : 'Start Trading Session'}</span>
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Backend Flow Trading Controls</h3>
        </div>
        
        {isTrading && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Trading Active</span>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                currentStep > step.id 
                  ? 'bg-green-500 text-white' 
                  : currentStep === step.id 
                    ? `bg-${step.color}-500 text-white` 
                    : 'bg-gray-600 text-gray-400'
              }`}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 transition-colors ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h4 className="text-lg font-semibold text-white mb-1">
            {steps[currentStep - 1]?.title}
          </h4>
          <p className="text-gray-400 text-sm">
            {steps[currentStep - 1]?.description}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentStep > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to previous step
          </button>
        </div>
      )}
    </div>
  )
}