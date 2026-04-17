import { useState, useEffect, useRef } from 'react'

/**
 * useCountUp — Animates a number from 0 to target.
 * @param {number} target - Final value
 * @param {number} duration - Animation duration in ms (default: 1200)
 * @returns {number} Current animated value
 */
export default function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  const startTime = useRef(null)
  const rafId = useRef(null)
  const prevTarget = useRef(target)

  // easeOutQuart for smooth deceleration
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4)

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }

    const startValue = prevTarget.current !== target ? 0 : 0
    prevTarget.current = target
    startTime.current = null

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutQuart(progress)
      const current = startValue + (target - startValue) * easedProgress

      // Handle decimals
      if (Number.isInteger(target)) {
        setValue(Math.round(current))
      } else {
        setValue(parseFloat(current.toFixed(1)))
      }

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate)
      }
    }

    rafId.current = requestAnimationFrame(animate)

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [target, duration])

  return value
}
