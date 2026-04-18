import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">ReviewIQ</h2>
          <p className="mt-2 text-sm text-gray-600">
            Intelligent Review Analysis Platform
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
