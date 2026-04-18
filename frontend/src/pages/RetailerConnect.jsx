import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plug, Download, CheckCircle, XCircle, Loader2, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

export default function RetailerConnect() {
  const navigate = useNavigate()
  const [apis, setApis] = useState([])
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectionTest, setConnectionTest] = useState(null)
  const [fetching, setFetching] = useState({})
  const [expandedGuide, setExpandedGuide] = useState(false)

  const [formData, setFormData] = useState({
    retailer_name: '',
    api_url: ''
  })

  useEffect(() => {
    fetchApis()
  }, [])

  const fetchApis = async () => {
    try {
      const token = localStorage.getItem('reviewiq_token')
      const response = await axios.get('/api/retailer/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setApis(response.data.apis || [])
    } catch (error) {
      console.error('Failed to fetch APIs:', error)
    }
  }

  const testConnection = async () => {
    setConnecting(true)
    setConnectionTest(null)

    // Step 1: Pinging API
    setConnectionTest({ step: 1, status: 'loading', message: 'Pinging API...' })
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 2: Verifying response format
    setConnectionTest({ step: 2, status: 'loading', message: 'Verifying response format...' })
    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      const token = localStorage.getItem('reviewiq_token')
      const response = await axios.post('/api/retailer/connect', {
        retailer_name: formData.retailer_name,
        api_url: formData.api_url,
        api_key: '' // No API key needed for public API
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        // Step 3: Connected!
        setConnectionTest({ 
          step: 3, 
          status: 'success', 
          message: `Connected! Found ${response.data.total_reviews} reviews`,
          totalReviews: response.data.total_reviews
        })
        
        // Reset form and refresh list
        setFormData({ retailer_name: '', api_url: '' })
        await fetchApis()
        
        setTimeout(() => {
          setConnectionTest(null)
        }, 3000)
      } else {
        setConnectionTest({ 
          step: 3, 
          status: 'error', 
          message: response.data.error || 'Connection failed - check URL' 
        })
      }
    } catch (error) {
      setConnectionTest({ 
        step: 3, 
        status: 'error', 
        message: error.response?.data?.detail || 'Connection failed - check URL' 
      })
    } finally {
      setConnecting(false)
    }
  }

  const fetchFromApi = async (apiId) => {
    setFetching(prev => ({ ...prev, [apiId]: true }))
    
    try {
      const token = localStorage.getItem('reviewiq_token')
      const eventSource = new EventSource(
        `/api/retailer/${apiId}/fetch?token=${token}`,
        { withCredentials: true }
      )

      let currentProgress = 0
      let totalReviews = 0

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'pipeline_started':
            setFetching(prev => ({ 
              ...prev, 
              [apiId]: { 
                ...prev[apiId], 
                message: data.message,
                stage: 'started'
              } 
            }))
            break
            
          case 'batch_created':
            totalReviews = data.total_reviews
            setFetching(prev => ({ 
              ...prev, 
              [apiId]: { 
                ...prev[apiId], 
                message: `Starting analysis of ${totalReviews} reviews...`,
                stage: 'processing'
              } 
            }))
            break
            
          case 'preprocessing_complete':
            setFetching(prev => ({ 
              ...prev, 
              [apiId]: { 
                ...prev[apiId], 
                message: `Preprocessed ${data.clean_reviews} reviews...`,
                stage: 'processing'
              } 
            }))
            break
            
          case 'ai_analysis_complete':
            setFetching(prev => ({ 
              ...prev, 
              [apiId]: {
                ...prev[apiId],
                message: `Analyzed ${data.reviews_analyzed} reviews...`,
                stage: 'analyzing'
              }
            }))
            break
            
          case 'pipeline_complete':
            setFetching(prev => ({ 
              ...prev, 
              [apiId]: { 
                ...prev[apiId], 
                message: `Successfully analyzed ${data.total_reviews} reviews - View Dashboard`,
                stage: 'complete',
                totalReviews: data.total_reviews
              } 
            }))
            
            setTimeout(() => {
              setFetching(prev => ({ ...prev, [apiId]: false }))
              navigate('/dashboard')
            }, 2000)
            break
            
          default:
            if (data.message) {
              setFetching(prev => ({ 
                ...prev, 
                [apiId]: { 
                  ...prev[apiId], 
                  message: data.message 
                } 
              }))
            }
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        setFetching(prev => ({ ...prev, [apiId]: false }))
      }

      // Auto-close after 5 minutes
      setTimeout(() => {
        eventSource.close()
        setFetching(prev => ({ ...prev, [apiId]: false }))
      }, 300000)

    } catch (error) {
      setFetching(prev => ({ ...prev, [apiId]: false }))
      console.error('Failed to fetch from API:', error)
    }
  }

  const deleteApi = async (apiId) => {
    if (!confirm('Are you sure you want to remove this API connection?')) return
    
    try {
      const token = localStorage.getItem('reviewiq_token')
      await axios.delete(`/api/retailer/${apiId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      await fetchApis()
    } catch (error) {
      console.error('Failed to delete API:', error)
    }
  }

  const downloadPhpFile = () => {
    const phpContent = `<?php
/**
 * ReviewIQ Retailer API
 * Set your API key below
 */
$API_KEY = "your_secure_api_key_here";
$CSV_FILE = "reviews.csv";

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
if ((\$_GET['api_key'] ?? '') !== $API_KEY) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

// Check if CSV exists
if (!file_exists($CSV_FILE)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'CSV not found']);
    exit();
}

// Read and return reviews
$reviews = [];
$handle = fopen($CSV_FILE, 'r');
$headers = fgetcsv($handle);

while (($row = fgetcsv($handle)) !== false) {
    if (empty(array_filter($row))) continue;
    
    $reviews[] = [
        'id' => count($reviews) + 1,
        'product_name' => $row[0] ?? 'Unknown',
        'review_text' => $row[1] ?? '',
        'submitted_at' => $row[2] ?? date('Y-m-d'),
        'rating' => isset($row[3]) ? intval($row[3]) : null,
        'source' => 'retailer_api'
    ];
}

fclose($handle);

echo json_encode([
    'success' => true,
    'source' => 'retailer_api',
    'retailer' => 'Your Store',
    'product' => $reviews[0]['product_name'] ?? 'Product',
    'total' => count($reviews),
    'reviews' => array_slice($reviews, 0, intval(\$_GET['limit'] ?? 50))
]);
?>`

    const blob = new Blob([phpContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reviews_api.php'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-syne font-black text-white tracking-tight leading-none uppercase italic">
          Retailer API <span className="text-teal not-italic">Connect</span>
        </h1>
        <p className="text-text-muted mt-2 font-mono text-[9px] uppercase tracking-[0.2em]">
          Fetch real-time reviews directly from your store
        </p>
      </div>

      {/* Connect New API */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
            <Plug className="w-5 h-5 text-teal" />
          </div>
          <div>
            <h2 className="text-lg font-syne font-bold text-white">Connect Retailer API</h2>
            <p className="text-sm text-text-muted">Fetch real-time reviews directly from your store</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              API Endpoint URL
            </label>
            <input
              type="url"
              placeholder="https://yourstore.com/reviews_api.php"
              value={formData.api_url}
              onChange={(e) => setFormData(prev => ({ ...prev, api_url: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-teal/50 focus:bg-white/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Retailer Name
            </label>
            <input
              type="text"
              placeholder="My Store"
              value={formData.retailer_name}
              onChange={(e) => setFormData(prev => ({ ...prev, retailer_name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-teal/50 focus:bg-white/10 transition-all"
            />
          </div>

          <button
            onClick={testConnection}
            disabled={connecting || !formData.api_url || !formData.retailer_name}
            className="w-full py-3 bg-gradient-to-r from-teal to-teal/80 text-white font-bold rounded-lg hover:from-teal/90 hover:to-teal/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Plug className="w-4 h-4" />
                Test & Connect
              </>
            )}
          </button>
        </div>

        {/* Connection Test Results */}
        {connectionTest && (
          <div className={`mt-4 p-4 rounded-lg border flex items-center gap-3 ${
            connectionTest.status === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : connectionTest.status === 'loading'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {connectionTest.status === 'success' && <CheckCircle className="w-5 h-5" />}
            {connectionTest.status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {connectionTest.status === 'error' && <XCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{connectionTest.message}</span>
          </div>
        )}
      </div>

      {/* Connected APIs */}
      {apis.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-syne font-bold text-white">Your Connected Sources</h2>
          <div className="space-y-3">
            {apis.map((api) => (
              <div key={api.id} className={`glass-card p-4 border-l-4 ${
                api.status === 'connected' 
                  ? 'border-l-green-500' 
                  : api.status === 'error'
                  ? 'border-l-red-500'
                  : 'border-l-yellow-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-2 h-2 rounded-full ${
                        api.status === 'connected' 
                          ? 'bg-green-500 animate-pulse' 
                          : api.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`} />
                      <h3 className="font-syne font-bold text-white">{api.retailer_name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-mono ${
                        api.status === 'connected' 
                          ? 'bg-green-500/20 text-green-400' 
                          : api.status === 'error'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {api.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-text-muted font-mono">
                      <p className="truncate">{api.api_url}</p>
                      <p>Last fetched: {formatTimeAgo(api.last_fetched_at)}</p>
                      <p>Total reviews fetched: {api.total_fetched.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {fetching[api.id] ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {fetching[api.id]?.message || 'Fetching...'}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => fetchFromApi(api.id)}
                          className="px-3 py-1 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors text-xs font-medium flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Fetch Now
                        </button>
                        
                        <button
                          onClick={() => deleteApi(api.id)}
                          className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-xs font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Guide */}
      <div className="glass-card p-6">
        <button
          onClick={() => setExpandedGuide(!expandedGuide)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-lg font-syne font-bold text-white">Setup Guide</h2>
          <div className={`transform transition-transform ${expandedGuide ? 'rotate-180' : ''}`}>
            <Download className="w-5 h-5 text-teal" />
          </div>
        </button>

        {expandedGuide && (
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-syne font-bold text-white mb-2">Download PHP API file</h3>
                  <button
                    onClick={downloadPhpFile}
                    className="px-4 py-2 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download reviews_api.php
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-syne font-bold text-white mb-2">Upload to your server</h3>
                  <p className="text-sm text-text-muted">
                    Upload the PHP file and your reviews.csv to the same directory on your server (e.g., AlwaysData, InfinityFree)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-syne font-bold text-white mb-2">Set your API key</h3>
                  <p className="text-sm text-text-muted mb-3">
                    Edit the PHP file and change the $API_KEY variable at the top:
                  </p>
                  <div className="bg-black/50 border border-white/10 rounded-lg p-3">
                    <code className="text-teal text-sm">$API_KEY = "your_secure_api_key_here";</code>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal font-bold text-sm">4</span>
                </div>
                <div>
                  <h3 className="font-syne font-bold text-white mb-2">Connect in ReviewIQ</h3>
                  <p className="text-sm text-text-muted mb-3">
                    Paste your API URL above and connect. Your CSV should have this format:
                  </p>
                  <div className="bg-black/50 border border-white/10 rounded-lg p-3">
                    <pre className="text-teal text-sm">
product_name,review_text,submitted_at,rating
NovaBuds X1,"Amazing sound quality",2024-04-08,5
Wireless Earbuds,"Great battery life",2024-04-07,4
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
