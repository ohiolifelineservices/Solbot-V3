'use client';

import { API_CONFIG } from '../../lib/api';

export default function Debug() {
  const testAPI = async () => {
    console.log('API_CONFIG:', API_CONFIG);
    console.log('Environment variables:', {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL
    });
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`);
      const data = await response.json();
      console.log('API Response:', data);
      alert('API test successful! Check console for details.');
    } catch (error) {
      console.error('API Error:', error);
      alert(`API test failed: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug Page</h1>
      <p>API Base URL: {API_CONFIG.BASE_URL}</p>
      <p>WebSocket URL: {API_CONFIG.WS_URL}</p>
      <p>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
      <p>NEXT_PUBLIC_WS_URL: {process.env.NEXT_PUBLIC_WS_URL || 'Not set'}</p>
      <button onClick={testAPI}>Test API Connection</button>
    </div>
  );
}