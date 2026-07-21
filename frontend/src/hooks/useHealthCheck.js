import { useEffect, useState } from 'react'
import { getApiHealth } from '../services/api'

export default function useHealthCheck() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let isMounted = true
    const check = async () => {
      try {
        await getApiHealth()
        if (isMounted) setStatus('online')
      } catch {
        if (isMounted) setStatus('offline')
      }
    }
    check()
    const interval = window.setInterval(check, 30000)
    return () => { isMounted = false; window.clearInterval(interval) }
  }, [])

  return status
}
