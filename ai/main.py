from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from ai.config import UPLOAD_DIR
from ai.services.parser import parse_document
from ai.services.chunker import chunk_pages
from ai.services.embedder import Embedder
from ai.services.vector_store import VectorStore
from ai.services.retriever import Retriever
from ai.services.chat import ChatService

# Initialize shared components
embedder = Embedder()
vector_store = VectorStore()
retriever = Retriever(embedder, vector_store)
chat_service = ChatService()


@asynccontextmanager
async def lifespan(app: FastAPI):
	yield
	await embedder.close()
	await chat_service.close()


app = FastAPI(title="Canary AI Service", lifespan=lifespan)


# DTO schemas
class IndexRequest(BaseModel):
	document_id: str
	filename: str
	chunk_size: Optional[int] = 500
	chunk_overlap: Optional[int] = 50


class RetrieveRequest(BaseModel):
	query: str
	document_ids: List[str]
	top_k: Optional[int] = 5


class Message(BaseModel):
	role: str
	content: str


class ChatRequest(BaseModel):
	query: str
	document_ids: List[str]
	history: Optional[List[Message]] = []
	stream: Optional[bool] = True


@app.post("/api/v1/index")
async def index_document(payload: IndexRequest):
	file_path = UPLOAD_DIR / payload.filename
	if not file_path.exists():
		raise HTTPException(status_code=404, detail=f"File not found: {payload.filename}")

	try:
		pages = parse_document(file_path)
		if not pages or all(not p["text"].strip() for p in pages):
			raise HTTPException(status_code=400, detail="No readable text found in document")

		chunks = chunk_pages(pages, payload.chunk_size, payload.chunk_overlap)

		texts = [c["text"] for c in chunks]
		embeddings = await embedder.get_embeddings(texts)

		vector_store.save_index(payload.document_id, embeddings, chunks)

		return {
			"status": "success",
			"document_id": payload.document_id,
			"chunks_count": len(chunks)
		}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


@app.post("/api/v1/retrieve")
async def retrieve_chunks(payload: RetrieveRequest):
	try:
		chunks = await retriever.retrieve(payload.query, payload.document_ids, payload.top_k)
		return {
			"status": "success",
			"chunks": chunks
		}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")


@app.post("/api/v1/chat")
async def chat_with_docs(payload: ChatRequest):
	try:
		# Let the model decide (via lightweight classifier) if document context is required
		needs_retrieval = await chat_service.classify_intent(payload.query)

		chunks = []
		if needs_retrieval and payload.document_ids:
			chunks = await retriever.retrieve(payload.query, payload.document_ids, top_k=5)

		hist = [{"role": msg.role, "content": msg.content} for msg in payload.history]
		response = await chat_service.generate_response(payload.query, chunks, hist, payload.stream)

		if payload.stream:
			return StreamingResponse(response, media_type="text/event-stream")
		else:
			return response
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Chat generation failed: {str(e)}")


@app.delete("/api/v1/index/{document_id}")
async def delete_index(document_id: str):
	try:
		vector_store.delete_index(document_id)
		return {"status": "success", "document_id": document_id}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")
