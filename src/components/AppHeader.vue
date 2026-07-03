<script setup lang="ts">
import { ref } from 'vue'
import { Search, Plus, Sun, Moon, Download, Upload, Trash2, Info, Grid3X3, List } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { useSnippetStore } from '@/stores/snippets'
import { useCategoryStore } from '@/stores/categories'
import { exportToJson, importFromJson } from '@/utils/export'
import { ElMessage, ElMessageBox } from 'element-plus'

const settingsStore = useSettingsStore()
const snippetStore = useSnippetStore()
const categoryStore = useCategoryStore()

const searchInput = ref('')

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
      `检测到 ${data.snippets.length} 条话术和 ${data.categories.length} 个分类。\n是否导入？将覆盖现有数据。`,
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
    ElMessage.success(`成功导入 ${data.snippets.length} 条话术`)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '导入失败')
  } finally {
    input.value = ''
  }
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有话术数据吗？此操作不可恢复！',
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

const emit = defineEmits<{
  (e: 'newSnippet'): void
}>()
</script>

<template>
  <header class="h-16 flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center px-6 gap-4">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
        W
      </div>
      <div>
        <h1 class="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">WorkSnippetHub</h1>
        <p class="text-xs text-slate-400 dark:text-slate-500">工作话术管理工具</p>
      </div>
    </div>

    <div class="flex-1 max-w-xl mx-auto">
      <div class="relative">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchInput"
          type="text"
          placeholder="搜索话术标题、内容或标签..."
          class="w-full pl-10 pr-20 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
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

      <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

      <label class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer" title="导入数据">
        <Upload class="w-5 h-5" />
        <input type="file" accept=".json" class="hidden" @change="handleImport" />
      </label>

      <button
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
        title="导出数据"
        @click="handleExport"
      >
        <Download class="w-5 h-5" />
      </button>

      <button
        class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-300 hover:text-red-500 transition-colors"
        title="清空数据"
        @click="handleClearAll"
      >
        <Trash2 class="w-5 h-5" />
      </button>

      <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

      <button
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg flex items-center gap-1.5"
        @click="emit('newSnippet')"
      >
        <Plus class="w-4 h-4" />
        新建话术
      </button>
    </div>
  </header>
</template>
