import { useCallback, useEffect, useState } from 'react'
import { CircleUserRound, Wifi } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [isResizing, setIsResizing] = useState(false)

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
      <Sidebar />
      <div 
        className={`${styles.resizer} ${isResizing ? styles.resizerActive : ''}`} 
        onMouseDown={startResize} 
      />
      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.workspace}><Wifi size={14} /> Local workspace</span>
          <CircleUserRound size={25} />
        </header>
        <div className={styles.workspaceContent}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
