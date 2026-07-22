import { useState, useEffect, useRef } from 'react'
import { Server, SlidersHorizontal, ChevronDown } from 'lucide-react'
import useHealthCheck from '../hooks/useHealthCheck'
import { getModels } from '../services/api'
import styles from './SettingsView.module.css'

export default function SettingsView() {
  const apiStatus = useHealthCheck()
  const [availableModels, setAvailableModels] = useState(['qwen2.5:3b', 'nomic-embed-text'])
  const [embeddingModel, setEmbeddingModel] = useState('nomic-embed-text')
  const [llmModel, setLlmModel] = useState('qwen2.5:3b')
  const [ollamaStatus, setOllamaStatus] = useState('Checking')
  const [ollamaHealthy, setOllamaHealthy] = useState(false)

  useEffect(() => {
    getModels()
      .then((models) => {
        if (models && models.length > 0) {
          setAvailableModels(models)
          setOllamaStatus('Online')
          setOllamaHealthy(true)
          
          // Categorize and pick default embedding model
          const embedMList = models.filter(m =>
            m.toLowerCase().includes('embed') || m.toLowerCase().includes('bge') || m.toLowerCase().includes('minilm')
          )
          const defaultEmbed = embedMList.length > 0 ? embedMList[0] : models[0]
          setEmbeddingModel(defaultEmbed)

          // Categorize and pick default language model
          const llmMList = models.filter(m =>
            !(m.toLowerCase().includes('embed') || m.toLowerCase().includes('bge') || m.toLowerCase().includes('minilm'))
          )
          const defaultLlm = llmMList.length > 0 ? llmMList[0] : models[0]
          setLlmModel(defaultLlm)
        } else {
          setOllamaStatus('Offline')
          setOllamaHealthy(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load Ollama models:', err)
        setOllamaStatus('Offline')
        setOllamaHealthy(false)
      })
  }, [])

  // Filter models for selection dropdowns
  const embeddingModels = availableModels.filter(m =>
    m.toLowerCase().includes('embed') || m.toLowerCase().includes('bge') || m.toLowerCase().includes('minilm')
  )
  const finalEmbeddingModels = embeddingModels.length > 0 ? embeddingModels : ['nomic-embed-text']

  const llmModels = availableModels.filter(m =>
    !(m.toLowerCase().includes('embed') || m.toLowerCase().includes('bge') || m.toLowerCase().includes('minilm'))
  )
  const finalLlmModels = llmModels.length > 0 ? llmModels : ['qwen2.5:3b']

  return (
    <div className={styles.page}>
      <div>
        <p className={styles.eyebrow}>Local configuration</p>
        <h1>Settings & System Status</h1>
        <p className={styles.subtitle}>Monitor local services and configure the RAG controls for your local AI connection.</p>
      </div>
      <section className={styles.grid}>
        <Panel title="System health" icon={<Server size={19} />}>
          <Status label="Canary API" value={apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking'} healthy={apiStatus === 'online'} />
          <Status label="Ollama service" value={ollamaStatus} healthy={ollamaHealthy} />
        </Panel>
        
        <Panel title="Local models" icon={<SlidersHorizontal size={19} />}>
          <p className={styles.muted}>Select from your locally installed Ollama models.</p>
          <label>
            Embedding model
            <CustomSelect
              value={embeddingModel}
              onChange={setEmbeddingModel}
              options={finalEmbeddingModels}
            />
          </label>
          <label style={{ marginTop: '12px', display: 'block' }}>
            Language model
            <CustomSelect
              value={llmModel}
              onChange={setLlmModel}
              options={finalLlmModels}
            />
          </label>
        </Panel>
        
        <Panel title="RAG parameters" icon={<SlidersHorizontal size={19} />}>
          <p className={styles.muted}>These controls are visual placeholders until the AI module exposes runtime configuration.</p>
          <Range label="Temperature" value="0.2" />
          <Range label="Top-K chunks" value="6" />
          <Range label="Similarity threshold" value="0.78" />
        </Panel>
      </section>
    </div>
  )
}

function Panel({ title, icon, children }) { return <section className={styles.panel}><h2>{icon}{title}</h2>{children}</section> }
function Status({ label, value, healthy }) { 
  return (
    <div className={styles.status}>
      <span className={healthy ? styles.healthyStatus : styles.unhealthyStatus}>
        {label}
      </span>
      <small className={healthy ? styles.healthy : ''}>{value}</small>
    </div>
  ) 
}
function Range({ label, value }) { return <label className={styles.range}>{label}<span>{value}</span><input type="range" min="0" max="100" defaultValue="45" disabled /></label> }

function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={styles.customSelectContainer}>
      <button type="button" className={styles.customSelectTrigger} onClick={() => setIsOpen(!isOpen)}>
        {value} <ChevronDown size={14} />
      </button>
      {isOpen && (
        <div className={styles.customSelectDropdown}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={value === option ? styles.activeOption : ''}
              onClick={() => {
                onChange(option)
                setIsOpen(false)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
