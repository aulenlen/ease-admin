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
      path: 'category',
      name: 'ProductCategory',
      component: '/product/category/index',
      meta: {
        title: 'menus.product.category',
        icon: 'ri:folder-2-line',
        keepAlive: true
      }
    },
    {
      path: 'brand',
      name: 'ProductBrand',
      component: '/product/brand/index',
      meta: {
        title: 'menus.product.brand',
        icon: 'ri:price-tag-2-line',
        keepAlive: true
      }
    },
    {
      path: 'spu',
      name: 'ProductSpu',
      component: '/product/spu/index',
      meta: {
        title: '商品管理',
        icon: 'ri:shopping-bag-3-line',
        keepAlive: true
      }
    },
    {
      path: 'spu/create',
      name: 'ProductSpuCreate',
      component: '/product/spu/add',
      meta: {
        title: '新增商品',
        isHide: true,
        isHideTab: true,
        activePath: '/product/spu'
      }
    },
    {
      path: 'spu/edit/:id',
      name: 'ProductSpuEdit',
      component: '/product/spu/update',
      meta: {
        title: '编辑商品',
        isHide: true,
        isHideTab: true,
        activePath: '/product/spu'
      }
    },
    {
      path: 'spu/detail/:id',
      name: 'ProductSpuDetail',
      component: '/product/spu/view',
      meta: {
        title: '商品详情',
        isHide: true,
        isHideTab: true,
        activePath: '/product/spu'
      }
    },
    {
      path: 'inventory',
      name: 'ProductInventory',
      component: '/product/inventory/index',
      meta: {
        title: '库存管理',
        icon: 'ri:archive-stack-line',
        keepAlive: true
      }
    }
  ]
}
