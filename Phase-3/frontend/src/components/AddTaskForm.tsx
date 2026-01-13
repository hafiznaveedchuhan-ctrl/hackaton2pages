'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { tasksClient } from '@/lib/tasks-client'

interface AddTaskFormProps {
  onTaskAdded?: () => void
}

export default function AddTaskForm({ onTaskAdded }: AddTaskFormProps) {
  const { userId, isAuthenticated } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!isAuthenticated || !userId) {
      setError('Please sign in first')
      setLoading(false)
      return
    }

    if (!title.trim()) {
      setError('Task title is required')
      setLoading(false)
      return
    }

    try {
      await tasksClient.createTask(userId, {
        title: title.trim(),
        description: description.trim() || undefined
      })

      setSuccess('Task created successfully!')
      setTitle('')
      setDescription('')

      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(''), 2000)

      // Notify parent component
      onTaskAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold">Add New Task</h3>

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-200">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="text"
          placeholder="Task title (required)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading || !isAuthenticated}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
        />

        <textarea
          placeholder="Task description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading || !isAuthenticated}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50 resize-none"
        />

        <button
          type="submit"
          disabled={loading || !isAuthenticated}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </div>
  )
}
