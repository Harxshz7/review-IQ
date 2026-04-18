import {
  Battery, Hammer, Package, Truck, DollarSign, Headphones, ShieldCheck, Activity
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
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted opacity-60">
        <span>{label}</span>
        <span className="font-mono">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div
          className="h-full rounded-full relative transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
        </div>
      </div>
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

  const negativePct = data?.negative_pct || 0
  let status = 'Optimal'
  let statusColor = 'text-teal'
  let statusBg = 'bg-teal/10'
  let statusBorder = 'border-teal/20'

  if (negativePct > 40) {
    status = 'Critical'
    statusColor = 'text-brand-red'
    statusBg = 'bg-brand-red/10'
    statusBorder = 'border-brand-red/20'
  } else if (negativePct > 20) {
    status = 'Suboptimal'
    statusColor = 'text-brand-amber'
    statusBg = 'bg-brand-amber/10'
    statusBorder = 'border-brand-amber/20'
  }

  const confidenceColor = confidence > 0.7 ? '#00FFD1' : confidence > 0.4 ? '#F59E0B' : '#FF4B4B'

  return (
    <div className={`glass-card p-4 group relative overflow-hidden ${status === 'Critical' ? 'critical-glow border-brand-red/20' : ''}`}>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 flex items-center justify-center text-text-secondary group-hover:text-teal transition-colors duration-500">
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-syne font-bold text-text-primary tracking-tight">{label}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Activity size={10} className="text-text-muted" />
              <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">{total} Data Points</p>
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border ${statusBg} ${statusColor} ${statusBorder} text-[9px] font-black uppercase tracking-widest shadow-sm`}>
          <div className={`w-1 h-1 rounded-full ${status === 'Critical' ? 'bg-brand-red animate-pulse' : 'bg-current'}`} />
          {status}
        </div>
      </div>

      <div className="space-y-3 mb-4 relative z-10">
        <SentimentBar label="Positive" value={positive} max={total} color="#00FFD1" delay={0.2} />
        <SentimentBar label="Negative" value={negative} max={total} color="#FF4B4B" delay={0.3} />
        <SentimentBar label="Neutral" value={neutral} max={total} color="#7C3AED" delay={0.4} />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-white/10 p-0.5">
            <div className="w-full h-full rounded-full opacity-80" style={{ backgroundColor: confidenceColor }} />
          </div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">AI Reliability</span>
        </div>
        <span className="text-xs font-mono font-bold text-text-primary">
          {(confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Decorative Gradient */}
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-teal/5 rounded-full blur-[40px]" />
    </div>
  )
}
