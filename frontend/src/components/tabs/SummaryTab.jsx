/**
 * SummaryTab
 * ==========
 * Tab 4: Forensic Summary + AI Detection Summary + quick stat cards.
 *
 * Props:
 *   report: ForensicReport object
 */

import React from 'react'

export default function SummaryTab({ report }) {
  const forensicSummary = report.forensic_summary || 'No forensic summary available.'
  const aiSummary = report.ai_detection_summary || 'No AI detection summary available.'
  const aiPct = Math.round((report.overall_ai_probability || 0) * 100)
  const risk = report.overall_risk_score || 0
  const authors = report.estimated_authors || 1
  const sourceCount = (report.source_matches || []).length

  const statCards = [
    {
      icon: '🛡️',
      label: 'Risk Score',
      value: `${Math.round(risk)}/100`,
      color: risk >= 70 ? '#ef4444' : risk >= 40 ? '#f59e0b' : '#10b981',
      bg: risk >= 70 ? 'rgba(239,68,68,0.06)' : risk >= 40 ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
    },
    {
      icon: '🤖',
      label: 'AI Detection',
      value: `${aiPct}%`,
      color: aiPct >= 60 ? '#ef4444' : aiPct >= 35 ? '#f59e0b' : '#10b981',
      bg: aiPct >= 60 ? 'rgba(239,68,68,0.06)' : aiPct >= 35 ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
    },
    {
      icon: '📚',
      label: 'Style Clusters',
      value: `${authors}`,
      color: authors > 1 ? '#f59e0b' : '#10b981',
      bg: authors > 1 ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
    },
    {
      icon: '⚠️',
      label: 'Source Matches',
      value: `${sourceCount}`,
      color: sourceCount > 0 ? '#f97316' : '#10b981',
      bg: sourceCount > 0 ? 'rgba(249,115,22,0.06)' : 'rgba(16,185,129,0.06)',
    },
  ]

  return (
    <div className="animate-fade-in-up">
      {/* Main Summary Card */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>📋</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Forensic Summary</h3>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.85, color: '#334155' }}>
          {forensicSummary}
        </p>

        {/* AI Detection Summary */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', marginBottom: 12 }}>AI Detection Summary</h4>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#334155' }}>
            {aiSummary}
          </p>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {statCards.map((card, i) => (
          <div key={i} className="glass-card" style={{
            padding: 20, textAlign: 'center',
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, margin: '0 auto 10px',
              background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {card.icon}
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</p>
            <p className="stat-label">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
