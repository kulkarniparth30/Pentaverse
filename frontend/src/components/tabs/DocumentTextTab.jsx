import React, { useState } from 'react';

const DocumentTextTab = ({ report }) => {
  const [highlightMode, setHighlightMode] = useState('ai'); // 'ai' or 'clusters' or 'flagged'

  if (!report || !report.paragraphs) {
    return <div className="text-slate-400">No document text available.</div>;
  }

  const getBackgroundColor = (para) => {
    if (highlightMode === 'ai') {
      const p = para.ai_probability;
      if (p >= 0.7) return 'bg-red-500/20 border-red-500/30';
      if (p >= 0.4) return 'bg-orange-500/20 border-orange-500/30';
      if (p >= 0.2) return 'bg-yellow-500/10 border-yellow-500/20';
      return 'bg-transparent border-transparent hover:bg-slate-800/30';
    }
    if (highlightMode === 'clusters') {
      const colors = [
        'bg-blue-500/20 border-blue-500/30',
        'bg-orange-500/20 border-orange-500/30',
        'bg-red-500/20 border-red-500/30',
        'bg-purple-500/20 border-purple-500/30',
        'bg-teal-500/20 border-teal-500/30',
      ];
      return colors[para.cluster % colors.length];
    }
    if (highlightMode === 'flagged') {
      return para.flagged ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-transparent border-transparent hover:bg-slate-800/30';
    }
    return 'bg-transparent border-transparent hover:bg-slate-800/30';
  };

  return (
    <div className="space-y-6">
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Visual Text Analysis</h3>
          <p style={{ fontSize: 13, color: '#64748b' }}>View the document text with intelligent highlighting.</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
          <button
            onClick={() => setHighlightMode('ai')}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: highlightMode === 'ai' ? '#fff' : 'transparent',
              color: highlightMode === 'ai' ? '#ef4444' : '#64748b',
              boxShadow: highlightMode === 'ai' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            AI Probability
          </button>
          <button
            onClick={() => setHighlightMode('clusters')}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: highlightMode === 'clusters' ? '#fff' : 'transparent',
              color: highlightMode === 'clusters' ? '#6366f1' : '#64748b',
              boxShadow: highlightMode === 'clusters' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Author Styles
          </button>
          <button
            onClick={() => setHighlightMode('flagged')}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: highlightMode === 'flagged' ? '#fff' : 'transparent',
              color: highlightMode === 'flagged' ? '#eab308' : '#64748b',
              boxShadow: highlightMode === 'flagged' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Flagged Regions
          </button>
        </div>
      </div>

      <div style={{ padding: 24, lineHeight: 1.8, fontFamily: 'Georgia, serif', color: '#1e293b' }}>
        {report.paragraphs.map((para, idx) => (
          <div
            key={idx}
            className={`mb-4 p-3 rounded-lg border-l-4 transition-colors duration-300 ${getBackgroundColor(para)}`}
            title={`Paragraph ${para.id + 1} | AI Prob: ${(para.ai_probability * 100).toFixed(1)}% | Cluster: ${para.cluster} | Flagged: ${para.flagged}`}
          >
            <span style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#6366f1', display: 'block', marginBottom: 4, userSelect: 'none' }}>
              [P{para.id + 1}] 
              {highlightMode === 'ai' && ` • AI: ${(para.ai_probability * 100).toFixed(0)}%`}
              {highlightMode === 'clusters' && ` • Style: ${para.cluster}`}
            </span>
            <span style={{ fontSize: 14, color: '#334155' }}>
              {para.full_text || para.text_preview}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentTextTab;
