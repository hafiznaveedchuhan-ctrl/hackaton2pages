'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AddTaskForm from '@/components/AddTaskForm'
import TaskList from '@/components/TaskList'
import Link from 'next/link'

export default function TasksPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleTaskAdded = () => {
    // Trigger TaskList to refresh
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Task Manager
              </h1>
              <p className="mt-2 text-sm text-white/60">Manage your todos with professional table view</p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/chat"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition"
              >
                💬 AI Chat
              </Link>
            </div>
          </div>

          {/* Add Task Form */}
          <div className="mb-6">
            <AddTaskForm onTaskAdded={handleTaskAdded} />
          </div>

          {/* Task List - Full Width Table */}
          <TaskList refreshTrigger={refreshTrigger} />

          {/* Tips section */}
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-slate-900/50 p-6">
            <h3 className="text-lg font-bold mb-4 text-emerald-400">💡 Quick Tips</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Use search bar to filter tasks instantly</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">✓</span>
                <span>Click checkmark to complete tasks</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">✓</span>
                <span>View detailed stats in the footer</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400">✓</span>
                <span>Use AI Chat for natural language management</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
