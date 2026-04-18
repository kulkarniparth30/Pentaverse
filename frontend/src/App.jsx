import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import UploadPage from './pages/UploadPage.jsx'
import AnalysisPage from './pages/AnalysisPage.jsx'
import ReportPage from './pages/ReportPage.jsx'

function Navbar() {
  const location = useLocation()
  const navItems = [
    { path: '/', label: 'Upload', icon: '📄' },
    { path: '/analysis', label: 'Analysis', icon: '🔬' },
    { path: '/report', label: 'Report', icon: '📊' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'rgba(10, 14, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--forensiq-border)',
    }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
          }}>F</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
            Forens<span style={{ color: '#6366f1' }}>IQ</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className="px-4 py-2 rounded-xl text-sm font-medium no-underline transition-all duration-200"
              style={{
                color: location.pathname === item.path ? '#fff' : '#94a3b8',
                background: location.pathname === item.path ? 'rgba(99,102,241,0.2)' : 'transparent',
                border: location.pathname === item.path ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              }}
            >
              <span className="mr-1.5">{item.icon}</span>{item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <main style={{ paddingTop: 80 }}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/report/:fileId" element={<ReportPage />} />
        </Routes>
      </main>
    </Router>
  )
}
