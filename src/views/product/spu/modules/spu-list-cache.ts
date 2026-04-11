const SPU_LIST_DIRTY_KEY = 'ease-admin:spu:list:dirty'

export function markSpuListDirty() {
  sessionStorage.setItem(SPU_LIST_DIRTY_KEY, `${Date.now()}`)
}

export function consumeSpuListDirtyFlag() {
  const value = sessionStorage.getItem(SPU_LIST_DIRTY_KEY)
  if (!value) return false
  sessionStorage.removeItem(SPU_LIST_DIRTY_KEY)
  return true
}
