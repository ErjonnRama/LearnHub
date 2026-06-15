import { useEffect, useRef, useCallback } from 'react'
import { useNotifStore } from '../store/store'

export function useNotificationSocket(userId: number | undefined) {
  const ws = useRef<WebSocket | null>(null)
  const { addNotification } = useNotifStore()

  useEffect(() => {
    if (!userId) return

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      ws.current = new WebSocket(`${protocol}://${window.location.host}/ws/notifications/${userId}`)

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          addNotification({ ...data, id: Date.now(), is_read: false, created_at: new Date().toISOString() })
        } catch {}
      }

      ws.current.onclose = () => {
        setTimeout(connect, 3000) // reconnect
      }
    }

    connect()
    return () => ws.current?.close()
  }, [userId])
}

export function useChatSocket(roomId: number | null, userId: number | undefined) {
  const ws = useRef<WebSocket | null>(null)
  const listeners = useRef<((msg: any) => void)[]>([])

  const sendMessage = useCallback((content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ content }))
    }
  }, [])

  const onMessage = useCallback((cb: (msg: any) => void) => {
    listeners.current.push(cb)
    return () => {
      listeners.current = listeners.current.filter((l) => l !== cb)
    }
  }, [])

  useEffect(() => {
    if (!roomId || !userId) return

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    ws.current = new WebSocket(
      `${protocol}://${window.location.host}/ws/chat/${roomId}?user_id=${userId}`
    )

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        listeners.current.forEach((l) => l(data))
      } catch {}
    }

    return () => ws.current?.close()
  }, [roomId, userId])

  return { sendMessage, onMessage }
}
