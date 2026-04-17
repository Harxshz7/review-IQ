import { useState } from 'react'
import { motion } from 'framer-motion'
import { Table, ChevronDown, Check } from 'lucide-react'

export default function ColumnMapper({ columns, detection, preview, onConfirm }) {
  const [reviewCol, setReviewCol] = useState(detection?.review_col || '')
  const [productCol, setProductCol] = useState(detection?.product_col || '')
  const [dateCol, setDateCol] = useState(detection?.date_col || '')

  const handleConfirm = () => {
    onConfirm({
      review_col: reviewCol,
      product_col: productCol || null,
      date_col: dateCol || null,
    })
  }

  const SelectDropdown = ({ label, value, onChange, required }) => (
    <div>
      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-elevated border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-teal focus:ring-1 focus:ring-teal outline-none cursor-pointer"
        >
          <option value="">— Select column —</option>
          {columns.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border-dark rounded-2xl p-6 space-y-5"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-brand-amber/15 flex items-center justify-center">
          <Table size={18} className="text-brand-amber" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Map Your Columns</h3>
          <p className="text-xs text-text-muted">Tell us which columns contain your data</p>
        </div>
      </div>

      {/* Confidence indicator */}
      {detection?.confidence && (
        <div className={`text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${
          detection.confidence === 'high'
            ? 'bg-brand-green/10 text-brand-green'
            : 'bg-brand-amber/10 text-brand-amber'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            detection.confidence === 'high' ? 'bg-brand-green' : 'bg-brand-amber'
          }`} />
          {detection.confidence === 'high' ? 'Auto-detected with high confidence' : 'Please verify column mapping'}
        </div>
      )}

      {/* Dropdowns */}
      <div className="grid grid-cols-3 gap-4">
        <SelectDropdown
          label="Review Text Column"
          value={reviewCol}
          onChange={setReviewCol}
          required
        />
        <SelectDropdown
          label="Product Name Column"
          value={productCol}
          onChange={setProductCol}
        />
        <SelectDropdown
          label="Date Column"
          value={dateCol}
          onChange={setDateCol}
        />
      </div>

      {/* Preview Table */}
      {preview && preview.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Preview (first 3 rows)
          </h4>
          <div className="overflow-x-auto rounded-xl border border-border-dark">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-elevated">
                  {Object.keys(preview[0]).map((key) => (
                    <th key={key} className={`text-left px-3 py-2 font-semibold ${
                      key === reviewCol ? 'text-teal' :
                      key === productCol ? 'text-brand-blue' :
                      key === dateCol ? 'text-brand-amber' :
                      'text-text-muted'
                    }`}>
                      {key}
                      {key === reviewCol && ' ✓'}
                      {key === productCol && ' ✓'}
                      {key === dateCol && ' ✓'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-border-dark/50">
                    {Object.entries(row).map(([key, val]) => (
                      <td key={key} className="px-3 py-2 text-text-muted max-w-[200px] truncate">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!reviewCol}
        className="flex items-center gap-2 px-5 py-2.5 bg-teal text-black rounded-xl font-semibold text-sm hover:bg-teal/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Check size={16} />
        Confirm & Analyze
      </button>
    </motion.div>
  )
}
