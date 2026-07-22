import pytest
from ai.services.vector_store import VectorStore


def test_vector_store_lifecycle(tmp_path):
	store = VectorStore()
	store.directory = tmp_path  # override directory to use temp path

	document_id = "test_doc_123"
	embeddings = [
		[0.1, 0.2, 0.3],
		[0.4, 0.5, 0.6]
	]
	chunks = [
		{"chunk_id": 0, "text": "Chunk zero text content.", "page": 1},
		{"chunk_id": 1, "text": "Chunk one text content.", "page": 1}
	]

	# Test missing index load
	idx, chks = store.load_index(document_id)
	assert idx is None
	assert chks == []

	# Test save index
	store.save_index(document_id, embeddings, chunks)

	# Verify files are written
	assert (tmp_path / f"{document_id}.index").exists()
	assert (tmp_path / f"{document_id}.json").exists()

	# Test load index
	loaded_idx, loaded_chunks = store.load_index(document_id)
	assert loaded_idx is not None
	assert loaded_idx.ntotal == 2
	assert len(loaded_chunks) == 2
	assert loaded_chunks[0]["text"] == "Chunk zero text content."

	# Test delete index
	store.delete_index(document_id)
	assert not (tmp_path / f"{document_id}.index").exists()
	assert not (tmp_path / f"{document_id}.json").exists()
