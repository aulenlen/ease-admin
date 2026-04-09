import { AppRouteRecord } from '@/types/router'

export const productRoutes: AppRouteRecord = {
  path: '/product',
  name: 'Product',
  component: '/index/index',
  meta: {
    title: 'menus.product.title',
    icon: 'ri:price-tag-3-line'
  },
  children: [
    {
      path: 'brand',
      name: 'ProductBrand',
      component: '/product/brand/index',
      meta: {
        title: 'menus.product.brand',
        icon: 'ri:price-tag-2-line',
        keepAlive: true
      }
    }
  ]
}
