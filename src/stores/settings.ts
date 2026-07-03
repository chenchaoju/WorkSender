import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Settings } from '@/types'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

const defaultSettings: Settings = {
  theme: 'light',
  viewMode: 'grid',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(loadFromStorage('settings', defaultSettings))

  watch(settings, (val) => {
    saveToStorage('settings', val)
  }, { deep: true })

  function toggleTheme(): void {
    settings.value.theme = settings.value.theme === 'light' ? 'dark' : 'light'
    applyTheme(settings.value.theme)
  }

  function setTheme(theme: 'light' | 'dark'): void {
    settings.value.theme = theme
    applyTheme(theme)
  }

  function applyTheme(theme: 'light' | 'dark'): void {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function setViewMode(mode: 'grid' | 'list'): void {
    settings.value.viewMode = mode
  }

  function initTheme(): void {
    applyTheme(settings.value.theme)
  }

  return {
    settings,
    toggleTheme,
    setTheme,
    setViewMode,
    initTheme,
  }
})
