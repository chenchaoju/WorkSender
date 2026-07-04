<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount, nextTick } from 'vue'
import type { Snippet, SnippetItem } from '@/types'
import { useCategoryStore } from '@/stores/categories'
import { X, Image as ImageIcon, Type, Link as LinkIcon, List, Trash2, Maximize2, Minimize2 } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { generateId } from '@/utils/storage'

const props = defineProps<{
  visible: boolean
  snippet: Snippet | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: Partial<Snippet>): void
}>()

const categoryStore = useCategoryStore()

const title = ref('')
const content = ref('')
const categoryId = ref<string | null>(null)
const type = ref<'text' | 'image' | 'link' | 'multi'>('text')
const imageUrl = ref('')
const items = ref<SnippetItem[]>([])
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const previewImage = ref('')
const isExpanded = ref(false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

const isEdit = computed(() => !!props.snippet)
const dialogTitle = computed(() => isEdit.value ? '编辑复制板' : '新建复制板')

function readImageFile(file: File, cb: (base64: string) => void) {
  const reader = new FileReader()
  reader.onload = (ev) => {
    cb(ev.target?.result as string)
  }
  reader.readAsDataURL(file)
}

function handlePaste(e: ClipboardEvent) {
  if (!props.visible) return
  const clipboardItems = e.clipboardData?.items
  if (!clipboardItems) return
  for (const item of clipboardItems) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) {
        if (type.value === 'multi') {
          addImageItem(file)
        } else {
          if (type.value !== 'image') {
            type.value = 'image'
          }
          readImageFile(file, (img) => { imageUrl.value = img })
          ElMessage.success('图片已粘贴')
        }
      }
      return
    }
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    let imgCount = 0
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        imgCount++
        if (type.value === 'multi') {
          addImageItem(file)
        } else {
          if (type.value !== 'image') {
            type.value = 'image'
          }
          readImageFile(file, (img) => { imageUrl.value = img })
        }
      }
    }
    if (imgCount > 0) {
      ElMessage.success(`已拖入 ${imgCount} 张图片`)
    } else {
      ElMessage.warning('请拖入图片文件')
    }
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  dragOver.value = true
}

function handleDragLeave() {
  dragOver.value = false
}

function removeImage() {
  imageUrl.value = ''
}

function addTextItem() {
  items.value.push({
    id: generateId(),
    label: '',
    content: '',
    itemType: 'text',
  })
}

function addImageItem(file: File) {
  readImageFile(file, (img) => {
    items.value.push({
      id: generateId(),
      label: '',
      content: '',
      itemType: 'image',
      imageUrl: img,
    })
    ElMessage.success('图片已添加')
  })
}

function removeItem(idx: number) {
  items.value.splice(idx, 1)
}

function moveItemUp(idx: number) {
  if (idx <= 0) return
  const temp = items.value[idx]
  items.value[idx] = items.value[idx - 1]
  items.value[idx - 1] = temp
}

function moveItemDown(idx: number) {
  if (idx >= items.value.length - 1) return
  const temp = items.value[idx]
  items.value[idx] = items.value[idx + 1]
  items.value[idx + 1] = temp
}

function openPreview(url: string) {
  previewImage.value = url
}

function closePreview() {
  previewImage.value = ''
}

