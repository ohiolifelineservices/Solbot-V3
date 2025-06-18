'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Settings, 
  Wallet, 
  BarChart3, 
  Play, 
  Pause, 
  Square,
  RefreshCw,
  DollarSign,
  Users,
  Activity,
  Zap
} from 'lucide-react'
import { TradingControls } from './TradingControls'
import { MetricsCards } from './MetricsCards'
import { VolumeChart } from './VolumeChart'
import { TransactionHistory } from './TransactionHistory'
import { WalletManager } from './WalletManager'
import { WalletCreator } from './WalletCreator'
import { SessionManager } from './SessionManager'
import { UserStats } from './UserStats'

export function Dashboard() {
  const { publicKey, disconnect } = useWallet()
  const [activeTab, setActiveTab] = useState('trading')
  const [isTrading, setIsTrading] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [currentWallet, setCurrentWallet] = useState<any>(null)

  // Load wallet from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('currentWallet')
    if (savedWallet) {
      try {
        setCurrentWallet(JSON.parse(savedWallet))
      } catch (error) {
        console.error('Error parsing saved wallet:', error)
      }
    }
  }, [])

  const tabs = [
    { id: 'trading', label: 'Trading', icon: TrendingUp },
    { id: 'sessions', label: 'Sessions', icon: Activity },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Solbot</span>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isTrading ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-300">
                  {isTrading ? 'Trading Active' : 'Idle'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Current Wallet Info */}
              {currentWallet && (
                <div className="bg-gray-700 rounded-lg px-4 py-2 border border-gray-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-xs text-gray-400">Active Trading Wallet</div>
                      <div className="text-sm font-mono text-white">
                        {currentWallet.publicKey.slice(0, 8)}...{currentWallet.publicKey.slice(-8)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentWallet.publicKey)
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Copy public key"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <UserStats />
              <WalletMultiButton className="!bg-gray-700 hover:!bg-gray-600 !border-gray-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section for New Wallets */}
      {currentWallet && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    🎉 Wallet Created Successfully!
                  </h2>
                  <p className="text-blue-100 mb-4">
                    Your new Solana wallet is ready for trading. Keep your private key safe!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/20 rounded-lg p-4">
                      <div className="text-sm text-blue-200 mb-1">Public Key (Address)</div>
                      <div className="font-mono text-white text-sm break-all">
                        {currentWallet.publicKey}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentWallet.publicKey)
                        }}
                        className="mt-2 text-xs text-blue-300 hover:text-white transition-colors"
                      >
                        📋 Copy Address
                      </button>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-4">
                      <div className="text-sm text-blue-200 mb-1">Private Key (Keep Secret!)</div>
                      <div className="font-mono text-white text-sm break-all">
                        {currentWallet.privateKey.slice(0, 20)}...
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentWallet.privateKey)
                        }}
                        className="mt-2 text-xs text-red-300 hover:text-white transition-colors"
                      >
                        🔐 Copy Private Key
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    localStorage.removeItem('currentWallet')
                    setCurrentWallet(null)
                  }}
                  className="text-white/60 hover:text-white transition-colors ml-4"
                  title="Dismiss welcome message"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'trading' && (
            <div className="space-y-8">
              <MetricsCards />
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <TradingControls 
                    isTrading={isTrading}
                    onTradingChange={setIsTrading}
                    onSessionChange={setCurrentSessionId}
                    currentWallet={currentWallet}
                  />
                </div>
                <div>
                  <VolumeChart />
                </div>
              </div>
              <TransactionHistory />
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-8">
              <SessionManager 
                onSessionImport={(sessionId) => {
                  setCurrentSessionId(sessionId)
                  setActiveTab('trading')
                }}
              />
              <WalletCreator />
            </div>
          )}

          {activeTab === 'wallets' && (
            <WalletManager sessionId={currentSessionId} />
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <VolumeChart />
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Success Rate</span>
                      <span className="text-green-400 font-semibold">98.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Avg. Slippage</span>
                      <span className="text-blue-400 font-semibold">2.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Fees Paid</span>
                      <span className="text-yellow-400 font-semibold">0.045 SOL</span>
                    </div>
                  </div>
                </div>
              </div>
              <TransactionHistory />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-8">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Trading Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Slippage (%)
                    </label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Trade Interval (seconds)
                    </label>
                    <input
                      type="number"
                      defaultValue="8"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Min SOL per Wallet
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      defaultValue="0.001"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-3" />
                    <span className="text-gray-300">Trading alerts</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-3" />
                    <span className="text-gray-300">Error notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-300">Daily reports</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}