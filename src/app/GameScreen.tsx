import { useState } from 'react'

import {
  exportGameState,
  importGameState,
} from '@/game/persistence/importExport'
import { PixiStage } from '@/game/rendering/PixiStage'
import {
  type GameCommand,
  selectPetViewModel,
  type PetScreenSnapshot,
  type PetViewModel,
} from '@/game/rendering/viewModels'
import { useGameStore } from '@/game/store/useGameStore'
import { useRuntimeStore } from '@/game/store/useRuntimeStore'

import { ActionDock } from './components/ActionDock'
import { MenuPanel } from './components/MenuPanel'
import { NotificationControl } from './components/NotificationControl'
import { ResetControl } from './components/ResetControl'
import { StatMeter } from './components/StatMeter'
import { StatusIsland } from './components/StatusIsland'

type GameScreenProps = {
  onEnableNotifications: () => void
  onDisableNotifications: () => void
}

export function GameScreen({
  onEnableNotifications,
  onDisableNotifications,
}: GameScreenProps) {
  const snapshot = useGameStore((state) => state.snapshot)
  const events = useGameStore((state) => state.events)
  const ackEvents = useGameStore((state) => state.ackEvents)
  const workerClient = useRuntimeStore((state) => state.workerClient)
  const workerReady = useRuntimeStore((state) => state.workerReady)
  const permission = useRuntimeStore((state) => state.notificationPermission)
  const startupNotice = useRuntimeStore((state) => state.startupNotice)
  const workerError = useRuntimeStore((state) => state.lastWorkerError)
  const pwaUpdateAvailable = useRuntimeStore(
    (state) => state.pwaUpdateAvailable
  )
  const pwaOfflineReady = useRuntimeStore((state) => state.pwaOfflineReady)
  const applyPwaUpdate = useRuntimeStore((state) => state.applyPwaUpdate)
  const [saveText, setSaveText] = useState('')
  const currentSnapshot = snapshot
    ? toPetScreenSnapshot(snapshot)
    : fallbackPetScreenSnapshot
  const pixiViewModel = snapshot
    ? selectPetViewModel(snapshot)
    : fallbackPetViewModel
  const isRuntimeReady = Boolean(workerClient && workerReady)

  const postCommand = (command: GameCommand) => {
    workerClient?.post({
      type: 'INTERACT',
      interaction: command.type,
      command,
      now: Date.now(),
    })
  }

  const postReset = () => {
    workerClient?.post({
      type: 'RESET',
      now: Date.now(),
    })
  }

  const exportSave = () => {
    if (!snapshot) return
    setSaveText(exportGameState(snapshot, Date.now()))
    postCommand({ type: 'exportSave' })
  }

  const importSave = () => {
    const result = importGameState(saveText)
    if (result.status === 'rejected') {
      setSaveText(`导入被拒绝：${result.reason}`)
      postCommand({ type: 'importSave', value: result.reason })
      return
    }

    workerClient?.post({
      type: 'IMPORT_STATE',
      state: result.state,
      now: Date.now(),
    })
  }

  return (
    <main className={`app-shell app-shell--${currentSnapshot.settings.theme}`}>
      <section className='game-surface' aria-label='Tamakey 游戏'>
        <StatusIsland
          snapshot={currentSnapshot}
          notice={workerError ?? startupNotice}
        />

        <section className='game-viewport' aria-label='宠物画面'>
          <div className='pixel-screen'>
            <PixiStage
              ackEvents={ackEvents}
              events={events}
              viewModel={pixiViewModel}
            />
          </div>
        </section>

        <ActionDock
          disabled={!isRuntimeReady || Boolean(currentSnapshot.activityId)}
          disabledReason={
            !isRuntimeReady
              ? '运行时加载中'
              : currentSnapshot.activityId
                ? currentSnapshot.lockReason
                : null
          }
          petStage={currentSnapshot.stage}
          sleepState={currentSnapshot.sleepState}
          onCommand={postCommand}
        />

        <MenuPanel
          disabled={!isRuntimeReady}
          pwaOfflineReady={pwaOfflineReady}
          pwaUpdateAvailable={
            pwaUpdateAvailable || currentSnapshot.settings.pwaUpdateAvailable
          }
          saveText={saveText}
          snapshot={currentSnapshot}
          onApplyPwaUpdate={() => applyPwaUpdate?.()}
          onCommand={postCommand}
          onExport={exportSave}
          onImport={importSave}
          onSaveTextChange={setSaveText}
        />

        <section className='secondary-panel' aria-label='宠物状态'>
          <div className='pet-dashboard'>
            <div className='resource-strip' aria-label='宠物资源'>
              <span>币 {currentSnapshot.coins}</span>
              <span>药 {currentSnapshot.medicine}</span>
              <span>饭 {currentSnapshot.foodCount}</span>
            </div>
            <div className='stat-grid'>
              <StatMeter
                label='饥饿'
                tone='hunger'
                value={currentSnapshot.stats.hunger}
              />
              <StatMeter
                label='开心'
                tone='happy'
                value={currentSnapshot.stats.happiness}
              />
              <StatMeter
                label='清洁'
                tone='clean'
                value={currentSnapshot.stats.cleanliness}
              />
              <StatMeter
                label='精力'
                tone='sleep'
                value={currentSnapshot.stats.energy}
              />
              <StatMeter
                label='如厕'
                tone='sleep'
                value={currentSnapshot.stats.bladder}
              />
              <StatMeter
                label='健康'
                tone='sick'
                value={currentSnapshot.stats.health}
              />
            </div>
          </div>
          <div className='system-controls'>
            <NotificationControl
              disabled={!isRuntimeReady}
              enabled={snapshot?.settings.notificationsEnabled ?? false}
              permission={permission}
              supported={typeof Notification !== 'undefined'}
              onEnable={onEnableNotifications}
              onDisable={onDisableNotifications}
            />
            <ResetControl disabled={!isRuntimeReady} onReset={postReset} />
          </div>
        </section>
      </section>
    </main>
  )
}

