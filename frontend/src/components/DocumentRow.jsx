import { FileCode2, FileText, Trash2 } from 'lucide-react'
import StatusBadge from './ui/StatusBadge'
import styles from './DocumentRow.module.css'

const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
function formatSize(bytes) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB` }
function extension(name) { return name.split('.').pop()?.toUpperCase() ?? 'FILE' }

export default function DocumentRow({ document, onDelete }) {
  const isMarkdown = document.originalFilename.toLowerCase().endsWith('.md')
  const Icon = isMarkdown ? FileCode2 : FileText
  return <tr>
    <td><span className={styles.file}><span className={styles.fileIcon}><Icon size={19} /></span><span><strong>{document.originalFilename}</strong><small>{document.checksum.slice(0, 12)}…</small></span></span></td>
    <td>{extension(document.originalFilename)}</td>
    <td>{formatSize(document.sizeBytes)}</td>
    <td>{formatter.format(new Date(document.uploadedAt))}</td>
    <td><StatusBadge status={document.status} /></td>
    <td><div className={styles.actions}><button title="Delete document" aria-label={`Delete ${document.originalFilename}`} onClick={() => onDelete(document)}><Trash2 size={17} /></button></div></td>
  </tr>
}
