// 渲染模块：房间、宠物和特效精灵的资源路径清单。
export const assetManifest = {
  room: {
    default: '/assets/rooms/default-room.png',
  },
  pet: {
    egg: '/assets/pets/egg.png',
    baby: '/assets/pets/baby.png',
    child: '/assets/pets/child.png',
    adult: '/assets/pets/adult.png',
    dead: '/assets/pets/dead.png',
  },
  effects: {
    heart: '/assets/effects/heart.png',
    sick: '/assets/effects/sick.png',
    sleep: '/assets/effects/sleep.png',
    poop: '/assets/objects/poop.png',
  },
} as const
