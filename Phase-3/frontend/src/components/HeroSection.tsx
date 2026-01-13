'use client'

import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-10 -right-24 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              AI-Powered Task Management
            </div>

            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              Master your tasks{' '}
              <span className="bg-gradient-to-r from-fuchsia-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                like an ecommerce pro
              </span>
            </h1>

            <p className="mt-4 text-base text-white/70">
              Type naturally: “Add task to complete report tomorrow”. Our AI converts your words into real task actions.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition"
              >
                Start AI Chat
              </Link>
              <Link
                href="/tasks"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
              >
                Open Tasks
              </Link>
            </div>

            {/* Trust / stats strip */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-extrabold">1000+</div>
                <div className="text-xs text-white/60">Active Users</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-extrabold">10K+</div>
                <div className="text-xs text-white/60">Tasks Completed</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-extrabold">99%</div>
                <div className="text-xs text-white/60">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right side preview card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">Live Preview</div>
              <div className="text-xs text-white/50">AI + MCP tools</div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-xs text-white/60">You</div>
              <div className="mt-1 text-sm">Add task: Complete project report tomorrow</div>

              <div className="mt-4 text-xs text-white/60">Assistant</div>
              <div className="mt-1 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                ✅ Task added! Due date set for tomorrow.
              </div>
            </div>

            {/* Feature cards */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">Add Tasks</div>
                <div className="mt-1 text-xs text-white/60">Describe what you need</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">Smart Search</div>
                <div className="mt-1 text-xs text-white/60">Find tasks instantly</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">Track Progress</div>
                <div className="mt-1 text-xs text-white/60">Pending → Completed</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">AI Assistance</div>
                <div className="mt-1 text-xs text-white/60">Natural language control</div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary sections */}
        <div className="pb-16">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold">Secure Auth</div>
              <div className="mt-2 text-sm text-white/70">
                JWT-based isolation so your tasks stay private.
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold">Stateless Backend</div>
              <div className="mt-2 text-sm text-white/70">
                Conversation history is stored in DB, works across restarts.
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold">MCP Tools</div>
              <div className="mt-2 text-sm text-white/70">
                AI calls tools (add/list/update/delete/complete) instead of direct DB.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
