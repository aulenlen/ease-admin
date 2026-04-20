<template>
  <ElDrawer
    :model-value="visible"
    :title="drawerTitle"
    :size="drawerSize"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
    @closed="handleClosed"
  >
    <component
      :is="lockedItemType === SLOT_ITEM_TYPE.ARTICLE ? SlotItemArticleForm : SlotItemCardForm"
      ref="formRef"
      :form="form"
    />

    <template #footer>
      <div class="flex justify-end gap-3">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" @click="handleConfirm">确认</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import {
    SLOT_ITEM_JUMP_TYPE,
    SLOT_ITEM_TYPE,
    SLOT_STATUS,
    type SlotItem,
    type SlotItemType
  } from '@/api/slot'
  import SlotItemCardForm from './slot-item-card-form.vue'
  import SlotItemArticleForm from './slot-item-article-form.vue'
  import { useWindowSize } from '@vueuse/core'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'SlotItemDrawer' })

  interface Props {
    visible: boolean
    itemData?: SlotItem | null
    isEdit?: boolean
    itemIndex?: number
    lockedItemType: SlotItemType
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    itemData: null,
    isEdit: false,
    itemIndex: -1
  })

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'confirm', item: SlotItem, index: number): void
  }>()

  const { width } = useWindowSize()
  const drawerSize = computed(() => (width.value < 768 ? '100%' : '520px'))
  const formRef = ref<{ validate: () => true | string } | null>(null)

  const drawerTitle = computed(() => {
    const action = props.isEdit ? '编辑' : '新增'
    const typeLabel = props.lockedItemType === SLOT_ITEM_TYPE.ARTICLE ? '文章项' : '卡片项'
    return `${action}${typeLabel}`
  })

  function defaultForm(): SlotItem {
    return {
      itemType: props.lockedItemType,
      title: '',
      subTitle: '',
      pic: '',
      jumpType: SLOT_ITEM_JUMP_TYPE.NONE,
      jumpTargetId: undefined,
      url: '',
      sort: 0,
      status: SLOT_STATUS.ENABLED,
      startTime: undefined,
      endTime: undefined,
      note: ''
    }
  }

  const form = reactive<SlotItem>({ ...defaultForm() })

  function handleClosed() {
    Object.assign(form, defaultForm())
  }

  function handleCancel() {
    emit('update:visible', false)
  }

  function handleConfirm() {
    const result = formRef.value?.validate()
    if (result !== true) {
      ElMessage.warning(result || '请完善必填字段')
      return
    }

    emit('confirm', { ...toRaw(form) }, props.itemIndex)
    emit('update:visible', false)
  }

  watch(
    () => props.visible,
    (visible) => {
      if (!visible) return
      if (props.isEdit && props.itemData) {
        Object.assign(form, {
          ...defaultForm(),
          ...props.itemData,
          itemType: props.lockedItemType,
          jumpType:
            typeof props.itemData.jumpType === 'number'
              ? props.itemData.jumpType
              : SLOT_ITEM_JUMP_TYPE.NONE,
          status:
            typeof props.itemData.status === 'number' ? props.itemData.status : SLOT_STATUS.ENABLED
        })
      } else {
        Object.assign(form, defaultForm())
      }
    }
  )
</script>
