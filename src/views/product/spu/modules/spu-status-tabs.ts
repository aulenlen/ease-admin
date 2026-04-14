// 商品状态 tabs 值类型抽离到独立 ts，避免再依赖旧的业务 tabs 组件文件。
export type SpuStatusTabKey = 'all' | 'publish' | 'unpublish' | 'verify' | 'staged'
