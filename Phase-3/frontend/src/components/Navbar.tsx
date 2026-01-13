'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

function AuthButtons() {
  const router = useRouter()
  const { isAuthenticated, userName, logout } = useAuth()

  if (isAuthenticated) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <span className="text-sm text-white/70">Hello, {userName}</span>
        <button
          onClick={() => {
            logout()
            router.push('/')
          }}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="hidden md:flex items-center gap-2">
      <Link
        href="/signin"
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition"
      >
        Sign up
      </Link>
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()

  const links = useMemo(
    () => [
      { href: '/tasks', label: 'Tasks' },
      { href: '/chat', label: 'AI Chat' },
    ],
    []
  )

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Roman Urdu: abhi demo ke liye console, baad me /tasks?q=... route kar dena
    console.log('Search query:', q)
  }

  return (
    <nav className="fixed top-0 z-50 w-full bg-gradient-to-r from-[#1e293b] via-[#312e81] to-[#a21caf] shadow-2xl border-b border-white/10 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="flex h-20 items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-xl">
              <span className="text-xl font-black tracking-widest drop-shadow">FZ</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-extrabold bg-gradient-to-r from-cyan-300 to-pink-400 bg-clip-text text-transparent">Fatima Zehra Todo</div>
              <div className="text-xs text-white/70 font-medium">AI Task Manager</div>
            </div>
          </Link>

          {/* Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 ml-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-4 py-2 text-base font-semibold text-white/80 hover:text-white hover:bg-white/10 transition shadow-sm"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Search (Desktop) */}
          <form onSubmit={onSearch} className="ml-auto hidden md:block w-full max-w-md">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Search tasks… e.g. "report", "meeting"'
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 pr-24 text-base text-white placeholder:text-white/40 outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Auth Buttons (Desktop) */}
          <AuthButtons />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden ml-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 transition shadow"
            aria-label="Open menu"
          >
            <div className="flex flex-col gap-1">
              <span className={`h-0.5 w-7 bg-white transition ${open ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`h-0.5 w-7 bg-white transition ${open ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-7 bg-white transition ${open ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Panel */}
        {open && (
          <div className="md:hidden pb-6 animate-fade-in">
            <form onSubmit={onSearch} className="mt-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tasks…"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 shadow-inner"
              />
            </form>

            <div className="mt-4 grid gap-3">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-base font-semibold text-white/90 hover:bg-white/20 transition shadow"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout()
                    setOpen(false)
                    router.push('/')
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center text-base font-semibold text-white/90 hover:bg-white/20 transition shadow"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/signin"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center text-base font-semibold text-white/90 hover:bg-white/20 transition shadow"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-center text-base font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
