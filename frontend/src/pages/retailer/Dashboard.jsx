import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Star,
  AlertTriangle,
  BarChart3,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default function RetailerDashboard() {
  const [kpiData, setKpiData] = useState({
    revenue: 0,
    sentiment: 0,
    returns: 0,
    customers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call for retailer data
    setTimeout(() => {
      setKpiData({
        revenue: 245678,
        sentiment: 78.5,
        returns: 2.3,
        customers: 12456
      })
      setLoading(false)
    }, 1000)
  }, [])

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: `$${(kpiData.revenue / 1000).toFixed(0)}K`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Customer Sentiment',
      value: `${kpiData.sentiment}%`,
      change: '+3.2%',
      trend: 'up',
      icon: Star,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Return Rate',
      value: `${kpiData.returns}%`,
      change: '-0.8%',
      trend: 'down',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Active Customers',
      value: kpiData.customers.toLocaleString(),
      change: '+18.2%',
      trend: 'up',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  const topProducts = [
    { name: 'Premium Headphones', sentiment: 92, sales: 1234, trend: 'up' },
    { name: 'Wireless Earbuds', sentiment: 88, sales: 987, trend: 'up' },
    { name: 'Bluetooth Speaker', sentiment: 76, sales: 654, trend: 'down' },
    { name: 'Phone Case', sentiment: 94, sales: 543, trend: 'up' }
  ]

  const insights = [
    {
      type: 'positive',
      title: 'Customer Satisfaction Improving',
      description: 'Overall sentiment score increased by 3.2% this month',
      impact: 'high'
    },
    {
      type: 'warning',
      title: 'Return Rate for Electronics',
      description: 'Electronics category showing 15% higher return rate',
      impact: 'medium'
    },
    {
      type: 'negative',
      title: 'Shipping Complaints Rising',
      description: 'Delivery speed complaints increased significantly',
      impact: 'high'
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
          <h1 className="text-2xl font-bold text-gray-900">Retailer Dashboard</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Export Report
          </button>
          <Link
            to="/retailer/reports"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <BarChart3 size={20} />
            View Reports
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpi.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="font-medium">{kpi.change}</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            <Link
              to="/retailer/products"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales.toLocaleString()} sales</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Sentiment</p>
                    <p className={`text-lg font-bold ${
                      product.sentiment >= 90 ? 'text-green-600' :
                      product.sentiment >= 80 ? 'text-blue-600' :
                      product.sentiment >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {product.sentiment}%
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    product.trend === 'up' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {product.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Insights */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Insights</h2>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded ${
                    insight.type === 'positive' ? 'bg-green-100' :
                    insight.type === 'warning' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    {insight.type === 'positive' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : insight.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{insight.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {insight.impact} impact
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/retailer/insights"
            className="block w-full mt-4 text-center text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Insights
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/retailer/products"
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Product Insights</p>
              <p className="text-sm text-gray-500">Analyze product performance</p>
            </div>
          </div>
        </Link>

        <Link
          to="/retailer/feedback"
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Customer Feedback</p>
              <p className="text-sm text-gray-500">Review customer sentiment</p>
            </div>
          </div>
        </Link>

        <Link
          to="/retailer/reports"
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Reports</p>
              <p className="text-sm text-gray-500">Generate business reports</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
