import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea
} from 'recharts'
import { motion } from 'framer-motion'

const featureLabels = {
  battery_life: 'Battery Life',
  build_quality: 'Build Quality',
  packaging: 'Packaging',
  delivery_speed: 'Delivery Speed',
  price_value: 'Price Value',
  customer_support: 'Customer Support',
}

const featureColors = {
  battery_life: '#00C896',
  build_quality: '#3B82F6',
  packaging: '#EF4444',
  delivery_speed: '#F59E0B',
  price_value: '#8B5CF6',
  customer_support: '#10B981',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-card border border-border-dark rounded-xl p-3 shadow-xl">
      <p className="text-xs text-text-muted mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-text-muted">{entry.name}:</span>
          <span className="font-mono text-text-primary font-medium">{entry.value}%</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ timeSeriesData, alerts = [] }) {
  const features = Object.keys(featureLabels)
  const [activeFeature, setActiveFeature] = useState('packaging')

  const chartData = useMemo(() => {
    if (!timeSeriesData?.dates?.length) return []

    const dates = timeSeriesData.dates
    const featureData = timeSeriesData.features?.[activeFeature]

    if (!featureData) return []

    return dates.map((date, i) => ({
      date: date.slice(5), // MM-DD format
      fullDate: date,
      positive: featureData.positive?.[i] || 0,
      negative: featureData.negative?.[i] || 0,
      neutral: featureData.neutral?.[i] || 0,
    }))
  }, [timeSeriesData, activeFeature])

  // Detect anomaly zones
  const anomalyZones = useMemo(() => {
    if (!alerts?.length) return []
    return alerts
      .filter(a => a.feature_name === activeFeature && a.severity === 'critical')
      .map(() => {
        if (chartData.length < 2) return null
        const start = chartData[Math.max(0, chartData.length - Math.ceil(chartData.length * 0.4))]?.date
        const end = chartData[chartData.length - 1]?.date
        return start && end ? { start, end } : null
      })
      .filter(Boolean)
  }, [alerts, activeFeature, chartData])

  if (!chartData.length) {
    return (
      <div className="bg-card border border-border-dark rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 font-syne">Trend Analysis</h3>
        <div className="flex items-center justify-center h-48 text-text-muted text-sm">
          No trend data available. Upload reviews to get started.
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border-dark rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary font-syne">
          Feature Sentiment Trends
        </h3>
      </div>

      {/* Feature Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {features.map((feat) => (
          <button
            key={feat}
            onClick={() => setActiveFeature(feat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFeature === feat
                ? 'text-black font-semibold'
                : 'text-text-muted hover:text-text-primary bg-elevated hover:bg-[#374151]'
            }`}
            style={activeFeature === feat ? { backgroundColor: featureColors[feat] } : {}}
          >
            {featureLabels[feat]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="positiveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis
            dataKey="date"
            stroke="#94A3B8"
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: '#1E293B' }}
          />
          <YAxis
            stroke="#94A3B8"
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: '#1E293B' }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Anomaly zones */}
          {anomalyZones.map((zone, i) => (
            <ReferenceArea
              key={i}
              x1={zone.start}
              x2={zone.end}
              fill="#EF4444"
              fillOpacity={0.08}
              stroke="#EF4444"
              strokeOpacity={0.3}
              strokeDasharray="4 4"
            />
          ))}

          <Area
            type="monotone"
            dataKey="positive"
            name="Positive"
            stroke="#10B981"
            fill="url(#positiveGrad)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 2, fill: '#111827' }}
          />
          <Area
            type="monotone"
            dataKey="negative"
            name="Negative"
            stroke="#EF4444"
            fill="url(#negativeGrad)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: '#EF4444', strokeWidth: 2, fill: '#111827' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
