import useCountUp from '../hooks/useCountUp'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ icon: Icon, value, label, subtitle, color = '#00FFD1', index = 0 }) {
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0)

  // Extract percentage or trend if present in subtitle
  const isTrend = subtitle?.includes('%')
  const isPositive = subtitle?.includes('+') || (isTrend && !subtitle?.includes('-'))

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      {/* Background Glow Effect - simplified */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal/5 rounded-full blur-2xl" />
      
      <div className="flex items-start justify-between relative z-10">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden border border-white/10"
          style={{ background: `linear-gradient(135deg, ${color}20 0%, transparent 100%)` }}
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          {Icon && <Icon size={22} style={{ color: color }} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />}
        </div>
        
        {subtitle && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-tighter ${
            isTrend 
              ? isPositive ? 'bg-teal/10 text-teal border border-teal/20' : 'bg-brand-red/10 text-brand-red border border-brand-red/20'
              : 'bg-white/5 text-text-muted border border-white/5'
          }`}>
            {isTrend && (isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
            {subtitle}
          </div>
        )}
      </div>

      <div className="mt-6 relative z-10">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold font-mono text-text-primary tracking-tighter drop-shadow-sm">
            {typeof value === 'number' ? animatedValue.toLocaleString() : value}
          </span>
          {typeof value === 'number' && value > 1000 && <span className="text-xs text-text-muted font-mono mb-1">+</span>}
        </div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-[0.15em] mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {label}
        </p>
      </div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
        <svg width="100%" height="100%">
          <pattern id={`pattern-${index}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 0h20v20H0z" fill="none" />
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#pattern-${index})`} />
        </svg>
      </div>
    </div>
  )
}
