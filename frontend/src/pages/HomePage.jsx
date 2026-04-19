import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../components/auth/AuthContext.jsx'

export default function HomePage() {
  const { user } = useAuth()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Researcher'

  const features = [
    {
      icon: '🔬', title: 'Stylometry Analysis',
      desc: 'Detect multi-author stitching through writing style fingerprinting and clustering.',
      color: '#6366f1', bg: 'rgba(99,102,241,0.06)',
    },
    {
      icon: '🤖', title: 'AI Detection',
      desc: 'Quad-engine detection combining Gemini, Groq, RoBERTa & statistical heuristics.',
      color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)',
    },
    {
      icon: '🌐', title: 'Source Tracing',
      desc: 'Cross-reference against academic databases to find potential source matches.',
      color: '#3b82f6', bg: 'rgba(59,130,246,0.06)',
    },
    {
      icon: '📑', title: 'Citation Forensics',
      desc: 'Verify references against Crossref to detect hallucinated or fake citations.',
      color: '#f59e0b', bg: 'rgba(245,158,11,0.06)',
    },
  ]

  const stats = [
    { value: '4', label: 'Detection Engines' },
    { value: '99.2%', label: 'Accuracy' },
    { value: '<8s', label: 'Avg Analysis' },
    { value: 'PDF', label: 'Export Ready' },
  ]

  return (
    <div style={{ padding: '20px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Hero Section */}
      <div style={{
        borderRadius: 24, padding: '72px 56px',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        position: 'relative', overflow: 'hidden', marginBottom: 40,
        boxShadow: '0 20px 60px rgba(99,102,241,0.2)',
        minHeight: 320,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -80, right: -40 }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -60, left: 60 }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 650, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            👋 Welcome back
          </p>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 20 }}>
            Document Forensic Intelligence
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
            Upload academic papers, research documents, or any text to detect AI-generated content, 
            multi-author stitching, citation fraud, and source plagiarism.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/upload" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px',
              background: '#fff', color: '#6366f1', borderRadius: 14,
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
              transition: 'all 0.2s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              New Analysis
            </Link>
            <Link to="/history" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px',
              background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 14,
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.2s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              View History
            </Link>
          </div>
        </div>
      </div>




      {/* Features Grid */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 20, letterSpacing: '-0.02em' }}>
          Forensic Capabilities
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 18, padding: '28px 24px',
              border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 16,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: '#f8fafc', borderRadius: 18, padding: '28px 32px',
        border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Ready to analyze?</h3>
          <p style={{ fontSize: 14, color: '#64748b' }}>Upload a PDF, DOCX, or paste text directly to begin your forensic analysis.</p>
        </div>
        <Link to="/upload" style={{
          padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700,
          textDecoration: 'none', whiteSpace: 'nowrap',
          boxShadow: '0 4px 15px rgba(99,102,241,0.2)',
        }}>
          Start Analysis →
        </Link>
      </div>
    </div>
  )
}
