import faiss
import json
import numpy as np
from ai.config import VECTOR_DIR


class VectorStore:
	def __init__(self):
		self.directory = VECTOR_DIR

	def save_index(self, document_id: str, embeddings: list[list[float]], chunks: list[dict]):
		if not embeddings:
			return

		vectors = np.array(embeddings, dtype=np.float32)
		dimension = vectors.shape[1]

		# Normalize for cosine similarity calculation
		faiss.normalize_L2(vectors)

		# Inner Product Flat index
		index = faiss.IndexFlatIP(dimension)
		index.add(vectors)

		index_path = self.directory / f"{document_id}.index"
		meta_path = self.directory / f"{document_id}.json"

		# Save binary index and accompanying metadata map
		faiss.write_index(index, str(index_path))
		with open(meta_path, "w", encoding="utf-8") as f:
			json.dump(chunks, f, ensure_ascii=False, indent=2)

	def load_index(self, document_id: str):
		index_path = self.directory / f"{document_id}.index"
		meta_path = self.directory / f"{document_id}.json"

		if not index_path.exists() or not meta_path.exists():
			return None, []

		index = faiss.read_index(str(index_path))
		with open(meta_path, "r", encoding="utf-8") as f:
			chunks = json.load(f)

		return index, chunks

	def delete_index(self, document_id: str):
		index_path = self.directory / f"{document_id}.index"
		meta_path = self.directory / f"{document_id}.json"

		if index_path.exists():
			index_path.unlink()
		if meta_path.exists():
			meta_path.unlink()
