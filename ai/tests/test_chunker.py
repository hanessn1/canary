from ai.services.chunker import split_text_recursively, chunk_pages


def test_split_text_recursively_empty():
	assert split_text_recursively("") == []
	assert split_text_recursively(None) == []


def test_split_text_recursively_small():
	text = "Hello world"
	chunks = split_text_recursively(text, chunk_size=50)
	assert chunks == ["Hello world"]


def test_split_text_recursively_large():
	text = "Paragraph 1\n\nParagraph 2\n\nParagraph 3"
	# Split on double newlines
	chunks = split_text_recursively(text, chunk_size=15, chunk_overlap=0)
	assert len(chunks) == 3
	assert "Paragraph 1" in chunks
	assert "Paragraph 2" in chunks
	assert "Paragraph 3" in chunks


def test_chunk_pages():
	pages = [
		{"text": "Page one text. This is some content.", "page": 1},
		{"text": "Page two text. More content here.", "page": 2}
	]
	chunks = chunk_pages(pages, chunk_size=20)
	assert len(chunks) >= 2
	assert chunks[0]["page"] == 1
	assert chunks[-1]["page"] == 2
	assert "chunk_id" in chunks[0]
	assert "text" in chunks[0]
	assert chunks[0]["chunk_id"] == 0
	assert chunks[1]["chunk_id"] == 1
