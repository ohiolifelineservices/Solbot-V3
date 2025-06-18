'use client'

import TestApiConnection from '../../components/TestApiConnection'

export default function TestApiPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🚀 Solbot V2 API Test</h1>
        <p className="text-xl mb-8">Test API connectivity and functionality</p>
        
        <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4">API Connection Test</h2>
          <TestApiConnection />
        </div>
        
        <div className="mt-8">
          <a 
            href="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors mr-4"
          >
            ← Back to Landing Page
          </a>
          <a 
            href="/dashboard" 
            className="inline-block bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}