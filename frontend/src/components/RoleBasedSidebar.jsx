import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useRole } from '../context/RoleContext'
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Clock,
  Package,
  Star,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  ShoppingCart
} from 'lucide-react'

export default function RoleBasedSidebar({ isOpen, onToggle }) {
  const location = useLocation()
  const { userRole, isCustomer, isRetailer, clearRole } = useRole()

  const customerNav = [
    {
      name: 'Dashboard',
      href: '/customer/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Upload Reviews',
      href: '/customer/upload',
      icon: FileText
    },
    {
      name: 'Analysis Results',
      href: '/customer/analysis',
      icon: BarChart3
    },
    {
      name: 'History',
      href: '/customer/history',
      icon: Clock
    }
  ]

  const retailerNav = [
    {
      name: 'Dashboard',
      href: '/retailer/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Product Insights',
      href: '/retailer/products',
      icon: Package
    },
    {
      name: 'Customer Feedback',
      href: '/retailer/feedback',
      icon: Star
    },
    {
      name: 'Reports',
      href: '/retailer/reports',
      icon: TrendingUp
    }
  ]

  const navigation = isCustomer ? customerNav : retailerNav

  const handleLogout = () => {
    clearRole()
    // Additional logout logic if needed
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">ReviewIQ</h1>
                <p className="text-xs text-gray-500 capitalize">{userRole} Portal</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2">
              <Link
                to="/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Switch Role</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
