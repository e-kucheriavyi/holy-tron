import { ActionType, type Mode, type ServerMessage } from './types.ts'

export type ConnectionStatus = 'connecting' | 'waiting' | 'connected' | 'closed' | 'error'
export interface Connection {
  send: (message: string) => void
  onMessage: (fn: (message: ServerMessage) => void) => void
  close: () => void
}
export type ConnectionOptions = {
  endpoint?: string
  nickname?: string
  mode?: Mode
  onStatus?: (status: ConnectionStatus) => void
}

export const createConnection = ({ endpoint = 'ws://localhost:2026', nickname = 'Pilot_01', mode = 'full', onStatus }: ConnectionOptions): Connection => {
  const url = new URL(endpoint)
  if (!['ws:', 'wss:'].includes(url.protocol)) throw new Error('Используй адрес ws:// или wss://')
  const ws = new WebSocket(url)
  let callback: ((message: ServerMessage) => void) | undefined
  let joined = false
  let intentional = false
  let retry: ReturnType<typeof setInterval> | undefined
  let timeout: ReturnType<typeof setTimeout> | undefined
  const clearTimers = () => { clearInterval(retry); clearTimeout(timeout) }
  const handshake = () => {
    if (ws.readyState === WebSocket.OPEN && !joined) ws.send(`${mode === 'full' ? 'f' : 't'}:${nickname}`)
  }
  onStatus?.('connecting')
  ws.addEventListener('open', () => {
    onStatus?.('waiting')
    handshake()
    // The workshop server accepts new pilots only during its pending phase.
    retry = setInterval(handshake, 1500)
  })
  timeout = setTimeout(() => {
    if (!joined) { clearTimers(); onStatus?.('error'); intentional = true; ws.close() }
  }, 45000)
  ws.addEventListener('message', event => {
    try {
      const message = JSON.parse(String(event.data)) as ServerMessage
      if (!Array.isArray(message.a) || !Number.isFinite(message.i)) return
      if (!joined && message.a.some(action => action.t === ActionType.DATA || action.t === ActionType.WELCOME)) {
        joined = true; clearTimers(); onStatus?.('connected')
      }
      callback?.(message)
    } catch { /* Ignore malformed packets; the next authoritative snapshot recovers the view. */ }
  })
  ws.addEventListener('error', () => { clearTimers(); if (!intentional) onStatus?.('error') })
  ws.addEventListener('close', () => { clearTimers(); if (!intentional) onStatus?.('closed') })
  return {
    send: message => { if (joined && ws.readyState === WebSocket.OPEN) ws.send(message) },
    onMessage: fn => { callback = fn },
    close: () => { intentional = true; clearTimers(); ws.close() },
  }
}
