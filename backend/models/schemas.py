"""
Pydantic Schemas
================
Shared data models for API request/response validation.
All team members should reference these schemas for consistency.

Usage:
    from models.schemas import ForensicReport, UploadResponse
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ─── Upload ─────────────────────────────────────────────

class UploadResponse(BaseModel):
    """Response returned after successful PDF upload."""
    file_id: str = Field(..., description="Unique identifier for the uploaded file")
    filename: str = Field(..., description="Original filename")
    size_bytes: int = Field(..., description="File size in bytes")
    status: str = Field(default="uploaded", description="Upload status")


# ─── Stylometry ─────────────────────────────────────────

class StyleStats(BaseModel):
    """Stylometric feature vector for a single paragraph."""
    avg_sentence_length: float = Field(..., description="Average sentence length in words")
    type_token_ratio: float = Field(..., description="Vocabulary richness (unique/total words)")
    avg_word_length: float = Field(..., description="Average word length in characters")
    punctuation_density: float = Field(..., description="Punctuation marks per word")
    passive_voice_ratio: float = Field(..., description="Fraction of passive voice sentences")
    noun_verb_ratio: float = Field(..., description="Ratio of nouns to verbs")
    sentence_complexity: float = Field(..., description="Average parse tree depth")


# ─── Paragraph ──────────────────────────────────────────

class ParagraphResult(BaseModel):
    """Analysis result for a single paragraph."""
    id: int = Field(..., description="Paragraph index (0-based)")
    text_preview: str = Field(..., description="First 200 chars of paragraph text")
    cluster: int = Field(..., description="Assigned cluster ID (style group)")
    style_stats: StyleStats = Field(..., description="Stylometric features")
    flagged: bool = Field(default=False, description="True if paragraph is suspicious")


# ─── Citation Anomalies ─────────────────────────────────

class CitationAnomalies(BaseModel):
    """Results from citation forensics analysis."""
    temporal_anomaly: bool = Field(default=False, description="Uneven year distribution detected")
    topic_mismatch: bool = Field(default=False, description="Cross-section topic inconsistency")
    self_citation_anomaly: bool = Field(default=False, description="Unusual self-citation pattern")
    score: float = Field(default=0.0, description="Citation anomaly score (0-1)")
    details: Optional[str] = Field(default=None, description="Human-readable explanation")


# ─── Source Match ────────────────────────────────────────

class SourceMatch(BaseModel):
    """A matched source paper for a flagged paragraph."""
    paragraph_id: int = Field(..., description="ID of the flagged paragraph")
    matched_paper: str = Field(..., description="Title of matched paper")
    arxiv_link: Optional[str] = Field(default=None, description="arXiv URL if available")
    semantic_scholar_link: Optional[str] = Field(default=None, description="Semantic Scholar URL")
    similarity: float = Field(..., description="Cosine similarity score (0-1)")


# ─── Cluster Info ────────────────────────────────────────

class ClusterInfo(BaseModel):
    """Information about a detected writing style cluster."""
    cluster_id: int
    paragraph_count: int
    avg_style: StyleStats


# ─── Forensic Report ────────────────────────────────────

class ForensicReport(BaseModel):
    """
    Complete forensic analysis report.

    This is the PRIMARY data contract between backend and frontend.
    Frontend team: build your UI components based on this schema.
    """
    overall_risk_score: float = Field(..., description="Risk score 0-100")
    estimated_authors: int = Field(..., description="Estimated number of distinct authors")
    paragraphs: List[ParagraphResult] = Field(default_factory=list)
    clusters: List[ClusterInfo] = Field(default_factory=list)
    citation_anomalies: CitationAnomalies = Field(default_factory=CitationAnomalies)
    source_matches: List[SourceMatch] = Field(default_factory=list)


# ─── Analysis Response ──────────────────────────────────

class AnalysisResponse(BaseModel):
    """Response returned after analysis completes."""
    file_id: str
    status: str = Field(default="completed")
    report: ForensicReport
