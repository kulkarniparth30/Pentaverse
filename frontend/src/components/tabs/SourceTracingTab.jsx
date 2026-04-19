/**
 * SourceTracingTab
 * ================
 * Tab 3: Stylometry inconsistencies summary, source matches list
 * with arXiv links.
 *
 * Props:
 *   report: ForensicReport object
 */

import React from 'react'
import SourceCard from '../SourceCard.jsx'

export default function SourceTracingTab({ report }) {
  const sourceMatches = report.source_matches || []
  const inconsistencySummary = report.stylometry_inconsistencies_summary || 'No data available.'
  const forensicSummary = report.forensic_summary || ''
  const authors = report.estimated_authors || 1



  return (
    <div className="animate-fade-in-up">
      {/* Citation Anomalies Section */}
      <div className="mb-8">
        <h3 className="section-title">
          <span style={{ color: '#ec4899' }}>📚</span> Citation Forensics
        </h3>
        
        {report.citation_anomalies && report.citation_anomalies.hallucinated_citations?.length > 0 ? (
          <div className="glass-card" style={{ padding: 24, borderLeft: '4px solid #ef4444', background: 'rgba(239,68,68,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', margin: 0 }}>Hallucinated Citations Detected!</h4>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>The following citations could not be verified via the Crossref academic database and are likely AI-generated fakes.</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report.citation_anomalies.hallucinated_citations.map((cite, i) => (
                <div key={i} style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#1e293b', fontFamily: 'monospace' }}>
                  {cite}
                </div>
              ))}
            </div>
          </div>
        ) : (
           <div className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
             <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✅</div>
             <div>
               <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>Citations Verified</h4>
               <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>A random sample of citations was successfully verified against real-world academic databases.</p>
             </div>
           </div>
        )}
      </div>

      {/* Source Matches */}
      {sourceMatches.length > 0 ? (
        <div>
          <h3 className="section-title">
            <span style={{ color: '#6366f1' }}>🔍</span> Source Matches ({sourceMatches.length} paragraphs traced)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sourceMatches.map((match, i) => (
              <div key={i} className="glass-card" style={{
                padding: 20,
                borderLeft: '3px solid #6366f1',
              }}>
                {/* Paragraph reference */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                    background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                  }}>
                    ¶{match.paragraph_id + 1}
                  </span>
                  <span style={{ fontSize: 13, fontStyle: 'italic', color: '#64748b', flex: 1 }}>
                    {match.matched_paper}
                  </span>
                </div>

                {/* Search query */}
                {match.matched_paper && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Search query: </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }}>
                      "{match.matched_paper.split(' ').slice(0, 3).join(' ')}"
                    </span>
                  </div>
                )}

                {/* Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {match.arxiv_link && (
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 6, display: 'block' }}>arXiv Matches</span>
                      <a
                        href={match.arxiv_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block', padding: '10px 14px', borderRadius: 12,
                          background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)',
                          textDecoration: 'none', color: '#6366f1', fontSize: 13, fontWeight: 500,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)' }}
                      >
                        {match.matched_paper} ↗
                      </a>
                    </div>
                  )}

                  {match.semantic_scholar_link && (
                    <a
                      href={match.semantic_scholar_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block', padding: '10px 14px', borderRadius: 12,
                        background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)',
                        textDecoration: 'none', color: '#10b981', fontSize: 13, fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.04)' }}
                    >
                      Semantic Scholar: {match.matched_paper} ↗
                    </a>
                  )}
                </div>

                {/* Similarity */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Similarity</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: match.similarity > 0.7 ? '#ef4444' : '#f97316' }}>
                      {Math.round(match.similarity * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9' }}>
                    <div style={{
                      height: '100%', borderRadius: 99, width: `${match.similarity * 100}%`,
                      background: match.similarity > 0.7 ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #f97316, #ea580c)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', boxShadow: 'var(--forensiq-shadow-md)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 24,
          }}>🔍</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>No Source Matches Found</p>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>
            The document content appears to be original.
          </p>
        </div>
      )}
    </div>
  )
}
