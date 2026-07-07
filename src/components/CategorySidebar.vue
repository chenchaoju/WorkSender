<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCategoryStore } from '@/stores/categories'
import { useSnippetStore } from '@/stores/snippets'
import { Folder, FolderOpen, Hash, Plus, Settings as SettingsIcon, Inbox, X, GripVertical, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const categoryStore = useCategoryStore()
const snippetStore = useSnippetStore()

const props = defineProps<{
  mobileOpen?: boolean
  desktopCollapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'close-mobile'): void
  (e: 'toggle-desktop'): void
}>()

const newCatName = ref('')
const newCatColor = ref('#3b82f6')
const editingId = ref<string | null>(null)
const editName = ref('')
const editColor = ref('')

// 拖拽排序相关
const dragId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

const colorOptions = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1',
]

function selectAll() {
  snippetStore.setActiveCategory(null)
  emit('close-mobile')
}

function selectUncategorized() {
  snippetStore.setActiveCategory('__uncategorized__')
  emit('close-mobile')
}

function selectCategory(id: string) {
  snippetStore.setActiveCategory(id)
  emit('close-mobile')
}

function addCategory() {
  if (!newCatName.value.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  categoryStore.addCategory(newCatName.value.trim(), newCatColor.value)
  newCatName.value = ''
  ElMessage.success('分类已创建')
}

function startEdit(id: string, name: string, color: string) {
  editingId.value = id
  editName.value = name
  editColor.value = color
}

function saveEdit() {
  if (!editingId.value || !editName.value.trim()) return
  categoryStore.updateCategory(editingId.value, { name: editName.value.trim(), color: editColor.value })
  editingId.value = null
  ElMessage.success('分类已更新')
}

function cancelEdit() {
  editingId.value = null
}

function deleteCategory(id: string, name: string) {
  if (confirm(`确定要删除分类「${name}」吗？该分类下的复制板将变为未分类。`)) {
    snippetStore.snippets.forEach(s => {
      if (s.categoryId === id) {
        snippetStore.updateSnippet(s.id, { categoryId: null })
      }
    })
    categoryStore.deleteCategory(id)
    if (snippetStore.activeCategoryId === id) {
      snippetStore.setActiveCategory(null)
    }
    ElMessage.success('分类已删除')
  }
}

// 拖拽排序
function onDragStart(e: DragEvent, id: string) {
  dragId.value = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}

function onDragOver(e: DragEvent, id: string) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverId.value = id
}

function onDragLeave() {
  dragOverId.value = null
}

function onDrop(e: DragEvent, targetId: string) {
  e.preventDefault()
  const sourceId = dragId.value
  if (!sourceId || sourceId === targetId) {
    dragId.value = null
    dragOverId.value = null
    return
  }

  const cats = categoryStore.sortedCategories
  const sourceIdx = cats.findIndex(c => c.id === sourceId)
  const targetIdx = cats.findIndex(c => c.id === targetId)
  if (sourceIdx === -1 || targetIdx === -1) return

  // 重新计算order
  const newCats = [...cats]
  const [moved] = newCats.splice(sourceIdx, 1)
  newCats.splice(targetIdx, 0, moved)
  newCats.forEach((c, idx) => {
    categoryStore.updateCategory(c.id, { order: idx + 1 })
  })

  dragId.value = null
  dragOverId.value = null
}

function onDragEnd() {
  dragId.value = null
  dragOverId.value = null
}

const isActiveAll = computed(() => snippetStore.activeCategoryId === null)
const isActiveUncategorized = computed(() => snippetStore.activeCategoryId === '__uncategorized__')
</script>

