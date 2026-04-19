import os
import requests
import fitz  # PyMuPDF

def download_pdf(url, output_path):
    print(f"Downloading {url}...")
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        print(f"Saved to {output_path}")
    else:
        print(f"Failed to download {url}")

def create_stitched_pdf():
    # arXiv PDFs
    paper1_url = "https://arxiv.org/pdf/1706.03762.pdf"  # "Attention Is All You Need" (CS/ML)
    paper2_url = "https://arxiv.org/pdf/2303.08774.pdf"  # Quantitative Biology paper
    
    paper1_path = "temp_paper1.pdf"
    paper2_path = "temp_paper2.pdf"
    output_path = "../samples/stitched_paper.pdf"
    
    # Ensure samples directory exists
    os.makedirs("../samples", exist_ok=True)
    
    # Download papers
    download_pdf(paper1_url, paper1_path)
    download_pdf(paper2_url, paper2_path)
    
    print("Stitching papers together...")
    try:
        doc1 = fitz.open(paper1_path)
        doc2 = fitz.open(paper2_path)
        
        # Create a new empty PDF
        merged_doc = fitz.open()
        
        # Insert pages 0-3 from the ML paper (pages 1 to 4)
        merged_doc.insert_pdf(doc1, from_page=0, to_page=3)
        
        # Insert pages 0-2 from the Bio paper (pages 1 to 3)
        merged_doc.insert_pdf(doc2, from_page=0, to_page=2)
        
        # Insert references from the ML paper. 
        # For "Attention Is All You Need" (1706.03762), references start on page 10 (index 9).
        if doc1.page_count >= 10:
            merged_doc.insert_pdf(doc1, from_page=9, to_page=doc1.page_count - 1)
            
        merged_doc.save(output_path)
        print(f"Stitched PDF created successfully at: {output_path}")
        
    except Exception as e:
        print(f"Error merging PDFs: {e}")
    finally:
        # Close docs first to release file locks on Windows
        if 'doc1' in locals(): doc1.close()
        if 'doc2' in locals(): doc2.close()
        if 'merged_doc' in locals(): merged_doc.close()
        # Now safe to delete
        if os.path.exists(paper1_path): os.remove(paper1_path)
        if os.path.exists(paper2_path): os.remove(paper2_path)

if __name__ == "__main__":
    create_stitched_pdf()
