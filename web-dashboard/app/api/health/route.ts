import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if the backend API server is running
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:12001'
    
    let rpcConnected = false
    let backendStatus = 'disconnected'
    
    try {
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        backendStatus = 'connected'
        rpcConnected = data.rpcConnected || false
      }
    } catch (error) {
      console.log('Backend not reachable:', error)
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      frontend: 'running',
      backend: backendStatus,
      rpcConnected: rpcConnected
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}