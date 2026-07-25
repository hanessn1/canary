import { useState, useEffect, useRef } from 'react'
import { Server, SlidersHorizontal, ChevronDown } from 'lucide-react'
import useHealthCheck from '../hooks/useHealthCheck'
import { getModels } from '../services/api'
import { useChat } from '../contexts/ChatContext'
import styles from './SettingsView.module.css'

export default function SettingsView() {
  const apiStatus = useHealthCheck()
  const { 
    temperature, 
    setTemperature, 
    topK, 
    setTopK, 
    similarityThreshold, 
    setSimilarityThreshold,
    embeddingModel,
    setEmbeddingModel,
    llmModel,
    setLlmModel
  } = useChat()

  const [availableModels, setAvailableModels] = useState([])
  const [ollamaStatus, setOllamaStatus] = useState('Checking')
  const [ollamaHealthy, setOllamaHealthy] = useState(false)

  useEffect(() => {
    getModels()
      .then((models) => {
        if (models && models.length > 0) {
          setAvailableModels(models)
          setOllamaStatus('Online')
          setOllamaHealthy(true)
          
          const isEmbed = (m) => m && (m.toLowerCase().includes('embed') || m.toLowerCase().includes('bge') || m.toLowerCase().includes('minilm'))
          const isLlm = (m) => m && !(m.toLowerCase().includes('embed') || m.toLowerCase().includes('bge') || m.toLowerCase().includes('minilm'))

          if (!isEmbed(embeddingModel) || !models.includes(embeddingModel)) {
            const embedMList = models.filter(isEmbed)
            const defaultEmbed = embedMList.length > 0 ? embedMList[0] : (models[0] || '')
            setEmbeddingModel(defaultEmbed)
          }

          if (!isLlm(llmModel) || !models.includes(llmModel)) {
            const llmMList = models.filter(isLlm)
            const defaultLlm = llmMList.length > 0 ? llmMList[0] : (models[0] || '')
            setLlmModel(defaultLlm)
          }
        } else {
          setAvailableModels([])
          setOllamaStatus('No models')
          setOllamaHealthy(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load Ollama models:', err)
        setAvailableModels([])
        setOllamaStatus('Offline')
        setOllamaHealthy(false)
      })
  }, [])

  // Filter models for selection dropdowns
  const finalEmbeddingModels = availableModels.filter(m =>
    m.toLowerCase().includes('embed') || m.toLowerCase().includes('bge') || m.toLowerCase().includes('minilm')
  )

  const finalLlmModels = availableModels.filter(m =>
    !(m.toLowerCase().includes('embed') || m.toLowerCase().includes('bge') || m.toLowerCase().includes('minilm'))
  )

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
              placeholder="No models available"
            />
          </label>
          <label style={{ marginTop: '12px', display: 'block' }}>
            Language model
            <CustomSelect
              value={llmModel}
              onChange={setLlmModel}
              options={finalLlmModels}
              placeholder="No models available"
            />
          </label>
        </Panel>
        
        <Panel title="RAG parameters" icon={<SlidersHorizontal size={19} />}>
          <p className={styles.muted}>Configure temperature, search range, and similarity margins for responses.</p>
          <Range 
            label="Temperature" 
            value={temperature} 
            onChange={setTemperature} 
            min={0} 
            max={1} 
            step={0.05} 
          />
          <Range 
            label="Top-K chunks" 
            value={topK} 
            onChange={setTopK} 
            min={1} 
            max={20} 
            step={1} 
          />
          <Range 
            label="Similarity threshold" 
            value={similarityThreshold} 
            onChange={setSimilarityThreshold} 
            min={0} 
            max={1} 
            step={0.02} 
          />
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
function Range({ label, value, onChange, min = 0, max = 1, step = 0.01 }) { 
  return (
    <label className={styles.range}>
      {label}
      <span>{value}</span>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))} 
      />
    </label>
  ) 
}

function CustomSelect({ value, onChange, options, placeholder = "No models available" }) {
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

  const hasOptions = options && options.length > 0
  const selectedOption = hasOptions ? (options.includes(value) ? value : options[0]) : ''
  const displayValue = hasOptions ? selectedOption : placeholder

  return (
    <div ref={containerRef} className={styles.customSelectContainer}>
      <button 
        type="button" 
        className={styles.customSelectTrigger} 
        onClick={() => hasOptions && setIsOpen(!isOpen)}
        disabled={!hasOptions}
        style={!hasOptions ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
      >
        {displayValue} <ChevronDown size={14} />
      </button>
      {isOpen && hasOptions && (
        <div className={styles.customSelectDropdown}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={selectedOption === option ? styles.activeOption : ''}
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
