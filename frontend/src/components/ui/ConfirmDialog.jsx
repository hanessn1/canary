import { AlertTriangle, X } from 'lucide-react'
import Button from './Button'
import styles from './ui.module.css'

export default function ConfirmDialog({ document, onCancel, onConfirm, isDeleting, error }) {
  if (!document) return null
  return (
    <div className={styles.backdrop} role="presentation">
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <button className={styles.close} onClick={onCancel} aria-label="Close confirmation"><X size={18} /></button>
        <span className={styles.dangerIcon}><AlertTriangle size={21} /></span>
        <h2 id="delete-title">Delete document?</h2>
        <p><strong>{document.originalFilename}</strong> will be removed from the local library and temporary storage.</p>
        {error && <div className={styles.dialogError}>{error}</div>}
        <div className={styles.dialogActions}>
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>{isDeleting ? 'Deleting…' : 'Delete document'}</Button>
        </div>
      </section>
    </div>
  )
}
