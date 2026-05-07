import type {
  FriendState,
  GameState,
  MockOnlinePet,
  SocialPost,
} from '../domain/gameTypes'

export type MockOnlineApi = {
  getProfile(state: GameState): GameState['profile']
  listRandomPets(state: GameState): MockOnlinePet[]
  addFriendByCode(state: GameState, code: string, now: number): FriendState
  createInteraction(
    petId: string,
    action: string,
    now: number
  ): {
    id: string
    petId: string
    action: string
    createdAt: number
  }
  createSocialPost(state: GameState, body: string, now: number): SocialPost
  orderSnapMeal(now: number): {
    itemId: string
    label: string
    deliveredAt: number
  }
}

export const mockOnlineApi: MockOnlineApi = {
  getProfile: (state) => state.profile,
  listRandomPets: (state) => state.mockOnline.pets,
  addFriendByCode: (_state, code, now) => ({
    id: `friend-${now}`,
    name: `Friend ${code.slice(-4).toUpperCase()}`,
    code,
    friendship: 20,
    addedAt: now,
  }),
  createInteraction: (petId, action, now) => ({
    id: `interaction-${now}`,
    petId,
    action,
    createdAt: now,
  }),
  createSocialPost: (state, body, now) => ({
    id: `post-${now}`,
    author: state.profile.username,
    body,
    createdAt: now,
    likes: 0,
    local: true,
  }),
  orderSnapMeal: (now) => ({
    itemId: 'snap-meal',
    label: '快餐',
    deliveredAt: now,
  }),
}

// 未来真实接口的替换边界：
// 后续可以用网络实现替换资料、宠物发现、互动、社交动态和快餐下单。
// 审核、鉴权、限流和隐私过滤应留在领域规则之外。
