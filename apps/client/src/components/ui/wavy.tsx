import type React from 'react'
import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

// Configuration for wave shader pattern
const ZOOM_FACTOR = 0.32
const BASE_WAVE_AMPLITUDE = 0.18
const RANDOM_WAVE_FACTOR = 0.12
const WAVE_FREQUENCY = 3.5
const TIME_FACTOR = 0.16
const BASE_SWIRL_STRENGTH = 0.85
const SWIRL_TIME_MULT = 3.5
const NOISE_SWIRL_FACTOR = 0.15
const FBM_OCTAVES = 7

// Theme tailored 20 step color palette (Dark Space, Deep Violet, Indigo, Cyan, Magenta)
const themePalette = [
  [0.01, 0.02, 0.05],
  [0.02, 0.03, 0.09],
  [0.04, 0.05, 0.16],
  [0.07, 0.07, 0.26],
  [0.11, 0.09, 0.38],
  [0.16, 0.11, 0.48],
  [0.22, 0.13, 0.58],
  [0.28, 0.16, 0.68],
  [0.32, 0.2, 0.75],
  [0.24, 0.32, 0.82],
  [0.14, 0.45, 0.88],
  [0.06, 0.58, 0.92],
  [0.18, 0.5, 0.94],
  [0.35, 0.38, 0.92],
  [0.52, 0.28, 0.88],
  [0.68, 0.22, 0.82],
  [0.78, 0.24, 0.85],
  [0.65, 0.2, 0.78],
  [0.45, 0.15, 0.65],
  [0.25, 0.1, 0.45],
]

function buildFragmentShader(): string {
  const fbmOctavesInt = Math.floor(FBM_OCTAVES)
  const colorArraySrc = themePalette.map((c) => `vec3(${c[0]}, ${c[1]}, ${c[2]})`).join(',\n  ')

  return `#version 300 es

precision highp float;
out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uScroll;

#define NUM_COLORS 20

vec3 seaColors[NUM_COLORS] = vec3[](
  ${colorArraySrc}
);

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float noise2D(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod(i, 289.0);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0)) +
    i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.792843 - 0.853734 * (a0 * a0 + h * h);

  vec3 g;
  g.x  = a0.x  * x0.x + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float freq = 1.0;
  for (int i = 0; i < ${fbmOctavesInt}; i++) {
    value += amplitude * noise2D(st * freq);
    freq *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;

  uv *= float(${ZOOM_FACTOR});

  float t = uTime * float(${TIME_FACTOR}) + uScroll * 0.0008;

  float waveAmp = float(${BASE_WAVE_AMPLITUDE}) + float(${RANDOM_WAVE_FACTOR})
                  * noise2D(vec2(t, 27.7));

  float waveX = waveAmp * sin(uv.y * float(${WAVE_FREQUENCY}) + t);
  float waveY = waveAmp * sin(uv.x * float(${WAVE_FREQUENCY}) - t);
  uv.x += waveX;
  uv.y += waveY;

  float r = length(uv);
  float angle = atan(uv.y, uv.x);
  float swirlStrength = float(${BASE_SWIRL_STRENGTH})
                        * (1.0 - smoothstep(0.0, 1.0, r));

  angle += swirlStrength * sin(t + r * float(${SWIRL_TIME_MULT}));
  uv = vec2(cos(angle), sin(angle)) * r;

  float n = fbm(uv + vec2(0.0, uScroll * 0.0004));

  float swirlEffect = float(${NOISE_SWIRL_FACTOR})
                      * sin(t + n * 3.0);
  n += swirlEffect;

  float noiseVal = 0.5 * (n + 1.0);

  float idx = clamp(noiseVal, 0.0, 1.0) * float(NUM_COLORS - 1);
  int iLow = int(floor(idx));
  int iHigh = int(min(float(iLow + 1), float(NUM_COLORS - 1)));
  float f = fract(idx);

  vec3 colLow = seaColors[iLow];
  vec3 colHigh = seaColors[iHigh];
  vec3 color = mix(colLow, colHigh, f);

  if (iLow == 0 && iHigh == 0) {
    outColor = vec4(color, 0.0);
  } else {
    outColor = vec4(color, 0.55);
  }
}
`
}

