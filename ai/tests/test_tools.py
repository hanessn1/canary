import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from ai.services.tools import get_system_time, list_documents, TOOL_SCHEMAS
from ai.services.chat import ChatService


def test_get_system_time():
	now = get_system_time()
	assert len(now) == 19
	assert now[4] == "-"
	assert now[7] == "-"
	assert now[10] == " "


def test_list_documents_missing(tmp_path):
	with patch("ai.services.tools.STORAGE_DIR", tmp_path):
		assert list_documents() == []


def test_list_documents_present(tmp_path):
	docs_file = tmp_path / "documents.json"
	mock_data = [{"id": "123", "originalFilename": "test.txt"}]
	docs_file.write_text(json.dumps(mock_data), encoding="utf-8")

	with patch("ai.services.tools.STORAGE_DIR", tmp_path):
		result = list_documents()
		assert len(result) == 1
		assert result[0]["originalFilename"] == "test.txt"


@pytest.mark.asyncio
async def test_chat_service_execute_tool():
	mock_retriever = MagicMock()
	mock_retriever.retrieve = AsyncMock(return_value=[{"text": "mock chunk"}])

	chat_service = ChatService(retriever=mock_retriever)

	# Test get_system_time tool execution
	time_res = await chat_service.execute_tool("get_system_time", {})
	assert len(time_res) == 19

	# Test list_documents tool execution
	with patch("ai.services.chat.list_documents", return_value=[{"id": "doc_1"}]) as mock_list:
		docs_res = await chat_service.execute_tool("list_documents", {})
		assert docs_res == [{"id": "doc_1"}]
		mock_list.assert_called_once()

	# Test search_documents tool execution
	search_res = await chat_service.execute_tool("search_documents", {
		"query": "hello query",
		"document_ids": ["doc_123"],
		"top_k": 3
	})
	assert search_res == [{"text": "mock chunk"}]
	mock_retriever.retrieve.assert_called_once_with("hello query", ["doc_123"], 3)

	# Test invalid tool execution
	with pytest.raises(ValueError, match="Unknown tool"):
		await chat_service.execute_tool("invalid_tool", {})
	
	await chat_service.close()
