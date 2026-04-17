import { motion } from 'framer-motion'
import {
  Battery, Hammer, Package, Truck, DollarSign, Headphones
} from 'lucide-react'

const featureIcons = {
  battery_life: Battery,
  build_quality: Hammer,
  packaging: Package,
  delivery_speed: Truck,
  price_value: DollarSign,
  customer_support: Headphones,
}

const featureLabels = {
  battery_life: 'Battery Life',
  build_quality: 'Build Quality',
  packaging: 'Packaging',
  delivery_speed: 'Delivery Speed',
  price_value: 'Price Value',
  customer_support: 'Customer Support',
}

function SentimentBar({ label, value, max, color, delay }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-text-muted">{label}</span>
      <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right font-mono text-text-muted">{value}</span>
    </div>
  )
}

export default function FeatureCard({ feature, data, index = 0 }) {
  const Icon = featureIcons[feature] || Package
  const label = featureLabels[feature] || feature

  const positive = data?.positive || 0
  const negative = data?.negative || 0
  const neutral = data?.neutral || 0
  const total = data?.total_mentioned || 0
  const confidence = data?.avg_confidence || 0

  // Determine overall status
  const positivePct = data?.positive_pct || 0
  const negativePct = data?.negative_pct || 0

  let status = 'Healthy'
  let statusColor = 'text-brand-green'
  let statusBg = 'bg-brand-green/10'

  if (negativePct > 40) {
    status = 'Critical'
    statusColor = 'text-brand-red'
    statusBg = 'bg-brand-red/10'
  } else if (negativePct > 25) {
    status = 'Warning'
    statusColor = 'text-brand-amber'
    statusBg = 'bg-brand-amber/10'
  } else if (total === 0) {
    status = 'No Data'
    statusColor = 'text-text-muted'
    statusBg = 'bg-elevated'
  }

  const confidenceColor = confidence > 0.7 ? '#10B981' : confidence > 0.4 ? '#F59E0B' : '#EF4444'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`bg-card border border-border-dark rounded-2xl p-5 hover:border-[#374151] hover:scale-[1.01] transition-all ${
        status === 'Critical' ? 'animate-pulse-red' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-elevated flex items-center justify-center text-text-muted">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
            <p className="text-xs text-text-muted">{total} mentions</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusBg} ${statusColor}`}>
          {status}
        </span>
      </div>

      <div className="space-y-2">
        <SentimentBar label="Positive" value={positive} max={total} color="#10B981" delay={index * 0.08 + 0.2} />
        <SentimentBar label="Negative" value={negative} max={total} color="#EF4444" delay={index * 0.08 + 0.3} />
        <SentimentBar label="Neutral" value={neutral} max={total} color="#3B82F6" delay={index * 0.08 + 0.4} />
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-dark">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: confidenceColor }}
        />
        <span className="text-xs text-text-muted">
          Confidence: <span className="font-mono">{(confidence * 100).toFixed(0)}%</span>
        </span>
      </div>
    </motion.div>
  )
}
