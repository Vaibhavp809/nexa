import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import GroqDemo from './pages/GroqDemo'
import Notes from './pages/Notes'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Tasks from './pages/Tasks'
import Workspace from './pages/Workspace'
import Onboarding from './pages/Onboarding'
import History from './pages/History'
import Widget from './pages/Widget'
import LanguageSelection from './pages/LanguageSelection'
import Meditator from './pages/Meditator'
import './index.css'

import Navbar from './components/Navbar'
import Bubble from './components/Bubble/Bubble'

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
    <>
      {token && <Navbar />}
      {token && <Bubble />}
      <Routes>
        <Route path='/' element={token ? <Home /> : <Navigate to='/login' />} />
        <Route path='/login' element={!token ? <Login /> : <Navigate to='/' />} />
        <Route path='/register' element={!token ? <Register /> : <Navigate to='/' />} />
        <Route path='/groq' element={token ? <GroqDemo /> : <Navigate to='/login' />} />
        <Route path='/notes' element={token ? <Notes /> : <Navigate to='/login' />} />
        <Route path='/tasks' element={token ? <Tasks /> : <Navigate to='/login' />} />
        <Route path='/workspace' element={token ? <Workspace /> : <Navigate to='/login' />} />
        <Route path='/profile' element={token ? <Profile /> : <Navigate to='/login' />} />
        <Route path='/settings' element={token ? <Settings /> : <Navigate to='/login' />} />
        <Route path='/history' element={token ? <History /> : <Navigate to='/login' />} />
        <Route path='/language-selection' element={token ? <LanguageSelection /> : <Navigate to='/login' />} />
        <Route path='/meditator' element={token ? <Meditator /> : <Navigate to='/login' />} />
        <Route path='/onboarding' element={<Onboarding />} />
        <Route path='/widget' element={<Widget />} />
      </Routes>
    </>
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
