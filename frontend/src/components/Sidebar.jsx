import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductContext'
import {
  LayoutDashboard, Upload, TrendingUp, MessageSquare,
  AlertTriangle, LogOut, Sparkles, Plug, Target
} from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/retailer-connect', icon: Plug, label: 'API Connect' },
  { to: '/trends', icon: TrendingUp, label: 'Trends' },
  { to: '/reviews', icon: MessageSquare, label: 'Reviews' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/strategy', icon: Target, label: 'Strategy' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { selectedProduct } = useProducts()
  const location = useLocation()
  const [alertCount, setAlertCount] = useState(0)
  const [apiConnectionCount, setApiConnectionCount] = useState(0)

  useEffect(() => {
    if (selectedProduct) {
      axios.get(`/api/alerts/${encodeURIComponent(selectedProduct)}`)
        .then(res => {
          const unresolved = res.data.filter(a => !a.is_resolved)
          setAlertCount(unresolved.length)
        })
        .catch(() => {})
    }
  }, [selectedProduct, location.pathname])

  useEffect(() => {
    // Fetch API connection count
    const token = localStorage.getItem('token')
    axios.get('/api/retailer/list', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setApiConnectionCount(res.data.apis?.length || 0)
      })
      .catch(() => {})
  }, [location.pathname])

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-sidebar-bg border-r border-border-dark flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border-dark">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-teal animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-teal opacity-50 animate-ping" />
          </div>
          <div>
            <h1 className="text-xl font-syne font-bold">
              <span className="text-white">Review</span>
              <span className="text-teal">IQ</span>
            </h1>
            <p className="text-[10px] text-text-muted tracking-widest uppercase">Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              className={`sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'active bg-teal/5 border-l-2 border-teal text-teal'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{label}</span>
              {label === 'Alerts' && alertCount > 0 && (
                <span className="ml-auto bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {alertCount}
                </span>
              )}
              {label === 'API Connect' && apiConnectionCount > 0 && (
                <span className="ml-auto bg-teal text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                  {apiConnectionCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border-dark space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal/20 flex items-center justify-center">
              <span className="text-xs font-bold text-teal">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm text-text-primary truncate max-w-[120px]">
              {user?.username || 'User'}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-text-muted hover:text-brand-red hover:bg-brand-red/10 transition-all"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-elevated/50">
          <Sparkles size={12} className="text-brand-amber" />
          <span className="text-[10px] text-text-muted">Powered by Gemini</span>
        </div>
      </div>
    </aside>
  )
}
