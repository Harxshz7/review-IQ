import { useState, useEffect } from 'react'
import { useProducts } from '../context/ProductContext'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Activity, TrendingDown, TrendingUp as TrendUp, ArrowRight } from 'lucide-react'
import TrendChart from '../components/TrendChart'
import SkeletonLoader from '../components/SkeletonLoader'
import useCountUp from '../hooks/useCountUp'

function WindowCard({ title, data, color }) {
  return (
    <div className="bg-card border border-border-dark rounded-2xl p-5">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{title}</h4>
      {data?.length > 0 ? (
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-elevated/50">
              <span className="text-sm text-text-primary capitalize">
                {item.feature_name?.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-2">
                <span className={`badge-${item.severity} text-[10px] font-bold px-2 py-0.5 rounded-md uppercase`}>
                  {item.severity}
                </span>
                <span className="text-xs font-mono text-text-muted">
                  {item.previous_percentage}% → {item.current_percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">No significant trends detected</p>
      )}
    </div>
  )
}

export default function Trends() {
  const { selectedProduct } = useProducts()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const healthScore = useCountUp(data?.health_score || 0)

  useEffect(() => {
    if (!selectedProduct) {
      setLoading(false)
      return
    }
    fetchTrends()
  }, [selectedProduct])

  const fetchTrends = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/trends/${encodeURIComponent(selectedProduct)}`)
      setData(res.data)
    } catch (err) {
      console.error('Trends fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Activity size={36} className="text-text-muted" />
        <p className="text-text-muted">Select a product to view trends</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="chart" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader type="card" count={3} />
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    )
  }

  const alerts = data?.alerts || []
  const emergingAlerts = alerts.filter(a => a.alert_type === 'emerging' || a.alert_type === 'anomaly')
  const resolvedAlerts = alerts.filter(a => a.is_resolved)
  const activeAlerts = alerts.filter(a => !a.is_resolved)

  const healthColor = (data?.health_score || 0) >= 70 ? '#10B981' :
                      (data?.health_score || 0) >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="space-y-6">
      {/* Header with health score */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border-dark rounded-2xl p-6 flex items-center gap-5"
        >
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1F2937" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={healthColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(data?.health_score || 0) * 2.64} ${264 - (data?.health_score || 0) * 2.64}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold font-mono" style={{ color: healthColor }}>
                {healthScore}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Health Score</h3>
            <p className="text-xs text-text-muted mt-0.5">{selectedProduct}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border-dark rounded-2xl p-6 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-red/15 flex items-center justify-center">
            <TrendingDown size={20} className="text-brand-red" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-text-primary">{activeAlerts.length}</p>
            <p className="text-xs text-text-muted">Active Alerts</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border-dark rounded-2xl p-6 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-amber/15 flex items-center justify-center">
            <Activity size={20} className="text-brand-amber" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-text-primary">{emergingAlerts.length}</p>
            <p className="text-xs text-text-muted">Emerging Trends</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border-dark rounded-2xl p-6 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-green/15 flex items-center justify-center">
            <TrendUp size={20} className="text-brand-green" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-text-primary">{resolvedAlerts.length}</p>
            <p className="text-xs text-text-muted">Resolved</p>
          </div>
        </motion.div>
      </div>

      {/* Trend Chart */}
      {data?.time_series && (
        <TrendChart
          timeSeriesData={data.time_series}
          alerts={alerts}
        />
      )}

      {/* Alert Windows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WindowCard
          title="Active Issues"
          data={activeAlerts}
          color="red"
        />
        <WindowCard
          title="All Detected Trends"
          data={alerts}
          color="amber"
        />
      </div>
    </div>
  )
}
