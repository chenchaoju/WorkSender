<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount, nextTick } from 'vue'
import type { Snippet, SnippetItem } from '@/types'
import { useCategoryStore } from '@/stores/categories'
import { useSnippetStore } from '@/stores/snippets'
import { X, Image as ImageIcon, Type, List, Trash2, GripVertical, ClipboardPaste, Check, Plus } from 'lucide-vue-next'
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
const snippetStore = useSnippetStore()

const title = ref('')
const content = ref('')
const categoryId = ref<string | null>(null)
const type = ref<'text' | 'image' | 'multi'>('text')
const imageUrl = ref('')
const items = ref<SnippetItem[]>([])
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const previewImage = ref('')

const isEdit = computed(() => !!props.snippet)
const dialogTitle = computed(() => isEdit.value ? '编辑复制板' : '新建剪切板')

const enableMultiple = ref(false)

function readImageFile(file: File, cb: (base64: string) => void) {
  const reader = new FileReader()
  reader.onload = (ev) => {
    cb(ev.target?.result as string)
  }
  reader.readAsDataURL(file)
}

async function tryReadClipboard() {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText()
      if (text && text.trim()) {
        return text
      }
    }
  } catch (e) {
  }
  return ''
}

async function tryReadClipboardImage() {
  try {
    if (navigator.clipboard && navigator.clipboard.read) {
      const clipboardItems = await navigator.clipboard.read()
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            return blob
          }
        }
      }
    }
  } catch (e) {
  }
  return null
}

function handlePaste(e: ClipboardEvent) {
  if (!props.visible) return
  const clipboardItems = e.clipboardData?.items
  if (!clipboardItems) return
  let hasImage = false
  for (const item of clipboardItems) {
    if (item.type.startsWith('image/')) {
      hasImage = true
      e.preventDefault()
      const file = item.getAsFile()
      if (file) {
        addImageFromFile(file)
      }
    }
  }
  if (!hasImage) {
    const text = e.clipboardData?.getData('text')
    if (text && text.trim()) {
      addTextFromClipboard(text)
    }
  }
}

function addImageFromFile(file: File) {
  readImageFile(file, (img) => {
    if (enableMultiple.value || type.value === 'multi') {
      items.value.push({
        id: generateId(),
        label: file.name,
        content: '',
        itemType: 'image',
        imageUrl: img,
      })
      ElMessage.success('图片已添加到列表')
    } else {
      imageUrl.value = img
      type.value = 'image'
      ElMessage.success('图片已添加')
    }
  })
}

