import httpx
from typing import List, Dict, Any, AsyncIterator
import json
from ai.config import OLLAMA_URL, LLM_MODEL


class ChatService:
	def __init__(self):
		self.client = httpx.AsyncClient(base_url=OLLAMA_URL, timeout=90.0)
		self.model = LLM_MODEL

	async def close(self):
		await self.client.aclose()

	async def generate_response(self,query: str,context_chunks: List[Dict[str, Any]],history: List[Dict[str, str]],stream: bool = False):
		if not context_chunks:
			system_prompt = (
				"You are Canary, a local-first AI document intelligence assistant. "
				"Help the user with their request or answer their questions. Be friendly, helpful, and conversational."
			)
		else:
			# Format the context text from retrieved chunks
			context_text = "\n\n".join([
				f"[Page: {chunk['page']}]\n{chunk['text']}"
				for chunk in context_chunks
			])

			# System prompt with instructions on grounding and citations
			system_prompt = (
				"You are Canary, a local-first AI document intelligence assistant. "
				"Answer the user's question based strictly on the provided document contexts below. "
				"If you do not know the answer or the context does not contain enough information, "
				"say so. Always cite your sources by referencing their Page Number in square brackets, "
				"e.g., [Page <number>].\n\n"
				f"--- START CONTEXT ---\n{context_text}\n--- END CONTEXT ---"
			)

		messages = [{"role": "system", "content": system_prompt}]
		for msg in history:
			messages.append({"role": msg["role"], "content": msg["content"]})
		messages.append({"role": "user", "content": query})

		payload = {
			"model": self.model,
			"messages": messages,
			"stream": stream
		}

		if stream:
			return self._stream_chat(payload, context_chunks)

		response = await self.client.post("/api/chat", json=payload)
		response.raise_for_status()
		result = response.json()
		return {
			"message": result["message"]["content"],
			"citations": context_chunks
		}

	async def _stream_chat(self, payload: dict, context_chunks: list) -> AsyncIterator[str]:
		async with self.client.stream("POST", "/api/chat", json=payload) as response:
			response.raise_for_status()
			# First line yields metadata/citations to client
			yield json.dumps({"citations": context_chunks}) + "\n"

			async for line in response.aiter_lines():
				if not line.strip():
					continue
				try:
					data = json.loads(line)
					content = data.get("message", {}).get("content", "")
					done = data.get("done", False)
					yield json.dumps({"content": content, "done": done}) + "\n"
				except json.JSONDecodeError:
					continue

	async def classify_intent(self, query: str) -> bool:
		clean_query = query.strip().lower().rstrip("?!.")

		# Common greetings and conversational patterns
		greetings = {
			"hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening", "howdy", "yo",
			"thanks", "thank you", "great", "ok", "okay", "cool", "perfect", "bye", "goodbye",
			"who are you", "what are you", "what is your name", "what can you do", "help", "how are you"
		}

		if clean_query in greetings:
			return False

		# Check for short conversational variations like "hi there"
		words = clean_query.split()
		if len(words) <= 3 and words[0] in {"hello", "hi", "hey", "greetings", "thanks", "thank", "goodbye"}:
			# If it contains references to documents, still classify as intent to retrieve
			if not any(w in clean_query for w in {"doc", "document", "file", "pdf", "text", "about"}):
				return False

		return True
