import { FilePlus2, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'
import DocumentRow from '../components/DocumentRow'
import Uploader from '../components/Uploader'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useDocuments } from '../contexts/DocumentsContext'
import styles from './LibraryView.module.css'

export default function LibraryView() {
  const { documents, isLoading, error, refresh, remove } = useDocuments()
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const fileInputRef = useRef(null)

  const deleteSelected = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await remove(selectedDocument.id)
      setSelectedDocument(null)
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete the document.')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setSelectedDocument(null)
    setDeleteError(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}><div><p className={styles.eyebrow}>Knowledge base</p><h1>Document Library</h1><p>Your local source material, ready for the next processing stage.</p></div><Button onClick={() => fileInputRef.current?.click()}><FilePlus2 size={18} />Upload documents</Button></div>
      <Uploader fileInputRef={fileInputRef} />
      <section className={styles.tableSection}>
        <div className={styles.tableHeader}><div><h2>Documents</h2><span>{documents.length} in your library</span></div><button className={styles.refresh} onClick={refresh} disabled={isLoading}><RefreshCw size={16} className={isLoading ? styles.spinning : ''} />Refresh</button></div>
        {error ? <div className={styles.notice}><strong>Cannot reach the document API.</strong><span>{error}</span><Button variant="secondary" onClick={refresh}>Try again</Button></div> : isLoading ? <div className={styles.empty}>Loading local documents…</div> : documents.length === 0 ? <div className={styles.empty}><FilePlus2 size={27} /><h3>No documents yet</h3><p>Upload a PDF, DOCX, Markdown, or text file to start your local library.</p></div> : <div className={styles.tableWrap}><table><thead><tr><th><input type="checkbox" aria-label="Select all documents" /></th><th>File name</th><th>Format</th><th>Size</th><th>Uploaded</th><th>Status</th><th>Actions</th></tr></thead><tbody>{documents.map((document) => <DocumentRow key={document.id} document={document} onDelete={setSelectedDocument} />)}</tbody></table></div>}
      </section>
      <ConfirmDialog document={selectedDocument} onCancel={cancelDelete} onConfirm={deleteSelected} isDeleting={isDeleting} error={deleteError} />
    </div>
  )
}
