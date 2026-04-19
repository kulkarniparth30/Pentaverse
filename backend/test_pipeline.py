import os
import json
import time
from core.pdf_parser import parse_pdf
from core.segmenter import segment_text
from core.stylometry import extract_style_features
from core.clustering import cluster_paragraphs

def test_pipeline():
    file_path = "../samples/stitched_paper.pdf"
    
    if not os.path.exists(file_path):
        print(f"Error: Could not find {file_path}")
        return

    print("--- 1. PARSING PDF ---")
    start = time.time()
    parsed = parse_pdf(file_path)
    print(f"Time: {time.time()-start:.2f}s")
    print(f"Total Text Length: {len(parsed['text'])} chars")
    print(f"Total Citations Extracted: {len(parsed['citations'])}")
    print("-" * 40)
    
    print("--- 2. SEGMENTING TEXT ---")
    start = time.time()
    paragraphs = segment_text(parsed["text"])
    print(f"Time: {time.time()-start:.2f}s")
    print(f"Total Paragraphs: {len(paragraphs)}")
    
    # Print the first 3 paragraphs to see if they look clean
    for i, p in enumerate(paragraphs[:3]):
        preview = p[:150].encode('ascii', 'ignore').decode('ascii')
        print(f"\n[Para {i+1} Preview]: {preview}...")
    print("-" * 40)
    
    print("--- 3. AI DETECTION ---")
    start = time.time()
    from core.ai_detector import batch_detect_ai
    try:
        ai_probs = batch_detect_ai(paragraphs)
        print(f"Time: {time.time()-start:.2f}s")
        print(f"AI Probs: {ai_probs}")
    except Exception as e:
        print(f"AI Detection failed: {e}")
    print("-" * 40)
    
    print("--- 4. EXTRACTING STYLOMETRY ---")
    start = time.time()
    style_vectors = [extract_style_features(p) for p in paragraphs]
    print(f"Time: {time.time()-start:.2f}s")
    print("-" * 40)
    
    print("--- 4. CLUSTERING ---")
    start = time.time()
    cluster_result = cluster_paragraphs(style_vectors)
    print(f"Time: {time.time()-start:.2f}s")
    print(f"Estimated Authors: {cluster_result['estimated_authors']}")
    print(f"Silhouette Score: {cluster_result['silhouette_score']}")
    
    # Show distribution
    labels = cluster_result['labels']
    from collections import Counter
    print(f"Cluster Distribution: {Counter(labels)}")
    print("-" * 40)
    
    print("--- 5. SOURCE TRACING ---")
    start = time.time()
    from core.source_tracer import trace_sources
    # Test trace_sources on the second paragraph (usually abstract or intro)
    if len(paragraphs) > 1:
        test_para = paragraphs[1]
        print(f"Tracing sources for: {test_para[:100]}...")
        matches = trace_sources(test_para, top_k=2)
        print(f"Time: {time.time()-start:.2f}s")
        for i, match in enumerate(matches):
            print(f"  Match {i+1}: {match['matched_paper']} (Score: {match['similarity']})")
            if match.get('arxiv_link'): print(f"    arXiv: {match['arxiv_link']}")
            if match.get('semantic_scholar_link'): print(f"    S2: {match['semantic_scholar_link']}")
    else:
        print("Not enough paragraphs to test tracing.")
    print("-" * 40)
    
    print("\nPIPELINE TEST COMPLETE")
    print("To fix the parsing, check `core/pdf_parser.py`.")

if __name__ == "__main__":
    test_pipeline()
