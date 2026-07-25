import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

const FAQS = [
  {
    q: 'Is StudYou free?',
    a: 'Yes. There are no agency fees and no commissions, because there is no agency and no middleman. That is the whole point: the same official information those agencies charge for, laid out for you directly.',
  },
  {
    q: 'Is this legal or immigration advice?',
    a: 'No. StudYou is guidance and signposting only, not legal or immigration advice. Every requirement links back to its official source, such as gov.uk or UKVI, and you should always confirm the details there before you act.',
  },
  {
    q: 'Where does the information come from?',
    a: 'Only official sources: UK Visas and Immigration, gov.uk, UCAS, the NHS, approved English test providers, and universities own admissions pages. Each item carries a last-updated date and a link straight to where it is published.',
  },
  {
    q: 'Which countries does it cover?',
    a: 'The UK for now. The data model was built country agnostic from day one, so every requirement, cost, and rule already carries a country reference. Adding more countries is data entry, not a rewrite.',
  },
  {
    q: 'Do I need an account?',
    a: 'Yes, and it is free. Your roadmap, budget, and deadlines are personal to your intake and your home currency, so they live behind your own account rather than being generic.',
  },
  {
    q: 'Can StudYou guarantee a visa or an offer?',
    a: 'No, and be wary of anyone who claims they can. StudYou helps you prepare the right things in the right order and on time. The decisions themselves rest with the universities and with UKVI.',
  },
]

function FaqItem({
  faq,
  isOpen,
  onToggle,
  index,
}: {
  faq: (typeof FAQS)[number]
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  const panelId = `faq-panel-${index}`
  const buttonId = `faq-button-${index}`

  return (
    <div
      className={`group rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
        isOpen
          ? 'border-accent/40 bg-[color:var(--surface)]/70 shadow-xl shadow-accent/5'
          : 'border-hairline bg-[color:var(--canvas)]/50 hover:border-white/20'
      }`}
    >
      <button
        type="button"
        id={buttonId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span
          className={`text-body font-semibold transition-colors duration-200 ${
            isOpen ? 'text-accent' : 'text-ink group-hover:text-accent'
          }`}
        >
          {faq.q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-accent' : 'text-ink-tertiary'
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.section
            key="content"
            id={panelId}
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <p className="text-body leading-relaxed text-ink-secondary">{faq.a}</p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      aria-label="Frequently asked questions"
      className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        {/* Left column */}
        <div className="h-max lg:sticky lg:top-24">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-accent">
            Before you start
          </p>
          <h2 className="mt-2 font-podium text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            Questions,{' '}
            <span className="bg-clip-text text-transparent [background-image:var(--accent-gradient)]">
              answered
            </span>
            .
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-secondary">
            Everything a prospective international student asks before trusting a self-service
            roadmap over an agency.
          </p>

          {/* Required legal disclaimer card */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-hairline bg-[color:var(--canvas)]/50 px-5 py-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-caption leading-relaxed text-ink-secondary">
              StudYou provides guidance and signposting only. It is not legal or immigration advice.
              Always confirm details on official sources such as gov.uk.
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={faq.q}
              faq={faq}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
