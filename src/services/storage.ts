import { getSupabaseClient } from '@/lib/supabase'

export interface FileValidationOptions {
  maxSizeMb?: number
  allowedTypes?: string[]
}

const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const PROBLEM_IMAGE_TYPES = ['image/jpeg', 'image/png']
export const DEFAULT_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

/**
 * Resolves a normalized MIME type and file extension for document uploads.
 * Guarantees consistent handling for PDF, PNG, and JPG/JPEG files across browsers and operating systems.
 */
export function getDocumentMimeAndExt(file: File): { mimeType: string; ext: string; isDocumentType: boolean } {
  const rawExt = file.name && file.name.includes('.')
    ? file.name.split('.').pop()?.toLowerCase().trim() || ''
    : ''
  const rawType = file.type?.toLowerCase().trim() || ''

  // 1. PDF detection
  if (
    rawType === 'application/pdf' ||
    rawType === 'application/x-pdf' ||
    rawExt === 'pdf'
  ) {
    return { mimeType: 'application/pdf', ext: 'pdf', isDocumentType: true }
  }

  // 2. PNG detection
  if (
    rawType === 'image/png' ||
    rawType === 'image/x-png' ||
    rawExt === 'png'
  ) {
    return { mimeType: 'image/png', ext: 'png', isDocumentType: true }
  }

  // 3. JPEG / JPG detection
  if (
    rawType === 'image/jpeg' ||
    rawType === 'image/jpg' ||
    rawType === 'image/pjpeg' ||
    rawExt === 'jpg' ||
    rawExt === 'jpeg'
  ) {
    return { mimeType: 'image/jpeg', ext: rawExt === 'jpeg' ? 'jpeg' : 'jpg', isDocumentType: true }
  }

  return {
    mimeType: rawType || 'application/octet-stream',
    ext: rawExt || 'jpg',
    isDocumentType: false,
  }
}

/**
 * Validates a file against allowed MIME types and maximum size in MB.
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const maxSizeMb = options.maxSizeMb ?? 5
  const allowedTypes = options.allowedTypes ?? DEFAULT_IMAGE_TYPES

  if (file.size > maxSizeMb * 1024 * 1024) {
    return {
      valid: false,
      error: `File size must be under ${maxSizeMb} MB (selected: ${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
    }
  }

  if (allowedTypes.length > 0) {
    const docInfo = getDocumentMimeAndExt(file)
    const isAllowed =
      allowedTypes.includes(file.type) ||
      (docInfo.isDocumentType && allowedTypes.includes(docInfo.mimeType))

    if (!isAllowed) {
      const extensions = allowedTypes
        .map(t => {
          if (t === 'application/pdf') return 'PDF'
          if (t === 'image/jpeg') return 'JPG'
          if (t === 'image/png') return 'PNG'
          return t.split('/')[1]?.toUpperCase() || t
        })
        .join(', ')
      return {
        valid: false,
        error: `Invalid file format. Allowed types: ${extensions}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Uploads a profile avatar to the public 'avatars' storage bucket.
 * Returns the public CDN URL of the uploaded image.
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const validation = validateFile(file, { maxSizeMb: 5, allowedTypes: DEFAULT_IMAGE_TYPES })
  if (!validation.valid) throw new Error(validation.error)

  const supabase = getSupabaseClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `${userId}/avatar-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Uploads a sensitive ID verification document to the private 'worker-documents' bucket.
 * Returns the storage path reference for secure signed access.
 */
