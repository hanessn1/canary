import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { documentApi } from '../services/api'

const DocumentsContext = createContext(null)
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['pdf', 'txt', 'md', 'docx'])

function getExtension(fileName) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

export function DocumentsProvider({ children }) {
  const [documents, setDocuments] = useState([])
  const [uploads, setUploads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setDocuments(await documentApi.list())
      setError(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const upload = useCallback(async (file) => {
    const uploadId = crypto.randomUUID()
    const extension = getExtension(file.name)
    let validationError = null
    if (!ALLOWED_EXTENSIONS.has(extension)) validationError = 'Supported files: PDF, DOCX, Markdown, and TXT.'
    if (file.size > MAX_UPLOAD_BYTES) validationError = 'This file exceeds the 10 MB upload limit.'

    if (validationError) {
      setUploads((current) => [...current, { id: uploadId, file, progress: 0, state: 'failed', error: validationError }])
      return
    }

    setUploads((current) => [...current, { id: uploadId, file, progress: 0, state: 'uploading' }])
    try {
      const document = await documentApi.upload(file, (progress) => {
        setUploads((current) => current.map((item) => item.id === uploadId ? { ...item, progress } : item))
      })
      setDocuments((current) => [document, ...current])
      setUploads((current) => current.map((item) => item.id === uploadId ? { ...item, progress: 100, state: 'complete' } : item))
      window.setTimeout(() => setUploads((current) => current.filter((item) => item.id !== uploadId)), 1400)
    } catch (requestError) {
      setUploads((current) => current.map((item) => item.id === uploadId ? { ...item, state: 'failed', error: requestError.message } : item))
    }
  }, [])

  const remove = useCallback(async (documentId) => {
    await documentApi.remove(documentId)
    setDocuments((current) => current.filter((document) => document.id !== documentId))
  }, [])

  const value = useMemo(() => ({ documents, uploads, isLoading, error, refresh, upload, remove }), [documents, uploads, isLoading, error, refresh, upload, remove])
  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}

export function useDocuments() {
  const context = useContext(DocumentsContext)
  if (!context) throw new Error('useDocuments must be used inside DocumentsProvider')
  return context
}
