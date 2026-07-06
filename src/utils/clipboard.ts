export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (e) {
    console.error('Copy failed:', e)
    return false
  }
}

export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext && window.ClipboardItem) {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      if (!blob.type.startsWith('image/')) return false
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      return true
    }
  } catch (e) {
    console.error('Clipboard API copy failed, trying canvas fallback:', e)
  }
  return copyImageViaCanvas(imageUrl)
}

function copyImageViaCanvas(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) return resolve(false)
          ctx.drawImage(img, 0, 0)
          canvas.toBlob(async (blob) => {
            if (!blob) return resolve(false)
            try {
              if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                resolve(true)
              } else {
                resolve(false)
              }
            } catch {
              resolve(false)
            }
          }, 'image/png')
        } catch {
          resolve(false)
        }
      }
      img.onerror = () => resolve(false)
      img.src = imageUrl
    } catch {
      resolve(false)
    }
  })
}
