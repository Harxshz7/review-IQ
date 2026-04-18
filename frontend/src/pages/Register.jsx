import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { error: toastError, success } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !username || !password) return
    setLoading(true)
    try {
      await register(email, username, password)
      success('Account created successfully!')
      navigate('/')
    } catch (err) {
      toastError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-teal/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-teal animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-teal opacity-40 animate-ping" />
            </div>
            <h1 className="text-3xl font-syne font-bold">
              <span className="text-white">Review</span>
              <span className="text-teal">IQ</span>
            </h1>
          </div>
          <p className="text-text-muted text-sm">AI-Powered Review Intelligence</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-xl font-syne font-bold text-text-primary mb-1">Create your account</h2>
          <p className="text-sm text-text-muted mb-6">Start analyzing reviews in seconds</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full bg-elevated border border-[#374151] rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-elevated border border-[#374151] rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-elevated border border-[#374151] rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-teal text-black rounded-xl py-2.5 font-semibold text-sm hover:bg-teal/90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <Sparkles size={12} className="text-brand-amber" />
          <span className="text-xs text-text-muted">Powered by Google Gemini AI</span>
        </div>
      </div>
    </div>
  )
}
