import { useEffect, useRef, useState } from 'react'

export const PlumBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const stopperRef = useRef<number | null>(null)

  // Configuration
  const r180 = Math.PI
  const r15 = Math.PI / 12
  const { random } = Math
  const MIN_BRANCH = 30
  const len = 4

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width === 0 || size.height === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = size.width
    const height = size.height

    // High DPI setup
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Styling - subtle white lines
    const isMobile = width < 768
    const opacity = isMobile ? 0.015 : 0.05
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
    ctx.lineWidth = 1

    let steps: (() => void)[] = []
    let prevSteps: (() => void)[] = []

    const step = (x: number, y: number, rad: number, counter = { value: 0 }) => {
      const length = random() * len
      counter.value += 1

      const [nx, ny] = polar2cart(x, y, length, rad)

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(nx, ny)
      ctx.stroke()

      const rad1 = rad + random() * r15
      const rad2 = rad - random() * r15

      if (nx < -100 || nx > width + 100 || ny < -100 || ny > height + 100) return

      const rate = counter.value <= MIN_BRANCH ? 0.8 : 0.5

      if (random() < rate) steps.push(() => step(nx, ny, rad1, counter))
      if (random() < rate) steps.push(() => step(nx, ny, rad2, counter))
    }

    const polar2cart = (x = 0, y = 0, r = 0, theta = 0): [number, number] => {
      const dx = r * Math.cos(theta)
      const dy = r * Math.sin(theta)
      return [x + dx, y + dy]
    }

    let lastTime = performance.now()
    const interval = 1000 / 30

    const frame = () => {
      if (performance.now() - lastTime < interval) {
        stopperRef.current = requestAnimationFrame(frame)
        return
      }

      prevSteps = steps
      steps = []
      lastTime = performance.now()

      if (!prevSteps.length) return

      prevSteps.forEach((i) => {
        if (random() < 0.5) steps.push(i)
        else i()
      })

      stopperRef.current = requestAnimationFrame(frame)
    }

    const randomMiddle = () => random() * 0.6 + 0.2

    const start = () => {
      ctx.clearRect(0, 0, width, height)
      steps = [
        () => step(0, randomMiddle() * height, 0),
        () => step(0, randomMiddle() * height, 0),
        () => step(width, randomMiddle() * height, r180),
        () => step(width, randomMiddle() * height, r180),
      ]
      if (width < 500) steps = steps.slice(0, 2)
      frame()
    }

    start()

    return () => {
      if (stopperRef.current) cancelAnimationFrame(stopperRef.current)
    }
  }, [size])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <canvas ref={canvasRef} />
    </div>
  )
}
