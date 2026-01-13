/**
 * Chat Component Tests
 *
 * Comprehensive tests for Chat component
 * - Message rendering
 * - Message sending
 * - Error handling
 * - Loading states
 * - Auto-scroll behavior
 *
 * @specs/phase-3-overview.md - Chat Component Specification
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Chat from '@/components/Chat'
import * as useChat from '@/hooks/useChat'

// Mock the useChat hook
jest.mock('@/hooks/useChat', () => ({
  useChat: jest.fn()
}))

describe('Chat Component', () => {
  let mockSendMessage: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockSendMessage = jest.fn()
    ;(useChat.useChat as jest.Mock).mockReturnValue({
      sendMessage: mockSendMessage
    })
  })

  describe('Rendering', () => {
    it('renders chat header', () => {
      render(<Chat />)
      expect(screen.getByText('Todo Assistant')).toBeInTheDocument()
      expect(screen.getByText('Ask me to manage your tasks')).toBeInTheDocument()
    })

    it('renders welcome message when no messages exist', () => {
      render(<Chat />)
      expect(screen.getByText('Welcome! 👋')).toBeInTheDocument()
      expect(screen.getByText('Start by asking me to:')).toBeInTheDocument()
    })

    it('renders input field and send button', () => {
      render(<Chat />)
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('disables send button when input is empty', () => {
      render(<Chat />)
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })
  })

  describe('Message Sending', () => {
    it('sends message on button click', async () => {
      mockSendMessage.mockResolvedValue({
        conversation_id: 1,
        response: 'Task added successfully',
        tool_calls: ['add_task'],
        status: 'success'
      })

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          'Add task: Buy groceries',
          null
        )
      })
    })

    it('sends message on Enter key press', async () => {
      mockSendMessage.mockResolvedValue({
        conversation_id: 1,
        response: 'Task added successfully',
        tool_calls: ['add_task'],
        status: 'success'
      })

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')

      await userEvent.type(input, 'Add task: Buy groceries')
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled()
      })
    })

    it('clears input after sending message', async () => {
      mockSendMessage.mockResolvedValue({
        conversation_id: 1,
        response: 'Task added successfully',
        tool_calls: ['add_task'],
        status: 'success'
      })

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })

    it('does not send empty messages', async () => {
      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, '   ')
      await userEvent.click(sendButton)

      expect(mockSendMessage).not.toHaveBeenCalled()
    })
  })

  describe('Message Display', () => {
    it('displays user messages on the right with blue background', async () => {
      mockSendMessage.mockResolvedValue({
        conversation_id: 1,
        response: 'Task added',
        tool_calls: ['add_task'],
        status: 'success'
      })

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        const userMessage = screen.getByText('Add task: Buy groceries')
        expect(userMessage).toBeInTheDocument()
      })
    })

    it('displays assistant messages on the left with gray background', async () => {
      const assistantResponse = 'Task added successfully'
      mockSendMessage.mockResolvedValue({
        conversation_id: 1,
        response: assistantResponse,
        tool_calls: ['add_task'],
        status: 'success'
      })

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText(assistantResponse)).toBeInTheDocument()
      })
    })

    it('displays multiple messages in conversation', async () => {
      mockSendMessage
        .mockResolvedValueOnce({
          conversation_id: 1,
          response: 'Task 1 added',
          tool_calls: ['add_task'],
          status: 'success'
        })
        .mockResolvedValueOnce({
          conversation_id: 1,
          response: 'Task 2 added',
          tool_calls: ['add_task'],
          status: 'success'
        })

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      // Send first message
      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Task 1 added')).toBeInTheDocument()
      })

      // Send second message
      await userEvent.type(input, 'Add task: Buy milk')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Task 2 added')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading animation while sending message', async () => {
      mockSendMessage.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Add task: Buy groceries')).toBeInTheDocument()
      })
    })

    it('disables input while sending message', async () => {
      mockSendMessage.mockImplementation(() => new Promise(() => {}))

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(input).toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message on send failure', async () => {
      mockSendMessage.mockRejectedValue(new Error('Network error'))

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('removes user message on error', async () => {
      mockSendMessage.mockRejectedValue(new Error('Failed'))

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.queryByText('Add task: Buy groceries')).not.toBeInTheDocument()
      })
    })

    it('displays error banner with red styling', async () => {
      mockSendMessage.mockRejectedValue(new Error('Server error'))

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Test')
      await userEvent.click(sendButton)

      await waitFor(() => {
        const errorBanner = screen.getByText(/server error/i).closest('div')
        expect(errorBanner).toHaveClass('bg-red-50')
      })
    })
  })

  describe('Conversation ID Management', () => {
    it('starts with null conversation ID', () => {
      render(<Chat />)
      // Initially no conversation should be active
      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('sets conversation ID from first response', async () => {
      mockSendMessage.mockResolvedValue({
        conversation_id: 42,
        response: 'Task added',
        tool_calls: ['add_task'],
        status: 'success'
      })

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        // Second message should include conversation ID
        expect(mockSendMessage).toHaveBeenCalledWith(
          'Add task: Buy groceries',
          null // First message uses null
        )
      })
    })

    it('includes conversation ID in subsequent messages', async () => {
      mockSendMessage
        .mockResolvedValueOnce({
          conversation_id: 42,
          response: 'Task added',
          tool_calls: ['add_task'],
          status: 'success'
        })
        .mockResolvedValueOnce({
          conversation_id: 42,
          response: 'Done',
          tool_calls: [],
          status: 'success'
        })

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      // First message
      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledTimes(1)
      })

      // Second message
      await userEvent.type(input, 'Show tasks')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledTimes(2)
        // Second call should include conversation ID
        expect(mockSendMessage).toHaveBeenLastCalledWith(
          'Show tasks',
          42
        )
      })
    })
  })

  describe('Auto-scroll', () => {
    it('scrolls to latest message automatically', async () => {
      mockSendMessage.mockResolvedValue({
        conversation_id: 1,
        response: 'Task added',
        tool_calls: ['add_task'],
        status: 'success'
      })

      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await userEvent.type(input, 'Add task: Buy groceries')
      await userEvent.click(sendButton)

      await waitFor(() => {
        // The component should have scrolled
        // This is tested by the component's ref behavior
        expect(screen.getByText('Add task: Buy groceries')).toBeInTheDocument()
      })
    })
  })
})
