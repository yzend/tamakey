# 03-feature-specs.md

## 1. 说明

本文把 `02-feature-map.md` 中的功能地图展开为可实现规格。所有规格都是 clean-room 行为描述，不复制 Tamaweb 源码、素材、数值表、任务表、成长表、存档 key 或 UI 文案。

复刻实现时，P0/P1 必须优先满足；P2/P3 可以分阶段实现，但行为差异必须记录到 `09-difference-report.md`。

## 2. 核心功能规格

### 功能：应用初始化

- 功能 ID：F001、F004、F005
- 用户入口：打开 Web 应用
- 调用链：HTML load -> bootstrap -> load assets -> load save -> create domain state -> create renderer -> enter home scene
- 关键源文件：`index.html`, `src/Main.js`, `src/App.js`
- 关键函数 / 类：`App.init`, `App.load`, `App.createActivePet`
- 输入：浏览器环境、静态资源、IndexedDB/localStorage 存档
- 输出：游戏 ready、Home 场景、当前宠物或 egg
- 状态变化：`app.status=loading|ready|error`；`world.scene=home`；`pet` 从存档恢复或创建新 egg
- 数据读写：读 save；初始化后可触发 auto save
- 错误分支：资源加载失败显示错误；存档解析失败走恢复/重置确认；IndexedDB 不可用时 fallback
- 权限要求：无；PWA 持久化存储为可选
- 外部服务：无
- 对应测试：无存档首次启动、有存档恢复、损坏存档恢复、资源缺失错误
- 复刻策略：React 启动 UI shell，调用 domain bootstrap；PixiJS renderer 在资源加载后挂载
- 验收标准：首次打开 3 秒内进入 loading/ready；错误可见；有存档能恢复 pet/scene/settings；无存档进入 egg intro

### 功能：Egg 首次流程和孵化

- 功能 ID：F013、F014
- 用户入口：首次无存档、死亡/搬出后的 fresh egg
- 调用链：create new pet definition -> mark stage egg -> render egg object -> lock controls -> hatch timer -> transition to baby
- 关键源文件：`src/App.js`, `src/Pet.js`, `src/Activities.js`
- 关键函数 / 类：`transferAndGetFreshEgg`, `Pet.handleEgg`, `playEggUfoAnimation`
- 输入：新建宠物请求、当前时间、目标 hatch duration
- 输出：egg 像素对象、孵化动画、baby 可操作
- 状态变化：`pet.stage=egg -> baby`；`pet.hatchStartedAt` 写入；`controls.enabled=false -> true`
- 数据读写：创建新 save；hatch 后保存 stage
- 错误分支：egg asset 缺失时显示 fallback egg；hatch timer 丢失时重建 timer；重复 hatch 事件必须幂等
- 权限要求：无
- 外部服务：无
- 对应测试：reset 后 canvas 有 egg；egg 阶段不能 feed/play；hatch 后 baby 出现；刷新后仍保留 egg/hatch 状态
- 复刻策略：egg 是独立 render entity，不复用 baby sprite；baby sprite 只作为孵化后形态
- 验收标准：无存档启动时不能直接显示 baby；egg 在目标项目自定义的短等待窗口后孵化，不复用原仓库具体时间数值；孵化时不会同时显示 egg 和 baby

### 功能：宠物需求推进

- 功能 ID：F015、F016
- 用户入口：自动 tick、回访离线推进
- 调用链：game loop/restore -> compute elapsed -> advance needs -> derive moodlets -> check poop/death/misbehavior
- 关键源文件：`src/Pet.js`, `src/App.js`
- 关键函数 / 类：`statsManager`, `simulateOfflineProgression`, `simulateAwayProgression`
- 输入：elapsed time、当前 hour、pet stats、traits、vacation/parents/sleep flags
- 输出：更新后的 hunger/sleep/fun/bladder/health/cleanliness/care/deathTick
- 状态变化：需求下降或恢复；可能产生 poop、misbehaving、dead
- 数据读写：tick 更新内存状态；auto save 周期落盘
- 错误分支：elapsed 过大需 clamp；负值时间忽略；dead/egg 不走普通需求
- 权限要求：无
- 外部服务：无
- 对应测试：前台 60 秒推进；离线 1 小时推进；夜间低消耗；vacation 不下降；关键需求为 0 后 death tick 下降
- 复刻策略：目标项目重新设计数值，但保留“前台细 tick + 离线粗模拟 + 状态派生”机制
- 验收标准：离线恢复稳定、不会一次 tick 直接溢出、需求变化可解释、死亡条件可测

