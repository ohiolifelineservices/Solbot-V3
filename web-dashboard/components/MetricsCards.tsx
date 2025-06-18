'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Activity, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface MetricsData {
  totalVolume: number
  totalTransactions: number
  activeWallets: number
  totalFees: number
  volumeChange: number
  transactionChange: number
  walletChange: number
  feeChange: number
}

export function MetricsCards() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:12001/api/metrics')
        if (response.ok) {
          const data = await response.json()
          setMetricsData(data)
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getChangeType = (change: number) => {
    if (change > 0) return 'positive'
    if (change < 0) return 'negative'
    return 'neutral'
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
              <div className="w-16 h-4 bg-gray-700 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-700 rounded mb-2"></div>
            <div className="w-24 h-4 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const metrics = [
    {
      title: 'Total Volume',
      value: metricsData ? formatCurrency(metricsData.totalVolume) : '$0',
      change: metricsData ? formatChange(metricsData.volumeChange) : '0%',
      changeType: metricsData ? getChangeType(metricsData.volumeChange) : 'neutral',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: 'Transactions',
      value: metricsData ? metricsData.totalTransactions.toLocaleString() : '0',
      change: metricsData ? formatChange(metricsData.transactionChange) : '0%',
      changeType: metricsData ? getChangeType(metricsData.transactionChange) : 'neutral',
      icon: Activity,
      color: 'green'
    },
    {
      title: 'Active Wallets',
      value: metricsData ? metricsData.activeWallets.toString() : '0',
      change: metricsData ? formatChange(metricsData.walletChange) : '0%',
      changeType: metricsData ? getChangeType(metricsData.walletChange) : 'neutral',
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Fees Paid',
      value: metricsData ? `${metricsData.totalFees.toFixed(3)} SOL` : '0 SOL',
      change: metricsData ? formatChange(metricsData.feeChange) : '0%',
      changeType: metricsData ? getChangeType(metricsData.feeChange) : 'neutral',
      icon: DollarSign,
      color: 'yellow'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      yellow: 'from-yellow-500 to-yellow-600'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${getColorClasses(metric.color)} rounded-lg flex items-center justify-center`}>
              <metric.icon className="w-6 h-6 text-white" />
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              metric.changeType === 'positive' ? 'text-green-400' :
              metric.changeType === 'negative' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {metric.changeType === 'positive' && <ArrowUpRight className="w-4 h-4" />}
              {metric.changeType === 'negative' && <ArrowDownRight className="w-4 h-4" />}
              <span>{metric.change}</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
            <p className="text-gray-400 text-sm">{metric.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}