export interface WorkbenchAttr {
  id: number
  name: string
  type: 0 | 1
  unit?: string
  entryMethod: 0 | 1
  options: string[]
  searchable: 0 | 1
  filterable: 0 | 1
}

export interface WorkbenchRelation {
  id: number
  categoryId: number
  attrId: number
  groupName: string
  sort: number
  required: 0 | 1
  options: string[] | null
}

export interface WorkbenchRelationRow {
  relation: WorkbenchRelation
  attr: WorkbenchAttr
}

export function normalizeWorkbenchOptionList(options?: string[] | null): string[] {
  return (options || []).map((item) => String(item || '').trim()).filter(Boolean)
}

export function getWorkbenchRelationOptions(row: WorkbenchRelationRow): string[] {
  if (Array.isArray(row.relation.options) && row.relation.options.length) {
    return row.relation.options
  }

  return normalizeWorkbenchOptionList(row.attr.options)
}

export function formatWorkbenchEntryMethod(value?: number) {
  return Number(value) === 1 ? '预设选项' : '手工录入'
}
