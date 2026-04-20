<template>
  <ElInputNumber
    v-if="jumpType === SLOT_ITEM_JUMP_TYPE.ACTIVITY"
    v-model="targetIdModel"
    :min="1"
    :disabled="disabled"
    placeholder="请输入活动 ID"
    class="w-full"
    controls-position="right"
  />

  <SlotItemSpuSelect
    v-else-if="jumpType === SLOT_ITEM_JUMP_TYPE.SPU"
    v-model="targetIdModel"
    :disabled="disabled"
  />

  <SlotItemArticleSelect
    v-else-if="jumpType === SLOT_ITEM_JUMP_TYPE.ARTICLE"
    v-model="targetIdModel"
    :disabled="disabled"
  />

  <ElInput
    v-else-if="jumpType === SLOT_ITEM_JUMP_TYPE.EXTERNAL"
    v-model="urlModel"
    :disabled="disabled"
    placeholder="https://..."
    maxlength="500"
    show-word-limit
    @blur="handleUrlBlur"
  />
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { SLOT_ITEM_JUMP_TYPE } from '@/api/slot'
  import SlotItemArticleSelect from './slot-item-article-select.vue'
  import SlotItemSpuSelect from './slot-item-spu-select.vue'

  interface Props {
    jumpType?: number
    disabled?: boolean
  }

  withDefaults(defineProps<Props>(), {
    jumpType: SLOT_ITEM_JUMP_TYPE.NONE,
    disabled: false
  })

  const targetIdModel = defineModel<number | undefined>('jumpTargetId', { default: undefined })
  const urlModel = defineModel<string>('url', { default: '' })

  function handleUrlBlur() {
    const value = String(urlModel.value || '').trim()
    if (!value || /^https?:\/\/.+/i.test(value)) return

    ElMessage.warning('请输入以 http:// 或 https:// 开头的完整链接')
  }
</script>
