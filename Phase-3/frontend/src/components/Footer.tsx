'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-white/10 bg-gradient-to-b from-[#312e81] via-[#1e293b] to-[#0f172a] rounded-t-3xl shadow-2xl">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        {/* Main Footer Content */}
        <div className="grid gap-10 py-14 md:grid-cols-2">
          {/* Brand Column */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-xl">
                <span className="text-lg font-black tracking-widest drop-shadow">FZ</span>
              </div>
              <div>
                <div className="text-base font-extrabold bg-gradient-to-r from-cyan-300 to-pink-400 bg-clip-text text-transparent">Fatima Zehra</div>
                <div className="text-xs text-white/70 font-medium">Todo AI</div>
              </div>
            </div>
            <p className="text-base text-white/60 max-w-xs">
              AI-powered task management for modern teams. Organize, chat, and automate your productivity.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white/90 mb-2">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/chat" className="text-base text-white/70 hover:text-white transition font-medium">
                  AI Chat
                </Link>
              </li>
              <li>
                <Link href="/tasks" className="text-base text-white/70 hover:text-white transition font-medium">
                  Task Manager
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Bottom Footer */}
        <div className="flex flex-col gap-5 py-8 md:flex-row md:items-center md:justify-between">
          <p className="text-base text-white/60">
            © {currentYear} Fatima Zehra Todo. Built with <span className="text-pink-400">AI</span> & <span className="text-cyan-400">Next.js</span>.
          </p>

          {/* Social Links */}
          <div className="flex gap-6">
            <a href="#" className="text-white/60 hover:text-cyan-400 transition text-lg font-bold">
              Twitter
            </a>
            <a href="#" className="text-white/60 hover:text-pink-400 transition text-lg font-bold">
              GitHub
            </a>
            <a href="#" className="text-white/60 hover:text-blue-400 transition text-lg font-bold">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
