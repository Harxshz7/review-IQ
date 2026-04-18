import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

export default function AlertBanner({ alerts = [] }) {
  const [dismissed, setDismissed] = useState(new Set())

  const criticalAlerts = alerts.filter(
    a => a.severity === 'critical' && !a.is_resolved && !dismissed.has(a.id)
  )

  if (criticalAlerts.length === 0) return null

  return (
    <AnimatePresence>
      {criticalAlerts.map((alert) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-brand-red/10 border border-brand-red/30 rounded-2xl p-4 flex items-center gap-3 animate-pulse-red"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-red/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-brand-red" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-brand-red">
              CRITICAL: {alert.feature_name?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              {alert.description}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-mono font-bold text-brand-red">
              {alert.previous_percentage}% → {alert.current_percentage}%
            </p>
            <p className="text-[10px] text-text-muted">{alert.affected_count} affected</p>
          </div>
          <button
            onClick={() => setDismissed(prev => new Set(prev).add(alert.id))}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-all"
          >
            <X size={16} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
