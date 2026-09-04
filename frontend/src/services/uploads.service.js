import { env } from '@/config/env'
import { getAccessToken } from '@/lib/http'

/**
 * Uploads a single file to the given uploads endpoint via XMLHttpRequest
 * (not the shared httpClient, which always sends JSON) so real upload
 * progress is available.
 *
 * Resolves to { url, filename }. Rejects with { status, message } in the
 * same shape httpClient's errors use, so callers can handle both
 * uniformly (e.g. via the shared errorMessage() helper).
 */
function uploadFile(path, fieldName, file, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${env.apiBaseUrl}${path}`)

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
      reject({ status: 0, message: 'Network error while uploading the file.' })
    }

    const formData = new FormData()
    formData.append(fieldName, file)
    xhr.send(formData)
  })
}

export const uploadsService = {
  uploadImage(file, { onProgress } = {}) {
    return uploadFile('/uploads', 'image', file, { onProgress })
  },

  uploadVideo(file, { onProgress } = {}) {
    return uploadFile('/uploads/video', 'video', file, { onProgress })
  },
}
