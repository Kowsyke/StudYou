import { cn } from '../../lib/utils'
import { avatarGradients, initialsOf, useProfileStore } from '../../store/profileStore'

interface AvatarProps {
  fullName: string | undefined
  size?: number
  className?: string
}

/* Shows the uploaded profile photo when present, otherwise the gradient
   initials. Reads the current avatar from the profile store so it stays
   in step everywhere it appears. */
export function Avatar({ fullName, size = 32, className }: AvatarProps) {
  const avatarHue = useProfileStore((s) => s.avatarHue)
  const avatarImage = useProfileStore((s) => s.avatarImage)

  if (avatarImage) {
    return (
      <img
        src={avatarImage}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn('shrink-0 rounded-md object-cover shadow-sm', className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'shrink-0 rounded-md text-white font-extrabold flex items-center justify-center shadow-sm',
        className,
      )}
      style={{ width: size, height: size, backgroundImage: avatarGradients[avatarHue] }}
      aria-hidden="true"
    >
      <span style={{ fontSize: Math.round(size * 0.36) }}>{initialsOf(fullName)}</span>
    </span>
  )
}

/*
  Reads an image file, downscales it to a square and returns a compact
  JPEG data URL. JPEG at 256px keeps the string small enough for
  localStorage while covering png, jpg and webp inputs (all decode to a
  canvas). Rejects anything that is not an image.
*/
export function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG or WebP).'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That image could not be loaded.'))
      img.onload = () => {
        const target = 256
        const canvas = document.createElement('canvas')
        canvas.width = target
        canvas.height = target
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Image processing is not available in this browser.'))
          return
        }
        // Cover crop: fill the square from the centre of the image.
        const scale = Math.max(target / img.width, target / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (target - w) / 2, (target - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
