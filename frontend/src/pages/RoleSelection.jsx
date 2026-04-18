import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../context/RoleContext'
import { 
  Users, 
  Store, 
  ArrowRight,
  FileText,
  TrendingUp,
  BarChart3,
  Package,
  Star
} from 'lucide-react'

export default function RoleSelection() {
  const navigate = useNavigate()
  const { setRole } = useRole()
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)

  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      description: 'Upload and analyze your reviews',
      icon: Users,
      color: 'blue',
      features: [
        { icon: FileText, text: 'Upload review files' },
        { icon: TrendingUp, text: 'View sentiment analysis' },
        { icon: BarChart3, text: 'Track issues and insights' }
      ]
    },
    {
      id: 'retailer',
      title: 'Retailer',
      description: 'Business insights and analytics',
      icon: Store,
      color: 'purple',
      features: [
        { icon: Package, text: 'Product performance metrics' },
        { icon: Star, text: 'Customer sentiment tracking' },
        { icon: TrendingUp, text: 'Business KPIs and reports' }
      ]
    }
  ]

  const handleRoleSelect = async (role) => {
    setSelectedRole(role)
    setLoading(true)

    // Simulate API call or processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    setRole(role)
    navigate(`/${role}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to ReviewIQ
          </h1>
          <p className="text-lg text-gray-600">
            Choose your role to get started with intelligent review analysis
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`relative bg-white rounded-2xl p-8 border-2 transition-all cursor-pointer ${
                selectedRole === role.id
                  ? `border-${role.color}-500 shadow-lg`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => !loading && setSelectedRole(role.id)}
            >
              {selectedRole === role.id && (
                <div className={`absolute top-4 right-4 w-6 h-6 bg-${role.color}-500 rounded-full flex items-center justify-center`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 bg-${role.color}-50 rounded-xl`}>
                  <role.icon className={`w-8 h-8 text-${role.color}-600`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{role.title}</h2>
                  <p className="text-gray-600">{role.description}</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {role.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`p-2 bg-${role.color}-50 rounded-lg`}>
                      <feature.icon className={`w-4 h-4 text-${role.color}-600`} />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleRoleSelect(role.id)}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedRole === role.id
                    ? `bg-${role.color}-600 text-white hover:bg-${role.color}-700`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {loading && selectedRole === role.id ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    Continue as {role.title}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            You can change your role later in settings
          </p>
        </div>
      </div>
    </div>
  )
}
