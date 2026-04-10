export interface RiIconGroup {
  key: string
  label: string
  icons: string[]
}

export const riIconGroups: RiIconGroup[] = [
  {
    key: 'recent',
    label: '最近使用',
    icons: []
  },
  {
    key: 'common',
    label: '常用',
    icons: [
      'ri:folder-2-line',
      'ri:folder-open-line',
      'ri:price-tag-3-line',
      'ri:shopping-bag-3-line',
      'ri:gift-line',
      'ri:home-4-line',
      'ri:store-2-line',
      'ri:apps-2-line',
      'ri:archive-line',
      'ri:book-open-line',
      'ri:settings-3-line',
      'ri:star-smile-line'
    ]
  },
  {
    key: 'goods',
    label: '商品',
    icons: [
      'ri:price-tag-3-line',
      'ri:price-tag-line',
      'ri:shopping-bag-3-line',
      'ri:shopping-bag-4-line',
      'ri:store-2-line',
      'ri:shopping-cart-2-line',
      'ri:coupon-3-line',
      'ri:gift-2-line',
      'ri:gift-line',
      'ri:barcode-box-line',
      'ri:inbox-archive-line',
      'ri:archive-stack-line'
    ]
  },
  {
    key: 'category',
    label: '分类',
    icons: [
      'ri:folder-2-line',
      'ri:folder-open-line',
      'ri:apps-2-line',
      'ri:layout-grid-line',
      'ri:menu-line',
      'ri:list-check-2',
      'ri:dashboard-line',
      'ri:stack-line',
      'ri:bookmark-3-line',
      'ri:file-list-3-line',
      'ri:archive-line',
      'ri:hashtag'
    ]
  },
  {
    key: 'fashion',
    label: '服饰',
    icons: [
      'ri:shirt-line',
      'ri:t-shirt-line',
      'ri:handbag-line',
      'ri:footprint-line',
      'ri:vip-diamond-line',
      'ri:brush-2-line',
      'ri:scissors-cut-line',
      'ri:eyeglasses-line',
      'ri:palette-line',
      'ri:drop-line',
      'ri:sparkling-line',
      'ri:magic-line'
    ]
  },
  {
    key: 'digital',
    label: '数码',
    icons: [
      'ri:computer-line',
      'ri:smartphone-line',
      'ri:tablet-line',
      'ri:laptop-line',
      'ri:tv-2-line',
      'ri:headphone-line',
      'ri:camera-line',
      'ri:gamepad-line',
      'ri:router-line',
      'ri:cpu-line',
      'ri:hard-drive-3-line',
      'ri:keyboard-line'
    ]
  },
  {
    key: 'home',
    label: '家居',
    icons: [
      'ri:home-4-line',
      'ri:sofa-line',
      'ri:lamp-line',
      'ri:plant-line',
      'ri:cup-line',
      'ri:restaurant-line',
      'ri:fridge-line',
      'ri:hotel-bed-line',
      'ri:door-line',
      'ri:community-line',
      'ri:building-line',
      'ri:store-3-line'
    ]
  },
  {
    key: 'transport',
    label: '出行',
    icons: [
      'ri:car-line',
      'ri:bus-line',
      'ri:taxi-line',
      'ri:train-line',
      'ri:subway-line',
      'ri:flight-takeoff-line',
      'ri:road-map-line',
      'ri:map-pin-line',
      'ri:navigation-line',
      'ri:rocket-line',
      'ri:bike-line',
      'ri:ebike-line'
    ]
  }
]

export const riIconList = Array.from(
  new Set(riIconGroups.flatMap((group) => group.icons).filter(Boolean))
).sort()
