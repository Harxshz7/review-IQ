import { motion } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, Eye, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const urgencyConfig = {
  immediate: {
    color: '#EF4444',
    bg: 'bg-brand-red/10',
    text: 'text-brand-red',
    label: 'IMMEDIATE ACTION',
    border: 'border-l-brand-red',
  },
  this_week: {
    color: '#F59E0B',
    bg: 'bg-brand-amber/10',
    text: 'text-brand-amber',
    label: 'THIS WEEK',
    border: 'border-l-brand-amber',
  },
  monitor: {
    color: '#3B82F6',
    bg: 'bg-brand-blue/10',
    text: 'text-brand-blue',
    label: 'MONITOR',
    border: 'border-l-brand-blue',
  },
}

export default function ActionCard({ card, onResolve, onDismiss, index = 0 }) {
  const [expanded, setExpanded] = useState(false)
  const urgency = urgencyConfig[card.urgency] || urgencyConfig.monitor

  const prevPct = card.previous_percentage || 0
  const currPct = card.current_percentage || 0
  const delta = currPct - prevPct

  const isImmediate = card.urgency === 'immediate'
  const isCritical = card.severity === 'critical'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5 }}
      className={`relative bg-card border border-border-dark rounded-2xl overflow-hidden hover:border-[#374151] transition-all ${
        isCritical ? 'animate-pulse-red' : ''
      }`}
    >
      {/* Left colored bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{ backgroundColor: urgency.color }}
      />

      <div className="pl-6 pr-5 py-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {/* Urgency badge */}
            <div className="flex items-center gap-2 mb-2">
              {isImmediate && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-red/15 text-brand-red text-[11px] font-bold tracking-wide animate-pulse">
                  <AlertTriangle size={12} />
                  {urgency.label}
                </span>
              )}
              {!isImmediate && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${urgency.bg} ${urgency.text} text-[11px] font-bold tracking-wide`}>
                  <Clock size={12} />
                  {urgency.label}
                </span>
              )}
              {card.severity && (
                <span className={`badge-${card.severity} text-[10px] font-bold px-2 py-0.5 rounded-md uppercase`}>
                  {card.severity}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-text-primary leading-tight">
              {card.title}
            </h3>

            {/* Summary */}
            {card.issue_summary && (
              <p className="text-sm text-text-muted italic mt-1.5 leading-relaxed">
                {card.issue_summary}
              </p>
            )}
          </div>
        </div>

        {/* Expandable sections */}
        <div className={`space-y-4 overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          {/* What happened */}
          {card.what_happened && (
            <div>
              <h4 className="text-xs font-bold text-teal uppercase tracking-wider mb-1.5">
                What Happened
              </h4>
              <p className="text-sm text-text-muted leading-relaxed">
                {card.what_happened}
              </p>
            </div>
          )}

          {/* Who affected */}
          {card.who_affected && (
            <div>
              <h4 className="text-xs font-bold text-teal uppercase tracking-wider mb-1.5">
                Who Is Affected
              </h4>
              <p className="text-sm text-text-muted leading-relaxed">
                {card.who_affected}
              </p>
            </div>
          )}

          {/* Recommended actions */}
          {card.recommended_actions && card.recommended_actions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-teal uppercase tracking-wider mb-2">
                Recommended Actions
              </h4>
              <div className="space-y-2">
                {card.recommended_actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal/15 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-teal">{i + 1}</span>
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated impact */}
          {card.estimated_impact && (
            <div className="bg-brand-red/5 border border-brand-red/20 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-brand-amber uppercase tracking-wider mb-1">
                Estimated Impact
              </h4>
              <p className="text-sm text-brand-amber/90 leading-relaxed">
                {card.estimated_impact}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-dark">
          <div className="flex items-center gap-3">
            {/* Delta badge */}
            <div className="flex items-center gap-1.5 bg-elevated rounded-lg px-2.5 py-1">
              <span className="text-xs font-mono text-text-muted">{prevPct.toFixed(1)}%</span>
              <ArrowRight size={12} className="text-brand-red" />
              <span className="text-xs font-mono text-brand-red font-bold">{currPct.toFixed(1)}%</span>
              {delta > 0 && (
                <span className="text-[10px] font-bold text-brand-red ml-1">+{delta.toFixed(1)}pp</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-elevated transition-all"
            >
              <Eye size={13} />
              {expanded ? 'Less' : 'Details'}
            </button>
            {onResolve && (
              <button
                onClick={() => onResolve(card)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal/10 text-teal hover:bg-teal/20 transition-all"
              >
                <CheckCircle size={13} />
                Resolve
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
