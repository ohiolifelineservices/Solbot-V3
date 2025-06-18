'use client'

export default function TestApiConnection() {
  const handleTest = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      alert(`API Status: ${data.status}\nRPC Connected: ${data.rpcConnected}`)
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  return (
    <button 
      onClick={handleTest}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Test API Connection
    </button>
  )
}