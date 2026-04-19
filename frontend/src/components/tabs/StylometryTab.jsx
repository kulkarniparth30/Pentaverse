/**
 * StylometryTab
 * =============
 * Tab 1: Style Integrity Score donut, Style Clusters count,
 * Cluster Legend with descriptions, and Style Consistency Timeline.
 *
 * Props:
 *   report: ForensicReport object
 */

import React, { useEffect, useRef } from 'react'
import AuthorClusters from '../AuthorClusters.jsx'

const CLUSTER_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#a855f7', '#10b981']
const CLUSTER_NAMES = ['Style A', 'Style B', 'Style C', 'Style D', 'Style E']

function StyleIntegrityDonut({ score }) {
  const canvasRef = useRef(null)
  const s = Math.round(score)
  const color = s >= 70 ? '#ef4444' : s >= 40 ? '#f59e0b' : '#10b981'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 180
    canvas.width = size * 2
    canvas.height = size * 2
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(2, 2)

    const cx = size / 2, cy = size / 2, radius = 68, lineWidth = 16
    const total = Math.PI * 2
    const filled = (s / 100) * total

    // Background ring
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, total)
    ctx.strokeStyle = '#f1f5f9'
    ctx.lineWidth = lineWidth
    ctx.stroke()

    // Score arc
    ctx.beginPath()
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + filled)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.stroke()
    ctx.shadowBlur = 0

    // Center text
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 36px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${s}`, cx, cy - 8)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText('/ 100', cx, cy + 16)
  }, [s])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas ref={canvasRef} />
      <p style={{ fontSize: 13, fontWeight: 600, color, marginTop: 8 }}>Style Integrity Score</p>
    </div>
  )
}

function StyleConsistencyTimeline({ paragraphs }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = React.useState(null)
  const pointsRef = useRef([])
  const n = paragraphs.length

  // Compute scores once
  const scores = React.useMemo(() =>
    paragraphs.map(p => {
      const ttr = p.style_stats?.type_token_ratio || 0.5
      return Math.min(1, Math.max(0, ttr))
    }), [paragraphs]
  )

  const drawChart = React.useCallback((hoveredIdx = -1) => {
    const canvas = canvasRef.current
    if (!canvas || n === 0) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.parentElement.getBoundingClientRect()
    const W = Math.max(600, rect.width - 48)
    const H = 220
    canvas.width = W * 2
    canvas.height = H * 2
    canvas.style.width = '100%'
    canvas.style.height = `${H}px`
    ctx.scale(2, 2)

    const padL = 44, padR = 24, padT = 24, padB = 40
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const step = plotW / Math.max(1, n - 1)

    // Store point positions for hit detection
    const pts = []

    // Clear
    ctx.clearRect(0, 0, W, H)

    // Y-axis labels + grid
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'right'
    for (let v = 0; v <= 1; v += 0.25) {
      const y = padT + plotH - v * plotH
      ctx.fillText(v.toFixed(2), padL - 8, y + 3)
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
      ctx.strokeStyle = '#f1f5f9'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Threshold line at 0.75
    const threshY = padT + plotH - 0.75 * plotH
    ctx.beginPath()
    ctx.setLineDash([6, 4])
    ctx.moveTo(padL, threshY)
    ctx.lineTo(padL + plotW, threshY)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#ef4444'
    ctx.font = '9px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Threshold', padL + plotW - 55, threshY - 5)

    // Hover vertical guide line
    if (hoveredIdx >= 0 && hoveredIdx < n) {
      const hx = padL + hoveredIdx * step
      ctx.beginPath()
      ctx.setLineDash([3, 3])
      ctx.moveTo(hx, padT)
      ctx.lineTo(hx, padT + plotH)
      ctx.strokeStyle = 'rgba(99,102,241,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Area fill
    ctx.beginPath()
    scores.forEach((s, i) => {
      const x = padL + i * step
      const y = padT + plotH - s * plotH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo(padL + (n - 1) * step, padT + plotH)
    ctx.lineTo(padL, padT + plotH)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, padT, 0, padT + plotH)
    gradient.addColorStop(0, 'rgba(59,130,246,0.1)')
    gradient.addColorStop(1, 'rgba(59,130,246,0.01)')
    ctx.fillStyle = gradient
    ctx.fill()

    // Plot line
    ctx.beginPath()
    scores.forEach((s, i) => {
      const x = padL + i * step
      const y = padT + plotH - s * plotH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Dots
    scores.forEach((s, i) => {
      const x = padL + i * step
      const y = padT + plotH - s * plotH
      const isHovered = i === hoveredIdx
      const dotRadius = isHovered ? 7 : 4

      // Glow ring for hovered dot
      if (isHovered) {
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99,102,241,0.1)'
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
      ctx.fillStyle = isHovered ? '#6366f1' : '#3b82f6'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = isHovered ? 3 : 2
      ctx.stroke()

      pts.push({ x, y, idx: i, score: s, canvasW: W })
    })

    // X-axis labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'center'
    const labelStep = Math.max(1, Math.floor(n / 12))
    for (let i = 0; i < n; i += labelStep) {
      const x = padL + i * step
      const isHov = i === hoveredIdx
      if (isHov) {
        ctx.fillStyle = '#6366f1'
        ctx.font = 'bold 11px Inter, sans-serif'
      } else {
        ctx.fillStyle = '#94a3b8'
        ctx.font = '10px Inter, sans-serif'
      }
      ctx.fillText(`¶${i + 1}`, x, H - padB + 16)
    }
    // Always show hovered label even if not on a label step
    if (hoveredIdx >= 0 && hoveredIdx % labelStep !== 0) {
      const x = padL + hoveredIdx * step
      ctx.fillStyle = '#6366f1'
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`¶${hoveredIdx + 1}`, x, H - padB + 16)
    }

    pointsRef.current = pts
  }, [paragraphs, scores, n])

  useEffect(() => {
    drawChart(-1)
  }, [drawChart])

  const handleMouseMove = React.useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas || !pointsRef.current.length) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = (pointsRef.current[0]?.canvasW || 800) / rect.width
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * (220 / rect.height)

    // Find nearest point within threshold
    let closest = null
    let minDist = Infinity
    for (const pt of pointsRef.current) {
      const dist = Math.sqrt((mx - pt.x) ** 2 + (my - pt.y) ** 2)
      if (dist < minDist && dist < 25) {
        minDist = dist
        closest = pt
      }
    }

    if (closest) {
      const p = paragraphs[closest.idx]
      const cluster = p.cluster ?? 0
      const clusterName = ['Style A', 'Style B', 'Style C', 'Style D', 'Style E'][cluster % 5]
      const aiProb = Math.round((p.ai_probability || 0) * 100)
      const avgSentLen = p.style_stats?.avg_sentence_length?.toFixed(1) || '—'
      const passiveVoice = p.style_stats?.passive_voice_ratio != null
        ? (p.style_stats.passive_voice_ratio * 100).toFixed(0) + '%'
        : '—'

      // Position tooltip relative to container
      const containerRect = containerRef.current.getBoundingClientRect()
      const tipX = e.clientX - containerRect.left
      const tipY = e.clientY - containerRect.top

      setTooltip({
        x: tipX,
        y: tipY,
        paraIdx: closest.idx,
        score: closest.score,
        clusterName,
        aiProb,
        avgSentLen,
        passiveVoice,
        preview: p.text_preview?.slice(0, 80) || '',
      })
      drawChart(closest.idx)
      canvas.style.cursor = 'pointer'
    } else {
      setTooltip(null)
      drawChart(-1)
      canvas.style.cursor = 'default'
    }
  }, [paragraphs, drawChart])

  const handleMouseLeave = React.useCallback(() => {
    setTooltip(null)
    drawChart(-1)
  }, [drawChart])

  return (
    <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
      <h3 className="section-title">
        <span>📈</span> Style Consistency Timeline
      </h3>
      <div ref={containerRef} style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: tooltip.x + 16,
            top: tooltip.y - 120,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '14px 18px',
            minWidth: 220,
            maxWidth: 300,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            zIndex: 50,
            pointerEvents: 'none',
            transition: 'opacity 0.15s ease',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
                ¶{tooltip.paraIdx + 1}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                background: 'rgba(99,102,241,0.08)', color: '#6366f1',
              }}>
                {tooltip.clusterName}
              </span>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
                {tooltip.score.toFixed(3)}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>TTR Score</span>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div style={{ padding: '6px 8px', borderRadius: 8, background: '#f8fafc' }}>
                <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Avg Sent. Len</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{tooltip.avgSentLen}</p>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: 8, background: '#f8fafc' }}>
                <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Passive Voice</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{tooltip.passiveVoice}</p>
              </div>
            </div>

            {/* AI Badge */}
            {tooltip.aiProb > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                padding: '4px 8px', borderRadius: 6,
                background: tooltip.aiProb > 50 ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
              }}>
                <span style={{ fontSize: 12 }}>🤖</span>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: tooltip.aiProb > 50 ? '#ef4444' : '#10b981',
                }}>
                  AI: {tooltip.aiProb}%
                </span>
              </div>
            )}

            {/* Preview */}
            {tooltip.preview && (
              <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{tooltip.preview}..."
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StylometryTab({ report }) {
  const clusters = report.clusters || []
  const paragraphs = report.paragraphs || []
  const authors = report.estimated_authors || 1
  const risk = report.overall_risk_score || 0

  // Determine inconsistency label
  const inconsistencyLabel = report.stylometry_inconsistencies_summary
    ? report.stylometry_inconsistencies_summary.split('.')[0] || 'Minor Inconsistencies'
    : authors >= 4 ? 'Major Inconsistencies' : authors >= 3 ? 'Moderate Inconsistencies' : authors >= 2 ? 'Minor Inconsistencies' : 'No Inconsistencies'

  const inconsistencyColor = inconsistencyLabel.includes('Major') ? '#ef4444'
    : inconsistencyLabel.includes('Moderate') ? '#f97316'
    : inconsistencyLabel.includes('Minor') ? '#eab308'
    : '#10b981'

  return (
    <div className="animate-fade-in-up">
      {/* Top Row: Score + Clusters + Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 20, marginBottom: 24 }}>
        {/* Style Integrity Score */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <StyleIntegrityDonut score={risk} />
        </div>

        {/* Style Clusters Count */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
          <p className="stat-value">{clusters.length}</p>
          <p className="stat-label">Style Clusters</p>
          <div style={{
            display: 'inline-block', marginTop: 12, padding: '4px 14px', borderRadius: 99,
            background: `${inconsistencyColor}10`, border: `1px solid ${inconsistencyColor}25`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: inconsistencyColor }}>{inconsistencyLabel}</span>
          </div>
        </div>

        {/* Cluster Legend */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#64748b' }}>Cluster Legend</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {clusters.map((c, i) => {
              const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length]
              const name = CLUSTER_NAMES[i % CLUSTER_NAMES.length]
              const s = c.avg_style || {}
              const tone = (s.passive_voice_ratio || 0) > 0.3 ? 'formal' : 'informal'
              const vocab = (s.type_token_ratio || 0) > 0.6 ? 'high' : (s.type_token_ratio || 0) > 0.4 ? 'medium' : 'low'
              const sentLen = (s.avg_sentence_length || 0) > 25 ? 'long' : (s.avg_sentence_length || 0) > 15 ? 'medium' : 'short'
              const passive = (s.passive_voice_ratio || 0) > 0.3 ? 'high' : (s.passive_voice_ratio || 0) > 0.15 ? 'medium' : 'low'

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color }}>{name}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{c.paragraph_count} ¶</span>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 1.5 }}>
                      {tone} tone, {vocab} vocabulary richness, {sentLen} sentence length, {passive} passive voice ratio
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <StyleConsistencyTimeline paragraphs={paragraphs} />
    </div>
  )
}
