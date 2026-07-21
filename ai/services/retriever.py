import numpy as np
import faiss
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
from ai.services.embedder import Embedder
from ai.services.vector_store import VectorStore


class Retriever:
	def __init__(self, embedder: Embedder, vector_store: VectorStore):
		self.embedder = embedder
		self.vector_store = vector_store

	async def retrieve(self, query: str, document_ids: List[str], top_k: int = 5) -> List[Dict[str, Any]]:
		if not document_ids:
			return []

		# Get query vector embedding
		query_vector = await self.embedder.get_embedding(query)
		query_np = np.array([query_vector], dtype=np.float32)
		faiss.normalize_L2(query_np)

		all_candidate_chunks = []

		# Load and query index for each selected document
		for doc_id in document_ids:
			index, chunks = self.vector_store.load_index(doc_id)
			if not index or not chunks:
				continue

			k = min(top_k, len(chunks))
			if k == 0:
				continue

			scores, indices = index.search(query_np, k)

			for score, idx in zip(scores[0], indices[0]):
				if idx < 0 or idx >= len(chunks):
					continue
				chunk = chunks[idx]
				all_candidate_chunks.append({
					"text": chunk["text"],
					"page": chunk["page"],
					"document_id": doc_id,
					"score": float(score)  # Cosine similarity score from FAISS
				})

		# Fallback to empty if no chunks retrieved
		if not all_candidate_chunks:
			return []

		# Perform BM25 Re-Ranking on all collected candidates
		corpus = [c["text"].lower().split() for c in all_candidate_chunks]
		bm25 = BM25Okapi(corpus)

		tokenized_query = query.lower().split()
		bm25_scores = bm25.get_scores(tokenized_query)

		# Normalize BM25 scores
		max_bm25 = max(bm25_scores) if len(bm25_scores) > 0 else 0

		for i, chunk in enumerate(all_candidate_chunks):
			norm_bm25 = (bm25_scores[i] / max_bm25) if max_bm25 > 0 else 0.0
			# Hybrid combined score (70% semantic, 30% keyword match)
			chunk["combined_score"] = 0.7 * chunk["score"] + 0.3 * norm_bm25

		# Sort candidates by combined score
		all_candidate_chunks.sort(key=lambda x: x["combined_score"], reverse=True)
		return all_candidate_chunks[:top_k]
