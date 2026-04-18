import { useState, useEffect } from 'react'
import { useProducts } from '../context/ProductContext'
import { useToast } from '../context/ToastContext'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Shield, CheckCircle, Clock,
  ChevronDown, ChevronUp
} from 'lucide-react'
import ActionCard from '../components/ActionCard'
import SkeletonLoader from '../components/SkeletonLoader'

const severityTabs = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical', color: 'text-brand-red' },
  { key: 'high', label: 'High', color: 'text-brand-amber' },
  { key: 'medium', label: 'Medium', color: 'text-brand-blue' },
  { key: 'low', label: 'Low', color: 'text-brand-purple' },
]

export default function Alerts() {
  const { selectedProduct } = useProducts()
  const { success } = useToast()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [expandedAlerts, setExpandedAlerts] = useState(new Set())

  useEffect(() => {
    if (!selectedProduct) {
      setLoading(false)
      return
    }
    fetchAlerts()
  }, [selectedProduct])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/alerts/${encodeURIComponent(selectedProduct)}`)
      setAlerts(res.data)
    } catch (err) {
      console.error('Alerts fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (alert) => {
    try {
      await axios.post(`/api/alerts/${alert.id}/resolve`)
      success('Alert resolved successfully')
      fetchAlerts()
    } catch (err) {
      console.error('Resolve error:', err)
    }
  }

  const handleResolveCard = async (card) => {
    try {
      if (card.alert_id) {
        await axios.post(`/api/alerts/${card.alert_id}/resolve`)
      }
      await axios.post(`/api/action-cards/${card.id}/dismiss`)
      success('Action resolved')
      fetchAlerts()
    } catch (err) {
      console.error('Resolve error:', err)
    }
  }

  const toggleAlert = (id) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredAlerts = activeTab === 'all'
    ? alerts
    : alerts.filter(a => a.severity === activeTab)

  const unresolvedCount = alerts.filter(a => !a.is_resolved).length
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length

  if (!selectedProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle size={36} className="text-text-muted" />
        <p className="text-text-muted">Select a product to view alerts</p>
      </div>
    )
  }

  if (loading) {
    return <SkeletonLoader type="card" count={4} />
  }

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-brand-amber" />
          <span className="text-sm text-text-muted">
            <span className="text-text-primary font-bold font-mono">{unresolvedCount}</span> unresolved
          </span>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
            <span className="text-sm text-brand-red font-medium">
              {criticalCount} critical
            </span>
          </div>
        )}
      </div>

      {/* Severity Tabs */}
      <div className="flex gap-1 bg-elevated p-1 rounded-xl w-fit">
        {severityTabs.map((tab) => {
          const count = tab.key === 'all'
            ? alerts.length
            : alerts.filter(a => a.severity === tab.key).length

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-teal text-black'
                  : `text-text-muted hover:text-text-primary ${tab.color || ''}`
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1 rounded ${
                activeTab === tab.key ? 'bg-black/20' : 'bg-base'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-3"
        >
          <Shield size={40} className="text-brand-green" />
          <p className="text-text-muted">No alerts in this category</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredAlerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card border rounded-2xl overflow-hidden transition-all ${
                  alert.severity === 'critical' && !alert.is_resolved
                    ? 'border-brand-red/30 animate-pulse-red'
                    : 'border-border-dark hover:border-[#374151]'
                } ${alert.is_resolved ? 'opacity-60' : ''}`}
              >
                {/* Alert Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer"
                  onClick={() => toggleAlert(alert.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-brand-red' :
                      alert.severity === 'high' ? 'bg-brand-amber' :
                      alert.severity === 'medium' ? 'bg-brand-blue' : 'bg-brand-purple'
                    } ${alert.severity === 'critical' && !alert.is_resolved ? 'animate-pulse' : ''}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-text-primary">
                          {alert.feature_name?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <span className={`badge-${alert.severity} text-[10px] font-bold px-2 py-0.5 rounded-md uppercase`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-text-muted bg-elevated px-2 py-0.5 rounded capitalize">
                          {alert.alert_type}
                        </span>
                        {alert.is_resolved && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-brand-green bg-brand-green/10 px-2 py-0.5 rounded">
                            <CheckCircle size={10} /> Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-1 line-clamp-1">{alert.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-text-primary">
                        {alert.previous_percentage}%
                        <span className="text-brand-red mx-1">→</span>
                        {alert.current_percentage}%
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {alert.affected_count} affected • {alert.classification}
                      </p>
                    </div>
                    {expandedAlerts.has(alert.id) ? (
                      <ChevronUp size={16} className="text-text-muted" />
                    ) : (
                      <ChevronDown size={16} className="text-text-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedAlerts.has(alert.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-border-dark pt-4 space-y-4">
                        {/* Alert details */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="bg-elevated rounded-xl p-3">
                            <span className="text-text-muted">Alert Type</span>
                            <p className="text-text-primary font-medium capitalize mt-0.5">{alert.alert_type}</p>
                          </div>
                          <div className="bg-elevated rounded-xl p-3">
                            <span className="text-text-muted">Classification</span>
                            <p className="text-text-primary font-medium capitalize mt-0.5">{alert.classification}</p>
                          </div>
                          <div className="bg-elevated rounded-xl p-3">
                            <span className="text-text-muted">Created</span>
                            <p className="text-text-primary font-medium mt-0.5">
                              {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="bg-elevated rounded-xl p-3">
                            <span className="text-text-muted">Affected Reviews</span>
                            <p className="text-text-primary font-mono font-medium mt-0.5">{alert.affected_count}</p>
                          </div>
                        </div>

                        {/* Action Card */}
                        {alert.action_card && (
                          <ActionCard
                            card={alert.action_card}
                            onResolve={handleResolveCard}
                          />
                        )}

                        {/* Actions */}
                        {!alert.is_resolved && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleResolve(alert) }}
                              className="flex items-center gap-1.5 px-4 py-2 bg-teal/10 text-teal rounded-xl text-xs font-medium hover:bg-teal/20 transition-all"
                            >
                              <CheckCircle size={14} />
                              Mark Resolved
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
