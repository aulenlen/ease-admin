/**
 * 格式化日期时间
 * 统一用于表格、详情等展示层输出
 */
export function formatDateTime(
  value: Date | number | string | null | undefined,
  pattern: 'datetime' | 'date' = 'datetime'
): string {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')

  if (pattern === 'date') {
    return `${year}-${month}-${day}`
  }

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
