import type {
  GameCommand,
  PetScreenSnapshot,
} from '@/game/rendering/viewModels'

type MenuPanelProps = {
  disabled: boolean
  pwaOfflineReady: boolean
  pwaUpdateAvailable: boolean
  saveText: string
  snapshot: PetScreenSnapshot
  onApplyPwaUpdate: () => void
  onCommand: (command: GameCommand) => void
  onExport: () => void
  onImport: () => void
  onSaveTextChange: (value: string) => void
}

export function MenuPanel({
  disabled,
  pwaOfflineReady,
  pwaUpdateAvailable,
  saveText,
  snapshot,
  onApplyPwaUpdate,
  onCommand,
  onExport,
  onImport,
  onSaveTextChange,
}: MenuPanelProps) {
  const activeMenu = snapshot.menuStack[snapshot.menuStack.length - 1] ?? null
  const activityProgress = getActivityProgress(snapshot)

  if (!activeMenu && !snapshot.toast && !snapshot.activityId) return null

  return (
    <section className='menu-panel' aria-label='菜单面板'>
      <div className='menu-panel__header'>
        <strong>{activeMenu ? getMenuTitle(activeMenu) : '状态'}</strong>
        {activeMenu ? (
          <button
            className='menu-panel__back'
            disabled={disabled}
            type='button'
            onClick={() => onCommand({ type: 'closeMenu' })}
          >
            返回
          </button>
        ) : null}
      </div>

      {snapshot.toast ? (
        <p className='menu-panel__toast'>{snapshot.toast}</p>
      ) : null}

      {pwaOfflineReady ? (
        <p className='menu-panel__toast'>离线缓存已准备好。</p>
      ) : null}

      {pwaUpdateAvailable ? (
        <div className='menu-panel__content activity-card'>
          <div className='activity-card__copy'>
            <strong>发现新版本</strong>
            <span>可以在方便时更新到新版。</span>
          </div>
          <button
            className='menu-panel__back'
            disabled={disabled}
            type='button'
            onClick={onApplyPwaUpdate}
          >
            立即更新
          </button>
        </div>
      ) : null}

      {snapshot.activityId ? (
        <div className='menu-panel__content activity-card'>
          <div className='activity-card__copy'>
            <strong>{getActivityTitle(snapshot.activityId)}</strong>
            <span>
              {activityProgress.remainingLabel} · {activityProgress.percent}%
            </span>
          </div>
          <div className='activity-card__track' aria-hidden='true'>
            <span style={{ inlineSize: `${activityProgress.percent}%` }} />
          </div>
          <button
            className='menu-panel__back'
            disabled={disabled}
            title={disabled ? '运行时加载中' : undefined}
            type='button'
            onClick={() => onCommand({ type: 'endActivity' })}
          >
            结束活动
          </button>
        </div>
      ) : null}

      {activeMenu === 'feeding' ? (
        <CommandGrid
          baseDisabledReason={disabled ? '运行时加载中' : null}
          items={[
            {
              label: '正餐',
              command: { type: 'feedMeal' },
              disabledReason:
                snapshot.stage === 'egg'
                  ? '等待孵化'
                  : snapshot.stage === 'dead'
                    ? '仅可恢复'
                    : snapshot.foodCount <= 0
                      ? '没有正餐'
                      : null,
            },
            {
              label: '点心',
              command: { type: 'feedSnack' },
              disabledReason:
                snapshot.stage === 'egg'
                  ? '等待孵化'
                  : snapshot.stage === 'dead'
                    ? '仅可恢复'
                    : null,
            },
            {
              label: '药品',
              command: { type: 'medicine' },
              disabledReason:
                snapshot.medicine <= 0
                  ? '没有药品'
                  : snapshot.sickness === 'none'
                    ? '没有生病'
                    : null,
            },
            {
              label: '烹饪',
              command: { type: 'cook' },
              disabledReason: snapshot.harvestCount <= 0 ? '需要收获物' : null,
            },
            {
              label: '快餐',
              command: { type: 'snapMeal' },
              disabledReason: snapshot.coins < 12 ? '需要 12 金币' : null,
            },
          ]}
          onCommand={onCommand}
        />
      ) : null}

      {activeMenu === 'bath' ? (
        <CommandGrid
          baseDisabledReason={disabled ? '运行时加载中' : null}
          items={[
            { label: '洗澡', command: { type: 'bath' } },
            {
              label: '如厕',
              command: { type: 'toilet' },
              disabledReason:
                snapshot.stats.bladder <= 20 && snapshot.poopCount <= 0
                  ? '暂不需要'
                  : null,
            },
            { label: '打扫房间', command: { type: 'cleanRoom' } },
            { label: '刷牙', command: { type: 'brushTeeth' } },
          ]}
          onCommand={onCommand}
        />
      ) : null}

      {activeMenu === 'care' ? (
        <CommandGrid
          baseDisabledReason={disabled ? '运行时加载中' : null}
          items={[
            { label: '玩耍', command: { type: 'play' } },
            { label: '摸摸', command: { type: 'pet' } },
            { label: '表扬', command: { type: 'praise' } },
            { label: '批评', command: { type: 'scold' } },
            {
              label: snapshot.sleepState === 'sleeping' ? '叫醒' : '睡觉',
              command: {
                type: snapshot.sleepState === 'sleeping' ? 'wake' : 'sleep',
              },
            },
            {
              label: '花园',
              command: { type: 'openMenu', targetId: 'garden' },
            },
            {
              label: '任务',
              command: { type: 'openMenu', targetId: 'stats' },
            },
          ]}
          onCommand={onCommand}
        />
      ) : null}

      {activeMenu === 'activity' ? (
        <CommandGrid
          baseDisabledReason={disabled ? '运行时加载中' : null}
          items={[
            {
              label: '商店',
              command: { type: 'openMenu', targetId: 'shop' },
            },
            {
              label: '学校',
              command: { type: 'openMenu', targetId: 'school' },
            },
            {
              label: '花园',
              command: { type: 'startActivity', targetId: 'garden' },
            },
            {
              label: '街机',
              command: { type: 'startMinigame', targetId: 'card-match' },
            },
            {
              label: '打工',
              command: { type: 'work' },
            },
            {
              label: '占卜',
              command: { type: 'fortune' },
            },
            {
              label: '度假',
              command: { type: 'startVacation' },
            },
          ]}
          onCommand={onCommand}
        />
      ) : null}

      {activeMenu === 'shop' ? (
        <CommandGrid
          baseDisabledReason={disabled ? '运行时加载中' : null}
          items={[
            {
              label: '正餐包',
              command: { type: 'buyShopItem', targetId: 'basic-meal' },
              disabledReason: snapshot.coins < 8 ? '需要 8 金币' : null,
            },
            {
              label: '种子',
              command: { type: 'buyShopItem', targetId: 'sprout-seed' },
              disabledReason: snapshot.coins < 10 ? '需要 10 金币' : null,
            },
            {
              label: '肥皂',
              command: { type: 'buyShopItem', targetId: 'soap' },
              disabledReason: snapshot.coins < 6 ? '需要 6 金币' : null,
            },
            {
              label: '药品',
              command: { type: 'buyShopItem', targetId: 'medicine' },
              disabledReason: snapshot.coins < 14 ? '需要 14 金币' : null,
            },
            {
              label: '豆袋椅',
              command: { type: 'buyShopItem', targetId: 'beanbag' },
              disabledReason: snapshot.coins < 25 ? '需要 25 金币' : null,
            },
            {
              label: '丝带',
              command: { type: 'buyShopItem', targetId: 'ribbon-pin' },
              disabledReason: snapshot.coins < 18 ? '需要 18 金币' : null,
            },
          ]}
          onCommand={onCommand}
        />
      ) : null}

      {activeMenu === 'school' ? (
        <CommandGrid
          baseDisabledReason={disabled ? '运行时加载中' : null}
          items={[
            {
              label: '课程',
              command: { type: 'startActivity', targetId: 'school' },
            },
            {
              label: '逻辑游戏',
              command: { type: 'startMinigame', targetId: 'card-match' },
            },
          ]}
          onCommand={onCommand}
        />
      ) : null}

      {activeMenu === 'stuff' ? (
        <CommandGrid
          baseDisabledReason={disabled ? '运行时加载中' : null}
          items={[
            {
              label: '使用肥皂',
              command: { type: 'useItem', targetId: 'soap' },
              disabledReason: snapshot.soapCount <= 0 ? '没有肥皂' : null,
            },
            {
              label: '合成花盆',
              command: { type: 'craftItem', targetId: 'sprout-planter' },
            },
            {
              label: '合成胸针',
              command: { type: 'craftItem', targetId: 'sprout-pin' },
            },
            {
              label: '摆放豆袋椅',
              command: { type: 'placeFurniture', targetId: 'beanbag' },
            },
            {
              label: '佩戴丝带',
              command: { type: 'equipAccessory', targetId: 'ribbon-pin' },
            },
          ]}
          onCommand={onCommand}
        />
      ) : null}

      {activeMenu === 'garden' ? (
        <div className='menu-panel__content'>
          <p>
            种子 {snapshot.seedCount} · 收获物 {snapshot.harvestCount}
          </p>
          <div className='plot-grid'>
            {snapshot.plots.map((plot) => (
              <div className='plot-card' key={plot.id}>
                <strong>{plot.id}</strong>
                <span>{getPlotLabel(plot)}</span>
                <button
                  disabled={disabled || Boolean(plot.cropId)}
                  title={
                    disabled
                      ? '运行时加载中'
                      : plot.cropId
                        ? '地块已种植'
                        : undefined
                  }
                  type='button'
                  onClick={() =>
                    onCommand({ type: 'plant', targetId: plot.id })
                  }
                >
                  种植
                </button>
                <button
                  disabled={disabled || !plot.cropId}
                  title={
                    disabled
                      ? '运行时加载中'
                      : !plot.cropId
                        ? '没有作物'
                        : undefined
                  }
                  type='button'
                  onClick={() =>
                    onCommand({ type: 'water', targetId: plot.id })
                  }
                >
                  浇水
                </button>
                <button
                  disabled={disabled || plot.readyAt === null}
                  title={
                    disabled
                      ? '运行时加载中'
                      : plot.readyAt === null
                        ? '仍在生长'
                        : undefined
                  }
                  type='button'
                  onClick={() =>
                    onCommand({ type: 'harvest', targetId: plot.id })
                  }
                >
                  收获
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeMenu === 'phone' ? (
        <div className='menu-panel__content'>
          <CommandGrid
            baseDisabledReason={disabled ? '运行时加载中' : null}
            items={[
              {
                label: '生日',
                command: { type: 'birthday' },
                disabledReason:
                  snapshot.stage === 'elder'
                    ? '已是长者'
                    : snapshot.stage === 'egg' || snapshot.stage === 'dead'
                      ? '不可用'
                      : null,
              },
              {
                label: '复活',
                command: { type: 'revive' },
                disabledReason:
                  snapshot.stage !== 'dead'
                    ? '宠物仍然活着'
                    : snapshot.records.revives >= 1
                      ? '已经用过'
                      : null,
              },
              {
                label: '新蛋',
                command: { type: 'newEgg' },
                disabledReason:
                  snapshot.stage === 'dead' ? null : '仅死亡后可用',
              },
              {
                label: '社交',
                command: { type: 'openMenu', targetId: 'social' },
                disabledReason: snapshot.featureFlags.social
                  ? null
                  : '功能未开启',
              },
              {
                label: '在线',
                command: { type: 'openMenu', targetId: 'online' },
                disabledReason: snapshot.featureFlags.onlineHub
                  ? null
                  : '功能未开启',
              },
            ]}
            onCommand={onCommand}
          />
          <div className='online-grid'>
            <section className='online-card'>
              <strong>好友码</strong>
              <span>{snapshot.profile.friendCode}</span>
            </section>
            <section className='online-card'>
              <strong>世代</strong>
              <span>{snapshot.profile.generation}</span>
            </section>
          </div>
        </div>
      ) : null}

      {activeMenu === 'social' ? (
        <div className='menu-panel__content'>
          <CommandGrid
            baseDisabledReason={disabled ? '运行时加载中' : null}
            items={[
              {
                label: '发布',
                command: createSocialCommand(),
                disabledReason: snapshot.featureFlags.social
                  ? null
                  : '功能未开启',
              },
              {
                label: '添加好友',
                command: createFriendCommand(snapshot.profile.friendCode),
                disabledReason: snapshot.featureFlags.social
                  ? null
                  : '功能未开启',
              },
              {
                label: '点赞最新',
                command: {
                  type: 'likeSocialPost',
                  targetId: snapshot.socialPosts[0]?.id,
                },
                disabledReason: snapshot.socialPosts.length ? null : '没有动态',
              },
            ]}
            onCommand={onCommand}
          />
          <div className='online-grid'>
            <section className='online-card'>
              <strong>好友</strong>
              <span>{snapshot.friends.length}</span>
            </section>
            <section className='online-card'>
              <strong>动态</strong>
              <span>{snapshot.socialPosts.length}</span>
            </section>
          </div>
        </div>
      ) : null}

      {activeMenu === 'online' ? (
        <div className='menu-panel__content'>
          <CommandGrid
            baseDisabledReason={disabled ? '运行时加载中' : null}
            items={[
              {
                label: '刷新',
                command: createOnlineCommand(),
                disabledReason: snapshot.featureFlags.onlineHub
                  ? null
                  : '功能未开启',
              },
              {
                label: '问候宠物',
                command: {
                  type: 'interactOnlinePet',
                  targetId: snapshot.mockOnlinePets[0]?.id,
                  value: 'wave',
                },
                disabledReason:
                  snapshot.featureFlags.onlineHub && snapshot.mockOnlinePets[0]
                    ? null
                    : '没有模拟宠物',
              },
            ]}
            onCommand={onCommand}
          />
          <div className='online-grid'>
            {snapshot.mockOnlinePets.slice(0, 4).map((pet) => (
              <section className='online-card' key={pet.id}>
                <strong>{pet.name}</strong>
                <span>
                  {pet.stage} · {pet.owner}
                </span>
              </section>
            ))}
          </div>
        </div>
      ) : null}

      {activeMenu === 'stats' ? (
        <div className='menu-panel__content'>
          <p>
            金币 {snapshot.coins} · 药品 {snapshot.medicine} · 阶段{' '}
            {getStageLabel(snapshot.stage)}
          </p>
          <div className='profile-strip'>
            <span>{snapshot.profile.username}</span>
            <span>第 {snapshot.profile.generation} 代</span>
            <span>死亡 {snapshot.records.deaths}</span>
          </div>
          <div className='mission-list'>
            {snapshot.missions.map((mission) => (
              <div className='mission-row' key={mission.id}>
                <span>
                  {getMissionLabel(mission)}：{mission.progress}/{mission.goal}
                </span>
                <button
                  disabled={
                    disabled ||
                    mission.claimed ||
                    mission.progress < mission.goal
                  }
                  title={
                    disabled
                      ? '运行时加载中'
                      : mission.claimed
                        ? '已领取'
                        : mission.progress < mission.goal
                          ? '任务未完成'
                          : undefined
                  }
                  type='button'
                  onClick={() =>
                    onCommand({ type: 'claimMission', targetId: mission.id })
                  }
                >
                  {mission.claimed ? '已领取' : '领取'}
                </button>
              </div>
            ))}
          </div>
          <button
            className='menu-panel__back'
            disabled={disabled}
            type='button'
            onClick={() =>
              onCommand({ type: 'openMenu', targetId: 'settings' })
            }
          >
            设置
          </button>
        </div>
      ) : null}

      {activeMenu === 'settings' ? (
        <div className='menu-panel__content'>
          <div className='settings-grid'>
            <SettingToggle
              checked={snapshot.settings.soundEnabled}
              disabled={disabled}
              label='声音'
              setting='soundEnabled'
              onCommand={onCommand}
            />
            <SettingToggle
              checked={snapshot.settings.reducedMotion}
              disabled={disabled}
              label='减少动画'
              setting='reducedMotion'
              onCommand={onCommand}
            />
            <SettingToggle
              checked={snapshot.settings.fastHatch}
              disabled={disabled}
              label='快速孵化'
              setting='fastHatch'
              onCommand={onCommand}
            />
            <FeatureToggle
              checked={snapshot.featureFlags.social}
              disabled={disabled}
              feature='social'
              label='模拟社交'
              onCommand={onCommand}
            />
            <FeatureToggle
              checked={snapshot.featureFlags.onlineHub}
              disabled={disabled}
              feature='onlineHub'
              label='模拟中心'
              onCommand={onCommand}
            />
          </div>

          <div className='theme-grid' aria-label='主题'>
            {themeOptions.map((theme) => (
              <button
                className='setting-toggle'
                disabled={disabled}
                key={theme}
                type='button'
                onClick={() => onCommand(createSettingCommand('theme', theme))}
              >
                <span>{getMenuTitle(theme)}</span>
                <span aria-hidden='true'>
                  {snapshot.settings.theme === theme ? '已启用' : '设置'}
                </span>
              </button>
            ))}
          </div>

          <div className='save-tools'>
            <button disabled={disabled} type='button' onClick={onExport}>
              导出
            </button>
            <button
              disabled={disabled || !saveText}
              type='button'
              onClick={onImport}
            >
              导入
            </button>
          </div>
          <textarea
            aria-label='存档导入导出文本'
            value={saveText}
            onChange={(event) => onSaveTextChange(event.target.value)}
          />

          <div className='save-tools'>
            <button
              disabled={disabled || !pwaUpdateAvailable}
              type='button'
              onClick={onApplyPwaUpdate}
            >
              应用更新
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function CommandGrid({
  baseDisabledReason,
  items,
  onCommand,
}: {
  baseDisabledReason: string | null
  items: CommandGridItem[]
  onCommand: (command: GameCommand) => void
}) {
  return (
    <div className='command-grid'>
      {items.map((item) => {
        const disabledReason = baseDisabledReason ?? item.disabledReason ?? null
        return (
          <button
            disabled={Boolean(disabledReason)}
            key={`${item.command.type}-${item.command.targetId ?? item.label}`}
            title={disabledReason ?? undefined}
            type='button'
            onClick={() => onCommand(item.command)}
          >
            <span>{item.label}</span>
            {disabledReason ? <small>{disabledReason}</small> : null}
          </button>
        )
      })}
    </div>
  )
}

type CommandGridItem = {
  label: string
  command: GameCommand
  disabledReason?: string | null
}

function SettingToggle({
  checked,
  disabled,
  label,
  setting,
  onCommand,
}: {
  checked: boolean
  disabled: boolean
  label: string
  setting: keyof PetScreenSnapshot['settings']
  onCommand: (command: GameCommand) => void
}) {
  return (
    <button
      className='setting-toggle'
      disabled={disabled}
      title={disabled ? '运行时加载中' : undefined}
      type='button'
      onClick={() =>
        onCommand(createSettingCommand(setting, checked ? false : true))
      }
    >
      <span>{label}</span>
      <span aria-hidden='true'>{checked ? '开' : '关'}</span>
    </button>
  )
}

function FeatureToggle({
  checked,
  disabled,
  feature,
  label,
  onCommand,
}: {
  checked: boolean
  disabled: boolean
  feature: keyof PetScreenSnapshot['featureFlags']
  label: string
  onCommand: (command: GameCommand) => void
}) {
  return (
    <button
      className='setting-toggle'
      disabled={disabled}
      title={disabled ? '运行时加载中' : undefined}
      type='button'
      onClick={() =>
        onCommand({
          type: 'toggleFeature',
          targetId: feature,
          value: checked ? 'false' : 'true',
          payload: {
            kind: 'feature',
            key: feature,
            value: !checked,
          },
        })
      }
    >
      <span>{label}</span>
      <span aria-hidden='true'>{checked ? '开' : '关'}</span>
    </button>
  )
}

const themeOptions = [
  'classic',
  'mint',
  'contrast',
  'sakura',
  'aqua',
  'grape',
  'toyblue',
  'strawberry',
  'matcha',
] as const

function createSettingCommand(
  setting: keyof PetScreenSnapshot['settings'],
  value: boolean | string
): GameCommand {
  return {
    type: 'toggleSetting',
    targetId: setting,
    value: String(value),
    payload: {
      kind: 'settings',
      key: setting,
      value,
    },
  }
}

function createSocialCommand(): GameCommand {
  return {
    type: 'postSocial',
    targetId: 'local-status',
    payload: {
      kind: 'social',
      body: '来自 Tamakey 的问候。',
    },
  }
}

function createFriendCommand(friendCode: string): GameCommand {
  return {
    type: 'addFriend',
    targetId: friendCode,
    payload: {
      kind: 'social',
      friendCode,
    },
  }
}

function createOnlineCommand(): GameCommand {
  return {
    type: 'refreshOnline',
    targetId: 'hub',
    payload: {
      kind: 'online',
      action: 'refresh',
    },
  }
}

function getMenuTitle(menu: string) {
  const labels: Record<string, string> = {
    activity: '活动',
    bath: '清洁',
    care: '照护',
    classic: '经典',
    contrast: '高对比',
    aqua: '水色糖果',
    feeding: '喂食',
    garden: '花园',
    grape: '葡萄汽水',
    main: '主菜单',
    matcha: '抹茶布丁',
    mint: '薄荷',
    online: '在线',
    phone: '电话',
    sakura: '樱花奶油',
    school: '学校',
    settings: '设置',
    shop: '商店',
    social: '社交',
    stats: '状态',
    strawberry: '草莓牛奶',
    stuff: '物品',
    toyblue: '玩具蓝',
  }
  return labels[menu] ?? menu
}

function getStageLabel(stage: PetScreenSnapshot['stage']) {
  const labels: Record<PetScreenSnapshot['stage'], string> = {
    adult: '成年',
    baby: '幼年',
    child: '童年',
    dead: '死亡',
    egg: '蛋',
    elder: '长者',
    teen: '少年',
  }
  return labels[stage]
}

function getMissionLabel(mission: PetScreenSnapshot['missions'][number]) {
  const labels: Record<string, string> = {
    arcadeRun: '试玩一次街机游戏',
    cleanHome: '打扫房间',
    craftDecor: '合成房间装饰',
    dailyCare: '完成三次照护',
    firstFriend: '添加一位本地好友',
    firstMeal: '提供一份正餐',
    gardenStart: '种下一颗种子',
    schoolDay: '参加学校课程',
    socialPost: '发布一条本地动态',
  }
  return labels[mission.id] ?? mission.label
}

function getPlotLabel(plot: PetScreenSnapshot['plots'][number]) {
  if (!plot.cropId) return '空地'
  if (plot.readyAt !== null) return '可收获'
  return '生长中'
}

function getActivityProgress(snapshot: PetScreenSnapshot) {
  const startedAt = snapshot.activityStartedAt ?? Date.now()
  const endsAt = snapshot.activityEndsAt ?? startedAt
  const total = Math.max(1, endsAt - startedAt)
  const remainingMs = Math.max(0, endsAt - Date.now())
  const percent = Math.min(
    100,
    Math.max(0, Math.round(((total - remainingMs) / total) * 100))
  )

  return {
    percent,
    remainingLabel:
      remainingMs <= 0
        ? '可以结束'
        : `剩余 ${Math.ceil(remainingMs / 1000)} 秒`,
  }
}

function getActivityTitle(activityId: PetScreenSnapshot['activityId']) {
  if (!activityId) return '活动'
  const titles: Record<string, string> = {
    arcade: '街机挑战',
    bath: '洗澡时间',
    cleanRoom: '打扫房间',
    cooking: '烹饪',
    fortune: '占卜',
    garden: '花园散步',
    school: '学校课程',
    shop: '购物',
    toilet: '如厕',
    vacation: '度假',
    work: '打工',
  }
  return titles[activityId] ?? getMenuTitle(activityId)
}
