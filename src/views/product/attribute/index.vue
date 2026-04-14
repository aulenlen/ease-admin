<template>
  <div class="art-full-height product-attribute-page">
    <AttributeManagerContent :preset-type="presetType" :embedded="false" />
  </div>
</template>

<script setup lang="ts">
  import AttributeManagerContent from '../category/modules/attribute-manager-content.vue'
  import type { CategoryAttributeType } from '@/api/category-attribute'

  defineOptions({ name: 'ProductAttributePage' })

  const route = useRoute()

  const presetType = computed<-1 | CategoryAttributeType>(() => {
    const rawType = Number(route.query.type)
    if (rawType === 0 || rawType === 1) return rawType as CategoryAttributeType
    return -1
  })
</script>
