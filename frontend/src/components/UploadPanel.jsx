import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Upload, FileText, FileJson, MessageSquare, Check,
  Loader2, AlertCircle, ArrowRight
} from 'lucide-react'
import axios from 'axios'
import ColumnMapper from './ColumnMapper'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductContext'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'

const steps = [
  { key: 'parsed', label: 'Parsing file' },
  { key: 'preprocessed', label: 'Preprocessing & cleaning' },
  { key: 'analyzing', label: 'AI analysis' },
  { key: 'trends', label: 'Detecting trends' },
  { key: 'complete', label: 'Complete' },
]

export default function UploadPanel() {
  const { token } = useAuth()
  const { fetchProducts } = useProducts()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('file')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [productName, setProductName] = useState('')

  // Column mapping
  const [showMapper, setShowMapper] = useState(false)
  const [detection, setDetection] = useState(null)
  const [preview, setPreview] = useState(null)

  // Streaming state
  const [streaming, setStreaming] = useState(false)
  const [currentStep, setCurrentStep] = useState(null)
  const [progress, setProgress] = useState(0)
  const [latestReviews, setLatestReviews] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const fileInputRef = useRef(null)

  const handleFileDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      setShowMapper(false)
      setResult(null)
      setError(null)
      detectColumns(droppedFile)
    }
  }, [])

  const detectColumns = async (uploadFile) => {
    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      const res = await axios.post('/api/upload/detect-columns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setDetection(res.data)
      setPreview(res.data.preview)

      if (res.data.needs_mapping) {
        setShowMapper(true)
      } else {
        // Auto-start with detected columns
        startStreaming(uploadFile, {
          review_col: res.data.review_col,
          product_col: res.data.product_col,
          date_col: res.data.date_col,
        })
      }
    } catch (err) {
      setError('Failed to detect columns. Please check your file format.')
      toastError('Column detection failed')
    }
  }

  const startStreaming = async (uploadFile, mapping) => {
    setStreaming(true)
    setCurrentStep('parsed')
    setProgress(0)
    setLatestReviews([])
    setResult(null)
    setError(null)
    setShowMapper(false)

    const formData = new FormData()
    formData.append('file', uploadFile)
    if (mapping?.review_col) formData.append('review_col', mapping.review_col)
    if (mapping?.product_col) formData.append('product_col', mapping.product_col)
    if (mapping?.date_col) formData.append('date_col', mapping.date_col)

    const isJson = uploadFile.name.endsWith('.json')
    const url = isJson ? '/api/upload/json-stream' : '/api/upload/csv-stream'

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              handleSSEEvent(data)
            } catch (e) {
              // Skip unparseable lines
            }
          }
        }
      }
    } catch (err) {
      setError(`Analysis failed: ${err.message}`)
      toastError('Analysis failed. Please try again.')
      setStreaming(false)
    }
  }

  const startTextStreaming = async () => {
    if (!textInput.trim()) return

    setStreaming(true)
    setCurrentStep('parsed')
    setProgress(0)
    setLatestReviews([])
    setResult(null)
    setError(null)

    const formData = new FormData()
    formData.append('text', textInput)
    formData.append('product_name', productName || 'Unknown Product')

    try {
      const response = await fetch('/api/upload/text-stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              handleSSEEvent(data)
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      setError(`Analysis failed: ${err.message}`)
      setStreaming(false)
    }
  }

  const handleSSEEvent = (data) => {
    switch (data.type) {
      case 'parsed':
        setCurrentStep('parsed')
        break
      case 'preprocessed':
        setCurrentStep('preprocessed')
        break
      case 'batch_done':
        setCurrentStep('analyzing')
        setProgress(data.percent || 0)
        if (data.latest_reviews) {
          setLatestReviews(prev => [...data.latest_reviews, ...prev].slice(0, 3))
        }
        break
      case 'trends_analyzing':
        setCurrentStep('trends')
        setProgress(100)
        break
      case 'complete':
        setCurrentStep('complete')
        setProgress(100)
        setResult(data)
        setStreaming(false)
        fetchProducts()
        success('Analysis complete! Redirecting to dashboard...')
        setTimeout(() => navigate('/'), 2000)
        break
      case 'error':
        setError(data.message || 'An unknown error occurred during analysis.')
        setStreaming(false)
        toastError(data.message || 'Analysis failed')
        break
    }
  }

  const handleMapperConfirm = (mapping) => {
    if (file) {
      startStreaming(file, mapping)
    }
  }

  // Reset
  const handleReset = () => {
    setFile(null)
    setShowMapper(false)
    setStreaming(false)
    setCurrentStep(null)
    setProgress(0)
    setLatestReviews([])
    setResult(null)
    setError(null)
    setTextInput('')
    setProductName('')
  }

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-elevated p-1 rounded-xl w-fit">
        <button
          onClick={() => { setActiveTab('file'); handleReset() }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'file' ? 'bg-teal text-black' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-2"><FileText size={14} /> CSV / JSON</span>
        </button>
        <button
          onClick={() => { setActiveTab('text'); handleReset() }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'text' ? 'bg-teal text-black' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-2"><MessageSquare size={14} /> Text Paste</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-brand-red/10 border border-brand-red/20 rounded-xl"
        >
          <AlertCircle size={18} className="text-brand-red flex-shrink-0" />
          <p className="text-sm text-brand-red">{error}</p>
        </motion.div>
      )}

      {/* File Upload Tab */}
      {activeTab === 'file' && !streaming && !result && !showMapper && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`drop-zone rounded-2xl p-12 text-center cursor-pointer ${
            dragOver ? 'drag-over' : ''
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => handleFileDrop(e)}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-elevated flex items-center justify-center">
              <Upload size={28} className="text-text-muted" />
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">Drop your CSV or JSON file here</p>
              <p className="text-sm text-text-muted">or click to browse. Max 10MB.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-elevated text-xs text-text-muted">.csv</span>
              <span className="px-2.5 py-1 rounded-lg bg-elevated text-xs text-text-muted">.json</span>
            </div>
          </div>
        </div>
      )}

      {/* Column Mapper */}
      {showMapper && detection && (
        <ColumnMapper
          columns={detection.all_columns}
          detection={detection}
          preview={preview}
          onConfirm={handleMapperConfirm}
        />
      )}

      {/* Text Paste Tab */}
      {activeTab === 'text' && !streaming && !result && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., NovaBuds X1"
              className="w-full bg-elevated border border-[#374151] rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Paste Reviews (one per line)
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={8}
              placeholder="The battery life is amazing, lasts all day long.&#10;Packaging was terrible, box arrived crushed.&#10;Great sound quality for the price."
              className="w-full bg-elevated border border-[#374151] rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal outline-none resize-none"
            />
          </div>
          <button
            onClick={startTextStreaming}
            disabled={!textInput.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal text-black rounded-xl font-semibold text-sm hover:bg-teal/90 transition-all disabled:opacity-40"
          >
            <Upload size={16} />
            Analyze Reviews
          </button>
        </div>
      )}

      {/* Streaming Progress */}
      {streaming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border-dark rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="text-teal animate-spin" />
            <h3 className="text-sm font-semibold text-text-primary">Analyzing Reviews...</h3>
          </div>

          {/* Step indicators */}
          <div className="space-y-2">
            {steps.map((step, i) => {
              const stepIndex = steps.findIndex(s => s.key === currentStep)
              const thisIndex = i
              const isActive = thisIndex === stepIndex
              const isDone = thisIndex < stepIndex

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isDone ? 'bg-teal' :
                    isActive ? 'bg-teal/20 border border-teal' :
                    'bg-elevated'
                  }`}>
                    {isDone ? (
                      <Check size={12} className="text-black" />
                    ) : isActive ? (
                      <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                    ) : (
                      <span className="text-[10px] text-text-muted">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${
                    isDone ? 'text-teal' :
                    isActive ? 'text-text-primary font-medium' :
                    'text-text-muted'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-elevated rounded-full overflow-hidden">
            <div className="progress-bar h-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-text-muted text-right font-mono">{progress.toFixed(1)}%</p>

          {/* Latest reviews */}
          {latestReviews.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Latest Processed</h4>
              {latestReviews.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-2.5 bg-elevated rounded-xl animate-flash-green"
                >
                  <span className={`badge-${r.sentiment} px-1.5 py-0.5 rounded text-[10px] font-medium`}>
                    {r.sentiment}
                  </span>
                  <span className="text-xs text-text-primary truncate flex-1">{r.review_text}</span>
                  <span className="text-[10px] text-text-muted capitalize">{r.language}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Complete */}
      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-teal/30 rounded-2xl p-6 text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-teal/15 flex items-center justify-center">
            <Check size={32} className="text-teal" />
          </div>
          <h3 className="text-lg font-syne font-bold text-text-primary">Analysis Complete!</h3>
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <p className="font-mono text-xl text-teal font-bold">{result.alerts_count || 0}</p>
              <p className="text-text-muted text-xs">Alerts</p>
            </div>
            <div>
              <p className="font-mono text-xl text-brand-blue font-bold">{result.action_cards?.length || 0}</p>
              <p className="text-text-muted text-xs">Action Cards</p>
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal text-black rounded-xl font-semibold text-sm hover:bg-teal/90 transition-all"
            >
              View Dashboard <ArrowRight size={14} />
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-elevated text-text-muted rounded-xl text-sm hover:text-text-primary transition-all"
            >
              Upload More
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
