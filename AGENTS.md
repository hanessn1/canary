# Canary

Canary is a local-first AI document intelligence platform.

The project emphasizes software engineering quality over being a simple AI demo.

Goals:

- Clean architecture
- Modular design
- Production-ready code
- Local LLM inference
- RAG
- Tool calling
- Extensibility
- Maintainability

General Guidelines

- Prefer readability over cleverness.
- Follow SOLID design principles.
- Keep business logic independent from AI providers.
- Use dependency injection.
- Avoid unnecessary abstractions.
- Explain architectural trade-offs before implementing large features.
- Keep files focused on one responsibility.
- Write unit tests when appropriate.
- Prefer incremental changes over large rewrites.

## Before Implementing

For non-trivial features:

1. Explain the proposed design.
2. Identify trade-offs.
3. List files that will be modified.
4. Wait for approval before large architectural changes.

For small bug fixes or isolated improvements, implementation can proceed directly.