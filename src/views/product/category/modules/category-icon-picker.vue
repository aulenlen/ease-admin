<template>
  <div class="category-icon-picker">
    <div class="category-icon-picker__preview">
      <ArtSvgIcon v-if="innerValue" :icon="innerValue" class="category-icon-picker__preview-icon" />
      <span v-else class="category-icon-picker__preview-placeholder">-</span>
    </div>

    <div class="min-w-0 flex-1">
      <ElInput
        v-model.trim="innerValue"
        placeholder="请输入图标编码，如 ri:folder-2-line"
        @update:model-value="handleInput"
      >
        <template #append>
          <ElButton text @click="dialogVisible = true">选择图标</ElButton>
        </template>
      </ElInput>
    </div>
  </div>

  <ElDialog
    v-model="dialogVisible"
    title="选择图标"
    :width="dialogWidth"
    align-center
    append-to-body
    destroy-on-close
    class="category-icon-picker__dialog"
  >
    <div class="category-icon-picker__dialog-body">
      <div class="category-icon-picker__toolbar">
        <div class="category-icon-picker__toolbar-main">
          <ElInput
            v-model.trim="keyword"
            clearable
            placeholder="搜索图标，如 folder / shop / phone"
          />

          <div class="category-icon-picker__summary">
            <div class="category-icon-picker__summary-text">
              <span>当前分组 {{ visibleIcons.length }} 个图标</span>
              <span>点击图标后立即选中</span>
            </div>

            <div v-if="innerValue" class="category-icon-picker__current">
              <div class="category-icon-picker__current-preview">
                <ArtSvgIcon :icon="innerValue" class="category-icon-picker__current-icon" />
              </div>
              <div class="category-icon-picker__current-text">{{ innerValue }}</div>
              <ElButton text @click="clearIcon">清空</ElButton>
            </div>
          </div>
        </div>

        <EaseSegmentTabs v-model="activeGroupKey" :items="groupOptions" />
      </div>

      <ElScrollbar class="category-icon-picker__results">
        <div class="category-icon-picker__grid">
          <button
            v-for="icon in visibleIcons"
            :key="icon"
            type="button"
            :class="['category-icon-picker__grid-item', { 'is-active': icon === innerValue }]"
            @click="selectIcon(icon)"
          >
            <ArtSvgIcon :icon="icon" class="category-icon-picker__grid-icon" />
            <span class="category-icon-picker__grid-label">{{ icon.replace('ri:', '') }}</span>
          </button>

          <ElEmpty
            v-if="visibleIcons.length === 0"
            :image-size="60"
            description="没有匹配的图标"
            class="category-icon-picker__empty"
          />
        </div>
      </ElScrollbar>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import EaseSegmentTabs from '@/components/project/ease-segment-tabs/index.vue'
  import { riIconGroups, riIconList } from '@/config/ri-icon-catalog'
  import { useWindowSize } from '@vueuse/core'

  interface Props {
    modelValue?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void
  }

  const RECENT_STORAGE_KEY = 'category-icon-picker-recent'
  const RECENT_LIMIT = 12

  const props = withDefaults(defineProps<Props>(), {
    modelValue: ''
  })

  const emit = defineEmits<Emits>()
  const { width } = useWindowSize()

  const innerValue = ref(props.modelValue)
  const keyword = ref('')
  const dialogVisible = ref(false)
  const activeGroupKey = ref('recent')
  const recentIcons = ref<string[]>([])

  const availableGroups = computed(() =>
    riIconGroups.filter((group) => group.key !== 'recent' || recentIcons.value.length > 0)
  )
  const groupOptions = computed(() =>
    availableGroups.value.map((group) => ({
      label: group.label,
      value: group.key
    }))
  )
  const dialogWidth = computed(() => (width.value < 768 ? 'calc(100vw - 24px)' : '720px'))

  const visibleIcons = computed(() => {
    const currentGroup =
      activeGroupKey.value === 'recent'
        ? recentIcons.value
        : activeGroupKey.value === 'all'
          ? riIconList
          : riIconGroups.find((group) => group.key === activeGroupKey.value)?.icons || []

    const text = keyword.value.trim().toLowerCase()
    if (!text) return currentGroup

    return currentGroup.filter((icon) => icon.toLowerCase().includes(text))
  })

  function readRecentIcons() {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed
        .map((item) => String(item || '').trim())
        .filter((item) => item.startsWith('ri:'))
        .slice(0, RECENT_LIMIT)
    } catch {
      return []
    }
  }

  function writeRecentIcons(icon: string) {
    const next = [icon, ...recentIcons.value.filter((item) => item !== icon)].slice(0, RECENT_LIMIT)
    recentIcons.value = next
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next))
  }

  function handleInput(value: string) {
    emit('update:modelValue', String(value || '').trim())
  }

  function clearIcon() {
    innerValue.value = ''
    emit('update:modelValue', '')
  }

  function selectIcon(icon: string) {
    innerValue.value = icon
    emit('update:modelValue', icon)
    writeRecentIcons(icon)
    dialogVisible.value = false
  }

  onMounted(() => {
    recentIcons.value = readRecentIcons()
    if (recentIcons.value.length === 0) {
      activeGroupKey.value = 'common'
    }
  })

  watch(
    () => props.modelValue,
    (value) => {
      innerValue.value = value
    }
  )

  watch(dialogVisible, (visible) => {
    if (!visible) return
    keyword.value = ''
    if (activeGroupKey.value === 'recent' && recentIcons.value.length === 0) {
      activeGroupKey.value = 'common'
    }
  })
