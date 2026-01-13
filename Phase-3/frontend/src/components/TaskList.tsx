'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { tasksClient, Task } from '@/lib/tasks-client'

interface TaskListProps {
  refreshTrigger?: number
}

export default function TaskList({ refreshTrigger }: TaskListProps) {
  const { userId, isAuthenticated } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch tasks on mount and when auth changes or refresh is triggered
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchTasks()
    }
  }, [isAuthenticated, userId, refreshTrigger])

  const fetchTasks = async () => {
    if (!userId) return

    setLoading(true)
    setError('')

    try {
      const data = await tasksClient.getTasks(userId)
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (taskId: number) => {
    if (!userId) return

    setActionLoading(taskId)

    try {
      const updated = await tasksClient.completeTask(userId, taskId)
      setTasks(tasks.map(t => t.id === taskId ? updated : t))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (taskId: number) => {
    if (!userId) return

    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    setActionLoading(taskId)

    try {
      await tasksClient.deleteTask(userId, taskId)
      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    } finally {
      setActionLoading(null)
    }
  }

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white/60">Please sign in to view your tasks</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          <p className="text-white/60">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden shadow-2xl">
      {/* Header with Search */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">📋 Task Manager</h3>
          <button
            onClick={fetchTasks}
            disabled={actionLoading !== null}
            className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          {searchTerm && (
            <span className="absolute right-3 top-3 px-2 py-1 text-xs font-semibold bg-fuchsia-500 text-white rounded">
              Search Mode Activated
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {tasks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/60 text-lg">No tasks yet. Create one to get started!</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/60 text-lg">No tasks found matching "{searchTerm}"</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-600/40 to-purple-500/40 border-b border-purple-400/30">
                <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                  Task Description
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredTasks.map((task, index) => (
                <tr
                  key={task.id}
                  className={`${
                    index % 2 === 0
                      ? 'bg-purple-900/20'
                      : 'bg-purple-800/10'
                  } hover:bg-purple-700/30 transition`}
                >
                  {/* Task Description */}
                  <td className="px-6 py-4">
                    <div>
                      <p className={`text-sm font-semibold ${task.completed ? 'text-white/50 line-through' : 'text-white'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-white/40 mt-1">{task.description}</p>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        task.completed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {task.completed ? '✓ Completed' : '⏳ Pending'}
                    </span>
                  </td>

                  {/* Created Date */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-white/60">
                      {new Date(task.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Complete Button */}
                      <button
                        onClick={() => handleComplete(task.id)}
                        disabled={actionLoading === task.id || task.completed}
                        className={`p-2 rounded-lg transition ${
                          task.completed
                            ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-400/30'
                        } disabled:opacity-50`}
                        title={task.completed ? 'Completed' : 'Mark as complete'}
                      >
                        ✓
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(task.id)}
                        disabled={actionLoading === task.id}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-400/30 transition disabled:opacity-50"
                        title="Delete task"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>
            Total: <strong className="text-white">{tasks.length}</strong> tasks
          </span>
          <span>
            Completed: <strong className="text-emerald-400">{tasks.filter(t => t.completed).length}</strong> |
            Pending: <strong className="text-amber-400"> {tasks.filter(t => !t.completed).length}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
