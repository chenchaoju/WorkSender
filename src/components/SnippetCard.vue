<script setup lang="ts">
import { ref } from 'vue'
import type { Snippet } from '@/types'
import { useCategoryStore } from '@/stores/categories'
import { Copy, Check, Edit3, Trash2, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-vue-next'
import { copyToClipboard } from '@/utils/clipboard'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  snippet: Snippet
  isSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'select'): void
  (e: 'edit'): void
  (e: 'delete'): void
}>()

const categoryStore = useCategoryStore()
const copied = ref(false)

async function handleCopy(e: Event) {
  e.stopPropagation()
  const ok = await copyToClipboard(props.snippet.content)
  if (ok) {
    copied.value = true
    ElMessage.success('已复制到剪贴板')
    setTimeout(() => { copied.value = false }, 1500)
  } else {
    ElMessage.error('复制失败')
  }
}

function getTypeIcon() {
  if (props.snippet.type === 'image') return ImageIcon
  if (props.snippet.type === 'link') return LinkIcon
  return FileText
}

function previewText(content: string): string {
  const lines = content.split('\n').filter(l => l.trim())
  return lines.slice(0, 3).join('\n')
}
</script>

<template>
  <div
    class="snippet-card bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-600 group relative overflow-hidden"
    :class="{ 'ring-2 ring-indigo-500 border-indigo-500': isSelected }"
    @click="emit('select')"
  >
    <div
      class="absolute top-0 left-0 w-1 h-full"
      :style="{ backgroundColor: categoryStore.getCategoryColor(snippet.categoryId) }"
    ></div>

    <div class="flex items-start justify-between mb-2 pl-2">
      <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate flex-1 pr-2 flex items-center gap-1.5">
        <component :is="getTypeIcon()" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span class="truncate">{{ snippet.title }}</span>
      </h3>
      <button
        class="copy-btn opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all duration-200 flex-shrink-0"
        :class="copied
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          : 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'"
        @click="handleCopy"
        title="复制内容"
      >
        <Check v-if="copied" class="w-4 h-4" />
        <Copy v-else class="w-4 h-4" />
      </button>
    </div>

    <div class="pl-2">
      <p class="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-line line-clamp-3 mb-3 leading-relaxed">
        {{ previewText(snippet.content) }}
      </p>

      <div v-if="snippet.tags.length > 0" class="flex flex-wrap gap-1 mb-2">
        <span
          v-for="tag in snippet.tags.slice(0, 3)"
          :key="tag"
          class="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full"
        >
          #{{ tag }}
        </span>
        <span v-if="snippet.tags.length > 3" class="text-xs text-slate-400">
          +{{ snippet.tags.length - 3 }}
        </span>
      </div>

      <div class="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span class="flex items-center gap-1">
          <span
            class="w-2 h-2 rounded-full"
            :style="{ backgroundColor: categoryStore.getCategoryColor(snippet.categoryId) }"
          ></span>
          {{ categoryStore.getCategoryName(snippet.categoryId) }}
        </span>
        <span class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            class="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded hover:text-indigo-500"
            @click.stop="emit('edit')"
            title="编辑"
          >
            <Edit3 class="w-3 h-3" />
          </button>
          <button
            class="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-500 rounded"
            @click.stop="emit('delete')"
            title="删除"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snippet-card {
  animation: cardIn 0.3s ease-out both;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