function addTextFromClipboard(text: string) {
  if (enableMultiple.value || type.value === 'multi') {
    items.value.push({
      id: generateId(),
      label: '',
      content: text,
      itemType: 'text',
    })
    ElMessage.success('文本已添加到列表')
  } else {
    content.value = text
    type.value = 'text'
    if (!title.value) {
      title.value = text.substring(0, 20).replace(/\n/g, ' ')
    }
    ElMessage.success('文本已添加')
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        addImageFromFile(file)
      }
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

function addImageItem() {
  fileInput.value?.click()
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

const itemDragId = ref<string | null>(null)
const itemDragOverId = ref<string | null>(null)

function onItemDragStart(e: DragEvent, id: string) {
  itemDragId.value = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}

function onItemDragOver(e: DragEvent, id: string) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  itemDragOverId.value = id
}

function onItemDragLeave() {
  itemDragOverId.value = null
}

function onItemDrop(e: DragEvent, targetId: string) {
  e.preventDefault()
  const sourceId = itemDragId.value
  if (!sourceId || sourceId === targetId) {
    itemDragId.value = null
    itemDragOverId.value = null
    return
  }
  const sourceIdx = items.value.findIndex(i => i.id === sourceId)
  const targetIdx = items.value.findIndex(i => i.id === targetId)
  if (sourceIdx === -1 || targetIdx === -1) return
  const [moved] = items.value.splice(sourceIdx, 1)
  items.value.splice(targetIdx, 0, moved)
  itemDragId.value = null
  itemDragOverId.value = null
}

function onItemDragEnd() {
  itemDragId.value = null
  itemDragOverId.value = null
}

function openPreview(url: string) {
  previewImage.value = url
}

function closePreview() {
  previewImage.value = ''
}

async function handlePasteFromClipboard() {
  const text = await tryReadClipboard()
  const imageBlob = await tryReadClipboardImage()
  
  if (imageBlob) {
    const file = new File([imageBlob], 'clipboard-image.png', { type: imageBlob.type })
    addImageFromFile(file)
  } else if (text) {
    addTextFromClipboard(text)
  } else {
    ElMessage.warning('剪贴板为空')
  }
}

watch(() => props.visible, async (val) => {
  if (val) {
    if (props.snippet) {
      title.value = props.snippet.title
      content.value = props.snippet.content
      categoryId.value = props.snippet.categoryId
      type.value = props.snippet.type === 'link' ? 'text' : props.snippet.type
      imageUrl.value = props.snippet.imageUrl || ''
      items.value = props.snippet.items ? props.snippet.items.map(i => ({ ...i })) : []
      enableMultiple.value = props.snippet.type === 'multi'
    } else {
      content.value = ''
      categoryId.value = null
      type.value = 'text'
      imageUrl.value = ''
      items.value = []
      enableMultiple.value = false
      const count = snippetStore.snippets.length
      title.value = `标题${count + 1}`
      nextTick(async () => {
        const text = await tryReadClipboard()
        const imageBlob = await tryReadClipboardImage()
        if (imageBlob) {
          enableMultiple.value = true
          const file = new File([imageBlob], 'clipboard-image.png', { type: imageBlob.type })
          readImageFile(file, (img) => {
            items.value.push({
              id: generateId(),
              label: '剪贴板图片',
              content: '',
              itemType: 'image',
              imageUrl: img,
            })
          })
        } else if (text && text.trim()) {
          content.value = text
          if (!title.value) {
            title.value = text.substring(0, 20).replace(/\n/g, ' ')
          }
        }
      })
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

watch(enableMultiple, (val) => {
  if (val) {
    type.value = 'multi'
    if (content.value.trim()) {
      items.value.unshift({
        id: generateId(),
        label: '',
        content: content.value,
        itemType: 'text',
      })
      content.value = ''
    }
    if (imageUrl.value) {
      items.value.push({
        id: generateId(),
        label: '',
        content: '',
        itemType: 'image',
        imageUrl: imageUrl.value,
      })
      imageUrl.value = ''
    }
  } else {
    type.value = 'text'
    if (items.value.length === 1) {
      const item = items.value[0]
      if (item.itemType === 'text') {
        content.value = item.content
      } else if (item.itemType === 'image') {
        imageUrl.value = item.imageUrl || ''
        type.value = 'image'
      }
      items.value = []
    }
  }
})

function handleSave() {
  if (!title.value.trim()) {
    ElMessage.warning('请输入标题')
    return
  }

  if (enableMultiple.value || type.value === 'multi') {
    const validItems: SnippetItem[] = []
    items.value.forEach(i => {
      if (i.itemType === 'text' && i.content.trim()) {
        validItems.push({ ...i })
      } else if (i.itemType === 'image' && i.imageUrl) {
        validItems.push({ ...i })
      }
    })

    if (validItems.length === 0) {
      ElMessage.warning('请至少添加一项内容')
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
    if (type.value === 'image') {
      if (!imageUrl.value) {
        ElMessage.warning('请添加图片')
        return
      }
      emit('save', {
        title: title.value.trim(),
        content: '',
        categoryId: categoryId.value,
        type: 'image',
        imageUrl: imageUrl.value,
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
        type: 'text',
        imageUrl: undefined,
      })
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-3xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col animate-scaleIn">
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">{{ dialogTitle }}</h2>
          <button
            class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            @click="emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">类型</label>
            <div class="flex flex-wrap gap-2">
              <label
                class="px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 cursor-pointer select-none"
                :class="type === 'text' && !enableMultiple
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'"
                @click="type = 'text'; enableMultiple = false"
              >
                <Type class="w-4 h-4" />
                纯文本
              </label>
              <label
                class="px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 cursor-pointer select-none"
                :class="type === 'image' && !enableMultiple
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'"
                @click="type = 'image'; enableMultiple = false"
              >
                <ImageIcon class="w-4 h-4" />
                图片
              </label>
              <label
                class="px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 cursor-pointer select-none"
                :class="enableMultiple || type === 'multi'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'"
              >
                <input
                  type="checkbox"
                  v-model="enableMultiple"
                  class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <List class="w-4 h-4" />
                多条记录（文本+图片混合）
              </label>
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

          <div v-if="!enableMultiple && type === 'text'">
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">文本内容</label>
              <button
                class="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                @click="handlePasteFromClipboard"
                title="从剪贴板读取"
              >
                <ClipboardPaste class="w-3.5 h-3.5" />
                从剪贴板读取
              </button>
            </div>
            <textarea
              v-model="content"
              rows="6"
              placeholder="输入文本内容（可粘贴）..."
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-mono text-sm leading-relaxed"
            ></textarea>
          </div>

          <div v-if="!enableMultiple && type === 'image'">
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">图片</label>
              <button
                class="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                @click="handlePasteFromClipboard"
                title="从剪贴板读取"
              >
                <ClipboardPaste class="w-3.5 h-3.5" />
                从剪贴板读取
              </button>
            </div>
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

          <div v-if="enableMultiple">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">多条记录（{{ items.length }} 项）拖动可排序</label>
              <div class="flex gap-2">
                <button
                  class="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded-md transition-colors flex items-center gap-1"
                  @click="addTextItem()"
                >
                  <Plus class="w-3.5 h-3.5" />
                  添加文本
                </button>
                <button
                  class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md transition-colors flex items-center gap-1"
                  @click="addImageItem()"
                >
                  <Plus class="w-3.5 h-3.5" />
                  添加图片
                </button>
                <button
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-md transition-colors flex items-center gap-1"
                  @click="handlePasteFromClipboard"
                >
                  <ClipboardPaste class="w-3.5 h-3.5" />
                  从剪贴板添加
                </button>
              </div>
            </div>

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
                    if (f.type.startsWith('image/')) addImageFromFile(f)
                  }
                }
                input.value = ''
              }"
            />

            <div class="space-y-2">
              <div
                v-for="(item, idx) in items"
                :key="item.id"
                class="border rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50 transition-all cursor-move"
                :class="[
                  itemDragOverId === item.id ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-slate-200 dark:border-slate-700',
                  itemDragId === item.id ? 'opacity-50' : ''
                ]"
                draggable="true"
                @dragstart="onItemDragStart($event, item.id)"
                @dragover="onItemDragOver($event, item.id)"
                @dragleave="onItemDragLeave"
                @drop="onItemDrop($event, item.id)"
                @dragend="onItemDragEnd"
              >
                <div class="flex items-center gap-2">
                  <GripVertical class="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span class="text-xs font-medium text-slate-500 dark:text-slate-400 w-6 flex-shrink-0">{{ idx + 1 }}.</span>
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
                    @dragstart.stop
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
                <div v-if="item.itemType === 'image' && item.imageUrl" class="flex gap-3 mt-2">
                  <img
                    :src="item.imageUrl"
                    class="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    @click.stop="openPreview(item.imageUrl)"
                    @dragstart.stop
                  />
                  <div class="flex-1">
                    <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">备注</label>
                    <textarea
                      v-model="item.content"
                      rows="3"
                      placeholder="添加备注说明..."
                      class="w-full px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                      @dragstart.stop
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="border-2 border-dashed rounded-lg p-4 text-center transition-all mt-2"
              :class="dragOver
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-slate-200 dark:border-slate-600'"
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
            >
              <p class="text-xs text-slate-400">继续拖拽图片或文本到此处添加</p>
            </div>
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
            {{ isEdit ? '保存修改' : '创建剪切板' }}
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
