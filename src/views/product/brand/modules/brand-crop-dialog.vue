<template>
  <ElDialog
    v-model="visible"
    :title="`${title}裁剪`"
    :width="dialogWidth"
    align-center
    destroy-on-close
    class="brand-crop-dialog"
    @closed="handleClosed"
  >
    <div class="mb-3 flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="text-[13px] text-[var(--el-text-color-secondary)]">比例</span>
        <ElSelect v-model="selectedRatio" size="small" class="w-[120px]">
          <ElOption
            v-for="option in ratioOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </div>

      <div v-if="selectedRatio === 'custom'" class="flex items-center gap-2">
        <ElInputNumber
          v-model="customRatioWidth"
          :min="1"
          :max="99"
          size="small"
          controls-position="right"
          class="w-[92px]"
        />
        <span class="text-[13px] text-[var(--el-text-color-secondary)]">:</span>
        <ElInputNumber
          v-model="customRatioHeight"
          :min="1"
          :max="99"
          size="small"
          controls-position="right"
          class="w-[92px]"
        />
      </div>
    </div>

    <div class="grid items-start gap-4 lg:grid-cols-[max-content_max-content] grid-cols-1">
      <ArtCutterImg
        :key="cutterKey"
        :box-width="cutterConfig.boxWidth"
        :box-height="cutterConfig.boxHeight"
        :cut-width="cutterConfig.cutWidth"
        :cut-height="cutterConfig.cutHeight"
        :rate="activeRatio"
        :size-change="true"
        :show-preview="false"
        :show-download="false"
        :img-url="imgUrl"
        :title="'选择图片'"
        :confirm-text="'裁剪并上传'"
        @cut-done="handleCropDone"
        @preview-change="handlePreviewChange"
        @error="handleError"
      />

      <div v-if="previewSrc" class="min-w-0">
        <div class="pb-2.5 text-base font-medium">裁剪预览</div>
        <div
          class="overflow-hidden"
          :style="{
            width: `${previewSize.width}px`,
            height: `${previewSize.height}px`
          }"
        >
          <img
            class="block h-full w-full object-contain object-left-top"
            :src="previewSrc"
            alt="裁剪预览"
          />
        </div>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtCutterImg from '@/components/core/media/art-cutter-img/index.vue'
  import { useWindowSize } from '@vueuse/core'

  interface Props {
    modelValue: boolean
    title: string
    previewMode?: 'square' | 'wide'
    imgUrl?: string
  }

  interface CropResult {
    fileName: string
    file: File
    blob: Blob
    dataURL: string
  }

  interface PreviewResult {
    dataURL: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'crop-done', result: CropResult): void
    (e: 'error', error: unknown): void
  }

  const props = withDefaults(defineProps<Props>(), {
    previewMode: 'square',
    imgUrl: ''
  })

  const emit = defineEmits<Emits>()
  const { width } = useWindowSize()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const cutterKey = ref(0)
  const selectedRatio = ref(props.previewMode === 'wide' ? '16:9' : '1:1')
  const customRatioWidth = ref(props.previewMode === 'wide' ? 16 : 1)
  const customRatioHeight = ref(props.previewMode === 'wide' ? 9 : 1)
  const previewSrc = ref('')
  const previewSize = reactive({
    width: 220,
    height: 220
  })

  const cutterConfig = computed(() => {
    if (width.value <= 640) {
      return {
        boxWidth: Math.max(width.value - 72, 260),
        boxHeight: 300,
        cutWidth: 180,
        cutHeight: 180
      }
    }

    if (width.value <= 1024) {
      return {
        boxWidth: Math.min(width.value - 120, 460),
        boxHeight: 360,
        cutWidth: 220,
        cutHeight: 220
      }
    }

    return {
      boxWidth: 520,
      boxHeight: 420,
      cutWidth: 260,
      cutHeight: 260
    }
  })

  const ratioOptions = computed(() => {
    if (props.previewMode === 'wide') {
      return [
        { label: '16:9', value: '16:9' },
        { label: '4:3', value: '4:3' },
        { label: '1:1', value: '1:1' },
        { label: '自定义', value: 'custom' },
        { label: '自由', value: 'free' }
      ]
    }

    return [
      { label: '1:1', value: '1:1' },
      { label: '4:3', value: '4:3' },
      { label: '自定义', value: 'custom' },
      { label: '自由', value: 'free' }
    ]
  })

  const activeRatio = computed(() => {
    if (selectedRatio.value === 'free') return undefined
    if (selectedRatio.value === 'custom') {
      return `${customRatioWidth.value}:${customRatioHeight.value}`
    }
    return selectedRatio.value
  })

  const previewFallback = computed(() => {
    const baseWidth = 260
    const baseHeight = 220

    if (!activeRatio.value) {
      return { width: 220, height: 220 }
    }

    const [rawWidth, rawHeight] = activeRatio.value.split(':').map(Number)
    if (!rawWidth || !rawHeight) {
      return { width: 220, height: 220 }
    }

    let width = baseWidth
    let height = Math.round((width * rawHeight) / rawWidth)

    if (height > baseHeight) {
      height = baseHeight
      width = Math.round((height * rawWidth) / rawHeight)
    }

    return { width, height }
  })

  const dialogWidth = computed(() => {
    const previewWidth = previewSrc.value ? previewSize.width : previewFallback.value.width
    const contentWidth = cutterConfig.value.boxWidth + previewWidth + 92
    return `${Math.min(Math.max(contentWidth, 320), width.value - 24)}px`
  })

  function applyPreviewSize(url: string) {
    if (!url) {
      previewSize.width = previewFallback.value.width
      previewSize.height = previewFallback.value.height
      return
    }

    const img = new Image()
    img.onload = () => {
      const maxWidth = 260
      const maxHeight = 220
      const naturalWidth = img.naturalWidth || previewFallback.value.width
      const naturalHeight = img.naturalHeight || previewFallback.value.height
      const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1)

      previewSize.width = Math.max(Math.round(naturalWidth * scale), 1)
      previewSize.height = Math.max(Math.round(naturalHeight * scale), 1)
    }
    img.src = url
  }

  function syncPreview(url: string) {
    previewSrc.value = url
    applyPreviewSize(url)
  }

  function handlePreviewChange(result: PreviewResult) {
    syncPreview(result.dataURL || '')
  }

  function handleCropDone(result: CropResult) {
    visible.value = false
    emit('crop-done', result)
  }

  function handleError(error: unknown) {
    emit('error', error)
  }

  function handleClosed() {
    cutterKey.value += 1
  }

  watch(
    () => props.modelValue,
    (opened) => {
      if (!opened) return
      syncPreview(props.imgUrl || '')
    }
  )

  watch(
    () => activeRatio.value,
    () => {
      if (!previewSrc.value) {
        applyPreviewSize('')
      }
    }
  )
</script>

<style scoped lang="scss">
  :deep(.brand-crop-dialog .el-dialog__body) {
    padding-top: 12px;
    padding-bottom: 20px;
  }

  :deep(.brand-crop-dialog .el-dialog) {
    max-width: calc(100vw - 32px);
  }
</style>
