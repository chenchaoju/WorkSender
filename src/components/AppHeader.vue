<script setup lang="ts">
import { ref } from 'vue'
import { Search, Plus, Sun, Moon, Download, Upload, Trash2, Info, Grid3X3, List, Menu, FolderPlus } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { useSnippetStore } from '@/stores/snippets'
import { useCategoryStore } from '@/stores/categories'
import { exportToJson, importFromJson } from '@/utils/export'
import { ElMessage, ElMessageBox } from 'element-plus'

const settingsStore = useSettingsStore()
const snippetStore = useSnippetStore()
const categoryStore = useCategoryStore()

const searchInput = ref('')
const showNewCategory = ref(false)
const newCatName = ref('')
const newCatColor = ref('#3b82f6')

const colorOptions = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1',
]

const emit = defineEmits<{
  (e: 'newSnippet'): void
  (e: 'toggleSidebar'): void
}>()

function addCategory() {
  if (!newCatName.value.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  categoryStore.addCategory(newCatName.value.trim(), newCatColor.value)
  newCatName.value = ''
  showNewCategory.value = false
  ElMessage.success('分类已创建')
}

function handleSearch() {
  snippetStore.setSearchKeyword(searchInput.value)
}

function clearSearch() {
  searchInput.value = ''
  snippetStore.setSearchKeyword('')
}

function toggleTheme() {
  settingsStore.toggleTheme()
}

function toggleViewMode() {
  settingsStore.setViewMode(settingsStore.settings.viewMode === 'grid' ? 'list' : 'grid')
}

function handleExport() {
  exportToJson(
    categoryStore.categories,
    snippetStore.snippets,
    settingsStore.settings,
  )
  ElMessage.success('数据已导出')
}

async function handleImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const data = await importFromJson(file)
    await ElMessageBox.confirm(
      `检测到 ${data.snippets.length} 条复制板和 ${data.categories.length} 个分类。\n是否导入？将覆盖现有数据。`,
      '确认导入',
      {
        confirmButtonText: '导入覆盖',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    if (data.categories.length > 0) {
      categoryStore.categories.length = 0
      categoryStore.categories.push(...data.categories)
    }
    snippetStore.clearAll()
    snippetStore.importSnippets(data.snippets)
    ElMessage.success(`成功导入 ${data.snippets.length} 条复制板`)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '导入失败')
  } finally {
    input.value = ''
  }
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有复制板数据吗？此操作不可恢复！',
      '确认清空',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'error',
      }
    )
    snippetStore.clearAll()
    ElMessage.success('数据已清空')
  } catch {
  }
}
</script>

<template>
  <header class="h-16 flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center px-4 sm:px-6 gap-3 sm:gap-4">
    <button
      class="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
      @click="emit('toggleSidebar')"
      title="分类"
    >
      <Menu class="w-5 h-5" />
    </button>

    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
        助
      </div>
      <div class="hidden sm:block">
        <h1 class="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">个人工作助手</h1>
        <p class="text-xs text-slate-400 dark:text-slate-500">复制板管理工具</p>
      </div>
    </div>

    <div class="flex-1 max-w-xl mx-auto">
      <div class="relative">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchInput"
          type="text"
          placeholder="搜索复制板标题、内容或标签..."
          class="w-full pl-10 pr-10 sm:pr-20 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          @input="handleSearch"
        />
        <div v-if="searchInput" class="absolute right-3 top-1/2 -translate-y-1/2">
          <button
            class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            @click="clearSearch"
          >
            清除
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        class="hidden sm:block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
        :title="settingsStore.settings.viewMode === 'grid' ? '列表视图' : '网格视图'"
        @click="toggleViewMode"
      >
        <List v-if="settingsStore.settings.viewMode === 'grid'" class="w-5 h-5" />
        <Grid3X3 v-else class="w-5 h-5" />
      </button>

      <button
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
        :title="settingsStore.settings.theme === 'light' ? '深色模式' : '浅色模式'"
        @click="toggleTheme"
      >
        <Moon v-if="settingsStore.settings.theme === 'light'" class="w-5 h-5" />
        <Sun v-else class="w-5 h-5" />
      </button>

      <div class="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

      <label class="hidden md:block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer" title="导入数据">
        <Download class="w-5 h-5" />
        <input type="file" accept=".json" class="hidden" @change="handleImport" />
      </label>

      <button
        class="hidden md:block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
        title="导出数据"
        @click="handleExport"
      >
        <Upload class="w-5 h-5" />
      </button>

      <button
        class="hidden md:block p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-300 hover:text-red-500 transition-colors"
        title="清空数据"
        @click="handleClearAll"
      >
        <Trash2 class="w-5 h-5" />
      </button>

      <button
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-indigo-500 transition-colors"
        title="新建分类"
        @click="showNewCategory = !showNewCategory"
      >
        <FolderPlus class="w-5 h-5" />
      </button>

      <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

      <button
        class="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg flex items-center gap-1.5"
        @click="emit('newSnippet')"
      >
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline">新建剪切板</span>
      </button>
    </div>

    <div
      v-if="showNewCategory"
      class="absolute top-full right-4 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50"
    >
      <div class="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">新建分类</div>
      <div class="flex gap-2 mb-2">
        <input
          v-model="newCatName"
          type="text"
          placeholder="分类名称"
          class="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
          @keyup.enter="addCategory"
          autofocus
        />
        <button
          class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors"
          @click="addCategory"
        >
          确定
        </button>
      </div>
      <div class="flex gap-1.5 flex-wrap">
        <button
          v-for="color in colorOptions"
          :key="color"
          class="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
          :class="newCatColor === color ? 'border-slate-700 dark:border-slate-200 scale-110' : 'border-transparent'"
          :style="{ backgroundColor: color }"
          @click="newCatColor = color"
        />
      </div>
    </div>
  </header>
</template>
