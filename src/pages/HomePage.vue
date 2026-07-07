<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSnippetStore } from '@/stores/snippets'
import { useSettingsStore } from '@/stores/settings'
import AppHeader from '@/components/AppHeader.vue'
import CategorySidebar from '@/components/CategorySidebar.vue'
import SnippetCard from '@/components/SnippetCard.vue'
import SnippetDetail from '@/components/SnippetDetail.vue'
import SnippetEditor from '@/components/SnippetEditor.vue'
import type { Snippet } from '@/types'
import { FileText, Plus } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'

const snippetStore = useSnippetStore()
const settingsStore = useSettingsStore()

const editorVisible = ref(false)
const editingSnippet = ref<Snippet | null>(null)
const mobileSidebarOpen = ref(false)
const desktopSidebarCollapsed = ref(false)

onMounted(() => {
  settingsStore.initTheme()
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
    ElMessage.success('复制板已更新')
  } else {
    const newSnippet = snippetStore.addSnippet(data as any)
    snippetStore.selectSnippet(newSnippet.id)
    ElMessage.success('复制板已创建')
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
    <AppHeader @new-snippet="openNewSnippet" @toggle-sidebar="mobileSidebarOpen = !mobileSidebarOpen" />

    <div class="flex-1 flex overflow-hidden">
      <CategorySidebar
        :mobile-open="mobileSidebarOpen"
        :desktop-collapsed="desktopSidebarCollapsed"
        @close-mobile="mobileSidebarOpen = false"
        @toggle-desktop="desktopSidebarCollapsed = !desktopSidebarCollapsed"
      />

      <main class="flex-1 overflow-hidden flex flex-col">
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                <template v-if="snippetStore.activeCategoryId === null">全部复制板</template>
                <template v-else-if="snippetStore.activeCategoryId === '__uncategorized__'">未分类</template>
                <template v-else>
                  {{ snippetStore.filteredSnippets.length }} 条结果
                </template>
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                共 {{ snippetStore.filteredSnippets.length }} 条复制板
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

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <div v-if="snippetStore.filteredSnippets.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <FileText class="w-10 h-10 opacity-50" />
            </div>
            <p class="text-base font-medium">暂无复制板</p>
            <p class="text-sm mt-1 opacity-70">
              <template v-if="snippetStore.searchKeyword">
                没有找到匹配的结果，试试其他关键词
              </template>
              <template v-else>
                点击右上角"新建复制板"开始添加
              </template>
            </p>
            <button
              v-if="!snippetStore.searchKeyword"
              class="mt-6 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
              @click="openNewSnippet"
            >
              创建第一条复制板
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
  </div>
</template>
