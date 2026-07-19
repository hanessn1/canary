package com.canary.backend.mapper;

import com.canary.backend.domain.document.Document;
import com.canary.backend.dto.document.DocumentResponse;
import org.springframework.stereotype.Component;

/** Maps the document domain model to its public API representation. */
@Component
public class DocumentMapper {

	public DocumentResponse toResponse(Document document) {
		return new DocumentResponse(document.id(), document.filename(), document.originalFilename(),
				document.contentType(), document.sizeBytes(), document.uploadedAt(), document.status(),
				document.checksum(), document.pageCount(), document.metadata());
	}
}
