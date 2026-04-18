import { useLocation } from 'react-router-dom'
import { useProducts } from '../context/ProductContext'
import { FileDown, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const pageTitles = {
  '/': 'Dashboard',
  '/upload': 'Upload Reviews',
  '/trends': 'Trend Analysis',
  '/reviews': 'Review Explorer',
  '/alerts': 'Alert Center',
}

export default function TopBar() {
  const location = useLocation()
  const { products, selectedProduct, setSelectedProduct } = useProducts()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const dropdownRef = useRef(null)

  const title = pageTitles[location.pathname] || 'ReviewIQ'

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleDownloadReport = async () => {
    if (!selectedProduct) return
    setDownloading(true)
    try {
      const res = await axios.get(`/api/report/${encodeURIComponent(selectedProduct)}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ReviewIQ_${selectedProduct}_Report.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Report download failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-base/80 backdrop-blur-md border-b border-border-dark flex items-center justify-between px-6 z-40">
      <h2 className="text-lg font-syne font-semibold text-text-primary">{title}</h2>

      <div className="flex items-center gap-3">
        {/* Product Selector */}
        {products.length > 0 && location.pathname !== '/upload' && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-elevated border border-border-dark rounded-xl text-sm text-text-primary hover:border-[#374151] transition-all"
            >
              <span className="max-w-[180px] truncate">{selectedProduct || 'Select Product'}</span>
              <ChevronDown size={14} className={`text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border-dark rounded-xl shadow-2xl overflow-hidden z-50">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p.name)
                      setDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-elevated ${
                      selectedProduct === p.name ? 'text-teal bg-teal/5' : 'text-text-primary'
                    }`}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-text-muted">{p.total_reviews} reviews • {p.category}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generate Report */}
        {selectedProduct && location.pathname !== '/upload' && (
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal text-black rounded-xl text-sm font-semibold hover:bg-teal/90 transition-all disabled:opacity-50"
          >
            <FileDown size={14} />
            {downloading ? 'Generating...' : 'Report'}
          </button>
        )}
      </div>
    </header>
  )
}