### 功能：成长和生日

- 功能 ID：F017
- 用户入口：Phone > Have birthday；automatic aging
- 调用链：check birthday time -> birthday activity -> choose evolution -> update pet stage/sprite/traits -> save
- 关键源文件：`src/PetDefinition.js`, `src/Activities.js`, `src/App.js`
- 关键函数 / 类：`getNextBirthdayDate`, `getNextAutomaticBirthdayDate`, `ageUp`, `getPossibleEvolutions`, `birthday`
- 输入：birthday timestamp、care rating、skills、current stage、growth candidates
- 输出：新 life stage、新形态、生日动画
- 状态变化：`lifeStage`、`lastBirthdayAt`、`traits`、`records`
- 数据读写：保存 pet、records、achievements
- 错误分支：未到生日时间提示等待；elder 不再显示手动生日；候选形态为空时 fallback
- 权限要求：无
- 外部服务：无
- 对应测试：未到生日不可 age；到点可 age；自动生日入队；技能影响 evolution 开关有效
- 复刻策略：不复用原 growth chart；目标自建 evolution rule engine
- 验收标准：每个 stage 都有明确下一阶段；成长结果可追踪；刷新后不会重复生日

### 功能：主菜单和导航

- 功能 ID：F022、F023
- 用户入口：点击 canvas、shell/back button
- 调用链：pointer click -> check controls/display -> open main menu -> route to submenu
- 关键源文件：`index.html`, `src/Definitions.js`, `src/App.js`
- 关键函数 / 类：`open_main_menu`, `displayGrid`, `displayList`
- 输入：pointer event、control state、display stack
- 输出：菜单 UI、返回/关闭行为
- 状态变化：`ui.displayStack` push/pop；可能 `scene=home`
- 数据读写：设置 badge 状态可能保存
- 错误分支：活动锁定时点击交给 activity override；display 打开时 back 只关闭最上层
- 权限要求：无
- 外部服务：无
- 对应测试：egg 阶段主菜单不可打开或受限；活动中点击不打断；back 栈正确
- 复刻策略：React 实现菜单层，PixiJS 只发 pointer intent
- 验收标准：8 个入口完整；弹窗/列表/滑块可返回；活动锁控制优先

### 功能：喂食、药和烹饪

- 功能 ID：F029、F030、F031
- 用户入口：Main > Feeding
- 调用链：open food list -> select item -> validate pet state -> play feeding/cooking -> apply effects -> mission/want update
- 关键源文件：`src/App.js`, `src/Pet.js`, `src/Activities.js`, `src/Definitions.js`
- 输入：food item、inventory、pet mood/state
- 输出：吃饭动画、属性变化、inventory 变化
- 状态变化：hunger/fun/health/sleep/skills、last eaten、inventory
- 数据读写：inventory 和 pet stats 保存
- 错误分支：egg/dead 不可喂；吃饱拒绝；misbehaving 可能拒绝；材料不足不能 cook
- 权限要求：无
- 外部服务：SnapMeal 是独立规格
- 对应测试：普通食物、零食、药、重复食物拒绝、材料不足、cook 后扣材料
- 复刻策略：目标自定义 food definitions，只保留 food/treat/med/cooked 分类
- 验收标准：属性变化正确；UI 反馈明确；任务和 want 能联动

### 功能：清洁、厕所和睡眠

- 功能 ID：F032、F033、F034、F035、F037
- 用户入口：Bath、Care > Sleep
- 调用链：select action -> validate state -> scene transition -> mini interaction -> apply effects -> return home
- 关键源文件：`src/Activities.js`, `src/Pet.js`, `src/App.js`
- 输入：pet stats、scene、interaction input
- 输出：清洁/厕所/刷牙/睡眠效果
- 状态变化：cleanliness、health、bladder、poopCount、sleeping
- 数据读写：pet stats、room objects
- 错误分支：egg/dead 不可用；bladder 未低时拒绝 toilet；misbehaving 拒绝；睡眠时间外可能拒绝
- 权限要求：无
- 外部服务：无
- 对应测试：poop 生成和清理；睡觉恢复；点击唤醒；刷牙/洗澡结束回 home
- 复刻策略：P0 先实现 bath/toilet/sleep，P1/P2 再加刷牙和 room clean 细节
- 验收标准：核心需求能闭环；睡眠不允许菜单打断；poop 对 health 有影响

