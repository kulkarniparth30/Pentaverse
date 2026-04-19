/**
 * SourceCard
 * ==========
 * Displays a matched source paper from arXiv/Semantic Scholar.
 *
 * Props:
 *   match: { paragraph_id, matched_paper, arxiv_link, similarity }
 *
 * Owner: Frontend Dev 2
 */

import React from 'react'

export default function SourceCard({ match }) {
  const simPercent = Math.round(match.similarity * 100)
  const simColor = simPercent >= 80 ? '#ef4444' : simPercent >= 60 ? '#f59e0b' : '#10b981'

  return (
    <div className="glass-card flex flex-col justify-between" style={{ padding: 20 }}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono px-2 py-1 rounded-md" style={{
            background: 'rgba(99,102,241,0.08)', color: '#6366f1',
          }}>
            P{match.paragraph_id + 1}
          </span>
          <span className="text-sm font-bold" style={{ color: simColor }}>
            {simPercent}% match
          </span>
        </div>
        <h3 className="text-sm font-semibold mb-2 leading-snug" style={{ color: '#1e293b' }}>
          {match.matched_paper}
        </h3>
      </div>

      {/* Similarity bar */}
      <div className="mt-3">
        <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9' }}>
          <div style={{
            height: '100%', borderRadius: 99, background: simColor,
            width: `${simPercent}%`, transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-3 mt-3">
        {match.arxiv_link && (
          <a href={match.arxiv_link} target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium no-underline px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(99,102,241,0.06)', color: '#6366f1',
              border: '1px solid rgba(99,102,241,0.12)',
              transition: 'all 0.2s',
            }}>
            arXiv ↗
          </a>
        )}
        {match.semantic_scholar_link && (
          <a href={match.semantic_scholar_link} target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium no-underline px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(16,185,129,0.06)', color: '#10b981',
              border: '1px solid rgba(16,185,129,0.12)',
              transition: 'all 0.2s',
            }}>
            S2 ↗
          </a>
        )}
      </div>
    </div>
  )
}
