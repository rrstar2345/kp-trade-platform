import { useEffect, useRef, useCallback, useState } from 'react'
import type { WsMessage } from '@/types'

type Handler = (msg: WsMessage) => void

/** Option A: callback-based */
export function useWebSocket(onMessage: Handler): void
/** Option B: returns lastMessage string for manual parsing */
export function useWebSocket(pathOrVoid?: string): { lastMessage: string | null }

export function useWebSocket(arg?: Handler | string): void | { lastMessage: string | null } {
  const isCallbackMode = typeof arg === 'function'
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const handlerRef = useRef<Handler | null>(isCallbackMode ? arg : null)
  if (isCallbackMode) handlerRef.current = arg

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${protocol}://${window.location.host}/ws`
    const ws = new WebSocket(url)

    ws.onmessage = (event) => {
      if (isCallbackMode) {
        try {
          const msg = JSON.parse(event.data) as WsMessage
          handlerRef.current?.(msg)
        } catch { /* ignore */ }
      } else {
        setLastMessage(event.data)
      }
    }

    ws.onclose = () => {
      setTimeout(connect, 3_000)
    }

    wsRef.current = ws
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    connect()
    return () => { wsRef.current?.close() }
  }, [connect])

  if (!isCallbackMode) return { lastMessage }
}