const vertexShaderSource = `#version 300 es
precision mediump float;

in vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

function createShaderProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string,
): WebGLProgram | null {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  if (!vertexShader) return null

  gl.shaderSource(vertexShader, vsSource)
  gl.compileShader(vertexShader)
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader))
    gl.deleteShader(vertexShader)
    return null
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  if (!fragmentShader) {
    gl.deleteShader(vertexShader)
    return null
  }

  gl.shaderSource(fragmentShader, fsSource)
  gl.compileShader(fragmentShader)
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader))
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Could not link WebGL program:', gl.getProgramInfoLog(program))
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    gl.deleteProgram(program)
    return null
  }

  return program
}

export const WavyBackground = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollPosRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      scrollPosRef.current = window.scrollY || document.documentElement.scrollTop
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let animationFrameId = 0
    let cleanupGl: (() => void) | null = null

    // Rebuilds the whole GL program and (re)starts the render loop. Called on
    // mount and again after a lost context is restored, since a lost
    // context invalidates every existing program/buffer/VAO.
    function setup() {
      const fsSource = buildFragmentShader()
      const gl = canvas?.getContext('webgl2', { alpha: true })
      if (!canvas || !gl) {
        console.error('WebGL2 is not supported by your browser.')
        return
      }

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)

      const program = createShaderProgram(gl, vertexShaderSource, fsSource)
      if (!program) return

      gl.useProgram(program)

      const quadVertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])

      const vao = gl.createVertexArray()
      gl.bindVertexArray(vao)

      const vbo = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)

      const aPositionLoc = gl.getAttribLocation(program, 'aPosition')
      gl.enableVertexAttribArray(aPositionLoc)
      gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0)

      const uResolutionLoc = gl.getUniformLocation(program, 'uResolution')
      const uTimeLoc = gl.getUniformLocation(program, 'uTime')
      const uScrollLoc = gl.getUniformLocation(program, 'uScroll')

      const startTime = performance.now()

      function paint() {
        const elapsed = (performance.now() - startTime) * 0.001

        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
          gl.viewport(0, 0, canvas.width, canvas.height)
        }

        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(program)
        gl.bindVertexArray(vao)

        gl.uniform2f(uResolutionLoc, canvas.width, canvas.height)
        gl.uniform1f(uTimeLoc, elapsed)
        gl.uniform1f(uScrollLoc, scrollPosRef.current)

        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }

      function render() {
        paint()
        animationFrameId = requestAnimationFrame(render)
      }

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)

      // Reduced motion still gets the shader's look, just as one still
      // frame instead of a continuously running animation.
      if (prefersReducedMotion) {
        paint()
      } else {
        render()
      }

      const handleResize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        gl.viewport(0, 0, canvas.width, canvas.height)
        if (prefersReducedMotion) paint()
      }
      window.addEventListener('resize', handleResize)

      const handleVisibility = () => {
        if (prefersReducedMotion) return
        if (document.hidden) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = 0
        } else if (!animationFrameId) {
          render()
        }
      }
      document.addEventListener('visibilitychange', handleVisibility)

      cleanupGl = () => {
        cancelAnimationFrame(animationFrameId)
        window.removeEventListener('resize', handleResize)
        document.removeEventListener('visibilitychange', handleVisibility)
        gl.deleteProgram(program)
        gl.deleteBuffer(vbo)
        gl.deleteVertexArray(vao)
      }
    }

    // A lost context (GPU reset, too many concurrent WebGL contexts, driver
    // crash) must call preventDefault to make it recoverable at all; without
    // it the browser never fires 'webglcontextrestored' and the background
    // would stay permanently blank instead of coming back.
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      cancelAnimationFrame(animationFrameId)
      cleanupGl?.()
      cleanupGl = null
    }
    const handleContextRestored = () => setup()

    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)

    setup()

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      cleanupGl?.()
    }
  }, [])

  return (
    <div className={cn('relative w-full min-h-screen overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'transparent' }}
      />
      {children && <div className="relative z-10 w-full h-full">{children}</div>}
    </div>
  )
}
