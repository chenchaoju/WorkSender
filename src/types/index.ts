export interface Category {
  id: string
  name: string
  color: string
  order: number
  createdAt: number
  updatedAt: number
}

export interface Snippet {
  id: string
  title: string
  content: string
  categoryId: string | null
  tags: string[]
  imageUrl?: string
  type: 'text' | 'image' | 'link'
  createdAt: number
  updatedAt: number
}

export interface Settings {
  theme: 'light' | 'dark'
  viewMode: 'grid' | 'list'
  sortBy: 'createdAt' | 'updatedAt' | 'title'
  sortOrder: 'asc' | 'desc'
}

export interface ExportData {
  version: string
  exportedAt: number
  categories: Category[]
  snippets: Snippet[]
  settings: Settings
}
