import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Bot, Zap } from 'lucide-react'
import ReviewDrawer from './ReviewDrawer'

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'positive', label: 'Positive' },
  { key: 'negative', label: 'Negative' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'bots', label: 'Bots' },
]

const sentimentBadge = {
  positive: 'badge-positive',
  negative: 'badge-negative',
  neutral: 'badge-neutral',
  ambiguous: 'badge-neutral',
}

export default function ReviewTable({ reviews, total, page, totalPages, onPageChange, onFilterChange, onSearchChange, compact = false }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReview, setSelectedReview] = useState(null)

  const handleFilterClick = (key) => {
    setActiveFilter(key)
    onFilterChange?.(key)
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
    onSearchChange?.(e.target.value)
  }

  return (
    <>
      <div className="bg-card border border-border-dark rounded-2xl overflow-hidden">
        {/* Header with filters and search */}
        {!compact && (
          <div className="p-4 border-b border-border-dark">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleFilterClick(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeFilter === tab.key
                        ? 'bg-teal text-black'
                        : 'text-text-muted hover:text-text-primary bg-elevated hover:bg-[#374151]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="bg-elevated border border-[#374151] rounded-xl pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal outline-none w-64"
                />
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-dark">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Review</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-24">Sentiment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-24">Language</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-20">Flags</th>
              </tr>
            </thead>
            <tbody>
              {reviews && reviews.length > 0 ? (
                reviews.map((review, i) => (
                  <tr
                    key={review.id || i}
                    onClick={() => setSelectedReview(review)}
                    className="border-b border-border-dark/50 hover:bg-elevated/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm text-text-primary line-clamp-2 max-w-lg">
                        {review.review_text}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${sentimentBadge[review.overall_sentiment] || 'badge-neutral'}`}>
                        {review.overall_sentiment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-muted capitalize">
                        {review.original_language || 'english'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {review.is_bot_suspected && (
                          <span className="w-5 h-5 rounded bg-brand-amber/15 flex items-center justify-center" title="Bot suspected">
                            <Bot size={11} className="text-brand-amber" />
                          </span>
                        )}
                        {review.is_sarcastic && (
                          <span className="w-5 h-5 rounded bg-brand-purple/15 flex items-center justify-center" title="Sarcastic">
                            <Zap size={11} className="text-brand-purple" />
                          </span>
                        )}
                        {review.flagged_for_human_review && (
                          <span className="w-5 h-5 rounded bg-brand-red/15 flex items-center justify-center" title={review.flag_reason || 'Flagged'}>
                            <AlertTriangle size={11} className="text-brand-red" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-text-muted text-sm">
                    No reviews found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!compact && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-dark">
            <p className="text-xs text-text-muted">
              Showing page {page} of {totalPages} ({total} reviews)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange?.(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-all disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page <= 3 ? i + 1 : page - 2 + i
                if (pageNum > totalPages || pageNum < 1) return null
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                      pageNum === page
                        ? 'bg-teal text-black'
                        : 'text-text-muted hover:text-text-primary hover:bg-elevated'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-all disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Drawer */}
      {selectedReview && (
        <ReviewDrawer
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </>
  )
}