### 功能：纪律、抚摸和 Want

- 功能 ID：F018、F036、F038
- 用户入口：Care、直接拖/点宠物
- 调用链：open care/direct pointer -> praise/scold/pet -> validate -> apply discipline/care/fun -> check want
- 关键源文件：`src/PetDefinition.js`, `src/Pet.js`, `src/App.js`, `src/Activities.js`
- 输入：当前 want、misbehaving、pointer input
- 输出：反馈动画、want 完成或失败
- 状态变化：discipline、care、fun、want、misbehaving
- 数据读写：pet stats、mission progress
- 错误分支：错误 praise/scold 会负反馈；无 want 时不触发完成；egg/dead 禁用
- 权限要求：无
- 外部服务：无
- 对应测试：misbehaving scold 成功/失败；praise cooldown；petting 完成 want
- 复刻策略：want 分类保留，具体列表重写
- 验收标准：want 可见、可完成、会刷新；纪律影响 misbehavior

### 功能：任务、成就、收藏和 Profile

- 功能 ID：F024、F025、F026、F027、F028、F039
- 用户入口：Stats、Care > Missions
- 调用链：open menu -> read records/missions -> display progress -> claim reward -> update inventory/gold/records
- 关键源文件：`src/App.js`, `src/Missions.js`, `src/Definitions.js`
- 输入：records、missions、pet/profile data
- 输出：信息面板、奖励
- 状态变化：mission progress、points、claimed flags、records
- 数据读写：save records/missions/profile
- 错误分支：未完成不可领；重复领取无效；无 username 先提示设置
- 权限要求：Hubchi/profile 在线功能需要 username；本地 profile 不需要
- 外部服务：Hubchi 可选
- 对应测试：每日刷新、任务完成、领奖幂等、成就领取、过去世代可查看
- 复刻策略：任务枚举和奖励池重新设计；保留“每日任务 + 点数商店”
- 验收标准：任务来源可追踪；领奖后状态持久；重复刷新不破坏进度

### 功能：外出、商店、学校和小游戏

- 功能 ID：F041-F052
- 用户入口：Main > Activity
- 调用链：open activity selector -> choose location -> validate age/state -> scene script -> reward/effect -> return home
- 关键源文件：`src/Activities.js`, `src/App.js`, `src/Definitions.js`
- 输入：activity choice、pet age、gold、inventory、friends
- 输出：场景活动、奖励、商店购买、技能点、任务进度
- 状态变化：scene、gold、inventory、skills、friends、rabbitHole、vacation flags
- 数据读写：pet/world/inventory/records
- 错误分支：年龄不足禁用；金币不足；class daily limit；rabbit hole 未结束不可回
- 权限要求：在线地点可要求联网/用户名；其他无
- 外部服务：Hubchi 仅在 online hub
- 对应测试：地点禁用条件；商店扣钱给物品；school 计数；小游戏胜负结算；work 结算
- 复刻策略：P0 实现 selector 和 home return；P1 实现 shop/school/garden；P2 实现小游戏/work/fortune/rabbit hole；P3 online
- 验收标准：活动不会破坏主状态；结束后返回 home；奖励持久

### 功能：Stuff、家具、饰品和合成

- 功能 ID：F053-F056
- 用户入口：Main > Stuff
- 调用链：open stuff -> choose item/accessory/furniture/craft -> validate inventory/material -> apply effect
- 关键源文件：`src/App.js`, `src/Activities.js`, `src/Definitions.js`
- 输入：inventory、harvests、owned furniture/accessory
- 输出：使用物品、换装、摆家具、制作结果
- 状态变化：inventory、equipped accessories、room furniture、home background、skills
- 数据读写：save inventory/furniture/room
- 错误分支：未拥有不显示或禁用；材料不足不能 craft；摆放超过上限拒绝
- 权限要求：无
- 外部服务：无
- 对应测试：饰品开关、家具摆放/移除、craft 扣材料、room 替换
- 复刻策略：目标自定义物品表和资产；家具数据用 normalized schema
- 验收标准：换装和家具在 canvas 可见；保存恢复后保持

