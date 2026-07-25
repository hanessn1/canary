import httpx
from typing import List, Dict, Any, AsyncIterator, Optional
import json
from ai.config import OLLAMA_URL, LLM_MODEL
from ai.services.tools import get_system_time, list_documents, TOOL_SCHEMAS


class ChatService:
	def __init__(self, retriever=None):
		self.client = httpx.AsyncClient(base_url=OLLAMA_URL, timeout=90.0)
		self.model = LLM_MODEL
		self.retriever = retriever

	async def close(self):
		await self.client.aclose()

	async def execute_tool(self, name: str, arguments: dict) -> Any:
		if name == "get_system_time":
			return get_system_time()
		elif name == "list_documents":
			return list_documents()
		elif name == "search_documents":
			if not self.retriever:
				return []
			query = arguments.get("query")
			doc_ids = arguments.get("document_ids", [])
			top_k = arguments.get("top_k", 5)
			return await self.retriever.retrieve(query, doc_ids, top_k)
		else:
			raise ValueError(f"Unknown tool: {name}")

	async def generate_response(self, query: str, context_chunks: List[Dict[str, Any]], history: List[Dict[str, str]], stream: bool = False, tools: List[Dict[str, Any]] = TOOL_SCHEMAS, temperature: float = 0.3, model: Optional[str] = None):
		if not context_chunks:
			system_prompt = (
				"You are Canary, a local-first AI document intelligence assistant. "
				"Help the user with their request or answer their questions. Be friendly, helpful, and conversational. "
				"You can also use tools when needed to answer general questions about documents or time."
			)
		else:
			context_text = "\n\n".join([
				f"[Page: {chunk['page']}]\n{chunk['text']}"
				for chunk in context_chunks
			])

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

		if stream:
			return self._stream_agent_loop(messages, context_chunks, tools, temperature, model=model)
		else:
			return await self._blocking_agent_loop(messages, context_chunks, tools, temperature, model=model)

	async def _blocking_agent_loop(self, messages: List[Dict[str, Any]], context_chunks: List[Dict[str, Any]], tools: List[Dict[str, Any]], temperature: float = 0.3, model: Optional[str] = None) -> Dict[str, Any]:
		target_model = model if model and model.strip() else self.model
		if not target_model or not target_model.strip():
			return {
				"message": "Error: No language model is selected or available in Ollama.",
				"citations": context_chunks
			}

		payload = {
			"model": target_model,
			"messages": messages,
			"stream": False,
			"options": {
				"temperature": temperature
			}
		}
		if tools:
			payload["tools"] = tools

		for _ in range(5):
			try:
				response = await self.client.post("/api/chat", json=payload)
				response.raise_for_status()
			except httpx.HTTPError as e:
				# If tool call format is unsupported by this model in Ollama, retry without tools
				if "tools" in payload:
					payload_no_tools = {k: v for k, v in payload.items() if k != "tools"}
					try:
						response = await self.client.post("/api/chat", json=payload_no_tools)
						response.raise_for_status()
						payload = payload_no_tools
					except httpx.HTTPError as e2:
						err_msg = _extract_error_detail(getattr(e2, "response", None))
						return {"message": f"Error from Ollama: {err_msg}", "citations": context_chunks}
				else:
					err_msg = _extract_error_detail(getattr(e, "response", None))
					return {"message": f"Error from Ollama: {err_msg}", "citations": context_chunks}

			result = response.json()
			assistant_message = result.get("message", {})

			if "tool_calls" in assistant_message and assistant_message["tool_calls"]:
				payload["messages"].append(assistant_message)
				for tool_call in assistant_message["tool_calls"]:
					name = tool_call["function"]["name"]
					args = tool_call["function"]["arguments"]
					try:
						res = await self.execute_tool(name, args)
						content = json.dumps(res, ensure_ascii=False)
					except Exception as e:
						content = f"Error executing tool: {str(e)}"
					payload["messages"].append({
						"role": "tool",
						"name": name,
						"content": content
					})
			else:
				return {
					"message": assistant_message.get("content", ""),
					"citations": context_chunks
				}
		return {
			"message": "Error: Max tool execution loop limit reached.",
			"citations": context_chunks
		}

	async def _stream_agent_loop(self, messages: List[Dict[str, Any]], context_chunks: List[Dict[str, Any]], tools: List[Dict[str, Any]], temperature: float = 0.3, model: Optional[str] = None) -> AsyncIterator[str]:
		target_model = model if model and model.strip() else self.model

		# First, yield citations to the client immediately
		yield json.dumps({"citations": context_chunks}) + "\n"

		if not target_model or not target_model.strip():
			yield json.dumps({"content": "Error: No language model is selected or available in Ollama.", "done": True}) + "\n"
			return

		payload = {
			"model": target_model,
			"messages": messages,
			"stream": True,
			"options": {
				"temperature": temperature
			}
		}
		if tools:
			payload["tools"] = tools

		for _ in range(5):
			try:
				async with self.client.stream("POST", "/api/chat", json=payload) as response:
					status = getattr(response, "status_code", 200)
					if isinstance(status, int) and status >= 400:
						await response.aread()
						if "tools" in payload:
							payload_no_tools = {k: v for k, v in payload.items() if k != "tools"}
							async with self.client.stream("POST", "/api/chat", json=payload_no_tools) as response2:
								status2 = getattr(response2, "status_code", 200)
								if isinstance(status2, int) and status2 >= 400:
									await response2.aread()
									err_msg = _extract_error_detail(response2)
									yield json.dumps({"content": f"Error from Ollama ({err_msg})", "done": True}) + "\n"
									return
								else:
									async for line in response2.aiter_lines():
										if not line.strip():
											continue
										try:
											chunk_data = json.loads(line)
											chunk_content = chunk_data.get("message", {}).get("content", "")
											chunk_done = chunk_data.get("done", False)
											yield json.dumps({"content": chunk_content, "done": chunk_done}) + "\n"
										except json.JSONDecodeError:
											continue
									return
						else:
							err_msg = _extract_error_detail(response)
							yield json.dumps({"content": f"Error from Ollama ({err_msg})", "done": True}) + "\n"
							return

					lines_iter = response.aiter_lines()
					
					# Retrieve the first line to check if it represents a tool call or text content
					first_line = None
					async for line in lines_iter:
						if line.strip():
							first_line = line
							break
					
					if not first_line:
						break

					try:
						data = json.loads(first_line)
					except json.JSONDecodeError:
						data = {}

					assistant_msg = data.get("message", {})
					if "tool_calls" in assistant_msg and assistant_msg["tool_calls"]:
						tool_calls = assistant_msg["tool_calls"]
						
						# Consume remaining lines if any other tool call chunks exist
						async for line in lines_iter:
							pass
						
						payload["messages"].append(assistant_msg)
						for tool_call in tool_calls:
							name = tool_call["function"]["name"]
							args = tool_call["function"]["arguments"]
							try:
								res = await self.execute_tool(name, args)
								content = json.dumps(res, ensure_ascii=False)
							except Exception as e:
								content = f"Error executing tool: {str(e)}"
							payload["messages"].append({
								"role": "tool",
								"name": name,
								"content": content
							})
						continue
					else:
						content = assistant_msg.get("content", "")
						done = data.get("done", False)
						if content or done:
							yield json.dumps({"content": content, "done": done}) + "\n"
						
						async for line in lines_iter:
							if not line.strip():
								continue
							try:
								chunk_data = json.loads(line)
								chunk_content = chunk_data.get("message", {}).get("content", "")
								chunk_done = chunk_data.get("done", False)
								yield json.dumps({"content": chunk_content, "done": chunk_done}) + "\n"
							except json.JSONDecodeError:
								continue
						return
			except Exception as e:
				yield json.dumps({"content": f"Error from Ollama ({str(e)})", "done": True}) + "\n"
				return


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


def _extract_error_detail(resp) -> str:
	if resp is None:
		return "Unknown error"
	try:
		data = resp.json()
		if isinstance(data, dict) and "error" in data:
			return str(data["error"])
	except Exception:
		pass
	try:
		if resp.text:
			return resp.text.strip()
	except Exception:
		pass
	return f"HTTP {resp.status_code}"
