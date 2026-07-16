import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2.5rem)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex items-center gap-2.5 bg-surface border border-hairline shadow-card rounded-xl px-3.5 py-2.5 text-sm pointer-events-auto"
            aria-live="polite"
          >
            {item.kind === 'success' ? (
              <CheckCircle2 size={16} className="text-positive shrink-0" />
            ) : (
              <CircleAlert size={16} className="text-danger shrink-0" />
            )}
            <span className="flex-1 min-w-0">{item.message}</span>
            <button
              onClick={() => dismiss(item.id)}
              className="text-ink-muted hover:text-ink transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
