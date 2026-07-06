<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Snippet } from '@/types'
import { useCategoryStore } from '@/stores/categories'
import { Copy, Check, Edit3, Trash2, X, Calendar, Folder } from 'lucide-vue-next'
import { copyToClipboard } from '@/utils/clipboard'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  snippet: Snippet | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit'): void
  (e: 'delete'): void
}>()

const categoryStore = useCategoryStore()
const copied = ref(false)

async function handleCopy() {
  if (!props.snippet) return
  const ok = await copyToClipboard(props.snippet.content)
  if (ok) {
    copied.value = true
    ElMessage.success('已复制到剪贴板')
    setTimeout(() => { copied.value = false }, 1500)
  } else {
    ElMessage.error('复制失败')
  }
}

const formattedDate = computed(() => {
  if (!props.snippet) return ''
  return new Date(props.snippet.updatedAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <aside
    class="w-96 flex-shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col h-full transition-all duration-300"
    :class="{ 'translate-x-full opacity-0': !snippet }"
  >
    <template v-if="snippet">
      <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between">
        <div class="flex-1 pr-2">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="w-2.5 h-2.5 rounded-full"
              :style="{ backgroundColor: categoryStore.getCategoryColor(snippet.categoryId) }"
            ></span>
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ categoryStore.getCategoryName(snippet.categoryId) }}
            </span>
          </div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100 break-words">
            {{ snippet.title }}
          </h2>
        </div>
        <button
          class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="snippet.imageUrl" class="mb-4">
          <img
            :src="snippet.imageUrl"
            :alt="snippet.title"
            class="w-full rounded-lg shadow-md"
          />
        </div>

        <div class="mb-4">
          <button
            class="w-full py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
            :class="copied
              ? 'bg-green-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg'"
            @click="handleCopy"
          >
            <Check v-if="copied" class="w-5 h-5" />
            <Copy v-else class="w-5 h-5" />
            <span>{{ copied ? '已复制' : '一键复制内容' }}</span>
          </button>
        </div>

        <div class="mb-4">
          <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            内容详情
          </h4>
          <div class="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-200 dark:border-slate-700">
            {{ snippet.content }}
          </div>
        </div>

        <div class="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Calendar class="w-3.5 h-3.5" />
            <span>更新于 {{ formattedDate }}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Folder class="w-3.5 h-3.5" />
            <span>分类：{{ categoryStore.getCategoryName(snippet.categoryId) }}</span>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
        <button
          class="flex-1 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
          @click="emit('edit')"
        >
          <Edit3 class="w-4 h-4" />
          编辑
        </button>
        <button
          class="flex-1 py-2 px-4 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1.5"
          @click="emit('delete')"
        >
          <Trash2 class="w-4 h-4" />
          删除
        </button>
      </div>
    </template>

    <template v-else>
      <div class="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
        <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
          <Copy class="w-8 h-8 opacity-50" />
        </div>
        <p class="text-sm">选择一个复制板查看详情</p>
        <p class="text-xs mt-1 opacity-70">点击左侧卡片快速预览</p>
      </div>
    </template>
  </aside>
</template>
