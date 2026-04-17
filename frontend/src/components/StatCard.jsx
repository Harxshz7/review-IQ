import { motion } from 'framer-motion'
import useCountUp from '../hooks/useCountUp'

export default function StatCard({ icon: Icon, value, label, subtitle, color = '#00C896', index = 0 }) {
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0)

  const colorMap = {
    '#00C896': 'bg-teal/15 text-teal',
    '#3B82F6': 'bg-brand-blue/15 text-brand-blue',
    '#F59E0B': 'bg-brand-amber/15 text-brand-amber',
    '#EF4444': 'bg-brand-red/15 text-brand-red',
    '#8B5CF6': 'bg-brand-purple/15 text-brand-purple',
    '#10B981': 'bg-brand-green/15 text-brand-green',
  }

  const iconClass = colorMap[color] || 'bg-teal/15 text-teal'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-card border border-border-dark rounded-2xl p-5 hover:border-[#374151] hover:scale-[1.01] transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
          {Icon && <Icon size={20} />}
        </div>
        {subtitle && (
          <span className="text-xs text-text-muted bg-elevated px-2 py-0.5 rounded-full">
            {subtitle}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold font-mono number-display text-text-primary">
          {typeof value === 'number' ? animatedValue : value}
        </p>
        <p className="text-sm text-text-muted mt-1">{label}</p>
      </div>
    </motion.div>
  )
}
