const API_BASE = '/api/v1'

export class ApiError extends Error {
  constructor(message, status, code = 'REQUEST_FAILED') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options)
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.error?.message ?? 'The request could not be completed.',
      response.status,
      payload?.error?.code,
    )
  }

  console.debug('[Canary API]', options.method ?? 'GET', path, response.status)
  return payload.data
}

export const documentApi = {
  list: () => request('/documents'),
  get: (documentId) => request(`/documents/${documentId}`),
  remove: (documentId) => request(`/documents/${documentId}`, { method: 'DELETE' }),
  upload(file, onProgress) {
    return new Promise((resolve, reject) => {
      const data = new FormData()
      data.append('file', file)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/documents`)
      xhr.responseType = 'json'

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
      })
      xhr.addEventListener('load', () => {
        const payload = xhr.response
        if (xhr.status >= 200 && xhr.status < 300 && payload?.success) {
          console.debug('[Canary API] POST /documents', xhr.status)
          resolve(payload.data)
          return
        }
        reject(new ApiError(payload?.error?.message ?? 'Upload failed.', xhr.status, payload?.error?.code))
      })
      xhr.addEventListener('error', () => reject(new ApiError('Could not reach the Canary API.', 0, 'NETWORK_ERROR')))
      xhr.send(data)
    })
  },
}

export const chatApi = {
  chat: (query, documentIds, history = []) => request('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, documentIds, history })
  }),
  chatStream: async (query, documentIds, history = [], onChunk, onCitations) => {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, documentIds, history })
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new ApiError(payload?.error?.message ?? 'Streaming request failed.', response.status)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue

        if (line.startsWith('data:')) {
          try {
            const data = JSON.parse(line.slice(5).trim())
            if (data.citations) {
              onCitations(data.citations)
            }
            if (data.content) {
              onChunk(data.content)
            }
          } catch (e) {
            console.error('Failed to parse SSE JSON:', line, e)
          }
        }
      }
    }
  }
}

export async function getApiHealth() {
  const response = await fetch(`${API_BASE}/health`)
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) throw new ApiError('Canary API is unavailable.', response.status)
  return payload.data
}

export async function getModels() {
  const response = await fetch(`${API_BASE}/chat/models`)
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) throw new ApiError('Failed to fetch models.', response.status)
  return payload.data
}
