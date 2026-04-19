/**
 * HeatmapView
 * ===========
 * D3.js-powered paragraph heatmap showing cluster assignments.
 * Each paragraph = one colored block. Hover shows preview + stats.
 *
 * Props:
 *   paragraphs: Array<{ id, text_preview, cluster, style_stats, flagged }>
 *
 * Owner: Frontend Dev 2 (D3.js)
 */

import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'

const CLUSTER_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#a855f7', '#10b981']

export default function HeatmapView({ paragraphs = [] }) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    if (!paragraphs.length || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.parentElement.offsetWidth
    const cellSize = Math.max(40, Math.min(80, width / paragraphs.length))
    const height = cellSize + 20

    svg.attr('width', width).attr('height', height)

    // Draw cells
    svg.selectAll('rect')
      .data(paragraphs)
      .enter()
      .append('rect')
      .attr('x', (d, i) => i * (cellSize + 4))
      .attr('y', 10)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 8)
      .attr('fill', d => CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length])
      .attr('opacity', d => d.flagged ? 1 : 0.7)
      .attr('stroke', d => d.flagged ? '#1e293b' : 'transparent')
      .attr('stroke-width', d => d.flagged ? 2 : 0)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease')
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget).attr('opacity', 1).attr('transform', 'scale(1.05)')
        const rect = event.currentTarget.getBoundingClientRect()
        setTooltip({ x: rect.left, y: rect.top - 10, data: d })
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget).attr('opacity', d.flagged ? 1 : 0.7).attr('transform', '')
        setTooltip(null)
      })

    // Paragraph labels
    svg.selectAll('text')
      .data(paragraphs)
      .enter()
      .append('text')
      .attr('x', (d, i) => i * (cellSize + 4) + cellSize / 2)
      .attr('y', 10 + cellSize / 2 + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', 12)
      .attr('font-weight', 600)
      .text(d => `P${d.id + 1}`)

  }, [paragraphs])

  return (
    <div className="glass-card relative" style={{ overflowX: 'auto', padding: 20 }}>
      <svg ref={svgRef} />

      {/* Legend */}
      <div className="flex gap-4 mt-4">
        {[...new Set(paragraphs.map(p => p.cluster))].sort().map(cid => (
          <div key={cid} className="flex items-center gap-2 text-xs">
            <div style={{ width: 12, height: 12, borderRadius: 3, background: CLUSTER_COLORS[cid % CLUSTER_COLORS.length] }} />
            <span style={{ color: '#94a3b8' }}>Style {String.fromCharCode(65 + cid)}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x, top: tooltip.y - 120,
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 14, padding: 16, maxWidth: 300, zIndex: 100,
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
        }}>
          <p className="text-xs font-bold mb-1" style={{ color: CLUSTER_COLORS[tooltip.data.cluster % CLUSTER_COLORS.length] }}>
            Paragraph {tooltip.data.id + 1} — Cluster {String.fromCharCode(65 + tooltip.data.cluster)}
            {tooltip.data.flagged && <span className="ml-2">🚩 Flagged</span>}
          </p>
          {tooltip.data.ai_probability > 0.5 && (
            <p className="text-xs mb-1 font-bold" style={{ color: '#ef4444' }}>
              🤖 AI Generated: {Math.round(tooltip.data.ai_probability * 100)}%
            </p>
          )}
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            {tooltip.data.text_preview?.slice(0, 120)}...
          </p>
        </div>
      )}
    </div>
  )
}
