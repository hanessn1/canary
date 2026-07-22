import { ChevronDown, FileText, Paperclip, Send, X, Info, Bird } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '../contexts/ChatContext'
import { useDocuments } from '../contexts/DocumentsContext'
import styles from './ChatView.module.css'

const sampleAnswer = `The chat workspace is ready for retrieval-augmented responses. When local AI processing is connected, answers will cite exact document chunks here.`

export default function ChatView() {
  const { activeConversation, sendMessage, updateConversationTitle } = useChat()
  const { documents } = useDocuments()
  const [draft, setDraft] = useState('')
  const [isInspectorOpen, setInspectorOpen] = useState(false)
  const [isScopeOpen, setScopeOpen] = useState(false)
  const [selectedScope, setSelectedScope] = useState('All documents')
  const [activeCitation, setActiveCitation] = useState(null)
  const scopeRef = useRef(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(activeConversation?.title || '')

  useEffect(() => {
    setTitleDraft(activeConversation?.title || '')
    setIsEditingTitle(false)
  }, [activeConversation?.id, activeConversation?.title])

  useEffect(() => {
    function handleClickOutside(event) {
      if (scopeRef.current && !scopeRef.current.contains(event.target)) {
        setScopeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation.messages])

  const submit = () => {
    if (!draft.trim()) return
    const targetDocIds = selectedScope === 'All documents'
      ? documents.map(d => d.id)
      : [documents.find(d => d.originalFilename === selectedScope)?.id].filter(Boolean)
    sendMessage(draft.trim(), targetDocIds)
    setDraft('')
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const handleCardClick = (promptText) => {
    setDraft(promptText)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
  }

  return (
    <div className={`${styles.chatGrid} ${isInspectorOpen ? '' : styles.collapsed}`}>
      <section className={styles.dialogue}>
        <header>
          <div>
            <p className={styles.eyebrow}>Local assistant</p>
            {isEditingTitle ? (
              <input
                type="text"
                className={styles.titleInput}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false)
                  if (titleDraft.trim()) {
                    updateConversationTitle(activeConversation.id, titleDraft.trim())
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false)
                    if (titleDraft.trim()) {
                      updateConversationTitle(activeConversation.id, titleDraft.trim())
                    }
                  } else if (e.key === 'Escape') {
                    setTitleDraft(activeConversation.title)
                    setIsEditingTitle(false)
                  }
                }}
                autoFocus
              />
            ) : (
              <h1 className={styles.titleText} onClick={() => setIsEditingTitle(true)} title="Click to rename">
                {activeConversation.title}
              </h1>
            )}
          </div>
          <div className={styles.headerActions}>
            <div ref={scopeRef} className={styles.scopeContainer}>
              <button className={styles.scope} onClick={() => setScopeOpen(!isScopeOpen)}>
                {selectedScope} <ChevronDown size={14} />
              </button>
              {isScopeOpen && (
                <div className={styles.scopeDropdown}>
                  <button 
                    onClick={() => { setSelectedScope('All documents'); setScopeOpen(false) }}
                    className={selectedScope === 'All documents' ? styles.activeScope : ''}
                  >
                    All documents
                  </button>
                  {documents.map((doc) => (
                    <button 
                      key={doc.id}
                      onClick={() => { setSelectedScope(doc.originalFilename); setScopeOpen(false) }}
                      className={selectedScope === doc.originalFilename ? styles.activeScope : ''}
                    >
                      {doc.originalFilename}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              className={`${styles.inspectorToggle} ${isInspectorOpen ? styles.toggleActive : ''}`} 
              onClick={() => setInspectorOpen(!isInspectorOpen)}
              title="Toggle Citation Inspector"
            >
              <Info size={15} /> Inspector
            </button>
          </div>
        </header>

        <div className={styles.messages}>
          {activeConversation?.messages?.length === 0 ? (
            <div className={styles.welcomeContainer}>
              <div className={styles.welcomeLogo}>
                <Bird size={28} />
                <h1>Canary</h1>
              </div>
              <h2 className={styles.welcomeTitle}>What would you like to analyze today?</h2>
              <p className={styles.welcomeSubtitle}>Ask questions, summarize key highlights, or inspect citations from your local document library.</p>
            </div>
          ) : (
            <>
              <div className={styles.spacer} />
              {activeConversation?.messages?.map((message) => (
                <article key={message.id} className={`${styles.message} ${styles[message.role]}`}>
                  {message.role === 'assistant' && !message.content ? (
                    <div className={styles.loadingDots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  {message.citations && message.citations.length > 0 && (
                    <div className={styles.citationList} style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      {message.citations.map((citation, idx) => (
                        <button
                          key={idx}
                          className={styles.citation}
                          onClick={() => {
                            setActiveCitation(citation)
                            setInspectorOpen(true)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          [{idx + 1}]
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.composer}>
          <div className={styles.composerContainer}>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about your documents..."
            />
            <div className={styles.composerActions}>
              <span>Enter to send · Shift+Enter for new line</span>
              <button className={styles.send} onClick={submit} aria-label="Send message">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className={styles.inspector}>
        <header>
          <h2>Citation Inspector</h2>
          <button onClick={() => setInspectorOpen(false)} aria-label="Close citation inspector">
            <X size={19} />
          </button>
        </header>
        <div className={styles.inspectorContent}>
          {activeCitation ? (
            <>
              <p className={styles.inspectorLabel}>Source document</p>
              <strong className={styles.source}>
                <FileText size={18} /> {
                  documents.find(d => d.id === activeCitation.document_id)?.originalFilename 
                  || activeCitation.document_id.substring(0, 8) + '...'
                }
              </strong>
              <p className={styles.inspectorLabel}>Chunk reference</p>
              <span className={styles.chunk}>Page {activeCitation.page} (Score: {
                activeCitation.combined_score 
                  ? activeCitation.combined_score.toFixed(2) 
                  : (activeCitation.score ? activeCitation.score.toFixed(2) : 'N/A')
              })</span>
              <p className={styles.inspectorLabel}>Retrieved excerpt</p>
              <blockquote>
                <p>{activeCitation.text}</p>
              </blockquote>
            </>
          ) : (
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Select a citation index from the chat messages to inspect the source context.</p>
          )}
        </div>
      </aside>
    </div>
  )
}
