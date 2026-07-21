from typing import List, Dict, Any


def split_text_recursively(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
	if not text:
		return []

	separators = ["\n\n", "\n", " ", ""]
	final_chunks = []

	def _split(txt: str, current_seps: List[str]):
		if len(txt) <= chunk_size:
			final_chunks.append(txt)
			return

		if not current_seps:
			# Slice fallback
			start = 0
			while start < len(txt):
				final_chunks.append(txt[start:start + chunk_size])
				start += chunk_size - chunk_overlap
			return

		sep = current_seps[0]
		parts = txt.split(sep)

		current_chunk = ""
		for part in parts:
			if len(part) > chunk_size:
				if current_chunk:
					final_chunks.append(current_chunk)
					current_chunk = ""
				_split(part, current_seps[1:])
			else:
				# Add separator length if not first element
				sep_len = len(sep) if current_chunk else 0
				if len(current_chunk) + sep_len + len(part) <= chunk_size:
					current_chunk += (sep if current_chunk else "") + part
				else:
					if current_chunk:
						final_chunks.append(current_chunk)
					current_chunk = part

		if current_chunk:
			final_chunks.append(current_chunk)

	_split(text, separators)
	return [c.strip() for c in final_chunks if c.strip()]


def chunk_pages(pages: List[Dict[str, Any]], chunk_size: int = 500, chunk_overlap: int = 50) -> List[Dict[str, Any]]:
	chunks = []
	chunk_idx = 0
	for page in pages:
		text = page["text"]
		page_num = page["page"]

		page_chunks = split_text_recursively(text, chunk_size, chunk_overlap)
		for p_chunk in page_chunks:
			chunks.append({
				"chunk_id": chunk_idx,
				"text": p_chunk,
				"page": page_num
			})
			chunk_idx += 1
	return chunks
