/**
 * Client-side mirror of backend/app/services/upload_service.py's video
 * validation limits -- lets the UI reject an obviously-bad file instantly,
 * before spending a round trip (and a slow upload) on it. The backend
 * re-checks everything independently regardless -- this is a UX nicety,
 * not the security boundary.
 */

export const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

export function videoFileError(file) {
  if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please choose an MP4, MOV, or WebM video.'
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return `Video is too large. Maximum size is ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB.`
  }
  return null
}
