import { useState, useEffect } from 'react'
import { Plug, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

export default function LiveSourcesFixed() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState({})
  const [progress, setProgress] = useState({})
  const [totals, setTotals] = useState({})

  // Initialize component on mount
  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    setLoading(true)
    try {
      // Get token with fallbacks
      const token = localStorage.getItem('reviewiq_token') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken') ||
                      localStorage.getItem('access_token')
      
      if (!token) {
        console.warn('No authentication token found')
        setSources([])
        setLoading(false)
        return
      }
      
      const response = await axios.get('/api/retailer/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data && response.data.apis) {
        setSources(response.data.apis)
      } else {
        setSources([])
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error)
      setSources([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFromSource = async (sourceId) => {
    setFetching(prev => ({ ...prev, [sourceId]: true }))
    
    try {
      const token = localStorage.getItem('reviewiq_token') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken') ||
                      localStorage.getItem('access_token')
      
      if (!token) {
        console.error('No token found')
        return
      }
      
      const eventSource = new EventSource(
        `/api/retailer/${sourceId}/fetch?token=${token}`,
        { withCredentials: true }
      )

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.type === 'progress') {
          setProgress(prev => ({ ...prev, [sourceId]: Math.round((data.current / data.total) * 100) }))
          setTotals(prev => ({ ...prev, [sourceId]: data.total }))
        }
        
        if (data.type === 'complete') {
          setFetching(prev => ({ ...prev, [sourceId]: false }))
          setSources(prev => prev.map(source => 
            source.id === sourceId ? { ...source, total_fetched: data.total || 0 } : source
          ))
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error)
        setFetching(prev => ({ ...prev, [sourceId]: false }))
      }
      
      eventSource.onclose = () => {
        setFetching(prev => ({ ...prev, [sourceId]: false }))
      }

      return () => {
        eventSource.close()
      }
    } catch (error) {
      console.error('Failed to fetch from source:', error)
      setFetching(prev => ({ ...prev, [sourceId]: false }))
    }
  }

  const deleteApi = async (sourceId) => {
    if (!confirm('Are you sure you want to remove this API connection?')) return
    
    try {
      const token = localStorage.getItem('reviewiq_token') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken') ||
                      localStorage.getItem('access_token')
      
      await axios.delete(`/api/retailer/${sourceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      await fetchSources()
    } catch (error) {
      console.error('Failed to delete API:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!loading && sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-teal/20 to-violet/20 border border-white/10 flex items-center justify-center animate-float">
            <Plug size={40} className="text-teal" />
          </div>
          <div className="absolute -inset-4 bg-teal/10 blur-3xl -z-10 rounded-full" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-syne font-black text-text-primary tracking-tight">No Live Sources</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">Connect your first retailer API to start monitoring reviews in real-time.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Live Sources</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchSources}
            className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/80 transition-all flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Sources
          </button>
        </div>
      </div>

      {sources.map((source) => (
        <div key={source.id} className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">{source.retailer_name}</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  source.status === 'connected' ? 'bg-green/15 text-green' : 
                  source.status === 'fetching' ? 'bg-blue/15 text-blue' : 
                  source.status === 'error' ? 'bg-red/15 text-red' : 
                  'bg-white/5 text-text-muted'
                }`}>
                  {source.status === 'connected' ? 'Connected' : 
                   source.status === 'fetching' ? 'Fetching...' : 
                   source.status === 'error' ? 'Error' : 'Unknown'}
                </span>
                <span className="text-text-muted text-xs">
                  {source.last_fetched_at && `Last synced: ${new Date(source.last_fetched_at).toLocaleDateString()}`}
                  {source.total_fetched && `• ${source.total_fetched} reviews fetched`}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => fetchFromSource(source.id)}
                disabled={fetching[source.id] || source.status === 'fetching'}
                className="px-3 py-2 bg-teal text-white rounded-lg hover:bg-teal/80 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {fetching[source.id] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Fetch Latest
                  </>
                )}
              </button>
              
              <button
                onClick={() => deleteApi(source.id)}
                disabled={fetching[source.id]}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {fetching[source.id] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Remove
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            {fetching[source.id] && (
              <div className="bg-teal/10 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-white font-medium">Fetching reviews...</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-3">
                  <div 
                    className="bg-teal/500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress[source.id] || 0}%` }}
                  />
                </div>
                <p className="text-center text-white text-xs font-medium">
                  {progress[source.id] || 0}% complete ({totals[source.id] || 0} reviews)
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
