/**
 * AIDetectionTab
 * ==============
 * Tab 2: AI Score donut, Paragraphs Likely AI, Likely AI Tool,
 * AI Detection Summary text, and per-paragraph breakdown.
 *
 * Props:
 *   report: ForensicReport object
 */

import React from 'react'
import AIDonutChart from '../AIDonutChart.jsx'

export default function AIDetectionTab({ report }) {
  const aiPct = Math.round((report.overall_ai_probability || 0) * 100)
  const paragraphs = report.paragraphs || []
  const aiParas = paragraphs.filter(p => (p.ai_probability || 0) > 0.30)
  const aiParaPct = paragraphs.length > 0 ? Math.round((aiParas.length / paragraphs.length) * 100) : 0
  const likelyTool = report.likely_ai_tool || 'Unknown'
  const aiSummary = report.ai_detection_summary || ''

  // Verdict badge
  const verdict = aiPct >= 70 ? { text: 'Highly AI-Generated', color: '#ef4444' }
    : aiPct >= 50 ? { text: 'Likely AI-Generated', color: '#f97316' }
    : aiPct >= 30 ? { text: 'Ambiguous, possibly AI assisted', color: '#eab308' }
    : { text: 'Likely Human-Written', color: '#22c55e' }

  // Tool icon mapping
  const toolIcons = {
    'ChatGPT': '🤖', 'GPT-4': '🤖', 'Claude': '🧠',
    'Gemini': '✨', 'None Detected': '👤', 'Unknown': '❓'
  }

  return (
    <div className="animate-fade-in-up">
      {/* Top 3 Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* AI Score Donut */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <AIDonutChart aiProbability={report.overall_ai_probability || 0} paragraphs={[]} />
          {/* Verdict Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 99, marginTop: 12,
            background: `${verdict.color}10`, border: `1px solid ${verdict.color}25`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: verdict.color }}>{verdict.text}</span>
            {aiPct >= 30 && <span style={{ fontSize: 11 }}>⚠️</span>}
          </div>
        </div>

        {/* Paragraphs Likely AI */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
          <p className="stat-value">{aiParaPct}%</p>
          <p className="stat-label">Paragraphs Likely AI</p>
        </div>

        {/* Likely AI Tool */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, marginBottom: 10,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.06))',
            border: '1px solid rgba(99,102,241,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            {toolIcons[likelyTool] || '❓'}
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{likelyTool}</p>
          <p className="stat-label">Likely AI Tool</p>
        </div>
      </div>

      {/* AI Detection Summary */}
      {aiSummary && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, borderLeft: '4px solid #6366f1' }}>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: '#334155' }}>{aiSummary}</p>
        </div>
      )}

      {/* Per-Paragraph AI Analysis */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 className="section-title">
          <span>🤖</span> Per-Paragraph AI Analysis ({paragraphs.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paragraphs.map((p, i) => {
            const pct = Math.round((p.ai_probability || 0) * 100)
            const isAI = pct > 45
            const confidence = pct >= 70 ? 'HIGH' : pct >= 45 ? 'MEDIUM' : 'LOW'
            const confColor = pct >= 70 ? '#ef4444' : pct >= 45 ? '#f97316' : '#22c55e'
            const label = pct >= 70 ? 'AI Generated' : pct >= 45 ? 'Ambiguous' : 'Human'

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: isAI ? 'rgba(239,68,68,0.02)' : '#fafbfc', borderRadius: 12,
                border: isAI ? '1px solid rgba(239,68,68,0.1)' : '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: 12, color: '#94a3b8', width: 28, flexShrink: 0, fontWeight: 600 }}>¶{i + 1}</span>
                <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: isAI ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #22c55e, #16a34a)',
                    borderRadius: 99, transition: 'width 0.8s ease',
                  }} />
                </div>
                <div style={{
                  padding: '2px 10px', borderRadius: 99,
                  background: `${confColor}08`, border: `1px solid ${confColor}20`,
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: confColor }}>{label} ({pct}%)</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: confColor, opacity: 0.7 }}>{confidence}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
