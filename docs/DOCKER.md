# Containerized Deployment with Docker

Canary provides a multi-container deployment architecture using Docker and Docker Compose. Each core tier (Frontend, Java Spring Boot Backend, and Python AI Service) is containerized into lightweight, production-ready images.

## 1. Prerequisites

### Local Ollama Engine
Ollama runs locally on the host machine as a system dependency to leverage GPU hardware acceleration (NVIDIA CUDA / Metal / ROCm) directly.

Ensure Ollama is running on your host machine and pull the required models:

```bash
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
```

Default Ollama endpoint: `http://localhost:11434`

## 2. Docker Image Tagging

All project container images are built and tagged under the `hanessn` Docker namespace:

| Service | Docker Image Name | Base Environment | Port |
| :--- | :--- | :--- | :--- |
| **AI Engine** | `hanessn/canary-ai:latest` | Python 3.11 Slim | `8000` |
| **Backend API** | `hanessn/canary-backend:latest` | Eclipse Temurin JDK 25 / JRE 25 | `8080` |
| **Web Frontend** | `hanessn/canary-frontend:latest` | Node 22 Alpine / Nginx 1.27 Alpine | `3000` (`80`) |

## 3. Building Service Container Images

You can manually build individual service images from the project root:

### Build AI Service Image
```bash
docker build -t hanessn/canary-ai:latest -f ai/Dockerfile .
```

### Build Backend Service Image
```bash
docker build -t hanessn/canary-backend:latest -f backend/Dockerfile .
```

### Build Frontend Service Image
```bash
docker build -t hanessn/canary-frontend:latest -f frontend/Dockerfile .
```

## 4. Running the Application Stack

From the project root directory, launch the complete container stack using Docker Compose:

```bash
docker compose up -d
```

### Checking Service Logs
```bash
docker compose logs -f
```

### Stopping the Stack
```bash
docker compose down
```

## 5. Storage & Environment Architecture

### Shared Storage Volume
The container stack shares document storage between the **Backend** and **AI Service** using a Docker volume (`document-storage`):

- **Backend Container**: Saves uploaded files to `/app/storage/uploads` via `CANARY_DOCUMENTS_UPLOAD_DIRECTORY`.
- **AI Container**: Reads uploaded files from `/app/storage/uploads` via `STORAGE_DIR=/app/storage`.

### Host Ollama Networking
The AI container connects to Ollama on your host machine via:

```yaml
environment:
  OLLAMA_URL: ${OLLAMA_URL:-http://host.docker.internal:11434}
extra_hosts:
  - "host.docker.internal:host-gateway"
```

Once started, open `http://localhost:3000` in your web browser.
