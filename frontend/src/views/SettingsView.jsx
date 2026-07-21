import { CheckCircle2, CircleAlert, Server, SlidersHorizontal } from 'lucide-react'
import useHealthCheck from '../hooks/useHealthCheck'
import styles from './SettingsView.module.css'

export default function SettingsView() {
  const apiStatus = useHealthCheck()
  return <div className={styles.page}><div><p className={styles.eyebrow}>Local configuration</p><h1>Settings & System Status</h1><p className={styles.subtitle}>Monitor local services and prepare the RAG controls for a future AI connection.</p></div><section className={styles.grid}><Panel title="System health" icon={<Server size={19} />}><Status label="Canary API" value={apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking'} healthy={apiStatus === 'online'} /><Status label="Ollama service" value="Not configured" healthy={false} /></Panel><Panel title="Local models" icon={<SlidersHorizontal size={19} />}><p className={styles.muted}>Model discovery will connect to the local Ollama library in a future backend milestone.</p><label>Embedding model<select disabled><option>Not available</option></select></label><label>Language model<select disabled><option>Not available</option></select></label></Panel><Panel title="RAG parameters" icon={<SlidersHorizontal size={19} />}><p className={styles.muted}>These controls are visual placeholders until the AI module exposes runtime configuration.</p><Range label="Temperature" value="0.2" /><Range label="Top-K chunks" value="6" /><Range label="Similarity threshold" value="0.78" /></Panel></section></div>
}

function Panel({ title, icon, children }) { return <section className={styles.panel}><h2>{icon}{title}</h2>{children}</section> }
function Status({ label, value, healthy }) { return <div className={styles.status}><span>{healthy ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}{label}</span><small className={healthy ? styles.healthy : ''}>{value}</small></div> }
function Range({ label, value }) { return <label className={styles.range}>{label}<span>{value}</span><input type="range" min="0" max="100" defaultValue="45" disabled /></label> }
