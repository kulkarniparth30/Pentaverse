/**
 * CitationGraph
 * =============
 * Displays citation anomaly indicators.
 *
 * Props:
 *   anomalies: { temporal_anomaly, topic_mismatch, self_citation_anomaly, score, details }
 *
 * Owner: Frontend Dev 2
 */

import React from 'react'

const CHECKS = [
  { key: 'temporal_anomaly', label: 'Temporal Consistency', icon: '📅', desc: 'Citation years are evenly distributed' },
  { key: 'topic_mismatch', label: 'Topic Coherence', icon: '🧩', desc: 'Citations match the paper topic throughout' },
  { key: 'self_citation_anomaly', label: 'Self-Citation Pattern', icon: '🔁', desc: 'Self-citation rate is within normal range' },
]

export default function CitationGraph({ anomalies = {} }) {
  const score = anomalies.score || 0

  return (
    <div className="glass-card">
      <h3 className="text-sm font-semibold mb-4" style={{ color: '#1e293b' }}>Citation Health</h3>
      <div className="flex flex-col gap-3">
        {CHECKS.map(check => {
          const hasAnomaly = anomalies[check.key]
          return (
            <div key={check.key} className="flex items-center gap-3">
              <div style={{
                width: 28, height: 28, borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                background: hasAnomaly ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${hasAnomaly ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
              }}>
                {hasAnomaly ? '⚠️' : '✓'}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: hasAnomaly ? '#ef4444' : '#10b981' }}>
                  {check.label}
                </p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>{check.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Anomaly Score Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: '#94a3b8' }}>Anomaly Score</span>
          <span className="font-mono" style={{ color: '#1e293b' }}>{(score * 100).toFixed(0)}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: score > 0.5 ? '#ef4444' : score > 0.2 ? '#f59e0b' : '#10b981',
            width: `${score * 100}%`, transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
    </div>
  )
}
