/**
 * Chat API Client
 *
 * Handles communication with backend chat endpoint
 * Manages token-based authentication and request formatting
 *
 * @specs/phase-3-overview.md - Chat API Client Specification
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ChatRequest {
  conversation_id: number | null
  message: string
}

export interface ChatResponse {
  conversation_id: number
  response: string
  tool_calls: string[]
  status: string
}

class ChatClient {
  /**
   * Send message to chat endpoint
   * @param userId User ID
   * @param request Chat request with message and optional conversation ID
   * @param token JWT authentication token
   * @returns Chat response from server
   */
  async sendMessage(
    userId: number,
    request: ChatRequest,
    token: string
  ): Promise<ChatResponse> {
    const response = await fetch(`${API_URL}/api/${userId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || `Chat request failed: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get conversation history
   * @param userId User ID
   * @param conversationId Conversation ID
   * @param token JWT authentication token
   * @returns List of messages in conversation
   */
  async getConversationHistory(
    userId: number,
    conversationId: number,
    token: string
  ): Promise<any[]> {
    const response = await fetch(
      `${API_URL}/api/${userId}/conversations/${conversationId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || `Failed to fetch conversation: ${response.status}`)
    }

    return response.json()
  }

  /**
   * List all conversations for user
   * @param userId User ID
   * @param token JWT authentication token
   * @returns List of conversations
   */
  async listConversations(userId: number, token: string): Promise<any[]> {
    const response = await fetch(`${API_URL}/api/${userId}/conversations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || `Failed to list conversations: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Delete conversation
   * @param userId User ID
   * @param conversationId Conversation ID
   * @param token JWT authentication token
   * @returns Success status
   */
  async deleteConversation(
    userId: number,
    conversationId: number,
    token: string
  ): Promise<{ status: string }> {
    const response = await fetch(
      `${API_URL}/api/${userId}/conversations/${conversationId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || `Failed to delete conversation: ${response.status}`)
    }

    return response.json()
  }
}

export const chatClient = new ChatClient()
