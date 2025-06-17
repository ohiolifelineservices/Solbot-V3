'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, TrendingUp, DollarSign, Gift, ChevronDown } from 'lucide-react'

export function UserStats() {
  const [isOpen, setIsOpen] = useState(false)
  
  const userStats = {
    totalTrades: 156,
    freeTradesRemaining: 3,
    currentFee: 0.001,
    nextDiscount: '44 trades until 10% discount',
    totalVolume: 12456.78,
    totalFees: 0.156
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <div className="text-white font-medium text-sm">Trading Stats</div>
          <div className="text-gray-400 text-xs">{userStats.totalTrades} trades</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Trading Stats</h3>
              
              <div className="space-y-4">
                {/* Free Trades */}
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Gift className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">Free Trades</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{userStats.freeTradesRemaining}</div>
                  <div className="text-sm text-gray-400">remaining</div>
                </div>

                {/* Current Fee */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Current Fee</span>
                  <span className="text-blue-400 font-semibold">{userStats.currentFee} SOL</span>
                </div>

                {/* Total Trades */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Trades</span>
                  <span className="text-white font-semibold">{userStats.totalTrades}</span>
                </div>

                {/* Total Volume */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Volume</span>
                  <span className="text-white font-semibold">${userStats.totalVolume.toLocaleString()}</span>
                </div>

                {/* Total Fees */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Fees Paid</span>
                  <span className="text-yellow-400 font-semibold">{userStats.totalFees} SOL</span>
                </div>

                {/* Next Discount */}
                {userStats.nextDiscount && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-medium text-sm">Next Discount</span>
                    </div>
                    <div className="text-sm text-gray-300">{userStats.nextDiscount}</div>
                  </div>
                )}

                {/* Volume Discounts Info */}
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-white mb-3">Volume Discounts</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">100+ trades</span>
                      <span className="text-green-400">10% off</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">500+ trades</span>
                      <span className="text-green-400">20% off</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">1000+ trades</span>
                      <span className="text-green-400">30% off</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}