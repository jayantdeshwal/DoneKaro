/**
 * Client-Side Image Compressor for Avatars & Profile Photos.
 * Center-crops, resizes to a max square dimension (default 512x512),
 * and encodes to WebP at 0.85 quality (with JPEG fallback).
 * Fully dependency-free using native HTMLCanvasElement.
 */

export interface CompressAvatarOptions {
  maxDimension?: number
  quality?: number
}

export async function compressAvatarImage(
  file: File,
  options: CompressAvatarOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? 512
  const quality = options.quality ?? 0.85

  // Only compress raster images; pass through PDFs, SVGs, or unsupported types
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }

  return new Promise((resolve) => {
    let objectUrl = ''
    try {
      objectUrl = URL.createObjectURL(file)
    } catch {
      return resolve(file)
    }

    const img = new Image()

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width
        const naturalHeight = img.naturalHeight || img.height

        if (!naturalWidth || !naturalHeight) {
          cleanup()
          return resolve(file)
        }

        // Calculate square center-crop coordinates
        const minSide = Math.min(naturalWidth, naturalHeight)
        const sx = (naturalWidth - minSide) / 2
        const sy = (naturalHeight - minSide) / 2
        const targetDimension = Math.min(minSide, maxDimension)

        const canvas = document.createElement('canvas')
        canvas.width = targetDimension
        canvas.height = targetDimension

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          return resolve(file)
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDimension, targetDimension)

        const baseName = file.name.replace(/\.[^/.]+$/, '')

        // Try encoding as WebP first
        canvas.toBlob(
          (webpBlob) => {
            if (webpBlob && webpBlob.type === 'image/webp') {
              const compressedFile = new File([webpBlob], `${baseName}.webp`, {
                type: 'image/webp',
                lastModified: Date.now(),
              })
              cleanup()
              resolve(compressedFile)
            } else {
              // Fallback to JPEG if browser canvas doesn't encode WebP
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    const compressedFile = new File([jpegBlob], `${baseName}.jpg`, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    })
                    cleanup()
                    resolve(compressedFile)
                  } else {
                    cleanup()
                    resolve(file)
                  }
                },
                'image/jpeg',
                quality
              )
            }
          },
          'image/webp',
          quality
        )
      } catch (err) {
        console.warn('Image compression fallback to original:', err)
        cleanup()
        resolve(file)
      }
    }

    img.onerror = () => {
      cleanup()
      resolve(file)
    }

    img.src = objectUrl
  })
}

