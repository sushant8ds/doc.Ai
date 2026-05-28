"""Extract text from documents (PDF, DOCX, TXT)"""


def extract_text(file_path: str) -> str:
    """
    Extract text from PDF, DOCX, or TXT files.
    
    Args:
        file_path: Path to the document file
        
    Returns:
        str: Extracted text content
    """
    import os
    
    file_ext = os.path.splitext(file_path)[1].lower()
    
    if file_ext == ".pdf":
        return _extract_pdf(file_path)
    elif file_ext == ".docx":
        return _extract_docx(file_path)
    else:  # .txt or other text files
        return _extract_txt(file_path)


def _extract_pdf(file_path: str) -> str:
    """Extract text from PDF using PyMuPDF"""
    import fitz
    
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        raise Exception(f"PDF extraction error: {str(e)}")
    
    return text.strip()


def _extract_docx(file_path: str) -> str:
    """Extract text from DOCX using python-docx"""
    from docx import Document
    
    text = ""
    try:
        doc = Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        raise Exception(f"DOCX extraction error: {str(e)}")
    
    return text.strip()


def _extract_txt(file_path: str) -> str:
    """Extract text from TXT file"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            text = f.read()
    except Exception as e:
        raise Exception(f"TXT extraction error: {str(e)}")
    
    return text.strip()
