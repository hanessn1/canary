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

export async function getApiHealth() {
  const response = await fetch(`${API_BASE}/health`)
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) throw new ApiError('Canary API is unavailable.', response.status)
  return payload.data
}
