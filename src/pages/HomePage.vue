<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useSnippetStore } from '@/stores/snippets'
import { useSettingsStore } from '@/stores/settings'
import { useCategoryStore } from '@/stores/categories'
import AppHeader from '@/components/AppHeader.vue'
import CategorySidebar from '@/components/CategorySidebar.vue'
import SnippetCard from '@/components/SnippetCard.vue'
import SnippetDetail from '@/components/SnippetDetail.vue'
import SnippetEditor from '@/components/SnippetEditor.vue'
import type { Snippet } from '@/types'
import { FileText, Plus, FileJson } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { importFromJson } from '@/utils/export'

const categoryStore = useCategoryStore()

const snippetStore = useSnippetStore()
const settingsStore = useSettingsStore()

const editorVisible = ref(false)
const editingSnippet = ref<Snippet | null>(null)

const isDraggingFile = ref(false)
let dragCounter = 0

function isJsonFileDrag(e: DragEvent): boolean {
  if (!e.dataTransfer) return false
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    return [...e.dataTransfer.files].some(f => f.name.toLowerCase().endsWith('.json') || f.type === 'application/json')
  }
  if (e.dataTransfer.types) {
    return [...e.dataTransfer.types].includes('Files')
  }
  return false
}

function handleDragEnter(e: DragEvent) {
  if (!isJsonFileDrag(e)) return
  e.preventDefault()
  dragCounter++
  isDraggingFile.value = true
}

function handleDragLeave(e: DragEvent) {
  if (!isJsonFileDrag(e)) return
  e.preventDefault()
  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    isDraggingFile.value = false
  }
}

function handleDragOver(e: DragEvent) {
  if (!isJsonFileDrag(e)) return
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

async function handleDrop(e: DragEvent) {
  if (!isJsonFileDrag(e)) return
  e.preventDefault()
  dragCounter = 0
  isDraggingFile.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const jsonFile = [...files].find(f =>
    f.name.toLowerCase().endsWith('.json') || f.type === 'application/json'
  )
  if (!jsonFile) {
    ElMessage.warning('请拖入 JSON 数据文件')
    return
  }

  try {
    const data = await importFromJson(jsonFile)
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
  }
}

onMounted(() => {
  settingsStore.initTheme()
  window.addEventListener('dragenter', handleDragEnter)
  window.addEventListener('dragover', handleDragOver)
  window.addEventListener('dragleave', handleDragLeave)
  window.addEventListener('drop', handleDrop)
})

onBeforeUnmount(() => {
  window.removeEventListener('dragenter', handleDragEnter)
  window.removeEventListener('dragover', handleDragOver)
  window.removeEventListener('dragleave', handleDragLeave)
  window.removeEventListener('drop', handleDrop)
})

function openNewSnippet() {
  editingSnippet.value = null
  editorVisible.value = true
}

function openEditSnippet(snippet: Snippet) {
  editingSnippet.value = snippet
  editorVisible.value = true
}

function handleSave(data: Partial<Snippet>) {
  if (editingSnippet.value) {
    snippetStore.updateSnippet(editingSnippet.value.id, data)
    ElMessage.success('话术已更新')
  } else {
    const newSnippet = snippetStore.addSnippet(data as any)
    snippetStore.selectSnippet(newSnippet.id)
    ElMessage.success('话术已创建')
  }
  editorVisible.value = false
}

async function handleDelete(snippet: Snippet) {
  try {
    await ElMessageBox.confirm(
      `确定要删除「${snippet.title}」吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    snippetStore.deleteSnippet(snippet.id)
    ElMessage.success('已删除')
  } catch {
  }
}

function selectSnippet(snippet: Snippet) {
  snippetStore.selectSnippet(snippet.id)
}
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    <AppHeader @new-snippet="openNewSnippet" />

    <div class="flex-1 flex overflow-hidden">
      <CategorySidebar />

      <main class="flex-1 overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">
                <template v-if="snippetStore.activeCategoryId === null">全部话术</template>
                <template v-else-if="snippetStore.activeCategoryId === '__uncategorized__'">未分类</template>
                <template v-else>
                  {{ snippetStore.filteredSnippets.length }} 条结果
                </template>
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                共 {{ snippetStore.filteredSnippets.length }} 条话术
                <template v-if="snippetStore.searchKeyword">
                  · 搜索：{{ snippetStore.searchKeyword }}
                </template>
              </p>
            </div>
            <button
              class="md:hidden px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg"
              @click="openNewSnippet"
            >
              <Plus class="w-4 h-4 inline" /> 新建
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="snippetStore.filteredSnippets.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <FileText class="w-10 h-10 opacity-50" />
            </div>
            <p class="text-base font-medium">暂无话术</p>
            <p class="text-sm mt-1 opacity-70">
              <template v-if="snippetStore.searchKeyword">
                没有找到匹配的结果，试试其他关键词
              </template>
              <template v-else>
                点击右上角"新建话术"开始添加
              </template>
            </p>
            <button
              v-if="!snippetStore.searchKeyword"
              class="mt-6 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
              @click="openNewSnippet"
            >
              创建第一条话术
            </button>
          </div>

          <div
            v-else
            class="gap-4"
            :class="settingsStore.settings.viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'flex flex-col'"
          >
            <SnippetCard
              v-for="(snippet, index) in snippetStore.filteredSnippets"
              :key="snippet.id"
              :snippet="snippet"
              :is-selected="snippetStore.selectedSnippetId === snippet.id"
              :style="{ animationDelay: `${index * 30}ms` }"
              @select="selectSnippet(snippet)"
              @edit="openEditSnippet(snippet)"
              @delete="handleDelete(snippet)"
            />
          </div>
        </div>
      </main>

      <SnippetDetail
        :snippet="snippetStore.selectedSnippet"
        @close="snippetStore.selectSnippet(null)"
        v-if="snippetStore.selectedSnippet"
        @edit="openEditSnippet(snippetStore.selectedSnippet!)"
        @delete="handleDelete(snippetStore.selectedSnippet!)"
      />
    </div>

    <SnippetEditor
      :visible="editorVisible"
      :snippet="editingSnippet"
      @close="editorVisible = false"
      @save="handleSave"
    />

    <Teleport to="body">
      <div
        v-if="isDraggingFile"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-500/20 backdrop-blur-sm pointer-events-none animate-fadeIn"
      >
        <div class="bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-2xl p-12 text-center border-2 border-dashed border-indigo-400 dark:border-indigo-500 animate-bounceIn">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <FileJson class="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">松开即可导入</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">拖入 JSON 数据文件以导入话术和分类</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounceIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.15s ease-out;
}

.animate-bounceIn {
  animation: bounceIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
