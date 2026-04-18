/**
 * ReportPage
 * ==========
 * Displays the full forensic analysis report.
 * Consumes: ForensicReport schema from backend.
 *
 * Owner: Frontend Dev 1
 */

import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { getReport } from '../services/api.js'
import RiskScore from '../components/RiskScore.jsx'
import HeatmapView from '../components/HeatmapView.jsx'
import AuthorClusters from '../components/AuthorClusters.jsx'
import SourceCard from '../components/SourceCard.jsx'
import CitationGraph from '../components/CitationGraph.jsx'

export default function ReportPage() {
  const { fileId } = useParams()
  const location = useLocation()
  const [report, setReport] = useState(location.state?.report || null)
  const [loading, setLoading] = useState(!report)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (report || !fileId) return
    setLoading(true)
    getReport(fileId)
      .then(data => { setReport(data); setLoading(false) })
      .catch(err => { setError(err.response?.data?.detail || 'Failed to load report.'); setLoading(false) })
  }, [fileId, report])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ width: 48, height: 48, border: '3px solid var(--forensiq-border)', borderTop: '3px solid var(--forensiq-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card text-center" style={{ padding: 40, maxWidth: 400 }}>
          <p className="text-xl mb-2">😕</p>
          <p style={{ color: 'var(--forensiq-danger)' }}>{error || 'No report data. Upload a PDF first.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-8">
        Forensic <span style={{ color: 'var(--forensiq-accent)' }}>Report</span>
      </h1>

      {/* Top Row: Risk Score + Author Estimate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <RiskScore score={report.overall_risk_score} />
        <div className="glass-card flex flex-col items-center justify-center">
          <p className="text-5xl font-extrabold" style={{ color: report.estimated_authors > 1 ? 'var(--forensiq-warning)' : 'var(--forensiq-success)' }}>
            {report.estimated_authors}
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--forensiq-text-muted)' }}>Estimated Authors</p>
        </div>
        <CitationGraph anomalies={report.citation_anomalies} />
      </div>

      {/* Heatmap */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Paragraph Heatmap</h2>
        <HeatmapView paragraphs={report.paragraphs} />
      </div>

      {/* Cluster Details */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Author Clusters</h2>
        <AuthorClusters clusters={report.clusters} paragraphs={report.paragraphs} />
      </div>

      {/* Source Matches */}
      {report.source_matches?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Source Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.source_matches.map((match, i) => (
              <SourceCard key={i} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
