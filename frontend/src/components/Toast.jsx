import { useToast } from '../context/ToastContext'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const toastConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-brand-green/15 border-brand-green/30',
    text: 'text-brand-green',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-brand-red/15 border-brand-red/30',
    text: 'text-brand-red',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-brand-amber/15 border-brand-amber/30',
    text: 'text-brand-amber',
  },
  info: {
    icon: Info,
    bg: 'bg-brand-blue/15 border-brand-blue/30',
    text: 'text-brand-blue',
  },
}

export default function Toast() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = toastConfig[toast.type] || toastConfig.info
          const Icon = config.icon

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl max-w-sm ${config.bg}`}
            >
              <Icon size={18} className={config.text} />
              <p className="text-sm text-text-primary flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
