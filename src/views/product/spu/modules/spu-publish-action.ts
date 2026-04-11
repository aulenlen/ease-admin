import type { SpuFlag01, SpuListItem } from '@/api/spu'

export interface SpuPublishActionTarget {
  publishStatus?: SpuFlag01
  verifyStatus?: SpuFlag01
  hasStagedChanges?: SpuFlag01
}

export interface SpuPublishAction {
  disabled: boolean
  label: '上架' | '下架' | '发布更新'
  confirmTitle: '确认上架该商品？' | '确认下架该商品？' | '确认发布该商品的最新修改？'
  nextStatus: SpuFlag01
}

export interface SpuDisplayStatus {
  text: '待审核' | '已修改未发布' | '已上架' | '未上架'
  type: 'warning' | 'primary' | 'success' | 'info'
}

export function getSpuPublishAction(row: SpuPublishActionTarget): SpuPublishAction {
  if (Number(row.verifyStatus ?? 0) !== 1) {
    return {
      disabled: true,
      label: '上架',
      confirmTitle: '确认上架该商品？',
      nextStatus: 1
    }
  }

  if (Number(row.publishStatus ?? 0) === 1 && Number(row.hasStagedChanges ?? 0) === 1) {
    return {
      disabled: false,
      label: '发布更新',
      confirmTitle: '确认发布该商品的最新修改？',
      nextStatus: 1
    }
  }

  if (Number(row.publishStatus ?? 0) === 1) {
    return {
      disabled: false,
      label: '下架',
      confirmTitle: '确认下架该商品？',
      nextStatus: 0
    }
  }

  return {
    disabled: false,
    label: '上架',
    confirmTitle: '确认上架该商品？',
    nextStatus: 1
  }
}

export function getSpuDisplayStatus(
  row: Pick<SpuListItem, 'publishStatus' | 'verifyStatus' | 'hasStagedChanges'>
): SpuDisplayStatus {
  if (Number(row.verifyStatus ?? 0) !== 1) {
    return {
      text: '待审核',
      type: 'warning'
    }
  }

  if (Number(row.publishStatus ?? 0) === 1 && Number(row.hasStagedChanges ?? 0) === 1) {
    return {
      text: '已修改未发布',
      type: 'primary'
    }
  }

  if (Number(row.publishStatus ?? 0) === 1) {
    return {
      text: '已上架',
      type: 'success'
    }
  }

  return {
    text: '未上架',
    type: 'info'
  }
}
