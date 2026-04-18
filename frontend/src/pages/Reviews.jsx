import { useState, useEffect, useCallback } from 'react'
import { useProducts } from '../context/ProductContext'
import axios from 'axios'
import ReviewTable from '../components/ReviewTable'
import SkeletonLoader from '../components/SkeletonLoader'
import { MessageSquare } from 'lucide-react'

export default function Reviews() {
  const { selectedProduct } = useProducts()
  const [reviews, setReviews] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetchReviews = useCallback(async () => {
    if (!selectedProduct) return
    setLoading(true)
    try {
      const params = { page, limit, filter }
      if (search) params.search = search

      const res = await axios.get(
        `/api/reviews/${encodeURIComponent(selectedProduct)}`,
        { params }
      )
      setReviews(res.data.reviews)
      setTotal(res.data.total)
      setTotalPages(res.data.total_pages)
    } catch (err) {
      console.error('Reviews fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedProduct, page, limit, filter, search])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1)
  }, [filter, search])

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
  }

  // Debounce search
  const handleSearchChange = useCallback(
    (() => {
      let timeout
      return (value) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          setSearch(value)
        }, 400)
      }
    })(),
    []
  )

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  if (!selectedProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <MessageSquare size={36} className="text-text-muted" />
        <p className="text-text-muted">Select a product to explore reviews</p>
      </div>
    )
  }

  if (loading && reviews.length === 0) {
    return <SkeletonLoader type="table" count={8} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-syne font-bold text-text-primary">Review Explorer</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {total} reviews for <span className="text-teal">{selectedProduct}</span>
          </p>
        </div>
      </div>

      <ReviewTable
        reviews={reviews}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />
    </div>
  )
}
