"""
Stylometry Engine
=================
Extracts a 7-dimensional writing style feature vector from each paragraph.

Input:  Single paragraph string
Output: List of 7 floats (feature vector)

Features:
    0. avg_sentence_length   — words per sentence
    1. type_token_ratio      — unique words / total words (vocabulary richness)
    2. avg_word_length        — average characters per word
    3. punctuation_density    — punctuation marks per word
    4. passive_voice_ratio    — fraction of passive-voice sentences
    5. noun_verb_ratio        — nouns / verbs ratio
    6. sentence_complexity    — average dependency tree depth

Owner: Backend Dev 1
Dependencies: spaCy (en_core_web_sm), NLTK
"""

import re
import string
import spacy
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize

# Ensure NLTK data is available
try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab', quiet=True)

# Load spaCy model (load once, reuse)
nlp = spacy.load("en_core_web_sm")


def extract_style_features(paragraph: str) -> list:
    """
    Extract a 7-dimensional stylometric feature vector from a paragraph.

    Args:
        paragraph: Text string (should be >= 50 words for meaningful features).

    Returns:
        List of 7 float values representing the style vector.
    """
    sentences = sent_tokenize(paragraph)
    words = word_tokenize(paragraph)

    # Filter to actual words (not punctuation)
    alpha_words = [w for w in words if w.isalpha()]

    if not alpha_words or not sentences:
        return [0.0] * 7

    # Parse with spaCy for POS and dependency features
    doc = nlp(paragraph)

    # Feature 0: Average sentence length (words per sentence)
    avg_sentence_length = len(alpha_words) / len(sentences)

    # Feature 1: Type-Token Ratio (vocabulary richness)
    unique_words = set(w.lower() for w in alpha_words)
    type_token_ratio = len(unique_words) / len(alpha_words)

    # Feature 2: Average word length (characters)
    avg_word_length = sum(len(w) for w in alpha_words) / len(alpha_words)

    # Feature 3: Punctuation density (punctuation per word)
    punct_count = sum(1 for c in paragraph if c in string.punctuation)
    punctuation_density = punct_count / len(alpha_words) if alpha_words else 0.0

    # Feature 4: Passive voice ratio
    passive_voice_ratio = _compute_passive_ratio(doc)

    # Feature 5: Noun-to-verb ratio
    noun_verb_ratio = _compute_noun_verb_ratio(doc)

    # Feature 6: Sentence complexity (avg dependency tree depth)
    sentence_complexity = _compute_tree_depth(doc)

    return [
        round(avg_sentence_length, 4),
        round(type_token_ratio, 4),
        round(avg_word_length, 4),
        round(punctuation_density, 4),
        round(passive_voice_ratio, 4),
        round(noun_verb_ratio, 4),
        round(sentence_complexity, 4),
    ]


def _compute_passive_ratio(doc) -> float:
    """
    Estimate passive voice ratio using spaCy dependency labels.

    Passive voice indicators: nsubjpass, auxpass dependency relations.
    """
    sentences = list(doc.sents)
    if not sentences:
        return 0.0

    passive_count = 0
    for sent in sentences:
        for token in sent:
            if token.dep_ in ("nsubjpass", "auxpass"):
                passive_count += 1
                break  # Count sentence once

    return passive_count / len(sentences)


def _compute_noun_verb_ratio(doc) -> float:
    """
    Compute the ratio of nouns to verbs using POS tags.
    """
    nouns = sum(1 for token in doc if token.pos_ in ("NOUN", "PROPN"))
    verbs = sum(1 for token in doc if token.pos_ == "VERB")

    if verbs == 0:
        return float(nouns) if nouns > 0 else 0.0

    return nouns / verbs


def _compute_tree_depth(doc) -> float:
    """
    Compute average dependency tree depth across sentences.

    Deeper trees → more complex sentence structure.
    """
    def _token_depth(token):
        depth = 0
        while token.head != token:
            depth += 1
            token = token.head
        return depth

    sentences = list(doc.sents)
    if not sentences:
        return 0.0

    depths = []
    for sent in sentences:
        max_depth = max(_token_depth(token) for token in sent)
        depths.append(max_depth)

    return sum(depths) / len(depths)
