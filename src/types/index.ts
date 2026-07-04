export interface Category {
  id: string
  name: string
  color: string
  order: number
  createdAt: number
  updatedAt: number
}

export interface SnippetItem {
  id: string
  label: string
  content: string
  itemType: 'text' | 'image'
  imageUrl?: string
}

export interface Snippet {
  id: string
  title: string
  content: string
  categoryId: string | null
  tags: string[]
  imageUrl?: string
  type: 'text' | 'image' | 'link' | 'multi'
  items?: SnippetItem[]
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
