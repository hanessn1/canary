import { Activity, Bird, Bot, BookOpen, MessageSquare, Settings, Plus, Trash2 } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import useHealthCheck from '../hooks/useHealthCheck'
import { useChat } from '../contexts/ChatContext'
import styles from './Sidebar.module.css'

const navigation = [
  { to: '/library', label: 'Library', icon: BookOpen },
  { to: '/chat', label: 'Chat Assistant', icon: MessageSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const apiStatus = useHealthCheck()
  const { conversations, selectConversation, startNewChat, deleteConversation } = useChat()
  const navigate = useNavigate()

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
            {conversations.map((chat) => (
              <div key={chat.id} className={styles.chatRow}>
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
            ))}
          </div>
        </div>
      )}
      <div className={styles.health}>
        <p className={styles.sectionLabel}><Activity size={14} /> System health</p>
        <HealthLine label="API" value={apiStatus === 'checking' ? 'Checking' : apiStatus === 'online' ? 'Online' : 'Offline'} online={apiStatus === 'online'} />
        <HealthLine label="Ollama" value="Not configured" online={false} icon={<Bot size={15} />} />
      </div>
    </aside>
  )
}

function HealthLine({ label, value, online, icon }) {
  return <div className={styles.healthLine}>{icon ?? <span className={`${styles.dot} ${online ? styles.online : ''}`} />}<span>{label}</span><small>{value}</small></div>
}
