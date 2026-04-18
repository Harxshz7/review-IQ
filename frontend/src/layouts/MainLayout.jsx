import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import RoleBasedSidebar from '../components/RoleBasedSidebar'
import RoleBasedTopBar from '../components/RoleBasedTopBar'

export default function MainLayout({ userRole }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <RoleBasedSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <RoleBasedTopBar userRole={userRole} />
        <main className="p-6 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
