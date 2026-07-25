import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { chatApi, getModels } from '../services/api'

const ChatContext = createContext(null)

const initialConversations = [
  {
    id: 'chat-1',
    title: 'New chat',
    messages: []
  }
]

function getStoredValue(key, fallback) {
  try {
    const item = localStorage.getItem(key)
    return item !== null ? JSON.parse(item) : fallback
  } catch (e) {
    return fallback
  }
}

function isLlmModelName(name) {
  if (!name) return false
  const lower = name.toLowerCase()
  return !(lower.includes('embed') || lower.includes('bge') || lower.includes('minilm'))
}

function isEmbeddingModelName(name) {
  if (!name) return false
  const lower = name.toLowerCase()
  return lower.includes('embed') || lower.includes('bge') || lower.includes('minilm')
}

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeId, setActiveId] = useState('chat-1')
  
  const [temperature, setTemperatureState] = useState(() => getStoredValue('canary_temperature', 0.3))
  const [topK, setTopKState] = useState(() => getStoredValue('canary_top_k', 5))
  const [similarityThreshold, setSimilarityThresholdState] = useState(() => getStoredValue('canary_similarity_threshold', 0.35))
  const [llmModel, setLlmModelState] = useState(() => getStoredValue('canary_llm_model', 'qwen2.5:3b'))
  const [embeddingModel, setEmbeddingModelState] = useState(() => getStoredValue('canary_embedding_model', 'nomic-embed-text'))
  
  const [availableModels, setAvailableModels] = useState([])
  const [isModelsLoading, setIsModelsLoading] = useState(true)

  const setLlmModel = (val) => {
    setLlmModelState(val)
    try { localStorage.setItem('canary_llm_model', JSON.stringify(val)) } catch (_) {}
  }

  const setEmbeddingModel = (val) => {
    setEmbeddingModelState(val)
    try { localStorage.setItem('canary_embedding_model', JSON.stringify(val)) } catch (_) {}
  }

  const refreshModels = useCallback(async () => {
    setIsModelsLoading(true)
    try {
      const models = await getModels()
      if (models && models.length > 0) {
        setAvailableModels(models)
        
        const llmMList = models.filter(isLlmModelName)
        if (!isLlmModelName(llmModel) || !models.includes(llmModel)) {
          if (llmMList.length > 0) {
            setLlmModel(llmMList[0])
          }
        }

        const embedMList = models.filter(isEmbeddingModelName)
        if (!isEmbeddingModelName(embeddingModel) || !models.includes(embeddingModel)) {
          if (embedMList.length > 0) {
            setEmbeddingModel(embedMList[0])
          }
        }
      } else {
        setAvailableModels([])
      }
    } catch (_) {
      setAvailableModels([])
    } finally {
      setIsModelsLoading(false)
    }
  }, [llmModel, embeddingModel])

  useEffect(() => {
    refreshModels()
  }, [])

  const hasLlmModel = useMemo(() => {
    return availableModels.some(isLlmModelName)
  }, [availableModels])

  const setTemperature = (val) => {
    setTemperatureState(val)
    try { localStorage.setItem('canary_temperature', JSON.stringify(val)) } catch (_) {}
  }

  const setTopK = (val) => {
    setTopKState(val)
    try { localStorage.setItem('canary_top_k', JSON.stringify(val)) } catch (_) {}
  }

  const setSimilarityThreshold = (val) => {
    setSimilarityThresholdState(val)
    try { localStorage.setItem('canary_similarity_threshold', JSON.stringify(val)) } catch (_) {}
  }

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeId) || conversations[0]
  }, [conversations, activeId])

  const selectConversation = (id) => {
    setActiveId(id)
  }

  const startNewChat = () => {
    const newId = `chat-${crypto.randomUUID()}`
    const newChat = {
      id: newId,
      title: `New chat ${conversations.length + 1}`,
      messages: []
    }
    setConversations((current) => [newChat, ...current])
    setActiveId(newId)
  }

  const deleteConversation = (id) => {
    setConversations((current) => {
      const remaining = current.filter((c) => c.id !== id)
      if (remaining.length === 0) {
        const newId = `chat-${crypto.randomUUID()}`
        setActiveId(newId)
        return [
          {
            id: newId,
            title: 'New chat',
            messages: []
          }
        ]
      }
      if (activeId === id) {
        setActiveId(remaining[0].id)
      }
      return remaining
    })
  }

  const sendMessage = async (content, documentIds = []) => {
    const targetChatId = activeId
    const userMsgId = crypto.randomUUID()
    const assistantMsgId = crypto.randomUUID()

    setConversations((current) =>
      current.map((chat) => {
        if (chat.id === targetChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              { id: userMsgId, role: 'user', content },
              { id: assistantMsgId, role: 'assistant', content: '', citations: [] }
            ]
          }
        }
        return chat
      })
    )

    const targetConv = conversations.find((c) => c.id === targetChatId) || activeConversation
    const history = (targetConv?.messages || [])
      .filter(m => m.id !== userMsgId && m.id !== assistantMsgId && (m.role === 'user' || m.role === 'assistant'))
      .map(m => ({ role: m.role, content: m.content }))

    try {
      await chatApi.chatStream(
        content,
        documentIds || [],
        history,
        temperature,
        topK,
        similarityThreshold,
        llmModel,
        (chunk) => {
          setConversations((current) =>
            current.map((chat) => {
              if (chat.id === targetChatId) {
                return {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg
                  )
                }
              }
              return chat
            })
          )
        },
        (citations) => {
          setConversations((current) =>
            current.map((chat) => {
              if (chat.id === targetChatId) {
                return {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, citations } : msg
                  )
                }
              }
              return chat
            })
          )
        }
      )
    } catch (err) {
      setConversations((current) =>
        current.map((chat) => {
          if (chat.id === targetChatId) {
            return {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: `Error: ${err.message || 'Could not get response from local AI.'}` }
                  : msg
              )
            }
          }
          return chat
        })
      )
    }
  }

  const updateConversationTitle = (id, newTitle) => {
    setConversations((current) =>
      current.map((chat) =>
        chat.id === id ? { ...chat, title: newTitle } : chat
      )
    )
  }

  const value = useMemo(
    () => ({
      conversations,
      activeConversation,
      selectConversation,
      startNewChat,
      deleteConversation,
      sendMessage,
      updateConversationTitle,
      temperature,
      setTemperature,
      topK,
      setTopK,
      similarityThreshold,
      setSimilarityThreshold,
      llmModel,
      setLlmModel,
      embeddingModel,
      setEmbeddingModel,
      availableModels,
      hasLlmModel,
      isModelsLoading,
      refreshModels
    }),
    [conversations, activeConversation, activeId, temperature, topK, similarityThreshold, llmModel, embeddingModel, availableModels, hasLlmModel, isModelsLoading, refreshModels]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used inside ChatProvider')
  return context
}
