import { AppRouteRecord } from '@/types/router'

export const orderRoutes: AppRouteRecord = {
  path: '/order',
  name: 'OrderRoot',
  component: '/index/index',
  redirect: '/order/list',
  meta: {
    title: '订单中心',
    icon: 'ri:file-list-3-line'
  },
  children: [
    {
      path: 'list',
      name: 'Order',
      component: '/order/index',
      meta: {
        title: '订单管理',
        icon: 'ri:shopping-cart-2-line',
        keepAlive: true
      }
    },
    {
      path: 'detail/:orderNo',
      name: 'OrderDetail',
      component: '/order/detail',
      meta: {
        title: '订单详情',
        isHide: true,
        isHideTab: true,
        activePath: '/order/list'
      }
    },
    {
      path: 'payment',
      name: 'OrderPayment',
      component: '/order/payment/index',
      meta: {
        title: '支付单管理',
        icon: 'ri:secure-payment-line',
        keepAlive: true
      }
    }
  ]
}
