'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Filter, Download, TrendingUp, TrendingDown } from 'lucide-react'

interface Transaction {
  id: string
  type: 'buy' | 'sell'
  amount: string
  token: string
  price: string
  time: string
  hash: string
  status: 'success' | 'failed' | 'pending'
  fee: string
}

export function TransactionHistory() {
  const [filter, setFilter] = useState('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/transactions')
        if (response.ok) {
          const data = await response.json()
          setTransactions(data)
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
    const interval = setInterval(fetchTransactions, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true
    if (filter === 'buy') return tx.type === 'buy'
    if (filter === 'sell') return tx.type === 'sell'
    if (filter === 'success') return tx.status === 'success'
    if (filter === 'failed') return tx.status === 'failed'
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400'
      case 'failed': return 'text-red-400'
      case 'pending': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'buy' ? 
      <TrendingUp className="w-4 h-4 text-green-400" /> : 
      <TrendingDown className="w-4 h-4 text-red-400" />
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Transaction History</h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <button className="flex items-center space-x-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors duration-200">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Type</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Amount</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Price</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Fee</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Time</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Hash</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx, index) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(tx.type)}
                    <span className={`capitalize font-medium ${
                      tx.type === 'buy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-white font-medium">{tx.amount}</td>
                <td className="py-3 px-4 text-gray-300">{tx.price}</td>
                <td className="py-3 px-4 text-yellow-400">{tx.fee}</td>
                <td className="py-3 px-4">
                  <span className={`capitalize font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400">{tx.time}</td>
                <td className="py-3 px-4">
                  <a
                    href={`https://solscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  >
                    <span className="font-mono">{tx.hash}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No transactions found</div>
          <div className="text-sm text-gray-500">
            {filter !== 'all' ? 'Try adjusting your filter' : 'Start trading to see transactions here'}
          </div>
        </div>
      )}
    </div>
  )
}