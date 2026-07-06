<script setup lang="ts">
import { ref } from 'vue'
import type { Snippet } from '@/types'
import { useCategoryStore } from '@/stores/categories'
import { Copy, Check, Edit3, Trash2, Image as ImageIcon, Link as LinkIcon, FileText, ChevronUp, ChevronDown, List } from 'lucide-vue-next'
import { copyToClipboard, copyImageToClipboard } from '@/utils/clipboard'
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
const collapsed = ref(false)

function toggleCollapse(e: Event) {
  e.stopPropagation()
  collapsed.value = !collapsed.value
}

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

async function handleCopyImage(e: Event) {
  e.stopPropagation()
  if (!props.snippet.imageUrl) return
  const ok = await copyImageToClipboard(props.snippet.imageUrl)
  if (ok) {
    ElMessage.success('图片已复制到剪贴板')
  } else {
    ElMessage.error('图片复制失败，请尝试右键另存')
  }
}

async function handleCopyItem(e: Event, content: string, imageUrl?: string) {
  e.stopPropagation()
  if (imageUrl) {
    const ok = await copyImageToClipboard(imageUrl)
    if (ok) ElMessage.success('图片已复制')
    else ElMessage.error('图片复制失败')
  } else if (content) {
    const ok = await copyToClipboard(content)
    if (ok) {
      ElMessage.success('已复制')
    } else {
      ElMessage.error('复制失败')
    }
  }
}

function getTypeIcon() {
  if (props.snippet.type === 'image') return ImageIcon
  if (props.snippet.type === 'link') return LinkIcon
  if (props.snippet.type === 'multi') return List
  return FileText
}

function getTypeLabel() {
  if (props.snippet.type === 'image') return '图片'
  if (props.snippet.type === 'link') return '链接'
  if (props.snippet.type === 'multi') return '多条'
  return '文本'
}

function previewText(content: string): string {
  const lines = content.split('\n').filter(l => l.trim())
  return lines.slice(0, collapsed.value ? 2 : 4).join('\n')
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
        <span class="text-xs text-slate-400 font-normal flex-shrink-0">{{ getTypeLabel() }}</span>
      </h3>
      <div class="flex items-center gap-1 flex-shrink-0">
        <button
          class="copy-btn p-1.5 rounded-md transition-all duration-200"
          :class="copied
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-100'"
          @click="handleCopy"
          title="复制内容"
        >
          <Check v-if="copied" class="w-4 h-4" />
          <Copy v-else class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          @click="toggleCollapse"
          :title="collapsed ? '展开' : '收起'"
        >
          <ChevronUp v-if="!collapsed" class="w-4 h-4" />
          <ChevronDown v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="pl-2" :class="{ 'overflow-hidden': collapsed }">
      <!-- 图片类型 -->
      <div v-if="snippet.type === 'image' && snippet.imageUrl" class="mb-2">
        <img
          :src="snippet.imageUrl"
          :alt="snippet.title"
          class="rounded-lg max-h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          :class="{ 'max-h-20': collapsed }"
          @click.stop="handleCopyImage"
        />
      </div>

      <!-- 多条类型 -->
      <div v-else-if="snippet.type === 'multi' && snippet.items && snippet.items.length > 0" class="space-y-1.5 mb-2">
        <div
          v-for="(item, idx) in snippet.items.slice(0, collapsed ? 2 : 5)"
          :key="item.id"
          class="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group/item"
          @click.stop="handleCopyItem($event, item.content, item.imageUrl)"
        >
          <img
            v-if="item.itemType === 'image' && item.imageUrl"
            :src="item.imageUrl"
            class="w-8 h-8 object-cover rounded flex-shrink-0"
          />
          <div v-else class="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
            <FileText class="w-4 h-4 text-slate-400" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-slate-700 dark:text-slate-200 truncate">
              {{ item.label || item.content || (item.imageUrl ? '图片' : '空') }}
            </p>
            <p v-if="item.content && item.itemType === 'image'" class="text-xs text-slate-400 truncate">{{ item.content }}</p>
          </div>
          <Copy class="w-3 h-3 text-slate-300 group-hover/item:text-indigo-500 transition-colors flex-shrink-0" />
        </div>
        <p v-if="snippet.items.length > (collapsed ? 2 : 5)" class="text-xs text-slate-400 text-center pt-1">
          还有 {{ snippet.items.length - (collapsed ? 2 : 5) }} 项...
        </p>
      </div>

      <!-- 文本/链接类型 -->
      <p v-else class="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-line mb-3 leading-relaxed"
         :class="collapsed ? 'line-clamp-2' : 'line-clamp-4'">
        {{ previewText(snippet.content) }}
      </p>

      <div v-if="snippet.tags.length > 0 && !collapsed" class="flex flex-wrap gap-1 mb-2">
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
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
