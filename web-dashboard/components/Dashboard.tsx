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
import { UserStats } from './UserStats'

export function Dashboard() {
  const { publicKey, disconnect } = useWallet()
  const [activeTab, setActiveTab] = useState('trading')
  const [isTrading, setIsTrading] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const tabs = [
    { id: 'trading', label: 'Trading', icon: TrendingUp },
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
              <UserStats />
              <WalletMultiButton className="!bg-gray-700 hover:!bg-gray-600 !border-gray-600" />
            </div>
          </div>
        </div>
      </header>

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
                  />
                </div>
                <div>
                  <VolumeChart />
                </div>
              </div>
              <TransactionHistory />
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