<template>
  <!-- 移动端遮罩 -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-40 bg-black/40 lg:hidden"
    @click="emit('close-mobile')"
  ></div>

  <aside
    class="flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col h-full transition-all duration-300 z-50
    fixed lg:static top-0 left-0 bottom-0 lg:translate-x-0"
    :class="[
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      props.desktopCollapsed ? 'w-14' : 'w-64'
    ]"
  >
    <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between" :class="props.desktopCollapsed ? 'px-3 py-4 justify-center' : ''">
      <h2 v-if="!props.desktopCollapsed" class="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
        <Folder class="w-4 h-4" />
        分类管理
      </h2>
      <div class="flex items-center gap-1">
        <button
          class="hidden lg:block p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400"
          @click="emit('toggle-desktop')"
          :title="props.desktopCollapsed ? '展开' : '收起'"
        >
          <PanelLeftClose v-if="!props.desktopCollapsed" class="w-4 h-4" />
          <PanelLeftOpen v-else class="w-4 h-4" />
        </button>
        <button
          class="lg:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400"
          @click="emit('close-mobile')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto py-2">
      <div
        class="category-item mx-2 px-3 py-2 rounded-md cursor-pointer flex items-center transition-all duration-200"
        :class="[
          isActiveAll
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
          props.desktopCollapsed ? 'justify-center px-2' : 'justify-between'
        ]"
        @click="selectAll"
      >
        <span class="flex items-center gap-2" :class="props.desktopCollapsed ? '' : ''">
          <FolderOpen class="w-4 h-4 flex-shrink-0" :title="props.desktopCollapsed ? '全部复制板' : ''" />
          <span v-if="!props.desktopCollapsed">全部复制板</span>
        </span>
        <span v-if="!props.desktopCollapsed" class="text-xs opacity-70">{{ snippetStore.countByCategory(null) }}</span>
      </div>

      <div
        class="category-item mx-2 px-3 py-2 rounded-md cursor-pointer flex items-center transition-all duration-200"
        :class="[
          isActiveUncategorized
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
          props.desktopCollapsed ? 'justify-center px-2' : 'justify-between'
        ]"
        @click="selectUncategorized"
      >
        <span class="flex items-center gap-2">
          <Inbox class="w-4 h-4 flex-shrink-0" :title="props.desktopCollapsed ? '未分类' : ''" />
          <span v-if="!props.desktopCollapsed">未分类</span>
        </span>
        <span v-if="!props.desktopCollapsed" class="text-xs opacity-70">{{ snippetStore.countByCategory('__uncategorized__') }}</span>
      </div>

      <div v-if="!props.desktopCollapsed" class="h-px bg-slate-200 dark:bg-slate-700 mx-4 my-2"></div>

      <div
        v-for="cat in categoryStore.sortedCategories"
        :key="cat.id"
        class="category-item mx-2 px-3 py-2 rounded-md cursor-pointer flex items-center transition-all duration-200 group"
        :class="[
          snippetStore.activeCategoryId === cat.id
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
          dragOverId === cat.id ? 'ring-2 ring-indigo-400' : '',
          dragId === cat.id ? 'opacity-50' : '',
          props.desktopCollapsed ? 'justify-center px-2' : 'justify-between'
        ]"
        draggable="true"
        @click="selectCategory(cat.id)"
        @dragstart="onDragStart($event, cat.id)"
        @dragover="onDragOver($event, cat.id)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, cat.id)"
        @dragend="onDragEnd"
      >
        <div v-if="editingId === cat.id && !props.desktopCollapsed" class="flex items-center gap-2 flex-1" @click.stop>
          <input
            v-model="editName"
            class="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
            @keyup.enter="saveEdit"
            @keyup.esc="cancelEdit"
            autofocus
          />
          <div class="flex gap-1">
            <button
              v-for="color in colorOptions.slice(0, 6)"
              :key="color"
              class="w-4 h-4 rounded-full border"
              :class="editColor === color ? 'border-slate-700 dark:border-slate-200' : 'border-transparent'"
              :style="{ backgroundColor: color }"
              @click.stop="editColor = color"
            />
          </div>
          <button class="text-xs text-green-600 hover:text-green-700" @click.stop="saveEdit">保存</button>
          <button class="text-xs text-slate-400 hover:text-slate-600" @click.stop="cancelEdit">取消</button>
        </div>
        <template v-else>
          <span class="flex items-center gap-2 truncate" :title="cat.name">
            <GripVertical v-if="!props.desktopCollapsed" class="w-3 h-3 text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing flex-shrink-0" />
            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: cat.color }"></span>
            <span v-if="!props.desktopCollapsed" class="truncate">{{ cat.name }}</span>
          </span>
          <div v-if="!props.desktopCollapsed" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
              @click.stop="startEdit(cat.id, cat.name, cat.color)"
              title="编辑"
            >
              <SettingsIcon class="w-3 h-3" />
            </button>
            <button
              class="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
              @click.stop="deleteCategory(cat.id, cat.name)"
              title="删除"
            >
              <span class="text-xs">×</span>
            </button>
          </div>
          <span v-if="!props.desktopCollapsed" class="text-xs opacity-70 group-hover:opacity-0 transition-opacity">{{ snippetStore.countByCategory(cat.id) }}</span>
        </template>
      </div>
    </div>

    <div v-if="!props.desktopCollapsed" class="p-3 border-t border-slate-200 dark:border-slate-700">
      <div class="flex gap-2 mb-2">
        <input
          v-model="newCatName"
          type="text"
          placeholder="新分类名称"
          class="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          @keyup.enter="addCategory"
        />
        <button
          class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors flex items-center gap-1"
          @click="addCategory"
        >
          <Plus class="w-4 h-4" />
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
  </aside>
</template>

<style scoped>
.category-item {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