</script>

<style scoped lang="scss">
  .category-icon-picker {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .category-icon-picker__preview {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--custom-radius);
  }

  .category-icon-picker__preview-icon {
    font-size: 20px;
  }

  .category-icon-picker__preview-placeholder {
    font-size: 18px;
    line-height: 1;
  }

  .category-icon-picker__dialog-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .category-icon-picker__toolbar {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .category-icon-picker__toolbar-main {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .category-icon-picker__summary {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .category-icon-picker__summary-text {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  .category-icon-picker__current {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
    padding: 8px 10px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--custom-radius);
  }

  .category-icon-picker__current-preview {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: calc(var(--custom-radius) - 2px);
  }

  .category-icon-picker__current-icon {
    font-size: 18px;
  }

  .category-icon-picker__current-text {
    min-width: 0;
    max-width: 240px;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .category-icon-picker__results {
    max-height: min(64vh, 460px);
    padding-right: 4px;
  }

  .category-icon-picker__grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
  }

  .category-icon-picker__grid-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    justify-content: center;
    height: 74px;
    padding: 10px 8px;
    color: var(--el-text-color-primary);
    text-align: center;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--custom-radius);
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease,
      color 0.2s ease;
  }

  .category-icon-picker__grid-item:hover,
  .category-icon-picker__grid-item.is-active {
    background: var(--el-fill-color-light);
    border-color: var(--el-color-primary-light-5);
  }

  .category-icon-picker__grid-item.is-active {
    color: var(--el-color-primary);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  }

  .category-icon-picker__grid-icon {
    font-size: 18px;
  }

  .category-icon-picker__grid-label {
    width: 100%;
    overflow: hidden;
    font-size: 12px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .category-icon-picker__empty {
    grid-column: 1 / -1;
    padding: 28px 0 20px;
  }

  :deep(.category-icon-picker__dialog .el-dialog) {
    border-radius: calc(var(--custom-radius) + 2px);
  }

  :deep(.category-icon-picker__dialog .el-dialog__body) {
    padding-top: 16px;
  }

  @media (width < 768px) {
    .category-icon-picker__summary {
      align-items: stretch;
    }

    .category-icon-picker__current {
      width: 100%;
    }

    .category-icon-picker__current-text {
      flex: 1;
      max-width: none;
    }

    .category-icon-picker__grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
