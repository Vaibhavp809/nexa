import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import GroqDemo from './pages/GroqDemo'
import './index.css'

function AppRoutes() {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-neon-blue text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path='/' element={token ? <Home /> : <Navigate to='/login' />} />
      <Route path='/login' element={!token ? <Login /> : <Navigate to='/' />} />
      <Route path='/register' element={!token ? <Register /> : <Navigate to='/' />} />
      <Route path='/groq' element={token ? <GroqDemo /> : <Navigate to='/login' />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')).render(<App />)
