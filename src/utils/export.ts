import type { Category, Snippet, Settings, ExportData } from '@/types'

const EXPORT_VERSION = '1.0.0'

export function exportToJson(
  categories: Category[],
  snippets: Snippet[],
  settings: Settings
): void {
  const data: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    categories,
    snippets,
    settings,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workshub-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importFromJson(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData
        if (!data.categories || !data.snippets) {
          reject(new Error('无效的数据格式'))
          return
        }
        resolve(data)
      } catch (err) {
        reject(new Error('JSON 解析失败'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}
