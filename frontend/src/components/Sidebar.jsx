import { useState, useEffect } from 'react'
import { Activity, Bird, Bot, BookOpen, MessageSquare, Settings, Plus, Trash2, Sun, Moon } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import useHealthCheck from '../hooks/useHealthCheck'
import { useChat } from '../contexts/ChatContext'
import { getModels } from '../services/api'
import styles from './Sidebar.module.css'

const navigation = [
  { to: '/library', label: 'Library', icon: BookOpen },
  { to: '/chat', label: 'Chat Assistant', icon: MessageSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ theme, setTheme }) {
  const apiStatus = useHealthCheck()
  const { conversations, activeConversation, selectConversation, startNewChat, deleteConversation } = useChat()
  const navigate = useNavigate()
  const [ollamaOnline, setOllamaOnline] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState('Checking')

  useEffect(() => {
    if (apiStatus === 'online') {
      getModels()
        .then((models) => {
          if (models && models.length > 0) {
            setOllamaOnline(true)
            setOllamaStatus('Online')
          } else {
            setOllamaOnline(false)
            setOllamaStatus('Offline')
          }
        })
        .catch(() => {
          setOllamaOnline(false)
          setOllamaStatus('Offline')
        })
    } else if (apiStatus === 'offline') {
      setOllamaOnline(false)
      setOllamaStatus('Offline')
    }
  }, [apiStatus])

  const handleChatClick = (id) => {
    selectConversation(id)
    navigate('/chat')
  }

  const handleNewChat = () => {
    startNewChat()
    navigate('/chat')
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}><span className={styles.brandMark}><Bird size={29} /></span><span>Canary</span></div>
      <nav className={styles.nav} aria-label="Main navigation">
        {navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}><Icon size={19} />{label}</NavLink>)}
      </nav>
      {conversations.length > 0 && (
        <div className={styles.chats}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Active chats</p>
            <button className={styles.addChatBtn} onClick={handleNewChat} title="New chat">
              <Plus size={14} />
            </button>
          </div>
          <div className={styles.chatsList}>
            {conversations.map((chat) => {
              const isActive = chat.id === activeConversation?.id
              return (
                <div key={chat.id} className={`${styles.chatRow} ${isActive ? styles.activeChatRow : ''}`}>
                  <span onClick={() => handleChatClick(chat.id)} className={styles.chatLink}>
                    <MessageSquare size={14} /> {chat.title}
                  </span>
                  <button 
                    className={styles.deleteChatBtn} 
                    onClick={(e) => { e.stopPropagation(); deleteConversation(chat.id); }} 
                    title="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div className={styles.health}>
        <p className={styles.sectionLabel}><Activity size={14} /> System health</p>
        <HealthLine label="API" value={apiStatus === 'checking' ? 'Checking' : apiStatus === 'online' ? 'Online' : 'Offline'} online={apiStatus === 'online'} />
        <HealthLine label="Ollama" value={ollamaStatus} online={ollamaOnline} />
      </div>
    </aside>
  )
}

function HealthLine({ label, value, online, icon }) {
  return <div className={styles.healthLine}>{icon ?? <span className={`${styles.dot} ${online ? styles.online : ''}`} />}<span>{label}</span><small>{value}</small></div>
}
