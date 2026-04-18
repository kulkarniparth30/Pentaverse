/**
 * UploadPage
 * ==========
 * Drag & drop PDF upload interface with animated drop zone.
 *
 * Flow: User drops PDF → calls uploadPDF() → navigates to /analysis
 * Owner: Frontend Dev 1
 */

import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPDF } from '../services/api.js'

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }

    try {
      setUploading(true)
      const result = await uploadPDF(file)
      // Navigate to analysis page with file_id
      navigate('/analysis', { state: { fileId: result.file_id, filename: result.filename } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ paddingTop: 0 }}>
      <div className="max-w-2xl w-full animate-fade-in-up">
        {/* Hero Text */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold mb-4" style={{
            background: 'linear-gradient(135deg, #6366f1, #a78bfa, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
          }}>
            Analyze Academic Integrity
          </h1>
          <p className="text-lg" style={{ color: 'var(--forensiq-text-muted)' }}>
            Upload a PDF paper to detect multi-author stitching, citation anomalies, and trace potential sources.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          id="upload-dropzone"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
          className="glass-card cursor-pointer text-center"
          style={{
            padding: '60px 40px',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: isDragging ? 'var(--forensiq-accent)' : 'var(--forensiq-border)',
            background: isDragging ? 'rgba(99,102,241,0.08)' : 'rgba(17,24,39,0.5)',
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.3s ease',
          }}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={handleDrop}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <div style={{
                width: 48, height: 48, border: '3px solid var(--forensiq-border)',
                borderTop: '3px solid var(--forensiq-accent)',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
              }} />
              <p className="text-lg font-medium">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="text-6xl mb-4">📄</div>
              <p className="text-xl font-semibold mb-2" style={{ color: 'var(--forensiq-text)' }}>
                {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF'}
              </p>
              <p className="text-sm" style={{ color: 'var(--forensiq-text-muted)' }}>
                or click to browse — max 50MB
              </p>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm" style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--forensiq-danger)',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          {[
            { icon: '🧬', title: 'Stylometry', desc: 'Detects writing style shifts' },
            { icon: '📚', title: 'Citations', desc: 'Anomaly detection in references' },
            { icon: '🔍', title: 'Source Trace', desc: 'Matches against arXiv papers' },
          ].map((f, i) => (
            <div key={i} className="glass-card text-center" style={{
              animationDelay: `${i * 0.15}s`, padding: 20,
            }}>
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs" style={{ color: 'var(--forensiq-text-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
