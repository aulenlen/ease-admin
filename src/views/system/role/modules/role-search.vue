<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :show-expand="false"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  interface Props {
    modelValue: Api.SystemManage.RoleSearchParams
  }

  interface Emits {
    (e: 'update:modelValue', value: Api.SystemManage.RoleSearchParams): void
    (e: 'search', params: Api.SystemManage.RoleSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      span: 8,
      props: {
        placeholder: '搜索角色名称',
        clearable: true
      }
    }
  ])

  function handleReset() {
    emit('reset')
  }

  async function handleSearch(params: Api.SystemManage.RoleSearchParams) {
    await searchBarRef.value?.validate?.()
    emit('search', params)
  }
</script>
