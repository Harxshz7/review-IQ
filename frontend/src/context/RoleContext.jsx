import { createContext, useContext, useState, useEffect } from 'react'

const RoleContext = createContext()

export const useRole = () => {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

export const RoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    // Check for stored role on mount
    const storedRole = localStorage.getItem('userRole')
    if (storedRole && ['customer', 'retailer'].includes(storedRole)) {
      setUserRole(storedRole)
    }
    setRoleLoading(false)
  }, [])

  const setRole = (role) => {
    if (['customer', 'retailer'].includes(role)) {
      setUserRole(role)
      localStorage.setItem('userRole', role)
    }
  }

  const clearRole = () => {
    setUserRole(null)
    localStorage.removeItem('userRole')
  }

  const value = {
    userRole,
    setRole,
    clearRole,
    roleLoading,
    isCustomer: userRole === 'customer',
    isRetailer: userRole === 'retailer'
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}
