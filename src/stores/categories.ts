import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Category } from '@/types'
import { loadFromStorage, saveToStorage, generateId } from '@/utils/storage'

const defaultCategories: Category[] = [
  { id: 'cat_customer', name: '客户回复', color: '#3b82f6', order: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'cat_report', name: '工作汇报', color: '#10b981', order: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'cat_tech', name: '技术资料', color: '#f59e0b', order: 3, createdAt: Date.now(), updatedAt: Date.now() },
]

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref<Category[]>(loadFromStorage('categories', defaultCategories))

  watch(categories, (val) => {
    saveToStorage('categories', val)
  }, { deep: true })

  const sortedCategories = computed(() => {
    return [...categories.value].sort((a, b) => a.order - b.order)
  })

  function addCategory(name: string, color: string): Category {
    const now = Date.now()
    const cat: Category = {
      id: generateId(),
      name,
      color,
      order: categories.value.length + 1,
      createdAt: now,
      updatedAt: now,
    }
    categories.value.push(cat)
    return cat
  }

  function updateCategory(id: string, updates: Partial<Pick<Category, 'name' | 'color' | 'order'>>): void {
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      categories.value[idx] = {
        ...categories.value[idx],
        ...updates,
        updatedAt: Date.now(),
      }
    }
  }

  function deleteCategory(id: string): void {
    categories.value = categories.value.filter(c => c.id !== id)
  }

  function getCategoryName(id: string | null): string {
    if (!id) return '未分类'
    const cat = categories.value.find(c => c.id === id)
    return cat ? cat.name : '未分类'
  }

  function getCategoryColor(id: string | null): string {
    if (!id) return '#9ca3af'
    const cat = categories.value.find(c => c.id === id)
    return cat ? cat.color : '#9ca3af'
  }

  return {
    categories,
    sortedCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryName,
    getCategoryColor,
  }
})
