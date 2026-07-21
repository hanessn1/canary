import { createContext, useContext, useMemo, useState } from 'react'
import { chatApi } from '../services/api'

const ChatContext = createContext(null)

const initialConversations = [
  {
    id: 'chat-1',
    title: 'Research strategy',
    messages: [
      { id: 'msg-1', role: 'assistant', content: 'Chat is ready for the local AI pipeline. Upload and process documents to begin grounded conversations.' }
    ]
  },
  {
    id: 'chat-2',
    title: 'Architecture review',
    messages: [
      { id: 'msg-2', role: 'assistant', content: "Let's review the architecture. This conversation will load specific context from your files." }
    ]
  },
  {
    id: 'chat-3',
    title: 'Security audit prep',
    messages: [
      { id: 'msg-3', role: 'assistant', content: 'Security audit context ready. Upload compliance reports to start the checklist.' }
    ]
  },
  {
    id: 'chat-4',
    title: 'Document ingestion plan',
    messages: [
      { id: 'msg-4', role: 'assistant', content: 'We can discuss Phase 2 and how the Python service processes raw file uploads.' }
    ]
  }
]

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeId, setActiveId] = useState('chat-1')

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
      messages: [
        { id: `msg-${crypto.randomUUID()}`, role: 'assistant', content: 'New grounded chat started. How can I help you analyze your documents?' }
      ]
    }
    setConversations((current) => [newChat, ...current])
    setActiveId(newId)
  }

  const deleteConversation = (id) => {
    setConversations((current) => {
      const remaining = current.filter((c) => c.id !== id)
      if (remaining.length === 0) {
        return [
          {
            id: `chat-${crypto.randomUUID()}`,
            title: 'New chat',
            messages: [
              { id: `msg-${crypto.randomUUID()}`, role: 'assistant', content: 'New grounded chat started. How can I help you analyze your documents?' }
            ]
          }
        ]
      }
      return remaining
    })

    if (activeId === id) {
      setConversations((current) => {
        const remaining = current.filter((c) => c.id !== id)
        if (remaining.length > 0) {
          setActiveId(remaining[0].id)
        }
        return current
      })
    }
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

  const value = useMemo(
    () => ({
      conversations,
      activeConversation,
      selectConversation,
      startNewChat,
      deleteConversation,
      sendMessage
    }),
    [conversations, activeConversation, activeId]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used inside ChatProvider')
  return context
}
