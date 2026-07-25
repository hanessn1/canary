import os
import sys
from pathlib import Path

# Resolve base directories relative to workspace root
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
	sys.path.insert(0, str(BASE_DIR))

STORAGE_DIR = Path(os.getenv("STORAGE_DIR", BASE_DIR / "storage"))
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", STORAGE_DIR / "uploads"))
VECTOR_DIR = Path(os.getenv("VECTOR_DIR", STORAGE_DIR / "vectors"))

# Ollama Settings
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:3b")

# Ensure required directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VECTOR_DIR.mkdir(parents=True, exist_ok=True)
