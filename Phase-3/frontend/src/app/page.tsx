import Footer from '../components/Footer'
import Link from 'next/link'
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-2 sm:px-8 lg:px-24 py-8 bg-gradient-to-br from-[#0f172a] via-[#312e81] to-[#a21caf] text-white">
      <main className="w-full max-w-5xl flex-1 flex flex-col justify-center items-center">
        {/* Hero Section */}
        <section className="w-full text-center mb-32 mt-10">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-10 bg-gradient-to-r from-cyan-300 via-emerald-300 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
            AI-Powered Task Management
          </h1>
          <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto mb-12 font-medium">
            Chat with AI to manage your tasks naturally. Say <span className="text-cyan-300 font-bold">"Add task: Complete report tomorrow"</span> and watch AI convert your words into real task actions.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-8 py-4">
            <Link href="/signup" className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-7 py-3 text-lg font-bold text-white shadow-lg shadow-pink-500/20 hover:scale-105 transition">Get Started</Link>
            <Link href="/signin" className="rounded-2xl border border-cyan-400/40 bg-white/10 px-7 py-3 text-lg font-bold text-cyan-200 hover:text-white hover:bg-cyan-500/20 transition shadow">Sign In</Link>
            <Link href="/chat" className="rounded-2xl border border-emerald-400/40 bg-white/10 px-7 py-3 text-lg font-bold text-emerald-200 hover:text-white hover:bg-emerald-500/20 transition shadow">Try AI Chat</Link>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* AI Chatbot Card */}
          <div className="rounded-3xl p-8 bg-white/10 backdrop-blur-xl border border-cyan-400/10 hover:scale-[1.04] transition shadow-2xl flex flex-col items-center min-h-[260px]">
            <div className="text-5xl mb-5">🤖</div>
            <h3 className="text-2xl font-bold text-cyan-200 mb-3">AI Chatbot</h3>
            <p className="text-base text-white/80 mb-6 text-center">Natural language task management with OpenAI</p>
            <Link href="/chat" className="inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-base font-semibold text-white shadow hover:opacity-90 transition">Try AI Chat</Link>
          </div>
          {/* MCP Tools Card */}
          <div className="rounded-3xl p-8 bg-white/10 backdrop-blur-xl border border-fuchsia-400/10 hover:scale-[1.04] transition shadow-2xl flex flex-col items-center min-h-[260px]">
            <div className="text-5xl mb-5">🛠️</div>
            <h3 className="text-2xl font-bold text-fuchsia-200 mb-3">MCP Tools</h3>
            <p className="text-base text-white/80 mb-6 text-center">5 powerful tools: Add, List, Update, Complete, Delete</p>
            <Link href="/tasks" className="inline-block rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-6 py-2 text-base font-semibold text-white shadow hover:opacity-90 transition">Get Started</Link>
          </div>
          {/* Secure Auth Card */}
          <div className="rounded-3xl p-8 bg-white/10 backdrop-blur-xl border border-yellow-400/10 hover:scale-[1.04] transition shadow-2xl flex flex-col items-center min-h-[260px]">
            <div className="text-5xl mb-5">🔒</div>
            <h3 className="text-2xl font-bold text-yellow-200 mb-3">Secure Auth</h3>
            <p className="text-base text-white/80 mb-6 text-center">JWT-based authentication with user isolation</p>
            <Link href="/signin" className="inline-block rounded-xl bg-gradient-to-r from-yellow-400 to-pink-400 px-6 py-2 text-base font-semibold text-white shadow hover:opacity-90 transition">Sign In</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
