import { CheckCircle2, Circle, LoaderCircle, TriangleAlert } from 'lucide-react'
import styles from './ui.module.css'

const statusConfig = {
  UPLOADED: { label: 'Uploaded', icon: Circle, className: 'uploaded' },
  PROCESSING: { label: 'Indexing', icon: LoaderCircle, className: 'processing' },
  READY: { label: 'Indexed', icon: CheckCircle2, className: 'ready' },
  FAILED: { label: 'Failed', icon: TriangleAlert, className: 'failed' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] ?? statusConfig.UPLOADED
  const Icon = config.icon
  return <span className={`${styles.status} ${styles[config.className]}`}><Icon size={15} />{config.label}</span>
}
