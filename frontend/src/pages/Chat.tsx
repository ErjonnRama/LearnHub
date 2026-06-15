import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Wifi } from 'lucide-react'
import { useAuthStore } from '../store/store'
import { useChatSocket } from '../hooks/useWebSocket'
import { format } from 'date-fns'

interface Message {
  type: string
  room_id?: number
  sender_id?: number
  content: string
  timestamp: string
  message?: string
}

export default function Chat() {
  const { user } = useAuthStore()
  const [roomId] = useState(1)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { sendMessage, onMessage } = useChatSocket(roomId, user?.id)

  useEffect(() => {
    const unsub = onMessage((msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })
    setConnected(true)
    return unsub
  }, [onMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-400 font-medium mb-2">Live</p>
          <h1 className="heading-display font-bold text-4xl tracking-tight">Community chat</h1>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-ink-400'}`} />
          {connected ? 'Connected' : 'Connecting…'}
        </span>
      </div>

      <div className="card overflow-hidden">
        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-cream-50/40">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-ink-200 mb-4" />
              <p className="heading-display text-lg font-semibold text-ink-700">Start the conversation</p>
              <p className="text-sm text-ink-400 mt-1">Be the first to say hi</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id
            const isSystem = msg.type === 'system'
            if (isSystem) {
              return (
                <div key={i} className="text-center text-xs text-ink-400 py-1">
                  {msg.message}
                </div>
              )
            }
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-sm ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isMe && (
                    <span className="text-xs text-ink-400 ml-1">User {msg.sender_id}</span>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-night text-white rounded-br-sm'
                      : 'bg-surface border border-ink-100 text-ink-800 rounded-bl-sm shadow-soft'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-ink-400 px-1">
                    {format(new Date(msg.timestamp), 'HH:mm')}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-ink-100 p-4 bg-surface">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message…"
              className="input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="btn btn-primary aspect-square !p-0 w-12 h-12"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
