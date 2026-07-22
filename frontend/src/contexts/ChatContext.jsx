import { createContext, useContext, useMemo, useState } from 'react'
import { chatApi } from '../services/api'

const ChatContext = createContext(null)

const initialConversations = [
  {
    id: 'chat-1',
    title: 'New chat',
    messages: []
  }
]

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeId, setActiveId] = useState('chat-1')
  const [temperature, setTemperature] = useState(0.2)
  const [topK, setTopK] = useState(6)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.78)

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
    if (!documentIds || documentIds.length === 0) {
      setConversations((current) =>
        current.map((chat) => {
          if (chat.id === activeId) {
            return {
              ...chat,
              messages: [
                ...chat.messages,
                { id: crypto.randomUUID(), role: 'user', content },
                { id: crypto.randomUUID(), role: 'assistant', content: 'Please upload and select at least one document to chat.' }
              ]
            }
          }
          return chat
        })
      )
      return
    }

    const userMsgId = crypto.randomUUID()
    const assistantMsgId = crypto.randomUUID()
    setConversations((current) =>
      current.map((chat) => {
        if (chat.id === activeId) {
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

    const history = activeConversation.messages
      .filter(m => m.id !== userMsgId && m.id !== assistantMsgId && (m.role === 'user' || m.role === 'assistant'))
      .map(m => ({ role: m.role, content: m.content }))

    try {
      await chatApi.chatStream(
        content,
        documentIds,
        history,
        temperature,
        topK,
        similarityThreshold,
        (chunk) => {
          setConversations((current) =>
            current.map((chat) => {
              if (chat.id === activeId) {
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
              if (chat.id === activeId) {
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
          if (chat.id === activeId) {
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
      setSimilarityThreshold
    }),
    [conversations, activeConversation, activeId, temperature, topK, similarityThreshold]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used inside ChatProvider')
  return context
}
