import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const ProductContext = createContext(null)

export function ProductProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchProducts = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const res = await axios.get('/api/products')
      setProducts(res.data)
      if (res.data.length > 0 && !selectedProduct) {
        setSelectedProduct(res.data[0].name)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts()
    } else {
      setProducts([])
      setSelectedProduct(null)
    }
  }, [isAuthenticated])

  return (
    <ProductContext.Provider value={{
      products,
      selectedProduct,
      setSelectedProduct,
      fetchProducts,
      loading,
    }}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (!context) throw new Error('useProducts must be used within ProductProvider')
  return context
}

export default ProductContext
