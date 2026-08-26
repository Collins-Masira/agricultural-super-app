import { env } from '@/config/env'
import { getAccessToken } from '@/lib/http'

/**
 * Uploads a single image file to POST /api/uploads.
 *
 * Deliberately NOT built on httpClient (lib/http.js) -- that client
 * always sends JSON (`Content-Type: application/json`, `JSON.stringify`
 * body), which is wrong for a file upload. This uses XMLHttpRequest
 * instead of fetch specifically so real upload progress is available
 * (fetch has no upload-progress event as of writing).
 *
 * Resolves to { url, filename }. Rejects with { status, message } in the
 * same shape httpClient's errors use, so callers can handle both
 * uniformly (e.g. via the shared errorMessage() helper).
 */
export const uploadsService = {
  uploadImage(file, { onProgress } = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${env.apiBaseUrl}/uploads`)

      const token = getAccessToken()
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.upload.onprogress = (event) => {
        if (onProgress && event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      }

      xhr.onload = () => {
        let body = null
        try {
          body = JSON.parse(xhr.responseText)
        } catch {
          // Non-JSON response; body stays null and the status-based
          // branch below still produces a sensible error.
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(body)
        } else {
          reject({
            status: xhr.status,
            message: body?.error ?? xhr.statusText ?? 'Upload failed.',
            details: body?.details,
          })
        }
      }

      xhr.onerror = () => {
        reject({ status: 0, message: 'Network error while uploading the image.' })
      }

      const formData = new FormData()
      formData.append('image', file)
      xhr.send(formData)
    })
  },
}
