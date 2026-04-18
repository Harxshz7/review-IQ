import { useState, useEffect } from 'react'
import { useProducts } from '../context/ProductContext'
import axios from 'axios'
import {
  MessageSquare, Bot, AlertTriangle, Shield, Heart,
  TrendingUp, Globe, Activity, LayoutGrid, Zap, Plug, RefreshCw, BarChart3, Upload
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import StatCard from '../components/StatCard'
import FeatureCard from '../components/FeatureCard'
import TrendChart from '../components/TrendChart'
import ActionCard from '../components/ActionCard'
import AlertBanner from '../components/AlertBanner'
import ReviewTable from '../components/ReviewTable'
import SkeletonLoader from '../components/SkeletonLoader'
import LiveSourcesFixed from '../components/LiveSourcesFixed'
import { useNavigate } from 'react-router-dom'

const SENTIMENT_COLORS = ['#00FFD1', '#FF4B4B', '#7C3AED']

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{payload[0].name}</p>
      <p className="text-sm text-text-primary font-mono font-bold">
        {payload[0].value} <span className="text-xs text-text-muted font-normal ml-1">({payload[0].payload.pct}%)</span>
      </p>
    </div>
  )
}

export default function Dashboard() {
  const { selectedProduct } = useProducts()
  const [data, setData] = useState(null)
  const [trends, setTrends] = useState(null)
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
      // Try multiple possible token keys
      const token = localStorage.getItem('reviewiq_token') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken') ||
                      localStorage.getItem('access_token')
      
      console.log('Dashboard token:', token)
      
      if (!token) {
        setError('No authentication token found. Please login again.')
        setData(null)
        setTrends(null)
        setLoading(false)
        return
      }
      
      const [dashRes, trendsRes] = await Promise.all([
        axios.get(`/api/dashboard/${encodeURIComponent(selectedProduct)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/trends/${encodeURIComponent(selectedProduct)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ])
      setData(dashRes.data)
      setTrends(trendsRes.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err.response?.data?.detail || 'Failed to load dashboard data')
      setData(null)
      setTrends(null)
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

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  if (!selectedProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-teal/20 to-violet/20 border border-white/10 flex items-center justify-center animate-float">
            <MessageSquare size={40} className="text-teal" />
          </div>
          <div className="absolute -inset-4 bg-teal/10 blur-3xl -z-10 rounded-full" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-syne font-black text-text-primary tracking-tight">No Intelligence Data</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">Your intelligence engine is waiting for input. Upload your first review batch to generate AI insights.</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="px-8 py-3 bg-teal text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,209,0.3)]"
        >
          Initialize Analysis
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-4 gap-4"><div className="h-32 bg-white/5 rounded-2xl" /><div className="h-32 bg-white/5 rounded-2xl" /><div className="h-32 bg-white/5 rounded-2xl" /><div className="h-32 bg-white/5 rounded-2xl" /></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-80 bg-white/5 rounded-2xl" />
          <div className="h-80 bg-white/5 rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-4"><div className="h-40 bg-white/5 rounded-2xl" /><div className="h-40 bg-white/5 rounded-2xl" /><div className="h-40 bg-white/5 rounded-2xl" /></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-red/20 to-orange/20 border border-white/10 flex items-center justify-center animate-float">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <div className="absolute -inset-4 bg-red/10 blur-3xl -z-10 rounded-full" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-syne font-black text-text-primary tracking-tight">Dashboard Error</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">{error}</p>
        </div>
        <button
          onClick={() => {
            setError(null)
            fetchDashboard()
          }}
          className="px-8 py-3 bg-teal text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,209,0.3)]"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const sentimentData = [
    { name: 'Positive', value: data.sentiment.positive, pct: data.sentiment.positive_pct },
    { name: 'Negative', value: data.sentiment.negative, pct: data.sentiment.negative_pct },
    { name: 'Neutral', value: data.sentiment.neutral, pct: data.sentiment.neutral_pct },
  ]

  const alerts = data.alerts || []
  const actionCards = data.action_cards || []
  const features = data.features || {}
  const langStats = data.language_stats || {}
  const recentReviews = data.recent_reviews || []

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-syne font-black text-white tracking-tight leading-none uppercase italic">
            Intelligence <span className="text-teal not-italic">Dashboard</span>
          </h1>
          <p className="text-text-muted mt-2 font-mono text-[9px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
            <Activity size={10} className="text-teal" />
            Live Analysis: {selectedProduct}
          </p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
             <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">System Operational</span>
           </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      <AlertBanner alerts={alerts} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={MessageSquare}
          value={data.total_reviews}
          label="Processed Volume"
          subtitle="+12.5%"
          color="#00FFD1"
        />
        <StatCard
          icon={Bot}
          value={data.bots_detected}
          label="Bot Mitigation"
          subtitle="99.9% Acc"
          color="#F59E0B"
        />
        <StatCard
          icon={AlertTriangle}
          value={data.flagged_count}
          label="Human Review"
          subtitle="-4.2%"
          color="#FF4B4B"
        />
        <StatCard
          icon={Shield}
          value={data.health_score}
          label="Integrity Score"
          subtitle={`${data.health_score >= 70 ? '+' : ''}${data.health_score - 50}%`}
          color={data.health_score >= 70 ? '#00FFD1' : data.health_score >= 40 ? '#F59E0B' : '#FF4B4B'}
        />
      </div>

      {/* Main Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sentiment Analysis */}
        <div className="lg:col-span-4 glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal via-violet to-brand-blue opacity-50" />
          <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
             <Zap size={14} className="text-teal" />
             Sentiment Matrix
          </h3>
          <div className="relative h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1500}
                >
                  {sentimentData.map((entry, i) => (
                    <Cell key={i} fill={SENTIMENT_COLORS[i]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Positive</span>
              <span className="text-4xl font-syne font-black text-white">{data.sentiment.positive_pct}%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-8">
            {sentimentData.map((item, i) => (
              <div key={i} className="text-center p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="text-[9px] font-black text-text-muted uppercase mb-1 tracking-tighter">{item.name}</p>
                <p className="text-sm font-mono font-bold" style={{ color: SENTIMENT_COLORS[i] }}>{item.pct}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly / Alerts List */}
        <div className="lg:col-span-8 glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Dashboard</h2>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/upload')}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/80 transition-all flex items-center gap-2 border border-white/10"
              >
                <Upload size={18} />
                Upload Reviews
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-3 max-h-[280px] overflow-y-auto pr-2">
            <AnimatePresence mode="popLayout">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted space-y-4 py-10 opacity-40">
                  <Shield size={48} strokeWidth={1} />
                  <p className="text-sm font-syne font-bold uppercase tracking-widest">No Anomalies Detected</p>
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <div
                    key={alert.id}
                    className={`group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all ${
                      alert.severity === 'critical' ? 'border-brand-red/20 bg-brand-red/[0.02]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${
                        alert.severity === 'critical' ? 'bg-brand-red shadow-[0_0_10px_rgba(255,75,75,0.5)]' :
                        alert.severity === 'high' ? 'bg-brand-amber' :
                        'bg-brand-blue'
                      }`} />
                      <div>
                        <p className="text-sm font-bold text-text-primary group-hover:text-teal transition-colors">
                          {alert.feature_name?.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-[10px] font-mono font-bold text-text-muted uppercase mt-0.5 tracking-tighter">
                          {alert.classification} • {alert.affected_count} IMPACTED ENTITIES
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${
                         alert.severity === 'critical' ? 'bg-brand-red/10 text-brand-red border-brand-red/20' : 'bg-white/5 text-text-secondary border-white/10'
                       }`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Strategy Center has been moved to a standalone page */}

      {/* Feature Intelligence Matrix */}
      <div className="space-y-4">
        <h3 className="text-sm font-syne font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
          <LayoutGrid size={18} className="text-violet" />
          Feature Intelligence Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(features).map(([key, val], i) => (
            <FeatureCard key={key} feature={key} data={val} index={i} />
          ))}
        </div>
      </div>

      {/* Trend Timeline */}
      {trends?.time_series && (
        <div className="space-y-6">
           <h3 className="text-sm font-syne font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <TrendingUp size={18} className="text-brand-blue" />
            Temporal Sentiment Flux
          </h3>
          <div className="glass-card p-2 overflow-hidden">
            <TrendChart
              timeSeriesData={trends.time_series}
              alerts={trends.alerts}
            />
          </div>
        </div>
      )}

      {/* Language Breakdown */}
      {Object.keys(langStats).length > 0 && (
        <div className="glass-card p-10 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-violet/5 blur-[100px] -z-10" />
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <Globe size={16} className="text-brand-blue group-hover:rotate-12 transition-transform duration-700" />
            Global Linguistic Distribution
          </h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(langStats).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
              <div key={lang} className="group/lang flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300">
                <span className="text-sm text-text-primary capitalize font-bold tracking-tight">{lang}</span>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-xs font-mono font-bold text-teal">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews (Technical View) */}
      {recentReviews.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-sm font-syne font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <MessageSquare size={18} className="text-teal" />
            RAW DATA FEED
          </h3>
          <div className="glass-card p-1 overflow-hidden">
            <ReviewTable
              reviews={recentReviews}
              total={recentReviews.length}
              page={1}
              totalPages={1}
              compact
            />
          </div>
        </div>
      )}

      {/* Live Sources Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-syne font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
          <Plug size={18} className="text-teal" />
          Live Sources
        </h3>
        <div className="glass-card p-5">
          <LiveSourcesFixed />
        </div>
      </div>
    </div>
  )
}
