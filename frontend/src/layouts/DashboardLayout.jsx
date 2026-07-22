import { useCallback, useEffect, useState } from 'react'
import { CircleUserRound, Wifi, Sun, Moon } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [isResizing, setIsResizing] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

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
            <CircleUserRound size={25} className={styles.profileIcon} />
          </div>
        </header>
        <div className={styles.workspaceContent}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
