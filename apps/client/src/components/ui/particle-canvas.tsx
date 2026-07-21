import { useEffect, useRef } from 'react'

interface ParticleCanvasProps {
  pointerSize?: number
  pointerColor?: string
}

export function ParticleCanvas({ pointerSize = 4, pointerColor = 'white' }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return

    const ctx = c.getContext('2d')
    if (!ctx) return
    let s: number

    const resizeCanvas = () => {
      c.width = window.innerWidth
      c.height = window.innerHeight
      s = Math.min(c.width, c.height) // scale based on smaller dimension
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const opts = {
      particles: 340,
      particleBaseSize: 5,
      particleAddedSize: 3,
      particleMaxSize: 9,
      particleBaseLight: 18,
      particleAddedLight: 55,
      particleBaseBaseAngSpeed: 0.003,
      particleAddedBaseAngSpeed: 0.003,
      particleBaseVariedAngSpeed: 0.002,
      particleAddedVariedAngSpeed: 0.002,
      sourceBaseSize: 5,
      sourceAddedSize: 4,
      sourceBaseAngSpeed: -0.02,
      sourceVariedAngSpeed: 0.01,
      sourceBaseDist: 220,
      sourceVariedDist: 95,
      particleTemplateColor: 'hsla(hue,85%,light%,alp)',
      repaintColor: 'rgba(0,0,0,.08)',
      enableTrails: false,
    }

    const util = {
      square: (x: number) => x * x,
      tau: Math.PI * 2,
    }

    const particles: Particle[] = []

    class Source {
      x: number
      y: number
      rad: number
      mouseControlled: boolean

      constructor() {
        this.x = 0
        this.y = 0
        this.rad = Math.random() * util.tau
        this.mouseControlled = false
      }

      step() {
        if (!this.mouseControlled) {
          const angSpeed =
            opts.sourceBaseAngSpeed +
            Math.sin(this.rad * 6 + tick / 100) * opts.sourceVariedAngSpeed
          this.rad += angSpeed
          const dist =
            opts.sourceBaseDist + Math.sin(this.rad * 5 + tick / 100) * opts.sourceVariedDist
          this.x = dist * Math.cos(this.rad)
          this.y = dist * Math.sin(this.rad)
        }

        ctx.fillStyle = pointerColor
        ctx.beginPath()
        ctx.arc(this.x, this.y, pointerSize, 0, util.tau)
        ctx.fill()
      }
    }

    const source = new Source()
    let tick = 0

    class Particle {
      dist: number
      rad: number
      baseAngSpeed: number
      variedAngSpeed: number
      size: number

      constructor() {
        this.dist = (Math.sqrt(Math.random()) * s) / 1.7
        this.rad = Math.random() * util.tau
        this.baseAngSpeed =
          opts.particleBaseBaseAngSpeed + opts.particleAddedBaseAngSpeed * Math.random()
        this.variedAngSpeed =
          opts.particleBaseVariedAngSpeed + opts.particleAddedVariedAngSpeed * Math.random()
        this.size = opts.particleBaseSize + opts.particleAddedSize * Math.random()
      }

      step() {
        const angSpeed =
          this.baseAngSpeed + this.variedAngSpeed * Math.sin(this.rad * 7 + tick / 100)
        this.rad += angSpeed
        const x = this.dist * Math.cos(this.rad)
        const y = this.dist * Math.sin(this.rad)
        const squareDist = util.square(x - source.x) + util.square(y - source.y)
        const sizeProp = Math.sqrt(s) / Math.sqrt(squareDist)
        const color = opts.particleTemplateColor
          .replace('hue', ((this.rad / util.tau) * 360 + tick * 1.5).toString())
          .replace(
            'light',
            (opts.particleBaseLight + sizeProp * opts.particleAddedLight).toString(),
          )
          .replace('alp', '0.9')

        // High-energy jitter & firefly oscillation
        const jitterX = Math.sin(tick * 0.25 + this.rad * 3) * 5 + (Math.random() - 0.5) * 2.5
        const jitterY = Math.cos(tick * 0.25 + this.rad * 3) * 5 + (Math.random() - 0.5) * 2.5

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(
          x + jitterX,
          y + jitterY,
          Math.min(this.size * sizeProp, opts.particleMaxSize),
          0,
          util.tau,
        )
        ctx.fill()
      }
    }

    let rafId = 0

    function anim() {
      rafId = window.requestAnimationFrame(anim)
      tick++
      if (!opts.enableTrails) ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = opts.repaintColor
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.globalCompositeOperation = 'lighter'
      if (particles.length < opts.particles) particles.push(new Particle())
      ctx.save()
      ctx.translate(c.width / 2, c.height / 2)
      source.step()
      for (const p of particles) {
        p.step()
      }
      ctx.restore()
    }

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, c.width, c.height)

    // Respect reduced motion: leave a still dark canvas, run no loop at all.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduced) anim()

    // Pause the loop whenever the tab is hidden so it never burns CPU in the
    // background or competes with scrolling elsewhere; resume when visible.
    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(rafId)
        rafId = 0
      } else if (!reduced && !rafId) {
        anim()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    const handleMouseMove = (e: MouseEvent) => {
      const bbox = c.getBoundingClientRect()
      source.x = e.clientX - bbox.left - c.width / 2
      source.y = e.clientY - bbox.top - c.height / 2
      source.mouseControlled = true
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const bbox = c.getBoundingClientRect()
      source.x = e.clientX - bbox.left - c.width / 2
      source.y = e.clientY - bbox.top - c.height / 2
      source.rad = Math.atan2(source.y, source.x)
      source.mouseControlled = false
    }

    c.addEventListener('mousemove', handleMouseMove)
    c.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('visibilitychange', onVisibility)
      c.removeEventListener('mousemove', handleMouseMove)
      c.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [pointerSize, pointerColor])

  return <canvas ref={canvasRef} className="w-full h-full bg-black block animate-fade-in" />
}
