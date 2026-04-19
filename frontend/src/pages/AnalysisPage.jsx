/**
 * AnalysisPage
 * ============
 * Shows progress while the forensic pipeline runs.
 * Receives fileId from UploadPage via router state.
 *
 * Owner: Frontend Dev 1
 */

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { analyzeFile } from '../services/api.js'

const STEPS = [
  { label: 'Parsing PDF', icon: '📄', desc: 'Extracting text and metadata' },
  { label: 'Extracting stylometric features', icon: '🧬', desc: 'Analyzing writing patterns' },
  { label: 'Clustering writing styles', icon: '📊', desc: 'Identifying distinct authors' },
  { label: 'Analyzing citations', icon: '📚', desc: 'Checking reference integrity' },
  { label: 'Tracing sources', icon: '🔍', desc: 'Matching against databases' },
  { label: 'Building report', icon: '📝', desc: 'Compiling forensic results' },
]

export default function AnalysisPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { fileId, filename } = location.state || {}

  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!fileId) {
      navigate('/')
      return
    }

    // Simulate step progression while waiting for actual analysis
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev))
    }, 2000)

    // Start actual analysis
    analyzeFile(fileId)
      .then((result) => {
        clearInterval(interval)
        setCurrentStep(STEPS.length)
        setTimeout(() => {
          navigate(`/report/${fileId}`, { state: { report: result.report } })
        }, 800)
      })
      .catch((err) => {
        clearInterval(interval)
        setError(err.response?.data?.detail || 'Analysis failed.')
      })

    return () => clearInterval(interval)
  }, [fileId, navigate])

  const progress = Math.min(((currentStep + 1) / STEPS.length) * 100, 100)

  return (
    <div style={{ minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ maxWidth: 560, width: '100%' }} className="animate-fade-in-up">
        <div className="glass-card" style={{ padding: 40, borderRadius: 24, boxShadow: 'var(--forensiq-shadow-lg)' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 24,
            }}>
              🔬
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Analyzing Paper</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', wordBreak: 'break-all', padding: '0 16px' }}>
              {filename || 'document.pdf'}
            </p>
          </div>

          {/* Step List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {STEPS.map((step, i) => {
              const isActive = i === currentStep
              const isDone = i < currentStep || currentStep >= STEPS.length
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                  borderRadius: 14,
                  background: isActive ? 'rgba(99,102,241,0.04)' : isDone ? 'rgba(16,185,129,0.03)' : 'transparent',
                  transition: 'all 0.4s ease',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                    background: isDone ? 'rgba(16,185,129,0.1)' : isActive ? 'rgba(99,102,241,0.1)' : '#f1f5f9',
                    border: `1.5px solid ${isDone ? 'rgba(16,185,129,0.2)' : isActive ? 'rgba(99,102,241,0.2)' : '#e2e8f0'}`,
                    color: isDone ? '#10b981' : isActive ? '#6366f1' : '#94a3b8',
                    transition: 'all 0.4s ease',
                  }}>
                    {isDone ? '✓' : step.icon}
                  </div>
                  <div>
                    <span style={{
                      fontSize: 14, fontWeight: 600,
                      color: isDone ? '#10b981' : isActive ? '#1e293b' : '#94a3b8',
                      transition: 'color 0.3s ease',
                    }}>
                      {step.label}
                      {isActive && <span style={{ marginLeft: 8, display: 'inline-block', animation: 'spin 1.5s linear infinite', fontSize: 12 }}>⏳</span>}
                    </span>
                    <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99, transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                boxShadow: '0 0 12px rgba(99,102,241,0.3)',
              }} />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 20, padding: '12px 18px', borderRadius: 14,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
              color: '#ef4444', fontSize: 14, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
