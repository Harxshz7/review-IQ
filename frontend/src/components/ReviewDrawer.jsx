import { motion, AnimatePresence } from 'framer-motion'
import { X, Bot, Zap, AlertTriangle, Globe } from 'lucide-react'

const featureLabels = {
  battery_life: 'Battery Life',
  build_quality: 'Build Quality',
  packaging: 'Packaging',
  delivery_speed: 'Delivery Speed',
  price_value: 'Price Value',
  customer_support: 'Customer Support',
}

const sentimentColors = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#3B82F6',
  not_mentioned: '#374151',
}

export default function ReviewDrawer({ review, onClose }) {
  if (!review) return null

  const features = review.features || {}

  return (
    <AnimatePresence>
      {review && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[440px] bg-card border-l border-border-dark z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/90 backdrop-blur-md p-4 border-b border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary font-syne">Review Details</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Sentiment & Flags */}
              <div className="flex flex-wrap gap-2">
                <span className={`badge-${review.overall_sentiment || 'neutral'} px-2.5 py-1 rounded-lg text-xs font-medium`}>
                  {review.overall_sentiment}
                </span>
                {review.is_bot_suspected && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-amber/15 text-brand-amber text-xs">
                    <Bot size={12} /> Bot
                  </span>
                )}
                {review.is_sarcastic && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-purple/15 text-brand-purple text-xs">
                    <Zap size={12} /> Sarcastic
                  </span>
                )}
                {review.flagged_for_human_review && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-red/15 text-brand-red text-xs">
                    <AlertTriangle size={12} /> Flagged
                  </span>
                )}
              </div>

              {/* Flag reason */}
              {review.flag_reason && (
                <div className="bg-brand-red/5 border border-brand-red/20 rounded-xl p-3">
                  <p className="text-xs text-brand-red">{review.flag_reason}</p>
                </div>
              )}

              {/* Original text */}
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Original Review
                </h4>
                <p className="text-sm text-text-primary leading-relaxed bg-elevated rounded-xl p-4">
                  {review.review_text}
                </p>
              </div>

              {/* Translated text */}
              {review.translated_text && review.translated_text !== review.review_text && (
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Globe size={12} /> Translated ({review.original_language})
                  </h4>
                  <p className="text-sm text-text-primary leading-relaxed bg-elevated rounded-xl p-4">
                    {review.translated_text}
                  </p>
                </div>
              )}

              {/* Language */}
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Globe size={14} />
                <span>Language: <span className="text-text-primary capitalize">{review.original_language || 'english'}</span></span>
              </div>

              {/* Feature Sentiments */}
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Feature Analysis
                </h4>
                <div className="space-y-2.5">
                  {Object.entries(featureLabels).map(([key, label]) => {
                    const feat = features[key]
                    if (!feat) return null
                    const sentiment = feat.sentiment || 'not_mentioned'
                    const confidence = feat.confidence || 0

                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-text-muted w-32">{label}</span>
                        <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: sentiment === 'not_mentioned' ? '0%' : `${confidence * 100}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: sentimentColors[sentiment] }}
                          />
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                          sentiment === 'positive' ? 'text-brand-green' :
                          sentiment === 'negative' ? 'text-brand-red' :
                          sentiment === 'neutral' ? 'text-brand-blue' :
                          'text-text-muted'
                        }`}>
                          {sentiment === 'not_mentioned' ? '—' : sentiment}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Metadata */}
              {review.submitted_at && (
                <div className="pt-3 border-t border-border-dark">
                  <p className="text-xs text-text-muted">
                    Submitted: {new Date(review.submitted_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
