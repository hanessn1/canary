import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from pathlib import Path

from ai.main import app

client = TestClient(app)


def test_index_document_not_found():
	response = client.post(
		"/api/v1/index",
		json={"document_id": "test_id", "filename": "non_existent_file.txt"}
	)
	assert response.status_code == 404
	assert "File not found" in response.json()["detail"]


@patch("ai.main.UPLOAD_DIR")
@patch("ai.main.embedder.get_embeddings", new_callable=AsyncMock)
@patch("ai.main.vector_store.save_index")
def test_index_document_success(mock_save_index, mock_get_embeddings, mock_upload_dir, tmp_path):
	file_path = tmp_path / "doc.txt"
	file_path.write_text("Hello. This is page text.", encoding="utf-8")
	mock_upload_dir.__truediv__.return_value = file_path

	mock_get_embeddings.return_value = [[0.1, 0.2]]

	response = client.post(
		"/api/v1/index",
		json={"document_id": "test_id", "filename": "doc.txt"}
	)
	assert response.status_code == 200
	assert response.json() == {
		"status": "success",
		"document_id": "test_id",
		"chunks_count": 1
	}
	mock_save_index.assert_called_once()


@patch("ai.main.retriever.retrieve", new_callable=AsyncMock)
def test_retrieve_chunks(mock_retrieve):
	mock_retrieve.return_value = [{"chunk_id": 0, "text": "matched text", "page": 1}]

	response = client.post(
		"/api/v1/retrieve",
		json={"query": "test query", "document_ids": ["doc_1"], "top_k": 3}
	)
	assert response.status_code == 200
	assert response.json()["status"] == "success"
	assert len(response.json()["chunks"]) == 1
	assert response.json()["chunks"][0]["text"] == "matched text"


@patch("ai.main.chat_service.classify_intent", new_callable=AsyncMock)
@patch("ai.main.chat_service.generate_response", new_callable=AsyncMock)
def test_chat_non_stream(mock_generate, mock_classify):
	mock_classify.return_value = False
	mock_generate.return_value = {"message": "hello reply", "citations": []}

	response = client.post(
		"/api/v1/chat",
		json={"query": "hello", "document_ids": [], "stream": False}
	)
	assert response.status_code == 200
	assert response.json()["message"] == "hello reply"


@patch("ai.main.vector_store.delete_index")
def test_delete_index_success(mock_delete):
	response = client.delete("/api/v1/index/doc_1")
	assert response.status_code == 200
	assert response.json() == {"status": "success", "document_id": "doc_1"}
	mock_delete.assert_called_once_with("doc_1")
