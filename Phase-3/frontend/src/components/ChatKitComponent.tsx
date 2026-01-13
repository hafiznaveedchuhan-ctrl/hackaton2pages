'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import axios from 'axios'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: string[]
  timestamp: Date
}

interface Conversation {
  id: number
  createdAt: Date
  messageCount: number
}

export default function ChatKitComponent() {
  const router = useRouter()
  const { isAuthenticated, isLoading, userName, user, logout } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadConversations()
    }
  }, [isAuthenticated, user?.id])

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token || !user?.id) return

      const response = await axios.get(
        `${API_URL}/api/${user.id}/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const convList = response.data.conversations.map((conv: any) => ({
        id: conv.id,
        createdAt: new Date(conv.created_at),
        messageCount: conv.message_count,
        preview: conv.preview
      }))
      setConversations(convList)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadConversationMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token || !user?.id) return

      const response = await axios.get(
        `${API_URL}/api/${user.id}/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const msgs = response.data.messages.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }))
      setMessages(msgs)
      setCurrentConversationId(conversationId)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const createNewConversation = () => {
    setMessages([])
    setCurrentConversationId(null)
    setInputValue('')
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !isAuthenticated || !user?.id) return

    const messageContent = inputValue.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await axios.post(
        `${API_URL}/api/${user.id}/chat`,
        {
          message: messageContent,
          conversation_id: currentConversationId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      setCurrentConversationId(response.data.conversation_id)

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.response,
        toolCalls: response.data.tool_calls,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Refresh conversations list to show new/updated conversation
      loadConversations()
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    // For GitHub Pages, detect basePath from current URL
    const currentPath = window.location.pathname
    const basePath = currentPath.includes('/hackaton2pages') ? '/hackaton2pages' : ''
    window.location.href = `${basePath}/`
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <span className="text-lg font-bold text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4 bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">🤖 AI Chat</h1>
          <p className="text-gray-600">Please sign in to use the chatbot</p>
          <Link
            href="/signin"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-white border-r border-gray-200 overflow-y-auto flex flex-col shadow-lg`}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🤖 AI Chat
          </h2>
        </div>

        <div className="p-4 flex-1">
          <button
            onClick={createNewConversation}
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition"
          >
            + New Chat
          </button>

          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-2">
              Recent Chats
            </h3>
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <p className="text-xs text-gray-400 px-2 py-3">No conversations yet</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversationMessages(conv.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      currentConversationId === conv.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <p className="text-sm truncate">Chat {conv.id}</p>
                    <p className="text-xs text-gray-500">{conv.messageCount} messages</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer with Navigation */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Home
          </Link>
          <div className="pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-500">Logged in as</p>
            <p className="font-semibold text-gray-800 truncate">{userName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white shadow-sm h-16 flex items-center px-6 justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Todo Assistant
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium transition text-sm"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition text-sm"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 bg-white rounded-2xl shadow-lg p-8 max-w-md">
                <div className="text-5xl">💬</div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Start a conversation
                </h2>
                <p className="text-gray-600">
                  Ask me to help you manage your tasks. Try:
                </p>
                <div className="text-left bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-700">📝 "Add task: Complete Phase-3"</p>
                  <p className="text-sm text-gray-700">📋 "Show my tasks"</p>
                  <p className="text-sm text-gray-700">✅ "Mark task 1 as complete"</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl shadow-md ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className={`mt-2 pt-2 border-t ${message.role === 'user' ? 'border-white/30' : 'border-gray-200'}`}>
                        <p className={`text-xs font-semibold ${message.role === 'user' ? 'text-white/80' : 'text-gray-500'}`}>
                          Used tools:
                        </p>
                        <ul className="text-xs space-y-1 mt-1">
                          {message.toolCalls.map((tool) => (
                            <li key={tool} className={`flex items-center gap-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-600'}`}>
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              {tool}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <time className={`text-xs mt-2 block ${message.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="border-t border-gray-200 bg-white shadow-lg p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message... (e.g., 'Add task: Buy groceries')"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 transition"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
