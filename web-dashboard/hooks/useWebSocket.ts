'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketProps {
  url?: string
  sessionId?: string | null
  onSessionStarted?: (data: any) => void
  onSessionPaused?: (data: any) => void
  onSessionStopped?: (data: any) => void
  onTransactionStarted?: (data: any) => void
  onTransactionSuccess?: (data: any) => void
  onTransactionFailed?: (data: any) => void
  onTradingError?: (data: any) => void
  onMetricsUpdate?: (data: any) => void
}

export function useWebSocket({
  url,
  sessionId,
  onSessionStarted,
  onSessionPaused,
  onSessionStopped,
  onTransactionStarted,
  onTransactionSuccess,
  onTransactionFailed,
  onTradingError,
  onMetricsUpdate
}: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const apiUrl = url || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001'
    
    // Initialize socket connection
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    })

    const socket = socketRef.current

    // Connection event handlers
    socket.on('connect', () => {
      console.log('🔌 WebSocket connected')
      setIsConnected(true)
      setError(null)
      
      // Join session if provided
      if (sessionId) {
        socket.emit('joinSession', sessionId)
      }
    })

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected')
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('🔌 WebSocket connection error:', err)
      setError(err.message)
      setIsConnected(false)
    })

    // Session event handlers
    if (onSessionStarted) {
      socket.on('sessionStarted', onSessionStarted)
    }

    if (onSessionPaused) {
      socket.on('sessionPaused', onSessionPaused)
    }

    if (onSessionStopped) {
      socket.on('sessionStopped', onSessionStopped)
    }

    // Transaction event handlers
    if (onTransactionStarted) {
      socket.on('transactionStarted', onTransactionStarted)
    }

    if (onTransactionSuccess) {
      socket.on('transactionSuccess', onTransactionSuccess)
    }

    if (onTransactionFailed) {
      socket.on('transactionFailed', onTransactionFailed)
    }

    // Error handlers
    if (onTradingError) {
      socket.on('tradingError', onTradingError)
    }

    // Metrics updates
    if (onMetricsUpdate) {
      socket.on('metricsUpdate', onMetricsUpdate)
    }

    return () => {
      if (sessionId) {
        socket.emit('leaveSession', sessionId)
      }
      socket.disconnect()
    }
  }, [url, sessionId, onSessionStarted, onSessionPaused, onSessionStopped, onTransactionStarted, onTransactionSuccess, onTransactionFailed, onTradingError, onMetricsUpdate])

  // Join a new session
  const joinSession = (newSessionId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('joinSession', newSessionId)
    }
  }

  // Leave current session
  const leaveSession = (sessionIdToLeave: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leaveSession', sessionIdToLeave)
    }
  }

  return {
    isConnected,
    error,
    joinSession,
    leaveSession,
    socket: socketRef.current
  }
}