watch(() => props.visible, (val) => {
  if (!val) {
    isExpanded.value = false
  }
  if (val) {
    if (props.snippet) {
      title.value = props.snippet.title
      content.value = props.snippet.content
      categoryId.value = props.snippet.categoryId
      type.value = props.snippet.type
      imageUrl.value = props.snippet.imageUrl || ''
      items.value = props.snippet.items ? props.snippet.items.map(i => ({ ...i })) : []
    } else {
      title.value = ''
      content.value = ''
      categoryId.value = null
      type.value = 'text'
      imageUrl.value = ''
      items.value = []
    }
    nextTick(() => {
      document.addEventListener('paste', handlePaste)
    })
  } else {
    document.removeEventListener('paste', handlePaste)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', handlePaste)
})

function handleSave() {
  if (!title.value.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  if (type.value === 'image') {
    if (!imageUrl.value) {
      ElMessage.warning('请粘贴或拖入图片')
      return
    }
    emit('save', {
      title: title.value.trim(),
      content: '',
      categoryId: categoryId.value,
      type: 'image',
      imageUrl: imageUrl.value,
    })
  } else if (type.value === 'multi') {
    const validItems = items.value.filter(i =>
      (i.itemType === 'text' && (i.label.trim() || i.content.trim())) ||
      (i.itemType === 'image' && i.imageUrl)
    )
    if (validItems.length === 0) {
      ElMessage.warning('请至少添加一条子项')
      return
    }
    emit('save', {
      title: title.value.trim(),
      content: '',
      categoryId: categoryId.value,
      type: 'multi',
      items: validItems,
      imageUrl: undefined,
    })
  } else {
    if (!content.value.trim()) {
      ElMessage.warning('请输入内容')
      return
    }
    emit('save', {
      title: title.value.trim(),
      content: content.value,
      categoryId: categoryId.value,
      type: type.value,
      imageUrl: undefined,
    })
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex justify-center bg-black/40 backdrop-blur-sm transition-all duration-300"
      :class="isExpanded ? 'items-center p-0' : 'items-end sm:items-center p-2 sm:p-4'"
      @click.self="emit('close')"
    >
      <div
        class="bg-white dark:bg-slate-800 shadow-2xl w-full flex flex-col animate-scaleIn transition-all duration-300"
        :class="isExpanded
          ? 'h-screen max-h-screen rounded-none sm:rounded-xl sm:max-w-[95vw] sm:h-[95vh] sm:max-h-[95vh]'
          : 'rounded-t-2xl sm:rounded-xl max-w-3xl h-[92vh] sm:h-auto sm:max-h-[90vh]'"
      >
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">{{ dialogTitle }}</h2>
          <div class="flex items-center gap-1">
            <button
              class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              :title="isExpanded ? '收缩' : '最大化'"
              @click="toggleExpand"
            >
              <Minimize2 v-if="isExpanded" class="w-5 h-5" />
              <Maximize2 v-else class="w-5 h-5" />
            </button>
            <button
              class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              @click="emit('close')"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col">
          <div class="flex-shrink-0 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">标题</label>
            <input
              v-model="title"
              type="text"
              placeholder="输入复制板标题"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">类型</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="t in (['text', 'image', 'link', 'multi'] as const)"
                :key="t"
                class="px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-1.5"
                :class="type === t
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'"
                @click="type = t"
              >
                <Type v-if="t === 'text'" class="w-4 h-4" />
                <ImageIcon v-else-if="t === 'image'" class="w-4 h-4" />
                <LinkIcon v-else-if="t === 'link'" class="w-4 h-4" />
                <List v-else class="w-4 h-4" />
                {{ t === 'text' ? '纯文本' : t === 'image' ? '图片' : t === 'link' ? '链接' : '多条混合' }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">分类</label>
            <select
              v-model="categoryId"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option :value="null">未分类</option>
              <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="type === 'image'" class="flex-1 overflow-y-auto mt-4">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">图片</label>
            <div v-if="imageUrl" class="relative inline-block">
              <img :src="imageUrl" class="max-h-64 rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" @click="openPreview(imageUrl)" />
              <button
                class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                @click="removeImage"
              >
                ×
              </button>
            </div>
            <div
              v-else
              class="border-2 border-dashed rounded-lg p-8 text-center transition-all"
              :class="dragOver
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-slate-300 dark:border-slate-600'"
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
            >
              <ImageIcon class="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p class="text-sm text-slate-500 dark:text-slate-400">拖拽图片到此处 或 Ctrl+V 粘贴</p>
              <p class="text-xs text-slate-400 mt-1">支持微信截图、网页图片直接拖入</p>
            </div>
          </div>

          <div v-else-if="type === 'multi'" class="flex-1 overflow-y-auto mt-4">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">子项列表（{{ items.length }} 项）</label>
              <div class="flex gap-2">
                <button
                  class="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded-md transition-colors flex items-center gap-1"
                  @click="addTextItem"
                >
                  <Type class="w-3.5 h-3.5" />
                  添加文本
                </button>
                <button
                  class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md transition-colors flex items-center gap-1"
                  @click="fileInput?.click()"
                >
                  <ImageIcon class="w-3.5 h-3.5" />
                  添加图片
                </button>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="(e) => {
                    const input = e.target as HTMLInputElement
                    if (input.files) {
                      for (const f of input.files) {
                        if (f.type.startsWith('image/')) addImageItem(f)
                      }
                    }
                    input.value = ''
                  }"
                />
              </div>
            </div>

            <div
              v-if="items.length === 0"
              class="border-2 border-dashed rounded-lg p-8 text-center transition-all mb-3"
              :class="dragOver
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-slate-300 dark:border-slate-600'"
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
            >
              <List class="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p class="text-sm text-slate-500 dark:text-slate-400">拖拽多张图片到此处</p>
              <p class="text-xs text-slate-400 mt-1">或点击上方按钮添加</p>
            </div>

            <div class="space-y-2">
              <div
                v-for="(item, idx) in items"
                :key="item.id"
                class="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-slate-500 dark:text-slate-400 w-8 flex-shrink-0">{{ idx + 1 }}.</span>
                  <span v-if="item.itemType === 'image'" class="flex items-center gap-1 text-xs text-indigo-500 flex-shrink-0">
                    <ImageIcon class="w-3.5 h-3.5" /> 图片
                  </span>
                  <span v-else class="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                    <Type class="w-3.5 h-3.5" /> 文本
                  </span>
                  <input
                    v-model="item.label"
                    type="text"
                    :placeholder="item.itemType === 'image' ? '图片名称' : '输入文本内容...'"
                    class="flex-1 px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                  />
                  <div class="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30"
                      :disabled="idx === 0"
                      @click="moveItemUp(idx)"
                      title="上移"
                    >
                      ↑
                    </button>
                    <button
                      class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30"
                      :disabled="idx === items.length - 1"
                      @click="moveItemDown(idx)"
                      title="下移"
                    >
                      ↓
                    </button>
                    <button
                      class="p-1 text-red-400 hover:text-red-500"
                      @click="removeItem(idx)"
                      title="删除"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div v-if="item.itemType === 'image'" class="flex gap-3 mt-2">
                  <img
                    :src="item.imageUrl"
                    class="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    @click="openPreview(item.imageUrl!)"
                  />
                  <div class="flex-1">
                    <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">备注</label>
                    <textarea
                      v-model="item.content"
                      rows="3"
                      placeholder="添加备注说明..."
                      class="w-full px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="items.length > 0"
              class="border-2 border-dashed rounded-lg p-3 text-center transition-all mt-2"
              :class="dragOver
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-slate-200 dark:border-slate-600'"
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
            >
              <p class="text-xs text-slate-400">继续拖拽图片到此处添加</p>
            </div>
          </div>

          <div v-else class="flex-1 flex flex-col min-h-0">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">内容</label>
            <textarea
              v-model="content"
              :placeholder="type === 'link' ? '输入链接地址...' : '输入复制板内容...'"
              class="w-full flex-1 min-h-0 px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-mono text-sm leading-relaxed"
            ></textarea>
          </div>
        </div>

        <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            class="flex-1 sm:flex-none px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            @click="emit('close')"
          >
            取消
          </button>
          <button
            class="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors hover:shadow-lg"
            @click="handleSave"
          >
            {{ isEdit ? '保存修改' : '创建复制板' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="previewImage"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      @click="closePreview"
    >
      <img
        :src="previewImage"
        class="max-w-full max-h-full object-contain rounded-lg"
        @click.stop
      />
      <button
        class="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
        @click="closePreview"
      >
        <X class="w-6 h-6" />
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-scaleIn {
  animation: scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
