'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  Plus, 
  Download,
  Upload,
  RefreshCw,
  Send,
  ArrowUpDown,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  DollarSign,
  Coins,
  AlertCircle,
  CheckCircle,
  Settings,
  Key,
  Shield,
  TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'

interface WalletData {
  number: number
  address: string
  privateKey: string
  solBalance?: number
  tokenBalance?: number
  generationTimestamp?: string
  isAdmin?: boolean
}

interface TokenDistribution {
  fromWallet: string
  toWallets: string[]
  amount: number
  tokenAddress: string
}

interface SolDistribution {
  fromWallet: string
  toWallets: string[]
  amount: number
}

interface AdvancedWalletManagerProps {
  currentWallet?: WalletData | null
  sessionWallets?: WalletData[]
  tokenAddress?: string
  onWalletSelect: (wallet: WalletData) => void
  onWalletsUpdate: (wallets: WalletData[]) => void
}

export function AdvancedWalletManager({
  currentWallet,
  sessionWallets = [],
  tokenAddress,
  onWalletSelect,
  onWalletsUpdate
}: AdvancedWalletManagerProps) {
  const [wallets, setWallets] = useState<WalletData[]>(sessionWallets)
  const [isLoading, setIsLoading] = useState(false)
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [key: string]: boolean }>({})
  const [activeTab, setActiveTab] = useState('wallets')
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importPrivateKey, setImportPrivateKey] = useState('')
  const [walletCount, setWalletCount] = useState(5)
  const [distributionAmount, setDistributionAmount] = useState(0.1)
  const [selectedWallets, setSelectedWallets] = useState<string[]>([])
  const [showDistributionModal, setShowDistributionModal] = useState(false)
  const [distributionType, setDistributionType] = useState<'sol' | 'token'>('sol')

  useEffect(() => {
    setWallets(sessionWallets)
  }, [sessionWallets])

  useEffect(() => {
    if (wallets.length > 0) {
      loadWalletBalances()
    }
  }, [wallets, tokenAddress])

  const loadWalletBalances = async () => {
    if (wallets.length === 0) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const addresses = wallets.map(w => w.address)
      
      const response = await fetch(`${apiUrl}/api/wallets/balances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          addresses,
          tokenAddress: tokenAddress || null
        })
      })
      
      if (response.ok) {
        const balances = await response.json()
        const updatedWallets = wallets.map(wallet => ({
          ...wallet,
          solBalance: balances[wallet.address]?.sol || 0,
          tokenBalance: balances[wallet.address]?.token || 0
        }))
        
        setWallets(updatedWallets)
        onWalletsUpdate(updatedWallets)
      }
    } catch (error) {
      console.error('Load balances error:', error)
    }
  }

  const createWallet = async () => {
    setIsCreatingWallet(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/wallets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: false })
      })
      
      if (response.ok) {
        const newWallet = await response.json()
        const updatedWallets = [...wallets, newWallet]
        setWallets(updatedWallets)
        onWalletsUpdate(updatedWallets)
        toast.success('Wallet created successfully')
      } else {
        toast.error('Failed to create wallet')
      }
    } catch (error) {
      console.error('Create wallet error:', error)
      toast.error('Failed to create wallet')
    } finally {
      setIsCreatingWallet(false)
    }
  }

  const createMultipleWallets = async () => {
    setIsCreatingWallet(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/wallets/create-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: walletCount })
      })
      
      if (response.ok) {
        const newWallets = await response.json()
        const updatedWallets = [...wallets, ...newWallets]
        setWallets(updatedWallets)
        onWalletsUpdate(updatedWallets)
        toast.success(`${walletCount} wallets created successfully`)
      } else {
        toast.error('Failed to create wallets')
      }
    } catch (error) {
      console.error('Create wallets error:', error)
      toast.error('Failed to create wallets')
    } finally {
      setIsCreatingWallet(false)
    }
  }

  const importWallet = async () => {
    if (!importPrivateKey.trim()) {
      toast.error('Please enter a private key')
      return
    }
    
    setIsImporting(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/wallets/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          privateKey: importPrivateKey.trim(),
          isAdmin: false
        })
      })
      
      if (response.ok) {
        const importedWallet = await response.json()
        const updatedWallets = [...wallets, importedWallet]
        setWallets(updatedWallets)
        onWalletsUpdate(updatedWallets)
        setImportPrivateKey('')
        toast.success('Wallet imported successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to import wallet')
      }
    } catch (error) {
      console.error('Import wallet error:', error)
      toast.error('Failed to import wallet')
    } finally {
      setIsImporting(false)
    }
  }

  const distributeSol = async () => {
    if (!currentWallet || selectedWallets.length === 0) {
      toast.error('Please select wallets for distribution')
      return
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/wallets/distribute-sol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWallet: currentWallet.address,
          toWallets: selectedWallets,
          totalAmount: distributionAmount
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`SOL distributed to ${result.successCount} wallets`)
        loadWalletBalances()
        setShowDistributionModal(false)
        setSelectedWallets([])
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to distribute SOL')
      }
    } catch (error) {
      console.error('Distribute SOL error:', error)
      toast.error('Failed to distribute SOL')
    }
  }

  const distributeTokens = async () => {
    if (!currentWallet || !tokenAddress || selectedWallets.length === 0) {
      toast.error('Please select wallets and ensure token address is set')
      return
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/wallets/distribute-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWallet: currentWallet.address,
          toWallets: selectedWallets,
          tokenAddress,
          totalAmount: distributionAmount
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`Tokens distributed to ${result.successCount} wallets`)
        loadWalletBalances()
        setShowDistributionModal(false)
        setSelectedWallets([])
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to distribute tokens')
      }
    } catch (error) {
      console.error('Distribute tokens error:', error)
      toast.error('Failed to distribute tokens')
    }
  }

  const collectFunds = async (type: 'sol' | 'token') => {
    if (!currentWallet) {
      toast.error('Please select an admin wallet')
      return
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
      const response = await fetch(`${apiUrl}/api/wallets/collect-${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminWallet: currentWallet.address,
          wallets: wallets.filter(w => !w.isAdmin).map(w => w.address),
          tokenAddress: type === 'token' ? tokenAddress : undefined
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`${type.toUpperCase()} collected from ${result.successCount} wallets`)
        loadWalletBalances()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to collect ${type}`)
      }
    } catch (error) {
      console.error(`Collect ${type} error:`, error)
      toast.error(`Failed to collect ${type}`)
    }
  }

  const exportWallets = () => {
    try {
      const exportData = {
        wallets: wallets.map(w => ({
          number: w.number,
          address: w.address,
          privateKey: w.privateKey,
          isAdmin: w.isAdmin,
          generationTimestamp: w.generationTimestamp
        })),
        exportTimestamp: new Date().toISOString()
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `wallets_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Wallets exported successfully')
    } catch (error) {
      console.error('Export wallets error:', error)
      toast.error('Failed to export wallets')
    }
  }

  const importWallets = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const importData = JSON.parse(text)
      
      if (!importData.wallets || !Array.isArray(importData.wallets)) {
        throw new Error('Invalid wallet file format')
      }
      
      const updatedWallets = [...wallets, ...importData.wallets]
      setWallets(updatedWallets)
      onWalletsUpdate(updatedWallets)
      toast.success(`${importData.wallets.length} wallets imported successfully`)
    } catch (error) {
      console.error('Import wallets error:', error)
      toast.error('Failed to import wallets - invalid file format')
    }
    
    // Reset file input
    event.target.value = ''
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const togglePrivateKeyVisibility = (address: string) => {
    setShowPrivateKeys(prev => ({
      ...prev,
      [address]: !prev[address]
    }))
  }

  const toggleWalletSelection = (address: string) => {
    setSelectedWallets(prev => 
      prev.includes(address) 
        ? prev.filter(a => a !== address)
        : [...prev, address]
    )
  }

  const deleteWallet = (address: string) => {
    if (!confirm('Are you sure you want to delete this wallet? This action cannot be undone.')) {
      return
    }
    
    const updatedWallets = wallets.filter(w => w.address !== address)
    setWallets(updatedWallets)
    onWalletsUpdate(updatedWallets)
    toast.success('Wallet deleted')
  }

  const tabs = [
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'distribute', label: 'Distribute', icon: ArrowUpDown },
    { id: 'collect', label: 'Collect', icon: TrendingUp }
  ]

  const totalSolBalance = wallets.reduce((sum, w) => sum + (w.solBalance || 0), 0)
  const totalTokenBalance = wallets.reduce((sum, w) => sum + (w.tokenBalance || 0), 0)

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-400" />
          Advanced Wallet Manager
        </h2>
        
        <div className="flex items-center gap-2">
          <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer flex items-center gap-2 transition-colors">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importWallets}
              className="hidden"
            />
          </label>
          
          <button
            onClick={exportWallets}
            disabled={wallets.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={loadWalletBalances}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{wallets.length}</div>
          <div className="text-sm text-gray-400">Total Wallets</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{totalSolBalance.toFixed(4)}</div>
          <div className="text-sm text-gray-400">Total SOL Balance</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{totalTokenBalance.toFixed(4)}</div>
          <div className="text-sm text-gray-400">Total Token Balance</div>
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
        {activeTab === 'wallets' && (
          <div className="space-y-4">
            {wallets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No wallets found. Create or import wallets to get started.</p>
              </div>
            ) : (
              wallets.map((wallet) => (
                <div
                  key={wallet.address}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedWallets.includes(wallet.address)}
                        onChange={() => toggleWalletSelection(wallet.address)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <h3 className="font-medium text-white flex items-center gap-2">
                          Wallet #{wallet.number}
                          {wallet.isAdmin && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Admin</span>
                          )}
                        </h3>
                        <div className="text-sm text-gray-400">
                          {wallet.generationTimestamp && (
                            <span>Created: {new Date(wallet.generationTimestamp).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onWalletSelect(wallet)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Select
                      </button>
                      
                      <button
                        onClick={() => deleteWallet(wallet.address)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Address:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{wallet.address}</span>
                        <button
                          onClick={() => copyToClipboard(wallet.address, 'Address')}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Private Key:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">
                          {showPrivateKeys[wallet.address] 
                            ? wallet.privateKey 
                            : '•'.repeat(20)
                          }
                        </span>
                        <button
                          onClick={() => togglePrivateKeyVisibility(wallet.address)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPrivateKeys[wallet.address] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(wallet.privateKey, 'Private Key')}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">SOL:</span>
                        <span className="text-white">{(wallet.solBalance || 0).toFixed(6)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Tokens:</span>
                        <span className="text-white">{(wallet.tokenBalance || 0).toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Single Wallet Creation */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Create Single Wallet</h3>
              <button
                onClick={createWallet}
                disabled={isCreatingWallet}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isCreatingWallet ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isCreatingWallet ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>

            {/* Multiple Wallet Creation */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Create Multiple Wallets</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Wallets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={walletCount}
                    onChange={(e) => setWalletCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <button
                  onClick={createMultipleWallets}
                  disabled={isCreatingWallet}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isCreatingWallet ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  {isCreatingWallet ? 'Creating...' : `Create ${walletCount} Wallets`}
                </button>
              </div>
            </div>

            {/* Import Wallet */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Import Wallet</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Private Key
                  </label>
                  <input
                    type="password"
                    value={importPrivateKey}
                    onChange={(e) => setImportPrivateKey(e.target.value)}
                    placeholder="Enter private key..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <button
                  onClick={importWallet}
                  disabled={isImporting || !importPrivateKey.trim()}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isImporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  {isImporting ? 'Importing...' : 'Import Wallet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'distribute' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Distribute Funds</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Distribution Type
                  </label>
                  <select
                    value={distributionType}
                    onChange={(e) => setDistributionType(e.target.value as 'sol' | 'token')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="sol">SOL</option>
                    <option value="token">Token</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Amount to Distribute
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={distributionAmount}
                    onChange={(e) => setDistributionAmount(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="text-sm text-gray-400">
                  Selected wallets: {selectedWallets.length}
                  {selectedWallets.length > 0 && (
                    <span className="ml-2">
                      ({(distributionAmount / selectedWallets.length).toFixed(6)} per wallet)
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => setShowDistributionModal(true)}
                  disabled={!currentWallet || selectedWallets.length === 0 || distributionAmount <= 0}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Distribute {distributionType.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collect' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Collect Funds</h3>
              <p className="text-gray-400 mb-4">
                Collect all funds from trading wallets back to the admin wallet.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => collectFunds('sol')}
                  disabled={!currentWallet}
                  className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Collect All SOL
                </button>
                
                <button
                  onClick={() => collectFunds('token')}
                  disabled={!currentWallet || !tokenAddress}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Coins className="w-4 h-4" />
                  Collect All Tokens
                </button>
              </div>
              
              {!tokenAddress && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Token address required for token collection</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Distribution Confirmation Modal */}
      {showDistributionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Distribution</h3>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-white">{distributionType.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Amount:</span>
                <span className="text-white">{distributionAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recipients:</span>
                <span className="text-white">{selectedWallets.length} wallets</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Per Wallet:</span>
                <span className="text-white">{(distributionAmount / selectedWallets.length).toFixed(6)}</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDistributionModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={distributionType === 'sol' ? distributeSol : distributeTokens}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Confirm Distribution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}