function toPetScreenSnapshot(state: Parameters<typeof selectPetViewModel>[0]) {
  const seedCount =
    state.resources.seeds.find((item) => item.id === 'sprout-seed')?.quantity ??
    0
  const harvestCount =
    state.resources.items.find((item) => item.id === 'sprout-harvest')
      ?.quantity ?? 0
  const soapCount =
    state.resources.items.find((item) => item.id === 'soap')?.quantity ?? 0
  const foodCount = state.resources.food.reduce(
    (total, item) => total + item.quantity,
    0
  )
  const hasActivity = Boolean(state.world.activity)

  return {
    ...selectPetViewModel(state),
    stats: {
      hunger: state.pet.hunger,
      happiness: state.pet.happiness,
      cleanliness: state.pet.cleanliness,
      energy: state.pet.energy,
      health: state.pet.health,
      bladder: state.pet.bladder,
    },
    ageLabel: formatAge(state.pet.ageSeconds),
    menuStack: state.ui.displayStack,
    toast: state.ui.lastToast,
    coins: state.resources.coins,
    medicine: state.resources.medicine,
    seedCount,
    harvestCount,
    soapCount,
    foodCount,
    missions: state.missions.list,
    plots: state.garden.plots,
    settings: state.settings,
    featureFlags: state.featureFlags,
    records: state.records,
    profile: state.profile,
    friends: state.friends,
    socialPosts: state.social.posts,
    mockOnlinePets: state.mockOnline.pets,
    controlsLocked: state.pet.stage === 'egg' || hasActivity,
    lockReason: hasActivity
      ? '活动进行中'
      : state.pet.stage === 'egg'
        ? '等待孵化'
        : null,
  }
}

function formatAge(ageSeconds: number) {
  const days = Math.max(0, Math.floor(ageSeconds / 86_400))
  return `年龄 ${days} 天`
}

const fallbackPetViewModel: PetViewModel = {
  stage: 'egg',
  mood: 'idle',
  sleepState: 'awake',
  sickness: 'none',
  poopCount: 0,
  roomId: 'default',
  sceneId: 'home',
  activityId: null,
  activityStartedAt: null,
  activityEndsAt: null,
  furniture: [],
  accessories: [],
  weather: 'clear',
  socialState: 'offline',
  gardenReadyCount: 0,
}

const fallbackPetScreenSnapshot: PetScreenSnapshot = {
  ...fallbackPetViewModel,
  stats: {
    hunger: 0,
    happiness: 60,
    cleanliness: 100,
    energy: 80,
    health: 100,
    bladder: 0,
  },
  ageLabel: '年龄 0 天',
  menuStack: [],
  toast: null,
  coins: 0,
  medicine: 0,
  seedCount: 0,
  harvestCount: 0,
  soapCount: 0,
  foodCount: 0,
  missions: [],
  plots: [],
  settings: {
    notificationsEnabled: false,
    reducedMotion: false,
    soundEnabled: true,
    fastHatch: false,
    theme: 'classic',
    pwaUpdateAvailable: false,
  },
  featureFlags: {
    onlineHub: false,
    social: false,
    mods: false,
  },
  records: {
    mealsFed: 0,
    snacksFed: 0,
    bathsTaken: 0,
    toiletsUsed: 0,
    sleepsStarted: 0,
    gamesPlayed: 0,
    schoolLessons: 0,
    shopPurchases: 0,
    plantsHarvested: 0,
    birthdays: 0,
    deaths: 0,
    revives: 0,
    socialPosts: 0,
    craftsCompleted: 0,
    arcadeRuns: 0,
    workShifts: 0,
    vacations: 0,
  },
  profile: {
    username: '访客',
    generation: 1,
    achievements: [],
    friendCode: 'LOCAL',
  },
  friends: [],
  socialPosts: [],
  mockOnlinePets: [],
  controlsLocked: true,
  lockReason: '运行时加载中',
}
