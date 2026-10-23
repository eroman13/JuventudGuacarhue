import React from 'react'
import ReactDOM from 'react-dom/client'
import AppContent from './App.tsx'
import { AuthProvider } from './hooks/useAuth.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </React.StrictMode>,
)
