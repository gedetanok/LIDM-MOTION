import React from 'react'
import { motion } from 'framer-motion'

// Full-screen playful burst similar to IG story reactions
export function EmojiBurst({ emoji, onDone }: { emoji: string; onDone?: () => void }) {
  const total = 28
  const duration = 1.4
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {/* central pop */}
      <motion.span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl select-none drop-shadow"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.2, 1], opacity: [0, 1, 1], y: [-8, -18, -26] }}
        transition={{ times: [0, 0.35, 1], duration: duration * 0.6, ease: 'easeOut' }}
      >
        {emoji}
      </motion.span>

      {/* screen-covering confetti of the same emoji */}
      {Array.from({ length: total }).map((_, i) => {
        const delay = 0.02 * i
        const dir = Math.random() > 0.5 ? 1 : -1
        const xSpread = (50 + Math.random() * 200) * dir
        const yUp = 180 + Math.random() * 220
        const scale = 1 - (i / total) * 1
        const rot = Math.random() * 40 - 20
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl select-none"
            initial={{ opacity: 0, x: 0, y: 0, scale }}
            animate={{ opacity: [0, 1, 1, 0], x: [0, xSpread * 0.6, xSpread], y: [0, -yUp * 0.6, -yUp], rotate: rot }}
            transition={{ duration, ease: 'easeOut', delay }}
            onAnimationComplete={i === total - 1 ? onDone : undefined}
          >
            {emoji}
          </motion.span>
        )
      })}
    </div>
  )
}