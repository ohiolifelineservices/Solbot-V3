'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Database, 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Download,
  Upload,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Wallet,
  DollarSign,
  BarChart3,
  Settings,
  ArrowRight,
  Copy
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { API_CONFIG } from '@/lib/api'

interface SessionData {
  id: string
  fileName: string
  admin: {
    number: number
    address: string
    privateKey: string
  }
  wallets: Array<{
    number: number
    address: string
    privateKey: string
    generationTimestamp?: string
  }>
  tokenAddress: string
  tokenName: string
  tokenSymbol?: string
  poolKeys: any
  timestamp: string
  status: 'created' | 'active' | 'paused' | 'stopped' | 'error'
  metrics?: {
    totalVolume: number
    totalTransactions: number
    successfulTransactions: number
    failedTransactions: number
    totalFees: number
    averageSlippage: number
  }
}

interface RestartPoint {
  id: number
  label: string
  description: string
  icon: any
}

interface AdvancedSessionManagerProps {
  currentSession?: SessionData | null
  onSessionSelect: (session: SessionData) => void
  onSessionRestart: (sessionId: string, restartPoint: number) => void
  onSessionDelete: (sessionId: string) => void
}

export function AdvancedSessionManager({
  currentSession,
  onSessionSelect,
  onSessionRestart,
  onSessionDelete
}: AdvancedSessionManagerProps) {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null)
  const [showRestartModal, setShowRestartModal] = useState(false)
  const [showSessionDetails, setShowSessionDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('sessions')

  const restartPoints: RestartPoint[] = [
    {
      id: 1,
      label: 'After Token Discovery',
      description: 'Restart from token validation and pool key fetching',
      icon: CheckCircle
    },
    {
      id: 2,
      label: 'After Admin Wallet Creation',
      description: 'Restart from admin wallet setup and funding',
      icon: Wallet
    },
    {
      id: 3,
      label: 'After Wallet Generation',
      description: 'Restart from trading wallet creation',
      icon: Settings
    },
    {
      id: 4,
      label: 'After Wallet Funding',
      description: 'Restart from SOL distribution to wallets',
      icon: DollarSign
    },
    {
      id: 5,
      label: 'Token Transfer to Wallets',
      description: 'Restart from token distribution phase',
      icon: ArrowRight
    },
    {
      id: 6,
      label: 'Close Token Accounts & Send Balance',
      description: 'Restart from cleanup and balance collection',
      icon: Database
    }
  ]

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const apiUrl = API_CONFIG.BASE_URL
      const response = await fetch(`${apiUrl}/api/sessions`)
      
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
        
        // Also load session files from backend
        await loadSessionFiles()
      } else {
        toast.error('Failed to load sessions')
      }
    } catch (error) {
      console.error('Load sessions error:', error)
      toast.error('Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const createNewSession = async () => {
    try {
      const apiUrl = API_CONFIG.BASE_URL
      const response = await fetch(`${apiUrl}/api/sessions/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const newSession = await response.json()
        setSessions(prev => [newSession, ...prev])
        onSessionSelect(newSession)
        toast.success('New session created')
      } else {
        toast.error('Failed to create new session')
      }
    } catch (error) {
      console.error('Create session error:', error)
      toast.error('Failed to create new session')
    }
  }

  const restartSession = async (restartPoint: number) => {
    if (!selectedSession) return
    
    try {
      const apiUrl = API_CONFIG.BASE_URL
      const response = await fetch(`${apiUrl}/api/sessions/${selectedSession.id}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restartPoint })
      })
      
      if (response.ok) {
        const updatedSession = await response.json()
        setSessions(prev => prev.map(s => s.id === selectedSession.id ? updatedSession : s))
        onSessionRestart(selectedSession.id, restartPoint)
        setShowRestartModal(false)
        toast.success(`Session restarted from: ${restartPoints[restartPoint - 1].label}`)
      } else {
        toast.error('Failed to restart session')
      }
    } catch (error) {
      console.error('Restart session error:', error)
      toast.error('Failed to restart session')
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }
    
    try {
      const apiUrl = API_CONFIG.BASE_URL
      const response = await fetch(`${apiUrl}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        onSessionDelete(sessionId)
        toast.success('Session deleted')
      } else {
        toast.error('Failed to delete session')
      }
    } catch (error) {
      console.error('Delete session error:', error)
      toast.error('Failed to delete session')
    }
  }

  const exportSession = async (session: SessionData) => {
    try {
      const dataStr = JSON.stringify(session, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${session.fileName || `session_${session.id}`}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Session exported successfully')
    } catch (error) {
      console.error('Export session error:', error)
      toast.error('Failed to export session')
    }
  }

  const loadSessionFiles = async () => {
    try {
      const apiUrl = API_CONFIG.BASE_URL
      const response = await fetch(`${apiUrl}/api/sessions/files`)
      
      if (response.ok) {
        const sessionFiles = await response.json()
        
        // Import each session file
        for (const sessionFile of sessionFiles) {
          try {
            const fileResponse = await fetch(`${apiUrl}/api/sessions/files/${sessionFile.filename}`)
            if (fileResponse.ok) {
              const sessionData = await fileResponse.json()
              
              // Import the session
              const importResponse = await fetch(`${apiUrl}/api/sessions/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  filename: sessionFile.filename,
                  userWallet: sessionData.admin.address
                })
              })
              
              if (importResponse.ok) {
                const importedSession = await importResponse.json()
                setSessions(prev => {
                  // Check if session already exists
                  const exists = prev.some(s => s.sessionId === importedSession.sessionId)
                  if (!exists) {
                    return [importedSession, ...prev]
                  }
                  return prev
                })
              }
            }
          } catch (error) {
            console.error(`Failed to import session file ${sessionFile.filename}:`, error)
          }
        }
        
        toast.success(`Loaded ${sessionFiles.length} session files`)
      } else {
        toast.error('Failed to load session files')
      }
    } catch (error) {
      console.error('Load session files error:', error)
      toast.error('Failed to load session files')
    }
  }

  const importSession = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const sessionData = JSON.parse(text)
      
      const apiUrl = API_CONFIG.BASE_URL
      const response = await fetch(`${apiUrl}/api/sessions/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })
      
      if (response.ok) {
        const importedSession = await response.json()
        setSessions(prev => [importedSession, ...prev])
        toast.success('Session imported successfully')
      } else {
        toast.error('Failed to import session')
      }
    } catch (error) {
      console.error('Import session error:', error)
      toast.error('Failed to import session - invalid file format')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/20 border-green-700'
      case 'paused': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700'
      case 'stopped': return 'text-gray-400 bg-gray-900/20 border-gray-700'
      case 'error': return 'text-red-400 bg-red-900/20 border-red-700'
      default: return 'text-blue-400 bg-blue-900/20 border-blue-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Play
      case 'paused': return Pause
      case 'stopped': return Square
      case 'error': return AlertCircle
      default: return Clock
    }
  }

  const tabs = [
    { id: 'sessions', label: 'Sessions', icon: Database },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 }
  ]

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Advanced Session Manager
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadSessionFiles}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Load Files
          </button>
          
          <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer flex items-center gap-2 transition-colors">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importSession}
              className="hidden"
            />
          </label>
          
          <button
            onClick={createNewSession}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Database className="w-4 h-4" />
            New Session
          </button>
          
          <button
            onClick={loadSessions}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span className="ml-2 text-gray-400">Loading sessions...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No sessions found. Create a new session to get started.</p>
              </div>
            ) : (
              sessions.map((session) => {
                const StatusIcon = getStatusIcon(session.status)
                return (
                  <div
                    key={session.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-white">
                            {session.tokenName || 'Unnamed Session'}
                          </h3>
                          <div className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(session.status)}`}>
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {session.status}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                          <div>
                            <span className="text-gray-500">Token:</span> {session.tokenSymbol || 'N/A'}
                          </div>
                          <div>
                            <span className="text-gray-500">Wallets:</span> {session.wallets?.length || 0}
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span> {session.timestamp ? format(new Date(session.timestamp), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </div>
                          <div>
                            <span className="text-gray-500">File:</span> {session.fileName || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedSession(session)
                            setShowSessionDetails(true)
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => exportSession(session)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Export Session"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedSession(session)
                            setShowRestartModal(true)
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Restart Session"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => onSessionSelect(session)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Select
                        </button>
                        
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'details' && selectedSession && (
          <div className="space-y-6">
            {/* Admin Wallet */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                Admin Wallet
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">{selectedSession.admin.address}</span>
                    <button
                      onClick={() => copyToClipboard(selectedSession.admin.address, 'Address')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Private Key:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">{selectedSession.admin.privateKey.substring(0, 20)}...</span>
                    <button
                      onClick={() => copyToClipboard(selectedSession.admin.privateKey, 'Private Key')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Wallets */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-400" />
                Trading Wallets ({selectedSession.wallets?.length || 0})
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {selectedSession.wallets?.map((wallet, index) => (
                  <div key={wallet.number} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <span className="text-sm text-gray-400">Wallet #{wallet.number}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white font-mono">{wallet.address.substring(0, 20)}...</span>
                      <button
                        onClick={() => copyToClipboard(wallet.address, `Wallet #${wallet.number} Address`)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Token Information */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-400" />
                Token Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">{selectedSession.tokenAddress}</span>
                    <button
                      onClick={() => copyToClipboard(selectedSession.tokenAddress, 'Token Address')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{selectedSession.tokenName}</span>
                </div>
                {selectedSession.tokenSymbol && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Symbol:</span>
                    <span className="text-white">{selectedSession.tokenSymbol}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && selectedSession?.metrics && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{selectedSession.metrics.totalVolume.toFixed(4)}</div>
                <div className="text-sm text-gray-400">Total Volume (SOL)</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{selectedSession.metrics.totalTransactions}</div>
                <div className="text-sm text-gray-400">Total Transactions</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{selectedSession.metrics.successfulTransactions}</div>
                <div className="text-sm text-gray-400">Successful</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400">{selectedSession.metrics.failedTransactions}</div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{selectedSession.metrics.totalFees.toFixed(6)}</div>
                <div className="text-sm text-gray-400">Total Fees (SOL)</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{selectedSession.metrics.averageSlippage.toFixed(2)}%</div>
                <div className="text-sm text-gray-400">Avg Slippage</div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Restart Modal */}
      {showRestartModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Restart Session</h3>
            <p className="text-gray-400 mb-6">
              Select a restart point for session: {selectedSession.tokenName}
            </p>
            
            <div className="space-y-3 mb-6">
              {restartPoints.map((point) => {
                const Icon = point.icon
                return (
                  <button
                    key={point.id}
                    onClick={() => restartSession(point.id)}
                    className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="font-medium text-white">{point.label}</div>
                        <div className="text-sm text-gray-400">{point.description}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRestartModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}