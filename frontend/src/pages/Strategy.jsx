import { useState, useEffect } from 'react'
import { useProducts } from '../context/ProductContext'
import axios from 'axios'
import { Heart, Activity, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ActionCard from '../components/ActionCard'
import { useNavigate } from 'react-router-dom'

export default function Strategy() {
  const { selectedProduct } = useProducts()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedProduct) {
      setLoading(false)
      return
    }
    fetchDashboard()
  }, [selectedProduct])

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('reviewiq_token') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken') ||
                      localStorage.getItem('access_token')
      
      if (!token) {
        setError('No authentication token found. Please login again.')
        setData(null)
        setLoading(false)
        return
      }
      
      const dashRes = await axios.get(`/api/dashboard/${encodeURIComponent(selectedProduct)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(dashRes.data)
    } catch (err) {
      console.error('Strategy fetch error:', err)
      setError(err.response?.data?.detail || 'Failed to load strategy data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (card) => {
    try {
      if (card.alert_id) {
        await axios.post(`/api/alerts/${card.alert_id}/resolve`)
      }
      await axios.post(`/api/action-cards/${card.id}/dismiss`)
      fetchDashboard()
    } catch (err) {
      console.error('Resolve error:', err)
    }
  }

  if (!selectedProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-teal/20 to-violet/20 border border-white/10 flex items-center justify-center animate-float">
            <Target size={40} className="text-teal" />
          </div>
          <div className="absolute -inset-4 bg-teal/10 blur-3xl -z-10 rounded-full" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-syne font-black text-text-primary tracking-tight">No AI Strategies</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">Upload reviews to generate AI action plans.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-white/5 rounded-2xl" />
        <div className="h-40 bg-white/5 rounded-2xl" />
        <div className="h-40 bg-white/5 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 font-bold text-center mt-10">{error}</div>
  }

  if (!data) return null
  
  const actionCards = data.action_cards || []

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-syne font-black text-white tracking-tight leading-none uppercase italic">
            AI Strategy <span className="text-brand-red not-italic">Center</span>
          </h1>
          <p className="text-text-muted mt-2 font-mono text-[9px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
            <Activity size={10} className="text-brand-red" />
            Active Plans: {selectedProduct}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {actionCards.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 mt-8">
            {actionCards.map((card, i) => (
              <ActionCard
                key={card.id}
                card={card}
                index={i}
                onResolve={handleResolve}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
             <Heart size={48} className="opacity-20 mb-4" />
             <p className="text-sm font-syne font-bold uppercase tracking-widest">No Action Cards Needed</p>
             <p className="text-xs max-w-md text-center mt-2 opacity-50">Your product sentiment is stable. The AI strategy engine will generate action cards if significant issues or anomalies are detected.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
