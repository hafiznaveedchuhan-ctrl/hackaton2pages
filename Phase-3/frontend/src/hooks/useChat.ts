import { useState } from 'react'
import { useAuth } from './useAuth'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  conversation_id: number
  response: string
  tool_calls: string[]
  status: string
}

export function useChat() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token, userId } = useAuth()

  const sendMessage = async (
    message: string,
    conversationId: number | null = null
  ): Promise<ChatResponse | null> => {
    setIsLoading(true)
    setError(null)

    // Validate auth
    if (!token || !userId) {
      setError('Not authenticated. Please sign in first.')
      setIsLoading(false)
      return null
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      const response = await fetch(`${apiUrl}/api/${userId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: message,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        const errorMessage = errorData.detail || `Server error: ${response.status}`
        setError(errorMessage)
        return null
      }

      const data: ChatResponse = await response.json()
      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error'
      setError(`Failed to send message: ${errorMsg}`)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sendMessage,
    isLoading,
    error,
  }
}
