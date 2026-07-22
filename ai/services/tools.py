import datetime
import json
from typing import List, Dict, Any
from ai.config import BASE_DIR


def get_system_time() -> str:
	"""Get the current local system date and time."""
	return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def list_documents() -> List[Dict[str, Any]]:
	"""List all uploaded documents in the library along with their metadata."""
	metadata_path = BASE_DIR / "storage" / "documents.json"
	if not metadata_path.exists():
		return []
	try:
		with open(metadata_path, "r", encoding="utf-8") as f:
			return json.load(f)
	except Exception:
		return []


# JSON schemas for Ollama tool definitions
TOOL_SCHEMAS = [
	{
		"type": "function",
		"function": {
			"name": "get_system_time",
			"description": "Get the current local system date and time."
		}
	},
	{
		"type": "function",
		"function": {
			"name": "list_documents",
			"description": "List all uploaded documents in the library along with their metadata (id, originalFilename, sizeBytes, status, uploadedAt)."
		}
	},
	{
		"type": "function",
		"function": {
			"name": "search_documents",
			"description": "Search for relevant text chunks from the selected document library.",
			"parameters": {
				"type": "object",
				"properties": {
					"query": {
						"type": "string",
						"description": "The search query to match against document contents."
					},
					"document_ids": {
						"type": "array",
						"items": {
							"type": "string"
						},
						"description": "The UUID list of documents to search within."
					},
					"top_k": {
						"type": "integer",
						"description": "Number of chunks to return (default 5)."
					}
				},
				"required": ["query", "document_ids"]
			}
		}
	}
]
