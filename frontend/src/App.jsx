import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/auth/AuthContext.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import HomePage from './pages/HomePage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import AnalysisPage from './pages/AnalysisPage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'

function Navbar() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/upload', label: 'Upload', icon: '📄' },
    { path: '/history', label: 'History', icon: '🕒' },
  ]

  if (!user) return null
  if (location.pathname === '/login' || location.pathname === '/signup') return null

  return (
    <nav className="navbar-pill">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 800, color: '#fff',
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
        }}>F</div>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
          Forens<span style={{ color: '#6366f1' }}>IQ</span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span style={{ marginRight: 4 }}>{item.icon}</span>{item.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button 
          onClick={signOut}
          className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-red-500 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </nav>
  )
}

function BackgroundDecoration() {
  return (
    <div className="bg-decoration" aria-hidden="true">
      <div className="bg-blob-1" />
      <div className="bg-blob-2" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <BackgroundDecoration />
        <Navbar />
        <main style={{ paddingTop: 90, position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            <Route path="/history" element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } />
            <Route path="/analysis" element={
              <ProtectedRoute>
                <AnalysisPage />
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            } />
            <Route path="/report/:fileId" element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  )
}
