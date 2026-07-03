<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Snippet } from '@/types'
import { useCategoryStore } from '@/stores/categories'
import { X, Upload, Image as ImageIcon, Type } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

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
const tags = ref<string[]>([])
const tagInput = ref('')
const imageUrl = ref('')
const type = ref<'text' | 'image' | 'link'>('text')

const isEdit = computed(() => !!props.snippet)
const dialogTitle = computed(() => isEdit.value ? '编辑话术' : '新建话术')

watch(() => props.visible, (val) => {
  if (val) {
    if (props.snippet) {
      title.value = props.snippet.title
      content.value = props.snippet.content
      categoryId.value = props.snippet.categoryId
      tags.value = [...props.snippet.tags]
      imageUrl.value = props.snippet.imageUrl || ''
      type.value = props.snippet.type
    } else {
      title.value = ''
      content.value = ''
      categoryId.value = null
      tags.value = []
      imageUrl.value = ''
      type.value = 'text'
    }
  }
})

function addTag() {
  const val = tagInput.value.trim()
  if (val && !tags.value.includes(val)) {
    tags.value.push(val)
  }
  tagInput.value = ''
}

function removeTag(tag: string) {
  tags.value = tags.value.filter(t => t !== tag)
}

function handleTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  }
}

function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    imageUrl.value = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  imageUrl.value = ''
}

function handleSave() {
  if (!title.value.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!content.value.trim() && !imageUrl.value) {
    ElMessage.warning('请输入内容或添加图片')
    return
  }
  emit('save', {
    title: title.value.trim(),
    content: content.value,
    categoryId: categoryId.value,
    tags: tags.value,
    imageUrl: imageUrl.value || undefined,
    type: type.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scaleIn">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">{{ dialogTitle }}</h2>
          <button
            class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            @click="emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">标题</label>
            <input
              v-model="title"
              type="text"
              placeholder="输入话术标题"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">内容类型</label>
            <div class="flex gap-2">
              <button
                v-for="t in (['text', 'image', 'link'] as const)"
                :key="t"
                class="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                :class="type === t
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'"
                @click="type = t"
              >
                <span v-if="t === 'text'" class="flex items-center gap-1.5"><Type class="w-4 h-4" /> 纯文本</span>
                <span v-else-if="t === 'image'" class="flex items-center gap-1.5"><ImageIcon class="w-4 h-4" /> 图片资料</span>
                <span v-else class="flex items-center gap-1.5">🔗 链接</span>
              </button>
            </div>
          </div>

          <div v-if="type === 'image'">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">图片</label>
            <div v-if="imageUrl" class="relative inline-block">
              <img :src="imageUrl" class="max-h-48 rounded-lg shadow-md" />
              <button
                class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                @click="removeImage"
              >
                ×
              </button>
            </div>
            <label v-else class="block w-full">
              <div class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all">
                <Upload class="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p class="text-sm text-slate-500 dark:text-slate-400">点击或拖拽上传图片</p>
                <p class="text-xs text-slate-400 mt-1">支持 JPG、PNG、GIF 等格式</p>
              </div>
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">内容</label>
            <textarea
              v-model="content"
              rows="8"
              :placeholder="type === 'link' ? '输入链接地址...' : '输入话术内容，支持多行文本...'"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y font-mono text-sm leading-relaxed"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">分类</label>
            <select
              v-model="categoryId"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option :value="null">未分类</option>
              <option v-for="cat in categoryStore.sortedCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">标签</label>
            <div class="flex flex-wrap gap-1.5 mb-2 min-h-[32px]">
              <span
                v-for="tag in tags"
                :key="tag"
                class="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs rounded-full"
              >
                #{{ tag }}
                <button class="hover:text-indigo-800 dark:hover:text-indigo-100" @click="removeTag(tag)">×</button>
              </span>
            </div>
            <input
              v-model="tagInput"
              type="text"
              placeholder="输入标签后按回车添加"
              class="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
              @keydown="handleTagKeydown"
            />
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            class="px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            @click="emit('close')"
          >
            取消
          </button>
          <button
            class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors hover:shadow-lg"
            @click="handleSave"
          >
            {{ isEdit ? '保存修改' : '创建话术' }}
          </button>
        </div>
      </div>
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
