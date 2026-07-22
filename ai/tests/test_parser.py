from pathlib import Path
import pytest
from unittest.mock import MagicMock, patch

from ai.services.parser import parse_txt, parse_document


def test_parse_txt(tmp_path):
	file_path = tmp_path / "test.txt"
	file_path.write_text("Hello text file parsing content.", encoding="utf-8")
	pages = parse_txt(file_path)
	assert len(pages) == 1
	assert pages[0]["text"] == "Hello text file parsing content."
	assert pages[0]["page"] == 1


def test_parse_document_unsupported():
	with pytest.raises(ValueError, match="Unsupported file extension"):
		parse_document(Path("dummy.png"))


@patch("ai.services.parser.PdfReader")
def test_parse_pdf_mocked(mock_pdf_reader):
	# Mock pages extract_text
	mock_page = MagicMock()
	mock_page.extract_text.return_value = "Mocked PDF page content."

	mock_reader_instance = MagicMock()
	mock_reader_instance.pages = [mock_page]
	mock_pdf_reader.return_value = mock_reader_instance

	pages = parse_document(Path("dummy.pdf"))
	assert len(pages) == 1
	assert pages[0]["text"] == "Mocked PDF page content."
	assert pages[0]["page"] == 1


@patch("ai.services.parser.docx.Document")
def test_parse_docx_mocked(mock_docx_document):
	# Mock paragraphs
	mock_paragraph = MagicMock()
	mock_paragraph.text = "Mocked Docx paragraph."

	mock_doc_instance = MagicMock()
	mock_doc_instance.paragraphs = [mock_paragraph]
	mock_docx_document.return_value = mock_doc_instance

	pages = parse_document(Path("dummy.docx"))
	assert len(pages) == 1
	assert pages[0]["text"] == "Mocked Docx paragraph."
	assert pages[0]["page"] == 1
