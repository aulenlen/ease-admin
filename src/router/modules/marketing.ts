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
    },
    {
      path: 'flash/edit/:id',
      name: 'MarketingFlashEdit',
      component: '/marketing/flash/editor',
      meta: {
        title: '秒杀配置',
        isHide: true,
        activePath: '/marketing/flash'
      }
    },
    {
      path: 'content',
      name: 'MarketingArticle',
      component: '/marketing/content/article/index',
      meta: {
        title: '文章管理',
        icon: 'ri:article-line',
        keepAlive: true
      }
    },
    {
      path: 'content/media',
      name: 'MarketingMedia',
      component: '/marketing/content/media/index',
      meta: {
        title: '素材库',
        icon: 'ri:folder-image-line',
        keepAlive: true
      }
    },
    {
      path: 'content/create',
      name: 'MarketingArticleCreate',
      component: '/marketing/content/article/editor',
      meta: {
        title: '新建文章',
        isHide: true,
        activePath: '/marketing/content'
      }
    },
    {
      path: 'content/edit/:id',
      name: 'MarketingArticleEdit',
      component: '/marketing/content/article/editor',
      meta: {
        title: '编辑文章',
        isHide: true,
        activePath: '/marketing/content'
      }
    },
    {
      path: 'content/placements',
      name: 'MarketingPlacement',
      component: '/marketing/content/placement/index',
      meta: {
        title: '内容位配置',
        icon: 'ri:apps-2-line',
        keepAlive: true
      }
    },
    {
      path: 'content/placements/edit/:id',
      name: 'MarketingPlacementEdit',
      component: '/marketing/content/placement/editor',
      meta: {
        title: '槽位配置',
        isHide: true,
        activePath: '/marketing/content/placements'
      }
    },
    {
      path: 'sign',
      name: 'MarketingSign',
      component: '/marketing/sign/index',
      meta: {
        title: '签到管理',
        icon: 'ri:calendar-check-line',
        keepAlive: true
      }
    }
  ]
}
