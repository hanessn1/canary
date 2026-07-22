import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleUserRound, Wifi, Sun, Moon, User, X } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import styles from './DashboardLayout.module.css'

function ProfileCard({ onClose }) {
  const [name, setName] = useState(() => localStorage.getItem('profileName') || '')
  const [draft, setDraft] = useState(name)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const save = () => {
    const trimmed = draft.trim()
    setName(trimmed)
    localStorage.setItem('profileName', trimmed)
    onClose()
  }

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileCardHeader}>
        <span>Profile</span>
        <button className={styles.profileCardClose} onClick={onClose} aria-label="Close profile">
          <X size={14} />
        </button>
      </div>
      <div className={styles.profileCardAvatar}>
        <div className={styles.avatarCircle}>
          {draft.trim() ? draft.trim()[0].toUpperCase() : <User size={20} />}
        </div>
      </div>
      <label className={styles.profileCardLabel}>
        Display name
        <input
          ref={inputRef}
          className={styles.profileCardInput}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save() }}
          placeholder="Enter your name…"
          maxLength={40}
        />
      </label>
      <button className={styles.profileCardSave} onClick={save}>
        Save
      </button>
    </div>
  )
}

export default function DashboardLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [isResizing, setIsResizing] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const profileName = localStorage.getItem('profileName') || ''

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Close profile card on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [profileOpen])

  const startResize = useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault()
    setIsResizing(true)
  }, [])

  const resize = useCallback((mouseMoveEvent) => {
    if (isResizing) {
      const newWidth = mouseMoveEvent.clientX
      if (newWidth > 180 && newWidth < 400) {
        setSidebarWidth(newWidth)
      }
    }
  }, [isResizing])

  const stopResize = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize)
      window.addEventListener('mouseup', stopResize)
    }
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResize)
    }
  }, [isResizing, resize, stopResize])

  return (
    <div className={styles.appShell} style={{ gridTemplateColumns: `${sidebarWidth}px 4px minmax(0, 1fr)` }}>
      <Sidebar theme={theme} setTheme={setTheme} />
      <div
        className={`${styles.resizer} ${isResizing ? styles.resizerActive : ''}`}
        onMouseDown={startResize}
      />
      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.workspace}><Wifi size={14} /> Local workspace</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={styles.themeToggle}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Profile button + dropdown */}
            <div className={styles.profileWrapper} ref={profileRef}>
              <button
                className={styles.profileBtn}
                onClick={() => setProfileOpen((v) => !v)}
                title="Profile"
                aria-label="Open profile"
              >
                {profileName
                  ? <span className={styles.profileInitial}>{profileName[0].toUpperCase()}</span>
                  : <CircleUserRound size={25} />
                }
              </button>
              {profileOpen && (
                <ProfileCard onClose={() => setProfileOpen(false)} />
              )}
            </div>
          </div>
        </header>
        <div className={styles.workspaceContent}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
