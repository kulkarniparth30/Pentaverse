/**
 * UploadPage
 * ==========
 * Text input + file upload interface for forensic analysis.
 *
 * Supports: Direct text paste, PDF, DOCX, DOC, TXT
 * Flow: User pastes text or uploads file → navigates to /analysis
 * Owner: Frontend Dev 1
 */

import React, { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPDF, uploadText } from '../services/api.js'

export default function UploadPage() {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handlePasteClick = async () => {
    try {
      const clipText = await navigator.clipboard.readText()
      if (clipText) {
        setText(clipText)
        setUploadedFile(null)
        setError(null)
        if (textareaRef.current) textareaRef.current.focus()
      }
    } catch {
      // Clipboard API denied — focus textarea for manual paste
      if (textareaRef.current) textareaRef.current.focus()
    }
  }

  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ]
  const ACCEPTED_EXTS = ['.pdf', '.docx', '.doc', '.txt']

  const handleFileSelected = useCallback((file) => {
    if (!file) return
    setError(null)
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTS.includes(ext)) {
      setError('Unsupported file type. Accepted: PDF, DOCX, TXT.')
      return
    }
    setUploadedFile(file)
    setText('')
  }, [])

  const handleInputChange = useCallback((e) => {
    const file = e.target?.files?.[0]
    handleFileSelected(file)
  }, [handleFileSelected])

  const handleSubmit = useCallback(async () => {
    setError(null)

    if (!text.trim() && !uploadedFile) {
      setError('Please paste text or upload a file first.')
      return
    }

    try {
      setUploading(true)
      let result
      if (uploadedFile) {
        result = await uploadPDF(uploadedFile)
      } else {
        result = await uploadText(text.trim())
      }
      navigate('/analysis', { state: { fileId: result.file_id, filename: result.filename } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [text, uploadedFile, navigate])

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length
  const hasContent = text.trim().length > 0 || uploadedFile

  return (
    <div style={{ minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ maxWidth: 760, width: '100%' }} className="animate-fade-in-up">

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        {/* Badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span className="badge">
            <span className="badge-dot" />
            Academic Integrity Suite
          </span>
        </div>

        {/* Hero Text */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            fontSize: 56, fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-0.03em', color: '#1e293b', marginBottom: 8,
          }}>
            Detect Academic
          </h1>
          <h1 className="gradient-text" style={{
            fontSize: 56, fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-0.03em', marginBottom: 20,
          }}>
            Anomalies Instantly
          </h1>
          <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>
            Leverage advanced forensics to identify plagiarism, writing inconsistencies, and multi-author patterns.
          </p>
        </div>

        {/* ═══ Text Input Card ═══ */}
        <div className="glass-card" style={{
          padding: 0, overflow: 'hidden', marginBottom: 20,
          border: hasContent ? '1.5px solid rgba(99,102,241,0.2)' : '1.5px solid #e2e8f0',
          transition: 'border-color 0.3s ease',
        }}>
          {/* Textarea */}
          {uploadedFile ? (
            <div style={{
              minHeight: 220, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{uploadedFile.name}</p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
              <button
                type="button"
                onClick={() => { setUploadedFile(null); setError(null) }}
                style={{
                  fontSize: 12, fontWeight: 600, color: '#ef4444',
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 8, padding: '5px 14px', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null) }}
              placeholder="Start typing or paste your text here"
              style={{
                width: '100%', minHeight: 220, padding: '20px 24px',
                border: 'none', outline: 'none', resize: 'vertical',
                fontSize: 15, lineHeight: 1.8, color: '#1e293b',
                fontFamily: "'Inter', sans-serif",
                background: 'transparent',
              }}
            />
          )}

          {/* Bottom bar: character count */}
          {!uploadedFile && text.length > 0 && (
            <div style={{
              padding: '6px 24px', borderTop: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'flex-end', gap: 16,
            }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{wordCount} words</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{charCount} chars</span>
            </div>
          )}
        </div>

        {/* ═══ Action Buttons Row ═══ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, marginBottom: 20,
        }}>
          {/* Left: Paste + Upload */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={handlePasteClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 12,
                background: '#fff', border: '1.5px solid #e2e8f0',
                fontSize: 14, fontWeight: 600, color: '#475569',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1' }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Paste text
            </button>

            <button
              type="button"
              onClick={openFilePicker}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 12,
                background: '#fff', border: '1.5px solid #e2e8f0',
                fontSize: 14, fontWeight: 600, color: '#475569',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1' }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload File
            </button>
          </div>

          {/* Right: Check button */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={uploading || !hasContent}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12,
              fontSize: 15, fontWeight: 700,
              opacity: (!hasContent && !uploading) ? 0.5 : 1,
              cursor: (!hasContent && !uploading) ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? (
              <>
                <div style={{
                  width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff', borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Analyzing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Check for Plagiarism
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 20, padding: '12px 18px', borderRadius: 14,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#ef4444', fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
             HOW IT WORKS SECTION
             ═══════════════════════════════════════════════════════ */}
        <div id="how-it-works" style={{ marginTop: 80, scrollMarginTop: 100 }}>

          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="badge" style={{ marginBottom: 16, display: 'inline-flex' }}>
              <span className="badge-dot" />
              How It Works
            </span>
            <h2 style={{
              fontSize: 38, fontWeight: 800, color: '#1e293b',
              letterSpacing: '-0.03em', marginTop: 16, marginBottom: 12,
            }}>
              Three Steps to <span className="gradient-text">Full Analysis</span>
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Our forensic pipeline processes your document through multiple AI-driven analysis stages to deliver comprehensive results.
            </p>
          </div>

          {/* Process Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginBottom: 56, position: 'relative' }}>
            {/* Connector line */}
            <div style={{
              position: 'absolute', top: 44, left: 'calc(16.66% + 24px)', right: 'calc(16.66% + 24px)',
              height: 2, background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
              opacity: 0.2, zIndex: 0,
            }} />

            {[
              {
                step: '01',
                icon: '📤',
                title: 'Upload Your Paper',
                desc: 'Drag & drop or click to upload your academic PDF. We support files up to 50MB with instant processing.',
                color: '#6366f1',
              },
              {
                step: '02',
                icon: '⚙️',
                title: 'AI-Powered Analysis',
                desc: 'Our pipeline extracts stylometric features, clusters writing styles, checks citations, and traces sources simultaneously.',
                color: '#a855f7',
              },
              {
                step: '03',
                icon: '📊',
                title: 'Get Your Report',
                desc: 'Receive a comprehensive forensic report with risk scores, AI detection results, source matches, and actionable insights.',
                color: '#ec4899',
              },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0 20px', position: 'relative', zIndex: 1 }}>
                {/* Step number badge */}
                <div style={{
                  width: 88, height: 88, borderRadius: 24, margin: '0 auto 20px',
                  background: '#fff', border: `2px solid ${s.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 8px 32px ${s.color}15`,
                  position: 'relative',
                }}>
                  <span style={{ fontSize: 36 }}>{s.icon}</span>
                  <div style={{
                    position: 'absolute', top: -8, right: -8,
                    width: 28, height: 28, borderRadius: 99,
                    background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff',
                    boxShadow: `0 2px 8px ${s.color}40`,
                  }}>
                    {s.step}
                  </div>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)', margin: '8px 0 56px' }} />

          {/* Features Section Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', marginBottom: 10 }}>
              Powerful <span className="gradient-text">Features</span>
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>
              Every analysis leverages cutting-edge AI to examine your document from every angle.
            </p>
          </div>

          {/* Feature Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 56 }}>
            {[
              {
                icon: '🧬', title: 'Stylometry Analysis', color: '#6366f1',
                desc: 'Detects writing style shifts across document sections using 391-dimensional feature vectors.',
                details: ['Sentence length patterns', 'Vocabulary richness (TTR)', 'Passive voice detection', 'Punctuation density'],
              },
              {
                icon: '🤖', title: 'AI Content Detection', color: '#a855f7',
                desc: 'Identifies AI-generated text with paragraph-level granularity and tool attribution.',
                details: ['GPT/Claude/Gemini detection', 'Per-paragraph scoring', 'Confidence ratings', 'Tool identification'],
              },
              {
                icon: '🔍', title: 'Source Tracing', color: '#ec4899',
                desc: 'Matches content against arXiv and Semantic Scholar to find potential source papers.',
                details: ['arXiv paper matching', 'Semantic Scholar search', 'Similarity scoring', 'Direct source links'],
              },
            ].map((f, i) => (
              <div key={i} className="glass-card" style={{
                padding: 28, borderTop: `3px solid ${f.color}`,
                transition: 'all 0.3s ease',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: `${f.color}08`, border: `1px solid ${f.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18, fontSize: 24,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: '#1e293b' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 16 }}>{f.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {f.details.map((d, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8' }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', background: f.color, flexShrink: 0,
                        opacity: 0.6,
                      }} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Additional Features Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 56 }}>
            {[
              { icon: '📝', title: 'Citation Analysis', desc: 'Detects temporal anomalies and topic mismatches in references', color: '#3b82f6' },
              { icon: '👥', title: 'Multi-Author Detection', desc: 'Clusters paragraphs by writing style to find co-authorship', color: '#10b981' },
              { icon: '📈', title: 'Risk Scoring', desc: 'Comprehensive 0-100 risk score combining all analysis signals', color: '#f59e0b' },
              { icon: '📋', title: 'Detailed Reports', desc: 'Tabbed reports with charts, timelines, and actionable insights', color: '#ef4444' },
            ].map((f, i) => (
              <div key={i} className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${f.color}08`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', fontSize: 20,
                }}>
                  {f.icon}
                </div>
                <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#1e293b' }}>{f.title}</h4>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Trust Stats Bar */}
          <div className="glass-card" style={{
            padding: '28px 40px', marginBottom: 40,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.03), rgba(168,85,247,0.03), rgba(236,72,153,0.03))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          }}>
            {[
              { value: '391', label: 'Feature Dimensions', icon: '🧬' },
              { value: '< 30s', label: 'Average Analysis Time', icon: '⚡' },
              { value: '3', label: 'AI Model Pipelines', icon: '🤖' },
              { value: '50MB', label: 'Max File Size', icon: '📄' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{stat.icon}</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{stat.value}</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{stat.label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
