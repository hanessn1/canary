import httpx
from ai.config import OLLAMA_URL, EMBEDDING_MODEL


class Embedder:
	def __init__(self):
		self.client = httpx.AsyncClient(base_url=OLLAMA_URL, timeout=60.0)
		self.model = EMBEDDING_MODEL

	async def close(self):
		await self.client.aclose()

	async def get_embedding(self, text: str) -> list[float]:
		response = await self.client.post("/api/embeddings", json={
			"model": self.model,
			"prompt": text
		})
		response.raise_for_status()
		return response.json()["embedding"]

	async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
		embeddings = []
		for text in texts:
			embedding = await self.get_embedding(text)
			embeddings.append(embedding)
		return embeddings
