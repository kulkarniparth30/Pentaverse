import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, deleteHistory } from '../services/api.js'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getHistory()
        setHistory(data)
      } catch (err) {
        setError('Failed to load history. Please ensure the backend is running and connected to Supabase.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [])

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return
    try {
      await deleteHistory(fileId)
      setHistory(prev => prev.filter(item => item.file_id !== fileId))
    } catch (err) {
      console.error(err)
      alert('Failed to delete report. Please try again.')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    }).format(date)
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: 1000, margin: '0 auto' }}>
      
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Analysis History
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            View your previously processed documents and forensic reports.
          </p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="btn-primary"
          style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14 }}
        >
          New Analysis
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: 24, padding: '16px 20px', borderRadius: 12,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
          color: '#ef4444', fontSize: 14, fontWeight: 500
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ 
            width: 40, height: 40, margin: '0 auto 16px',
            border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1',
            borderRadius: '50%', animation: 'spin 1s linear infinite' 
          }} />
          <p style={{ color: '#64748b', fontWeight: 500 }}>Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ 
            width: 64, height: 64, margin: '0 auto 16px', borderRadius: 16,
            background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>No analyses yet</h3>
          <p style={{ color: '#64748b', fontSize: 14 }}>Upload a document to see your history here.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Analyzed</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.file_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>{item.filename}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#64748b', fontSize: 14 }}>
                    {formatDate(item.created_at)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: 'rgba(16,185,129,0.1)', color: '#10b981' 
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => navigate(`/report/${item.file_id}`, { state: { filename: item.filename } })}
                        style={{ 
                          padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                          background: '#fff', border: '1px solid #e2e8f0', color: '#475569',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1' }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
                      >
                        View Report
                      </button>
                      <button 
                        onClick={() => handleDelete(item.file_id)}
                        style={{ 
                          padding: '6px 10px', borderRadius: 8, fontSize: 13,
                          background: '#fff', border: '1px solid #e2e8f0', color: '#ef4444',
                          cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}
                        title="Delete Report"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