### 功能：花园、植物和动物

- 功能 ID：F057、F058
- 用户入口：Care > Garden/Backyard
- 调用链：enter garden -> select plot/animal -> plant/water/harvest/feed/play -> apply timers/buffs
- 关键源文件：`src/Activities.js`, `src/Plant.js`, `src/Animal.js`
- 输入：seed、plant timers、weather、animal happiness
- 输出：植物成长、harvest、动物 buff
- 状态变化：plants、harvest inventory、animals、gameplay buffs
- 数据读写：world plants/animals
- 错误分支：空地才能种；未成熟不能收；缺食物不能喂；动物 happiness 过低离开或失效
- 权限要求：无
- 外部服务：无
- 对应测试：种植、水分、成熟、枯死、收获、动物 buff 影响 plant duration
- 复刻策略：独立 timer service，渲染只展示 derived state
- 验收标准：离线后植物正确成长/死亡；动物 buff 可解释

### 功能：Phone、朋友、在线和 vacation

- 功能 ID：F059-F064
- 用户入口：Main > Phone
- 调用链：open phone -> choose service -> validate age/online/gold/friendship -> execute activity
- 关键源文件：`src/App.js`, `src/Activities.js`, `src/PetDefinition.js`
- 输入：username、online status、friend list、gold、age
- 输出：Hubchi、SnapMeal、friends、birthday、social、vacation、move out
- 状态变化：online temp、inventory、friends、vacation、new egg
- 数据读写：save profile/friends/inventory/pet
- 错误分支：baby 禁用大部分服务；offline 禁用 Hubchi；金币不足；不能加自己为 friend
- 权限要求：在线功能需要网络和 username
- 外部服务：目标项目需要自建 API 或关闭在线功能
- 对应测试：friend code 导入、SnapMeal 扣款收货、vacation 不掉需求、move out 生成 egg
- 复刻策略：P0 只实现 birthday/move out；P1 friends；P2 vacation/SnapMeal；P3 Hubchi/social
- 验收标准：Phone 功能按年龄禁用；move out 后 egg 正确显示

### 功能：存档、设置、PWA 和错误处理

- 功能 ID：F065-F074
- 用户入口：Settings、自动保存、浏览器安装提示、错误事件
- 调用链：settings/save/load -> repository -> IndexedDB/localStorage -> UI feedback；service worker install/fetch -> cache
- 关键源文件：`src/App.js`, `src/Main.js`, `service-worker.js`, `manifest.webmanifest`
- 输入：app state、settings toggles、save code、install prompt、runtime errors
- 输出：持久化 save、导入导出、PWA 安装、错误 UI
- 状态变化：settings、save version、storage status、cache
- 数据读写：IndexedDB、localStorage、Cache Storage
- 错误分支：存档损坏、存储被拒、导入 code 非法、SW 安装失败、异常捕获
- 权限要求：剪贴板/通知/持久化存储需浏览器授权；通知默认不实现
- 外部服务：无
- 对应测试：save/load roundtrip、导入非法 code、storage fallback、SW disabled 场景、global error UI
- 复刻策略：save schema versioned；设置分 domain/ui/system；PWA 用目标品牌资产
- 验收标准：自动保存不丢数据；导入导出可用；错误不会白屏

## 3. 横向规则

| 规则              | 说明                                                         |
| ----------------- | ------------------------------------------------------------ |
| Egg/dead gating   | egg 和 dead 状态禁用普通照料、外出、Phone 大部分功能         |
| Activity lock     | 活动中关闭普通主菜单，pointer 输入交给活动控制器             |
| Scene return      | 活动结束默认返回 Home，除非 vacation/rabbit hole/dead        |
| Save ownership    | 领域状态变化由 command/reducer 负责，repository 只持久化     |
| Clean-room assets | 每个 UI icon、sprite、sound、font 都必须来自目标项目自有资产 |
| Determinism       | 成长、随机遭遇、离线推进需可测试，随机源可注入 seed          |
