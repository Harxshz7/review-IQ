import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Upload,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react'

export default function CustomerDashboard() {
  const [stats, setStats] = useState({
    totalReviews: 0,
    sentimentScore: 0,
    issuesFound: 0,
    lastUpload: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalReviews: 1247,
        sentimentScore: 78.5,
        issuesFound: 23,
        lastUpload: new Date().toISOString()
      })
      setLoading(false)
    }, 1000)
  }, [])

  const statCards = [
    {
      title: 'Total Reviews',
      value: stats.totalReviews.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All uploaded reviews'
    },
    {
      title: 'Sentiment Score',
      value: `${stats.sentimentScore}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Overall positive sentiment'
    },
    {
      title: 'Issues Found',
      value: stats.issuesFound,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Critical issues detected'
    },
    {
      title: 'Last Upload',
      value: stats.lastUpload ? new Date(stats.lastUpload).toLocaleDateString() : 'Never',
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: 'Most recent analysis'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
          <p className="text-gray-600">Monitor your review analysis and insights</p>
        </div>
        <Link
          to="/customer/upload"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Upload size={20} />
          Upload Reviews
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/customer/upload"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-blue-50 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Upload New Reviews</p>
                <p className="text-sm text-gray-500">Add CSV or JSON files for analysis</p>
              </div>
            </Link>
            <Link
              to="/customer/analysis"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-green-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Analysis Results</p>
                <p className="text-sm text-gray-500">See detailed insights and trends</p>
              </div>
            </Link>
            <Link
              to="/customer/history"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Upload History</p>
                <p className="text-sm text-gray-500">View past uploads and results</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Analysis Complete</p>
                <p className="text-sm text-gray-500">1,247 reviews processed</p>
              </div>
              <span className="text-xs text-gray-500">2h ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Critical Issue Found</p>
                <p className="text-sm text-gray-500">Packaging complaints increased</p>
              </div>
              <span className="text-xs text-gray-500">5h ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Upload className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">New Upload</p>
                <p className="text-sm text-gray-500">Customer reviews file uploaded</p>
              </div>
              <span className="text-xs text-gray-500">1d ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
