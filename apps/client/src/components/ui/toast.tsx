import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

const swift = [0.16, 1, 0.3, 1] as const

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2.5rem)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: swift }}
            className="relative overflow-hidden flex items-center gap-3 bg-surface border border-hairline-strong shadow-lg rounded-md pl-4 pr-3 py-3 pointer-events-auto"
            aria-live="polite"
          >
            <span
              className={`absolute left-0 top-0 bottom-0 w-1 ${
                item.kind === 'success' ? 'bg-positive' : 'bg-danger'
              }`}
            />
            {item.kind === 'success' ? (
              <CheckCircle2 size={18} className="text-positive shrink-0" />
            ) : (
              <CircleAlert size={18} className="text-danger shrink-0" />
            )}
            <span className="flex-1 min-w-0 text-xs font-semibold text-ink">{item.message}</span>
            <button
              onClick={() => dismiss(item.id)}
              className="text-ink-tertiary hover:text-ink transition-colors duration-[120ms] shrink-0 rounded-xs"
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
