<template>
  <div class="flex flex-col gap-2">
    <ElInput
      v-model.trim="innerValue"
      placeholder="请输入图标编码，如 ri:folder-2-line"
      @update:model-value="handleInput"
    >
      <template #append>
        <ElPopover
          v-model:visible="popoverVisible"
          trigger="click"
          placement="bottom-end"
          :width="popoverWidth"
        >
          <template #reference>
            <ElButton text>选择图标</ElButton>
          </template>

          <div class="flex flex-col gap-4">
            <ElInput
              v-model.trim="keyword"
              clearable
              placeholder="搜索图标，如 folder / shop / phone"
            />

            <CategorySegmentTabs v-model="activeGroupKey" :options="groupOptions" />

            <ElScrollbar max-height="320px">
              <div class="category-icon-picker__grid">
                <button
                  v-for="icon in visibleIcons"
                  :key="icon"
                  type="button"
                  class="category-icon-picker__item"
                  @click="selectIcon(icon)"
                >
                  <ArtSvgIcon :icon="icon" class="text-lg" />
                  <span class="w-full truncate text-xs">{{ icon.replace('ri:', '') }}</span>
                </button>
              </div>
            </ElScrollbar>

            <ElEmpty
              v-if="visibleIcons.length === 0"
              :image-size="60"
              description="没有匹配的图标"
            />
          </div>
        </ElPopover>
      </template>
    </ElInput>

    <div
      v-if="innerValue"
      class="flex items-center gap-2 text-sm text-[var(--el-text-color-secondary)]"
    >
      <ArtSvgIcon :icon="innerValue" class="text-lg" />
      <span>{{ innerValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { riIconGroups, riIconList } from '@/config/ri-icon-catalog'
  import CategorySegmentTabs from './category-segment-tabs.vue'
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
  const popoverVisible = ref(false)
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
  const popoverWidth = computed(() => Math.min(520, Math.max(width.value - 48, 280)))

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

  function selectIcon(icon: string) {
    innerValue.value = icon
    emit('update:modelValue', icon)
    writeRecentIcons(icon)
    popoverVisible.value = false
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

  watch(popoverVisible, (visible) => {
    if (!visible) return
    keyword.value = ''
    if (activeGroupKey.value === 'recent' && recentIcons.value.length === 0) {
      activeGroupKey.value = 'common'
    }
  })
</script>

<style scoped lang="scss">
  .category-icon-picker__grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
  }

  .category-icon-picker__item {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
    height: 72px;
    padding: 0 8px;
    text-align: center;
    background: transparent;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease;
  }

  .category-icon-picker__item:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-color-primary-light-5);
  }

  @media (width <= 767px) {
    .category-icon-picker__grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
