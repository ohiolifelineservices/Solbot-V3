'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  Eye,
  Pause,
  Play,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'

interface Transaction {
  id: string
  type: 'buy' | 'sell'
  amount: number
  tokenAmount?: number
  price?: number
  hash?: string
  status: 'pending' | 'success' | 'failed'
  timestamp: Date
  fee: number
  slippage?: number
  error?: string
  walletAddress: string
}

interface TradingMetrics {
  totalVolume: number
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  totalFees: number
  averageSlippage: number
  currentPrice?: number
  priceChange24h?: number
  volume24h?: number
  marketCap?: number
  holders?: number
  liquidity?: number
}

interface WalletStatus {
  address: string
  solBalance: number
  tokenBalance: number
  isTrading: boolean
  lastTransaction?: Date
  transactionCount: number
  successRate: number
}

interface RealTimeMonitorProps {
  sessionId?: string | null
  tokenAddress?: string
  isConnected?: boolean
}

export function RealTimeMonitor({ sessionId, tokenAddress, isConnected = false }: RealTimeMonitorProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [metrics, setMetrics] = useState<TradingMetrics>({
    totalVolume: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalFees: 0,
    averageSlippage: 0
  })
  const [walletStatuses, setWalletStatuses] = useState<WalletStatus[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000)
  const [maxTransactions, setMaxTransactions] = useState(100)

  // WebSocket integration for real-time updates
  const { 
    isConnected: wsConnected, 
    error: wsError,
    joinSession,
    leaveSession 
  } = useWebSocket({
    sessionId,
    onTransactionStarted: (data) => {
      const newTransaction: Transaction = {
        id: data.transaction.id,
        type: data.transaction.type,
        amount: data.transaction.amount,
        status: 'pending',
        timestamp: new Date(),
        fee: 0,
        walletAddress: data.transaction.walletAddress || 'Unknown'
      }
      
      setTransactions(prev => [newTransaction, ...prev.slice(0, maxTransactions - 1)])
    },
    onTransactionSuccess: (data) => {
      setTransactions(prev => prev.map(tx => 
        tx.id === data.transaction.id 
          ? { 
              ...tx, 
              status: 'success',
              hash: data.transaction.hash,
              tokenAmount: data.transaction.tokenAmount,
              price: data.transaction.price,
              fee: data.transaction.fee,
              slippage: data.transaction.slippage
            }
          : tx
      ))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        successfulTransactions: prev.successfulTransactions + 1,
        totalVolume: prev.totalVolume + (data.transaction.amount || 0),
        totalFees: prev.totalFees + (data.transaction.fee || 0),
        averageSlippage: ((prev.averageSlippage * (prev.successfulTransactions - 1)) + (data.transaction.slippage || 0)) / prev.successfulTransactions
      }))
    },
    onTransactionFailed: (data) => {
      setTransactions(prev => prev.map(tx => 
        tx.id === data.transaction.id 
          ? { 
              ...tx, 
              status: 'failed',
              error: data.error
            }
          : tx
      ))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        failedTransactions: prev.failedTransactions + 1
      }))
    },
    onMetricsUpdate: (data) => {
      setMetrics(prev => ({ ...prev, ...data }))
    },
    onWalletStatusUpdate: (data) => {
      setWalletStatuses(data.wallets || [])
    }
  })

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh || !sessionId) return
    
    const interval = setInterval(() => {
      refreshData()
    }, refreshInterval)
    
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, sessionId])

  // Join session when sessionId changes
  useEffect(() => {
    if (sessionId && joinSession) {
      joinSession(sessionId)
    }
    
    return () => {
      if (leaveSession) {
        leaveSession()
      }
    }
  }, [sessionId, joinSession, leaveSession])

  const refreshData = async () => {
    if (!sessionId) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      
      // Fetch latest metrics
      const metricsResponse = await fetch(`${apiUrl}/api/sessions/${sessionId}/metrics`)
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(prev => ({ ...prev, ...metricsData }))
      }
      
      // Fetch wallet statuses
      const walletsResponse = await fetch(`${apiUrl}/api/sessions/${sessionId}/wallets`)
      if (walletsResponse.ok) {
        const walletsData = await walletsResponse.json()
        setWalletStatuses(walletsData.wallets || [])
      }
      
      // Fetch recent transactions
      const transactionsResponse = await fetch(`${apiUrl}/api/sessions/${sessionId}/transactions?limit=${maxTransactions}`)
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData.transactions || [])
      }
    } catch (error) {
      console.error('Refresh data error:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400'
      case 'failed': return 'text-red-400'
      case 'pending': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle
      case 'failed': return XCircle
      case 'pending': return RefreshCw
      default: return Clock
    }
  }

  const formatNumber = (num: number, decimals: number = 6) => {
    return num.toFixed(decimals)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num)
  }

  const calculateSuccessRate = () => {
    if (metrics.totalTransactions === 0) return 0
    return (metrics.successfulTransactions / metrics.totalTransactions) * 100
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'wallets', label: 'Wallets', icon: Eye },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Real-Time Monitor
          {wsConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-3 py-1 rounded-lg text-sm flex items-center gap-2 transition-colors ${
              isMonitoring 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {isMonitoring ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isMonitoring ? 'Pause' : 'Resume'}
          </button>
          
          <button
            onClick={refreshData}
            disabled={!sessionId}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <div className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
          wsConnected 
            ? 'bg-green-900/20 border border-green-700 text-green-400'
            : 'bg-red-900/20 border border-red-700 text-red-400'
        }`}>
          {wsConnected ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Connected to real-time updates</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>Disconnected from real-time updates</span>
              {wsError && <span className="ml-2">({wsError})</span>}
            </>
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{formatNumber(metrics.totalVolume, 4)}</div>
                <div className="text-sm text-gray-400">Total Volume (SOL)</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{metrics.totalTransactions}</div>
                <div className="text-sm text-gray-400">Total Transactions</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{calculateSuccessRate().toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{formatNumber(metrics.totalFees, 6)}</div>
                <div className="text-sm text-gray-400">Total Fees (SOL)</div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-lg font-bold text-green-400">{metrics.successfulTransactions}</div>
                <div className="text-sm text-gray-400">Successful</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-lg font-bold text-red-400">{metrics.failedTransactions}</div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-lg font-bold text-white">{formatNumber(metrics.averageSlippage, 2)}%</div>
                <div className="text-sm text-gray-400">Avg Slippage</div>
              </div>
            </div>

            {/* Token Information */}
            {(metrics.currentPrice || metrics.volume24h) && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-4">Token Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {metrics.currentPrice && (
                    <div>
                      <div className="text-lg font-bold text-white">{formatCurrency(metrics.currentPrice)}</div>
                      <div className="text-sm text-gray-400">Current Price</div>
                    </div>
                  )}
                  
                  {metrics.priceChange24h && (
                    <div>
                      <div className={`text-lg font-bold ${metrics.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {metrics.priceChange24h >= 0 ? '+' : ''}{metrics.priceChange24h.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-400">24h Change</div>
                    </div>
                  )}
                  
                  {metrics.volume24h && (
                    <div>
                      <div className="text-lg font-bold text-white">{formatCurrency(metrics.volume24h)}</div>
                      <div className="text-sm text-gray-400">24h Volume</div>
                    </div>
                  )}
                  
                  {metrics.marketCap && (
                    <div>
                      <div className="text-lg font-bold text-white">{formatCurrency(metrics.marketCap)}</div>
                      <div className="text-sm text-gray-400">Market Cap</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Recent Transactions</h3>
              <div className="text-sm text-gray-400">
                Showing {transactions.length} of {maxTransactions} max
              </div>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet. Start trading to see activity.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.map((tx) => {
                  const StatusIcon = getStatusIcon(tx.status)
                  return (
                    <div
                      key={tx.id}
                      className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`w-4 h-4 ${getStatusColor(tx.status)} ${tx.status === 'pending' ? 'animate-spin' : ''}`} />
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.type === 'buy' 
                              ? 'bg-green-900/20 text-green-400 border border-green-700'
                              : 'bg-red-900/20 text-red-400 border border-red-700'
                          }`}>
                            {tx.type.toUpperCase()}
                          </span>
                          <span className="text-white font-medium">{formatNumber(tx.amount, 6)} SOL</span>
                        </div>
                        
                        <div className="text-sm text-gray-400">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
                        <div>
                          <span className="text-gray-500">Wallet:</span> {tx.walletAddress.substring(0, 8)}...
                        </div>
                        {tx.tokenAmount && (
                          <div>
                            <span className="text-gray-500">Tokens:</span> {formatNumber(tx.tokenAmount, 4)}
                          </div>
                        )}
                        {tx.price && (
                          <div>
                            <span className="text-gray-500">Price:</span> {formatCurrency(tx.price)}
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Fee:</span> {formatNumber(tx.fee, 6)} SOL
                        </div>
                        {tx.slippage && (
                          <div>
                            <span className="text-gray-500">Slippage:</span> {tx.slippage.toFixed(2)}%
                          </div>
                        )}
                        {tx.hash && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Hash:</span> {tx.hash.substring(0, 16)}...
                          </div>
                        )}
                        {tx.error && (
                          <div className="col-span-4 text-red-400">
                            <span className="text-gray-500">Error:</span> {tx.error}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'wallets' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Wallet Status</h3>
            
            {walletStatuses.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No wallet data available.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {walletStatuses.map((wallet) => (
                  <div
                    key={wallet.address}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          wallet.isTrading ? 'bg-green-400' : 'bg-gray-400'
                        }`} />
                        <span className="text-white font-medium">
                          {wallet.address.substring(0, 8)}...{wallet.address.substring(-8)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        {wallet.successRate.toFixed(1)}% success
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-white">{formatNumber(wallet.solBalance, 6)}</div>
                        <div className="text-gray-400">SOL Balance</div>
                      </div>
                      
                      <div>
                        <div className="text-white">{formatNumber(wallet.tokenBalance, 6)}</div>
                        <div className="text-gray-400">Token Balance</div>
                      </div>
                      
                      <div>
                        <div className="text-white">{wallet.transactionCount}</div>
                        <div className="text-gray-400">Transactions</div>
                      </div>
                      
                      <div>
                        <div className="text-white">
                          {wallet.lastTransaction 
                            ? new Date(wallet.lastTransaction).toLocaleTimeString()
                            : 'Never'
                          }
                        </div>
                        <div className="text-gray-400">Last Activity</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Monitor Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">
                    Auto Refresh
                  </label>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      autoRefresh 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {autoRefresh ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Refresh Interval (ms)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="60000"
                    step="1000"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    disabled={!autoRefresh}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Transactions to Display
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    step="10"
                    value={maxTransactions}
                    onChange={(e) => setMaxTransactions(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}