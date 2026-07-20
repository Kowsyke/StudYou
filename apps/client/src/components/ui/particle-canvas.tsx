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
      particles: 200,
      particleBaseSize: 4,
      particleAddedSize: 1,
      particleMaxSize: 5,
      particleBaseLight: 5,
      particleAddedLight: 30,
      particleBaseBaseAngSpeed: 0.001,
      particleAddedBaseAngSpeed: 0.001,
      particleBaseVariedAngSpeed: 0.0005,
      particleAddedVariedAngSpeed: 0.0005,
      sourceBaseSize: 3,
      sourceAddedSize: 3,
      sourceBaseAngSpeed: -0.01,
      sourceVariedAngSpeed: 0.005,
      sourceBaseDist: 130,
      sourceVariedDist: 50,
      particleTemplateColor: 'hsla(hue,80%,light%,alp)',
      repaintColor: 'rgba(0,0,0,.1)',
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
        this.dist = (Math.sqrt(Math.random()) * s) / 2
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
          .replace('hue', ((this.rad / util.tau) * 360 + tick).toString())
          .replace(
            'light',
            (opts.particleBaseLight + sizeProp * opts.particleAddedLight).toString(),
          )
          .replace('alp', '0.8')

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, Math.min(this.size * sizeProp, opts.particleMaxSize), 0, util.tau)
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
    anim()

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
      c.removeEventListener('mousemove', handleMouseMove)
      c.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [pointerSize, pointerColor])

  return <canvas ref={canvasRef} className="w-full h-full bg-black block animate-fade-in" />
}
