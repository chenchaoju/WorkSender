import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Snippet } from '@/types'
import { loadFromStorage, saveToStorage, generateId } from '@/utils/storage'

const defaultSnippets: Snippet[] = [
  {
    id: 'snippet_welcome',
    title: '欢迎使用个人工作助手',
    content: '你好！欢迎使用个人工作助手复制板管理工具。\n\n这里可以保存你工作中常用的复制板、资料、链接和图片，通过分类和标签快速找到，一键复制提高效率。\n\n点击右上角"新建复制板"开始添加你的第一条内容吧！',
    categoryId: 'cat_customer',
    tags: ['欢迎', '使用说明'],
    type: 'text',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'snippet_report',
    title: '每日汇报模板',
    content: '【今日工作】\n1. 完成了 XX 功能开发\n2. 跟进了 XX 问题\n3. 参加了 XX 会议\n\n【明日计划】\n1. 继续推进 XX 任务\n2. 处理 XX 需求\n\n【风险/问题】\n- 暂无',
    categoryId: 'cat_report',
    tags: ['汇报', '模板'],
    type: 'text',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

export const useSnippetStore = defineStore('snippets', () => {
  const snippets = ref<Snippet[]>(loadFromStorage('snippets', defaultSnippets))
  const activeCategoryId = ref<string | null>(null)
  const searchKeyword = ref('')
  const selectedSnippetId = ref<string | null>(null)

  watch(snippets, (val) => {
    saveToStorage('snippets', val)
  }, { deep: true })

  const filteredSnippets = computed(() => {
    let result = [...snippets.value]

    if (activeCategoryId.value !== null) {
      if (activeCategoryId.value === '__uncategorized__') {
        result = result.filter(s => !s.categoryId)
      } else {
        result = result.filter(s => s.categoryId === activeCategoryId.value)
      }
    }

    if (searchKeyword.value.trim()) {
      const keywords = searchKeyword.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
      result = result.filter(s => {
        return keywords.every(kw =>
          s.title.toLowerCase().includes(kw) ||
          s.content.toLowerCase().includes(kw) ||
          s.tags.some(t => t.toLowerCase().includes(kw))
        )
      })
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt)
  })

  const allTags = computed(() => {
    const tagMap = new Map<string, number>()
    snippets.value.forEach(s => {
      s.tags.forEach(t => {
        tagMap.set(t, (tagMap.get(t) || 0) + 1)
      })
    })
    return Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })

  const selectedSnippet = computed(() => {
    if (!selectedSnippetId.value) return null
    return snippets.value.find(s => s.id === selectedSnippetId.value) || null
  })

  function countByCategory(categoryId: string | null): number {
    if (categoryId === null) return snippets.value.length
    if (categoryId === '__uncategorized__') {
      return snippets.value.filter(s => !s.categoryId).length
    }
    return snippets.value.filter(s => s.categoryId === categoryId).length
  }

  function addSnippet(data: Partial<Snippet> & { title: string; content: string }): Snippet {
    const now = Date.now()
    const snippet: Snippet = {
      id: generateId(),
      title: data.title,
      content: data.content,
      categoryId: data.categoryId ?? null,
      tags: data.tags ?? [],
      imageUrl: data.imageUrl,
      type: data.type ?? 'text',
      items: data.items,
      createdAt: now,
      updatedAt: now,
    }
    snippets.value.unshift(snippet)
    return snippet
  }

  function updateSnippet(id: string, updates: Partial<Snippet>): void {
    const idx = snippets.value.findIndex(s => s.id === id)
    if (idx !== -1) {
      snippets.value[idx] = {
        ...snippets.value[idx],
        ...updates,
        updatedAt: Date.now(),
      }
    }
  }

  function deleteSnippet(id: string): void {
    snippets.value = snippets.value.filter(s => s.id !== id)
    if (selectedSnippetId.value === id) {
      selectedSnippetId.value = null
    }
  }

  function selectSnippet(id: string | null): void {
    selectedSnippetId.value = id
  }

  function setActiveCategory(id: string | null): void {
    activeCategoryId.value = id
  }

  function setSearchKeyword(keyword: string): void {
    searchKeyword.value = keyword
  }

  function importSnippets(newSnippets: Snippet[]): number {
    let count = 0
    newSnippets.forEach(s => {
      if (!s.id || !s.title) return
      const existing = snippets.value.find(x => x.id === s.id)
      if (existing) {
        Object.assign(existing, s)
      } else {
        snippets.value.push(s)
      }
      count++
    })
    return count
  }

  function clearAll(): void {
    snippets.value = []
    selectedSnippetId.value = null
  }

  return {
    snippets,
    filteredSnippets,
    allTags,
    activeCategoryId,
    searchKeyword,
    selectedSnippetId,
    selectedSnippet,
    countByCategory,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    selectSnippet,
    setActiveCategory,
    setSearchKeyword,
    importSnippets,
    clearAll,
  }
})
