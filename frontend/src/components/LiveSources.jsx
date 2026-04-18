import { useState, useEffect } from 'react'
import { Plug, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

export default function LiveSources() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false) // Start with false to prevent initial blink
  const [fetching, setFetching] = useState({})
  const [isMounted, setIsMounted] = useState(true)

  useEffect(() => {
    if (isMounted) {
      fetchSources()
    }
  }, [isMounted])

  // Prevent UI collapse on mount - ensure stable loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 300) // Increased timeout for stability
    return () => clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    setIsComponentMounted(true)
    return () => {
      setIsComponentMounted(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (isComponentMounted) {
      console.log('All localStorage keys:', allKeys)
      
      // Try multiple possible token keys
      const token = localStorage.getItem('reviewiq_token') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken') ||
                      localStorage.getItem('access_token')
      
      console.log('Retrieved token:', token)
      
      if (!token) {
        console.error('No token found')
        setSources([])
        setLoading(false)
        return
      }
      
      const response = await axios.get('/api/retailer/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSources(response.data.apis || [])
    } catch (error) {
      console.error('Failed to fetch sources:', error)
      setSources([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSources = async () => {
    setLoading(true)
    try {
      // Debug: Check what's in localStorage
      const allKeys = Object.keys(localStorage)
      console.log('All localStorage keys:', allKeys)
      
      // Try multiple possible token keys
      const token = localStorage.getItem('reviewiq_token') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken') ||
                      localStorage.getItem('access_token')
      
      console.log('Retrieved token:', token)
      
      if (!token) {
        console.error('No token found')
        setSources([])
        setLoading(false)
        return
      }
      
      const response = await axios.get('/api/retailer/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSources(response.data.apis || [])
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
      const token = localStorage.getItem('reviewiq_token')
      const eventSource = new EventSource(
        `/api/retailer/${sourceId}/fetch?token=${token}`,
        { withCredentials: true }
      )

      let currentProgress = 0
      let totalReviews = 0

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'pipeline_complete':
            totalReviews = data.total_reviews
            break
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        setFetching(prev => ({ ...prev, [sourceId]: false }))
      }

      // Auto-close after completion
      setTimeout(() => {
        eventSource.close()
        setFetching(prev => ({ ...prev, [sourceId]: false }))
        fetchSources() // Refresh the sources list
      }, 30000)

    } catch (error) {
      setFetching(prev => ({ ...prev, [sourceId]: false }))
      console.error('Failed to fetch from source:', error)
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getTodayCount = (source) => {
    if (!source.last_fetched_at) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastFetch = new Date(source.last_fetched_at)
    return lastFetch >= today ? source.total_fetched : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    )
  }

  if (sources.length === 0) {
    return (
      <div className="text-center py-8">
        <Plug className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/60 text-sm">No connected sources</p>
        <p className="text-white/40 text-xs mt-1">Connect your retailer APIs to see live data</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <div key={source.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              source.status === 'connected' 
                ? 'bg-green-500 animate-pulse' 
                : source.status === 'error'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`} />
            <div>
              <p className="text-sm font-medium text-white">{source.retailer_name}</p>
              <p className="text-xs text-white/60 font-mono">
                Last synced: {formatTimeAgo(source.last_fetched_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-mono font-bold text-teal">
                {getTodayCount(source).toLocaleString()}
              </p>
              <p className="text-xs text-white/60">today</p>
            </div>

            <button
              onClick={() => fetchFromSource(source.id)}
              disabled={fetching[source.id]}
              className="px-3 py-1.5 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {fetching[source.id] ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Fetch Latest
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