export async function uploadIdProof(file: File, userId: string): Promise<string> {
  const validation = validateFile(file, { maxSizeMb: 10, allowedTypes: DEFAULT_DOCUMENT_TYPES })
  if (!validation.valid) throw new Error(validation.error)

  const supabase = getSupabaseClient()
  const { mimeType, ext } = getDocumentMimeAndExt(file)
  const filePath = `${userId}/id-proof-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('worker-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: mimeType,
    })

  if (uploadError) {
    throw new Error(`Failed to upload ID proof: ${uploadError.message}`)
  }

  return filePath
}

/**
 * Generates a short-lived signed URL for an administrator or document owner
 * to securely view a private document from the 'worker-documents' bucket.
 */
export async function getIdProofSignedUrl(
  pathOrUrl: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  if (!pathOrUrl) return null

  // If already a full signed URL or blob, return directly
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    if (pathOrUrl.includes('token=')) return pathOrUrl
  }

  const supabase = getSupabaseClient()
  // Clean path in case full storage URL was stored
  const cleanPath = pathOrUrl.replace(/^.*\/worker-documents\//, '')

  const { data, error } = await supabase.storage
    .from('worker-documents')
    .createSignedUrl(cleanPath, expiresInSeconds)

  if (error) {
    console.warn('Error generating signed URL for worker document:', error.message)
    return null
  }

  return data.signedUrl
}

/** Uploads an optional customer problem image to the private request-images bucket. */
export async function uploadProblemImage(file: File, userId: string, serviceRequestId: string): Promise<string> {
  const validation = validateFile(file, { maxSizeMb: 8, allowedTypes: PROBLEM_IMAGE_TYPES })
  if (!validation.valid) throw new Error(validation.error)
  if (!userId || !serviceRequestId) throw new Error('A signed-in customer and service request are required')

  const supabase = getSupabaseClient()
  const extension = file.type === 'image/png' ? 'png' : 'jpg'
  const filePath = `${userId}/${serviceRequestId}/problem-${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from('service-request-images')
    .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type })

  if (error) throw new Error(`Failed to upload problem image: ${error.message}`)
  return filePath
}

export async function attachProblemImage(params: {
  serviceRequestId: string
  customerId: string
  storagePath: string
  mimeType: string
  fileSize: number
}): Promise<void> {
  const { error } = await (getSupabaseClient().from('service_request_attachments') as any).insert({
    service_request_id: params.serviceRequestId,
    customer_id: params.customerId,
    storage_path: params.storagePath,
    mime_type: params.mimeType,
    file_size: params.fileSize,
  })
  if (error) throw error
}

export async function removeProblemImage(storagePath: string): Promise<void> {
  if (!storagePath) return
  await getSupabaseClient().storage.from('service-request-images').remove([storagePath])
}

export async function getProblemImageSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string | null> {
  if (!storagePath) return null
  const { data, error } = await getSupabaseClient().storage
    .from('service-request-images')
    .createSignedUrl(storagePath, expiresInSeconds)
  if (error) {
    console.warn('Error generating signed URL for problem image:', error.message)
    return null
  }
  return data.signedUrl
}

/**
 * Uploads a sensitive customer address-proof document to the private 'customer-documents' bucket.
 * Uses an opaque, non-PII storage path based on the authenticated customer ID and a random UUID.
 * Returns the storage path reference for secure signed access.
 */
export async function uploadCustomerAddressProof(file: File, userId: string): Promise<string> {
  const validation = validateFile(file, { maxSizeMb: 10, allowedTypes: DEFAULT_DOCUMENT_TYPES })
  if (!validation.valid) throw new Error(validation.error)
  if (!userId) throw new Error('An authenticated customer ID is required to upload address proof')

  const supabase = getSupabaseClient()
  const { mimeType, ext } = getDocumentMimeAndExt(file)
  const filePath = `${userId}/address-proof-${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('customer-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: mimeType,
    })

  if (uploadError) {
    throw new Error(`Failed to upload address proof: ${uploadError.message}`)
  }

  return filePath
}

/**
 * Generates a short-lived signed URL for an administrator or document owner
 * to securely view a private document from the 'customer-documents' bucket.
 */
export async function getCustomerAddressProofSignedUrl(
  pathOrUrl: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  if (!pathOrUrl) return null

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    if (pathOrUrl.includes('token=')) return pathOrUrl
  }

  const supabase = getSupabaseClient()
  const cleanPath = pathOrUrl.replace(/^.*\/customer-documents\//, '')

  const { data, error } = await supabase.storage
    .from('customer-documents')
    .createSignedUrl(cleanPath, expiresInSeconds)

  if (error) {
    console.warn('Error generating signed URL for customer document:', error.message)
    return null
  }

  return data.signedUrl
}
