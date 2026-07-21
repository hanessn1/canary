# Canary Frontend

React and Vite single-page application for Canary's local document workspace.

## Commands

```bash
npm install
npm run dev
npm run build
```

The Vite development server proxies `/api` and `/actuator` to the Spring Boot backend at `http://localhost:8080`.

## Views

- **Library**: uploads, lists, and deletes documents through the backend API.
- **Chat Assistant**: future-ready local conversation and citation-inspector UI; no AI request is made yet.
- **Settings**: Java API health and future Ollama/RAG configuration placeholders.

The frontend uses CSS Modules for component-scoped styles and CSS custom properties in `src/App.css` for the shared dark design system.
