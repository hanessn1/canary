import { FileWarning, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDocuments } from '../contexts/DocumentsContext'
import styles from './Uploader.module.css'

export default function Uploader({ fileInputRef }) {
  const { upload, uploads } = useDocuments()
  const [isDragging, setIsDragging] = useState(false)
  const localRef = useRef(null)
  const inputRef = fileInputRef || localRef
  const processFiles = (files) => Array.from(files).forEach(upload)

  return (
    <section>
      <div className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); processFiles(event.dataTransfer.files) }}>
        <UploadCloud size={35} />
        <h2>Drop files here or <button onClick={() => inputRef.current?.click()}>browse</button></h2>
        <p>PDF, DOCX, Markdown, TXT · max 10 MB</p>
        <input ref={inputRef} type="file" accept=".pdf,.docx,.md,.txt,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { processFiles(event.target.files); event.target.value = '' }} multiple hidden />
      </div>
      {uploads.length > 0 && <div className={styles.uploadList}>
        <h3>Active uploads</h3>
        {uploads.map((item) => <div className={styles.uploadItem} key={item.id}>
          {item.state === 'failed' ? <FileWarning className={styles.failed} size={21} /> : <UploadCloud size={21} />}
          <div className={styles.uploadMeta}><strong>{item.file.name}</strong>{item.state === 'failed' ? <span className={styles.error}>{item.error}</span> : <div className={styles.progressTrack}><span style={{ width: `${item.progress}%` }} /></div>}</div>
          <small>{item.state === 'failed' ? 'Failed' : item.state === 'complete' ? 'Complete' : `${item.progress}%`}</small>
        </div>)}
      </div>}
    </section>
  )
}
