import { AppRouteRecord } from '@/types/router'

export const marketingRoutes: AppRouteRecord = {
  path: '/marketing',
  name: 'Marketing',
  component: '/index/index',
  redirect: '/marketing/flash',
  meta: {
    title: '营销中心',
    icon: 'ri:megaphone-line'
  },
  children: [
    {
      path: 'flash',
      name: 'MarketingFlash',
      component: '/marketing/flash/index',
      meta: {
        title: '秒杀管理',
        icon: 'ri:flashlight-line',
        keepAlive: true
      }
    }
  ]
}
