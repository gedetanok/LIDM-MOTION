import React from 'react'
import { motion } from 'framer-motion'

export function EmojiBurst({ emoji, onDone }: { emoji: string; onDone?: () => void }) {
  const N = 10
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: N }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl select-none"
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: -80 - Math.random() * 90,
            x: (Math.random() * 2 - 1) * 60,
            scale: 1,
          }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          onAnimationComplete={i === N - 1 ? onDone : undefined}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  )
}