'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

export default function Chat() {
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { sendMessage, isLoading, error } = useChat()

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Add loading indicator
    setMessages(prev => [...prev, {
      id: 'loading-' + Date.now(),
      role: 'assistant',
      content: 'Processing your request...',
      timestamp: new Date(),
      isLoading: true
    }])

    const response = await sendMessage(inputValue, conversationId)

    // Remove loading indicator
    setMessages(prev => prev.filter(m => !m.id.startsWith('loading-')))

    if (response) {
      setConversationId(response.conversation_id)
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } else if (error) {
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: `Error: ${error}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-slate-700/50 bg-gradient-to-r from-slate-800 via-purple-800/20 to-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5"></div>
        <div className="relative px-8 py-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-slate-900">✓</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Todo Assistant
              </h1>
            </div>
            <p className="text-slate-400 text-sm">AI-Powered Task Management Chat</p>
          </div>
          {conversationId && (
            <div className="bg-slate-700/50 backdrop-blur px-4 py-2 rounded-full border border-slate-600/50">
              <p className="text-xs text-slate-300">
                <span className="text-cyan-400 font-semibold">Chat #{conversationId}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area - Premium */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6 relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                <span className="text-5xl">💬</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-100 mb-3">Start Your Task Journey</h2>
            <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
              Begin by asking me to manage your tasks. Try "Show my tasks", "Add task: Learn something new", or "Complete all today's tasks".
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md">
              {[
                { icon: '📝', text: 'Add tasks' },
                { icon: '📋', text: 'View tasks' },
                { icon: '✔️', text: 'Complete tasks' },
                { icon: '🗑️', text: 'Delete tasks' }
              ].map((item) => (
                <div key={item.text} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 hover:bg-slate-700/50 transition">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-xs text-slate-300 mt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3 max-w-2xl`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-400 to-cyan-400'
                    : 'bg-gradient-to-br from-purple-400 to-pink-400'
                }`}>
                  <span className="text-sm">{msg.role === 'user' ? '👤' : '🤖'}</span>
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col gap-1">
                  <div
                    className={`px-5 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-none shadow-lg shadow-blue-500/20'
                        : msg.id.startsWith('error-')
                        ? 'bg-red-500/20 text-red-200 border border-red-500/50 rounded-bl-none backdrop-blur'
                        : msg.isLoading
                        ? 'bg-slate-700/50 text-slate-300 rounded-bl-none border border-slate-600/50 backdrop-blur'
                        : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100 border border-slate-600/50 rounded-bl-none shadow-lg shadow-purple-500/10'
                    }`}
                  >
                    <p className="break-words leading-relaxed text-sm">{msg.content}</p>
                  </div>
                  <span className={`text-xs px-1 ${
                    msg.role === 'user'
                      ? 'text-slate-400'
                      : msg.id.startsWith('error-')
                      ? 'text-red-400'
                      : 'text-slate-500'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Input Area */}
      <div className="border-t border-slate-700/50 bg-gradient-to-t from-slate-900 to-slate-800/50 backdrop-blur-xl p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm backdrop-blur">
            <span className="text-sm font-medium">⚠️ {error}</span>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tell me what to do with your tasks..."
              className="w-full bg-slate-700/50 border border-slate-600/50 backdrop-blur rounded-xl px-5 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition duration-200"
              disabled={isLoading}
            />
            {inputValue && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
                {inputValue.length} chars
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 hover:shadow-lg hover:shadow-cyan-500/50 disabled:shadow-none flex items-center gap-2 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <span className="animate-spin inline-block">⟳</span>
                <span className="hidden sm:inline">Processing</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Send</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>
        <p className="text-slate-500 text-xs mt-3 px-1">
          💡 Tip: Use natural language like "show", "add", "delete", or "complete" for best results
        </p>
      </div>
    </div>
  )
}
