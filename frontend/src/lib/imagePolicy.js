/**
 * Client-side mirror of backend/app/services/upload_service.py's
 * validation limits -- lets the UI reject an obviously-bad file
 * instantly, before spending a round trip on it. The backend re-checks
 * everything independently regardless (real content, not just
 * extension/MIME) -- this is a UX nicety, not the security boundary.
 */

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export function imageFileError(file) {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please choose a JPEG, PNG, or WebP image.'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `Image is too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`
  }
  return null
}
