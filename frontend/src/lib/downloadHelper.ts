/**
 * Universal download helper for PDFs and other blobs
 * Works reliably on desktop and mobile devices
 */

export function downloadBlob(blob: Blob, filename: string) {
  // Check if we're on iOS Safari (which has issues with <a>.click())
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  // Create blob URL
  const url = window.URL.createObjectURL(blob)

  try {
    if (isIOS || isSafari) {
      // iOS/Safari: Open in new tab (more reliable)
      const newWindow = window.open(url, '_blank')
      if (!newWindow) {
        // Fallback: try standard download
        downloadViaAnchor(url, filename)
      }
    } else {
      // Desktop/Android: Standard download
      downloadViaAnchor(url, filename)
    }
  } finally {
    // Clean up blob URL after a delay
    setTimeout(() => window.URL.revokeObjectURL(url), 1000)
  }
}

function downloadViaAnchor(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * Check if device supports direct PDF download
 * Returns false for iOS Safari (needs different handling)
 */
export function supportsDirectDownload(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  return !isIOS
}
