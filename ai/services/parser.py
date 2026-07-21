from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader
import docx


def parse_pdf(file_path: Path) -> List[Dict[str, Any]]:
	reader = PdfReader(str(file_path))
	pages = []
	for page_idx, page in enumerate(reader.pages):
		text = page.extract_text() or ""
		pages.append({"text": text.strip(), "page": page_idx + 1})
	return pages


def parse_docx(file_path: Path) -> List[Dict[str, Any]]:
	doc = docx.Document(str(file_path))
	text = "\n".join([p.text for p in doc.paragraphs])
	return [{"text": text.strip(), "page": 1}]


def parse_txt(file_path: Path) -> List[Dict[str, Any]]:
	with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
		text = f.read()
	return [{"text": text.strip(), "page": 1}]


def parse_document(file_path: Path) -> List[Dict[str, Any]]:
	ext = file_path.suffix.lower()
	if ext == ".pdf":
		return parse_pdf(file_path)
	elif ext == ".docx":
		return parse_docx(file_path)
	elif ext in [".txt", ".md", ".markdown"]:
		return parse_txt(file_path)
	else:
		raise ValueError(f"Unsupported file extension: {ext}")
