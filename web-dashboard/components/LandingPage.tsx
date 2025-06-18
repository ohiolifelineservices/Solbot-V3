'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Zap, 
  Shield, 
  BarChart3, 
  Wallet, 
  ArrowRight,
  CheckCircle,
  DollarSign,
  Upload,
  Plus
} from 'lucide-react'

import { useRouter } from 'next/navigation'

export function LandingPage() {
  const router = useRouter()

  const handleStartTrading = () => {
    // Navigate directly to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">Solbot</span>
              <div className="text-xs text-blue-300 font-medium">Raydium Trading Bot</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={handleStartTrading}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 border-none rounded-xl font-bold px-8 py-3 text-white transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Zap className="w-5 h-5" />
              Launch Bot
            </button>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-green-400">RAYDIUM</span>
              <span className="text-2xl font-bold text-white">TRADING BOT</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Automated
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                {' '}Volume Generation
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto"
            >
              🚀 Professional Raydium trading bot that generates organic volume for your Solana tokens. 
              <span className="text-green-400 font-semibold"> Multi-wallet automation</span> with 
              <span className="text-blue-400 font-semibold"> real-time analytics</span>.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center justify-center gap-6"
            >
              <button
                onClick={handleStartTrading}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 border-none rounded-2xl font-bold px-16 py-5 text-2xl text-white transition-all duration-200 flex items-center gap-4 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105 animate-pulse"
              >
                <Zap className="w-8 h-8" />
                START TRADING BOT
                <ArrowRight className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center text-green-400 font-semibold text-lg">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  10 Free Trades
                </div>
                <div className="flex items-center text-blue-400 font-semibold text-lg">
                  <Shield className="w-6 h-6 mr-2" />
                  Raydium DEX
                </div>
                <div className="flex items-center text-purple-400 font-semibold text-lg">
                  <BarChart3 className="w-6 h-6 mr-2" />
                  Live Analytics
                </div>
              </div>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          >
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Raydium Integration"
              description="Direct integration with Raydium DEX for seamless trading"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Multi-Wallet System"
              description="Automated wallet creation and SOL distribution"
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Volume Analytics"
              description="Real-time volume tracking and performance metrics"
            />
            <FeatureCard
              icon={<DollarSign className="w-8 h-8" />}
              title="Pay Per Transaction"
              description="0.001 SOL per trade - no monthly subscriptions"
            />
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              How Solbot Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Enter Token</h3>
                <p className="text-gray-300">Input your Solana token address for validation</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Setup Wallets</h3>
                <p className="text-gray-300">Create admin wallet and trading wallets automatically</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Start Trading</h3>
                <p className="text-gray-300">Bot generates organic volume on Raydium DEX</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                0.001 SOL
              </div>
              <div className="text-gray-300 mb-4">per transaction • 10 free trades included</div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
      </div>


    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-200"
    >
      <div className="text-blue-400 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </motion.div>
  )
}