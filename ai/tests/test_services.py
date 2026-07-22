import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json
import numpy as np
import faiss

from ai.services.embedder import Embedder
from ai.services.retriever import Retriever
from ai.services.chat import ChatService


@pytest.mark.asyncio
async def test_embedder():
	embedder = Embedder()

	mock_response = MagicMock()
	mock_response.json.return_value = {"embedding": [0.1, 0.2]}
	mock_response.raise_for_status = MagicMock()

	embedder.client.post = AsyncMock(return_value=mock_response)

	embedding = await embedder.get_embedding("hello")
	assert embedding == [0.1, 0.2]

	embeddings = await embedder.get_embeddings(["hello", "world"])
	assert embeddings == [[0.1, 0.2], [0.1, 0.2]]

	await embedder.close()


@pytest.mark.asyncio
async def test_retriever():
	mock_embedder = MagicMock()
	mock_embedder.get_embedding = AsyncMock(return_value=[0.1, 0.2])

	mock_vector_store = MagicMock()
	dimension = 2
	index = faiss.IndexFlatIP(dimension)
	index.add(np.array([[0.1, 0.2], [0.3, 0.4]], dtype=np.float32))

	chunks = [
		{"chunk_id": 0, "text": "First chunk text.", "page": 1},
		{"chunk_id": 1, "text": "Second chunk text.", "page": 2}
	]
	mock_vector_store.load_index.return_value = (index, chunks)

	retriever = Retriever(mock_embedder, mock_vector_store)
	results = await retriever.retrieve("test query", ["doc_123"], top_k=2)

	assert len(results) == 2
	assert "combined_score" in results[0]


@pytest.mark.asyncio
async def test_chat_service_classify_intent():
	chat_service = ChatService()

	# Greetings should bypass retrieval
	assert await chat_service.classify_intent("hi") is False
	assert await chat_service.classify_intent("hello canary") is False
	assert await chat_service.classify_intent("thanks!") is False

	# Queries about documents or specific concepts should trigger retrieval
	assert await chat_service.classify_intent("what is the financial result?") is True
	assert await chat_service.classify_intent("tell me about the document") is True

	await chat_service.close()


@pytest.mark.asyncio
async def test_chat_service_generate_response_blocking():
	chat_service = ChatService()

	mock_response = MagicMock()
	mock_response.json.return_value = {
		"message": {"role": "assistant", "content": "This is a response."}
	}
	mock_response.raise_for_status = MagicMock()
	chat_service.client.post = AsyncMock(return_value=mock_response)

	res = await chat_service.generate_response(
		query="question",
		context_chunks=[{"text": "context snippet", "page": 1, "document_id": "1"}],
		history=[],
		stream=False
	)
	assert res["message"] == "This is a response."
	assert len(res["citations"]) == 1

	await chat_service.close()


@pytest.mark.asyncio
async def test_chat_service_generate_response_streaming():
	chat_service = ChatService()

	# Set up async generator mock for response.aiter_lines
	async def mock_aiter_lines():
		yield '{"message": {"content": "Hello"}, "done": false}'
		yield '{"message": {"content": " world"}, "done": true}'

	mock_response = MagicMock()
	mock_response.raise_for_status = MagicMock()
	mock_response.aiter_lines = mock_aiter_lines

	# Mock the client.stream context manager
	mock_stream = MagicMock()
	mock_stream.__aenter__ = AsyncMock(return_value=mock_response)
	mock_stream.__aexit__ = AsyncMock(return_value=None)

	chat_service.client.stream = MagicMock(return_value=mock_stream)

	stream = await chat_service.generate_response(
		query="question",
		context_chunks=[{"text": "context snippet", "page": 1, "document_id": "1"}],
		history=[],
		stream=True
	)

	chunks = []
	async for line in stream:
		chunks.append(json.loads(line))

	# First line yields citations
	assert "citations" in chunks[0]
	assert len(chunks[0]["citations"]) == 1

	# Remaining lines yield content
	assert chunks[1]["content"] == "Hello"
	assert chunks[2]["content"] == " world"
	assert chunks[2]["done"] is True

	await chat_service.close()
