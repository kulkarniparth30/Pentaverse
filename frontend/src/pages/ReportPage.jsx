/**
 * ReportPage
 * ==========
 * Tabbed forensic report view matching the premium white design.
 * Tabs: Stylometry | AI Detection | Source Tracing | Summary
 *
 * Owner: Frontend Dev 1
 */

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getReport } from '../services/api.js'
import html2pdf from 'html2pdf.js'

import StylometryTab from '../components/tabs/StylometryTab.jsx'
import AIDetectionTab from '../components/tabs/AIDetectionTab.jsx'
import SourceTracingTab from '../components/tabs/SourceTracingTab.jsx'
import SummaryTab from '../components/tabs/SummaryTab.jsx'
import DocumentTextTab from '../components/tabs/DocumentTextTab.jsx'

/* ── Verdict Banner ── */
function VerdictBanner({ report, onDownload }) {
  const aiPct = Math.round((report.overall_ai_probability || 0) * 100)
  const risk = report.overall_risk_score || 0
  const authors = report.estimated_authors || 1

  let verdict, icon, gradient
  if (risk >= 76 || aiPct >= 70) {
    verdict = 'CRITICAL RISK — Highly Suspicious Content Detected'
    icon = '🚨'
    gradient = 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
  } else if (risk >= 51 || aiPct >= 50) {
    verdict = 'HIGH RISK — Significant Integrity Concerns Found'
    icon = '⚠️'
    gradient = 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)'
  } else if (risk >= 26 || aiPct >= 30 || authors > 1) {
    verdict = 'MODERATE RISK — Style Inconsistencies Detected'
    icon = '⚠️'
    gradient = 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
  } else {
    verdict = 'LOW RISK — No Major Integrity Issues Found'
    icon = '✅'
    gradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  }

  return (
    <div style={{
      background: gradient,
      borderRadius: '20px 20px 0 0',
      padding: '22px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Combined Forensic Verdict</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{verdict}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onDownload}
          style={{
            background: '#fff',
            border: 'none',
            borderRadius: 50,
            padding: '8px 18px',
            color: '#1e293b',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          📄 Download PDF
        </button>
        <DashboardLink />
      </div>
    </div>
  )
}

function DashboardLink() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/')}
      style={{
        background: 'rgba(255,255,255,0.2)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 50,
        padding: '8px 18px',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
    >
      ← Dashboard
    </button>
  )
}

/* ── File Info Bar ── */
function FileInfoBar({ fileId, paragraphCount }) {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div style={{
      padding: '14px 28px',
      background: '#fff',
      borderBottom: '1px solid #f1f5f9',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
          {fileId?.slice(0, 8) || 'document'}.pdf
        </p>
        <p style={{ fontSize: 11, color: '#94a3b8' }}>
          📅 {date} • {paragraphCount} paragraphs
        </p>
      </div>
    </div>
  )
}

/* ── Tab Navigation ── */
const TABS = [
  { id: 'stylometry', label: 'Stylometry', icon: '📊' },
  { id: 'ai', label: 'AI Detection', icon: '🤖' },
  { id: 'document', label: 'Document Text', icon: '📄' },
  { id: 'sources', label: 'Source Tracing', icon: '🌐' },
  { id: 'summary', label: 'Summary', icon: '📋' },
]

function TabNavigation({ activeTab, setActiveTab, aiPct }) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      padding: '12px 28px',
      background: '#fff',
      borderBottom: '1px solid #f1f5f9',
    }} className="html2pdf__exclude">
      {TABS.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 50,
              border: isActive ? '1.5px solid #6366f1' : '1.5px solid transparent',
              background: isActive ? 'rgba(99,102,241,0.06)' : 'transparent',
              color: isActive ? '#6366f1' : '#94a3b8',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = '#f8fafc'
                e.currentTarget.style.color = '#475569'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#94a3b8'
              }
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
            {/* Show AI % badge on AI Detection tab */}
            {tab.id === 'ai' && aiPct > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 800,
                padding: '1px 7px', borderRadius: 99,
                background: aiPct >= 50 ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
                color: aiPct >= 50 ? '#ef4444' : '#f97316',
                marginLeft: 2,
              }}>
                {aiPct}%
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ── Main Report Page ── */
export default function ReportPage() {
  const { fileId } = useParams()
  const location = useLocation()
  const [report, setReport] = useState(location.state?.report || null)
  const [loading, setLoading] = useState(!report)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('stylometry')
  const reportRef = useRef(null)

  useEffect(() => {
    if (report || !fileId) return
    setLoading(true)
    getReport(fileId)
      .then(data => { setReport(data); setLoading(false) })
      .catch(err => { setError(err.response?.data?.detail || 'Failed to load report.'); setLoading(false) })
  }, [fileId, report])

  const handleDownloadPdf = () => {
    const element = reportRef.current;
    if (!element) return;
    
    // Set active tab to 'summary' briefly to capture the best high-level view for the PDF
    const previousTab = activeTab;
    setActiveTab('summary');
    
    // Small timeout to allow React to render the summary tab
    setTimeout(() => {
      const opt = {
        margin:       10,
        filename:     `ForensIQ_Report_${fileId?.slice(0, 8) || 'Document'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        // Restore previous tab after PDF generation
        setActiveTab(previousTab);
      });
    }, 300);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 90px)' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid #e2e8f0',
          borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 90px)', padding: 24 }}>
        <div className="glass-card" style={{ padding: 40, maxWidth: 400, textAlign: 'center', boxShadow: 'var(--forensiq-shadow-lg)' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>😕</p>
          <p style={{ color: '#ef4444', fontWeight: 600 }}>{error || 'No report data. Upload a PDF first.'}</p>
        </div>
      </div>
    )
  }

  const aiPct = Math.round((report.overall_ai_probability || 0) * 100)
  const paragraphCount = (report.paragraphs || []).length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }} className="animate-fade-in-up">
      {/* Verdict + Info + Tabs Shell */}
      <div ref={reportRef} style={{
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        marginBottom: 28,
        boxShadow: 'var(--forensiq-shadow-lg)',
        background: '#fff',
      }}>
        <VerdictBanner report={report} onDownload={handleDownloadPdf} />
        <FileInfoBar fileId={fileId} paragraphCount={paragraphCount} />
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} aiPct={aiPct} />

        {/* Tab Content inside the report ref so it gets exported */}
        <div style={{ minHeight: 400, padding: 24 }}>
          {activeTab === 'stylometry' && <StylometryTab report={report} />}
          {activeTab === 'ai' && <AIDetectionTab report={report} />}
          {activeTab === 'document' && <DocumentTextTab report={report} />}
          {activeTab === 'sources' && <SourceTracingTab report={report} />}
          {activeTab === 'summary' && <SummaryTab report={report} />}
        </div>
      </div>
    </div>
  )
}
