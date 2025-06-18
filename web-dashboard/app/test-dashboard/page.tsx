'use client'

import { Dashboard } from '@/components/Dashboard'
import { motion } from 'framer-motion'

export default function TestDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-900"
    >
      <Dashboard />
    </motion.div>
  )
}