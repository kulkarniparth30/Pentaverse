/**
 * AIDonutChart
 * ============
 * Premium donut chart showing AI Generated % vs Original %
 * Matches the style of professional plagiarism checkers.
 *
 * Props:
 *   aiProbability: number (0-1)
 *   paragraphs: array of paragraph results
 *
 * Owner: Frontend Dev
 */

import React, { useEffect, useRef } from 'react'

export default function AIDonutChart({ aiProbability = 0, paragraphs = [] }) {
  const canvasRef = useRef(null)
  const aiPct = Math.round(aiProbability * 100)
  const humanPct = 100 - aiPct

  const aiColor = aiPct >= 70 ? '#ef4444' : aiPct >= 40 ? '#f97316' : '#eab308'
  const humanColor = '#22c55e'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 200
    canvas.width = size * 2
    canvas.height = size * 2
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(2, 2)

    const cx = size / 2
    const cy = size / 2
    const radius = 72
    const lineWidth = 18
    const gap = 0.03  // gap between segments in radians

    const total = Math.PI * 2
    const aiAngle = (aiPct / 100) * total
    const humanAngle = total - aiAngle

    // Draw AI segment (starts at top = -π/2)
    if (aiPct > 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, radius, -Math.PI / 2 + gap / 2, -Math.PI / 2 + aiAngle - gap / 2)
      ctx.strokeStyle = aiColor
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'butt'
      ctx.shadowColor = aiColor
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Draw human segment
    if (humanPct > 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, radius, -Math.PI / 2 + aiAngle + gap / 2, -Math.PI / 2 + total - gap / 2)
      ctx.strokeStyle = humanColor
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'butt'
      ctx.shadowColor = humanColor
      ctx.shadowBlur = 6
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Center text - percentage
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 36px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${aiPct}%`, cx, cy - 4)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px Inter, sans-serif'
    ctx.fillText('AI Score', cx, cy + 20)
  }, [aiPct])

  // Count flagged paragraphs
  const aiParas = paragraphs.filter(p => (p.ai_probability || 0) > 0.45).length
  const humanParas = paragraphs.length - aiParas

  const verdict = aiPct >= 70 ? { text: 'Highly AI-Generated', color: '#ef4444' }
    : aiPct >= 45 ? { text: 'Likely AI-Generated', color: '#f97316' }
    : aiPct >= 25 ? { text: 'Partially AI-Generated', color: '#eab308' }
    : { text: 'Likely Human-Written', color: '#22c55e' }

  return (
    <div className="glass-card" style={{ padding: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#1e293b' }}>
        AI Content Analysis
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
        {/* Donut Chart */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <canvas ref={canvasRef} />
        </div>

        {/* Legend & Stats */}
        <div style={{ flex: 1, minWidth: 160 }}>
          {/* Verdict */}
          <div style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 99,
            background: `${verdict.color}10`, border: `1px solid ${verdict.color}25`,
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: verdict.color }}>
              {verdict.text}
            </span>
          </div>

          {/* Legend items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: aiColor, flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 20, color: aiColor }}>{aiPct}%</span>
                <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
                  AI-Generated Text
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: humanColor, flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 20, color: humanColor }}>{humanPct}%</span>
                <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
                  Original Human Text
                </span>
              </div>
            </div>
          </div>

          {/* Paragraph stats */}
          {paragraphs.length > 0 && (
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 12,
              background: '#f8fafc', border: '1px solid #f1f5f9',
              display: 'flex', gap: 24,
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: aiColor, margin: 0 }}>{aiParas}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>AI Paragraphs</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: humanColor, margin: 0 }}>{humanParas}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Human Paragraphs</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>{paragraphs.length}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Total</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
