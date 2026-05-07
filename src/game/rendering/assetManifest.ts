// 渲染模块：房间、宠物和特效精灵的资源路径清单。
export const assetManifest = {
  petManifests: {
    monkey: '/assets/pets/monkey/monkey.json',
  },
  rooms: {
    home: '/assets/rooms/home.png',
    bedroom: '/assets/rooms/bedroom.png',
    garden: '/assets/rooms/garden.png',
    default: '/assets/rooms/home.png',
  },
  pets: {
    monkeyFallback: '/assets/pets/monkey/monkey-idle.png',
    eggIdle: '/assets/pets/egg/egg-idle.png',
  },
  legacy: {
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

export type PetAnimationAsset = {
  image: string
  frameWidth: number
  frameHeight: number
  frames: number
  fps: number
  loop: boolean
  anchor: { x: number; y: number }
  offset: { x: number; y: number }
}

export type PetSpriteManifest = {
  id: string
  frameSize: number
  palette: string
  animations: Record<string, PetAnimationAsset>
}
