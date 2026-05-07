# 02-feature-map.md

## 1. 复刻范围

默认复刻范围是 Tamaweb 的全部可见功能行为规格，但采用 clean-room 重新实现。

这里的“全部可见功能行为规格”表示文档会覆盖原仓库可见能力，方便后续完整复刻；不表示所有功能都必须在第一阶段实现。实现优先级按 P0-P3 拆分，差异和延后项在 `09-difference-report.md` 中明确记录。

包含：

- 首次进入、egg、孵化、命名。
- 宠物成长、需求、死亡、revive、新 egg。
- 主菜单 8 个入口。
- 喂食、洗澡、厕所、刷牙、睡眠、纪律、抚摸。
- 外出、学校、小游戏、工作、餐厅、医院、商店、花园、动物。
- Phone、朋友、社交、Hubchi 行为规格。
- 每日任务、成就、收藏、家族树。
- 存档、导入导出、离线推进、PWA、错误处理。

不包含：

- 原源码复制。
- 原素材、声音、字体、logo、商标、UI 文案复制。
- 原 Google Apps Script endpoint 复用。
- 原数值表、任务表、成长表直接复用。
- 原 Discord/社媒/官方链接。
- 原分析上报。

## 2. 功能地图

| 功能 ID | 功能域    | 功能点                                | 用户入口               | 源文件                                   | 输入                         | 输出                         | 状态变化                 | 依赖                  | 优先级        |
| ------- | --------- | ------------------------------------- | ---------------------- | ---------------------------------------- | ---------------------------- | ---------------------------- | ------------------------ | --------------------- | ------------- |
| F001    | 用户界面  | Loading/Error 容器                    | 页面打开               | `index.html`, `Main.js`                  | 页面加载、异常               | loading/error UI             | loading 状态             | DOM                   | P0            |
| F002    | 用户界面  | Canvas 游戏画面                       | 页面中心 canvas        | `index.html`, `Drawer.js`, `Object2d.js` | draw objects                 | 96x96 画面                   | 渲染列表排序             | Canvas 2D             | P0            |
| F003    | 用户界面  | `<c-sprite>` UI 图标                  | 菜单/列表              | `Main.js`                                | sprite src/index             | DOM sprite                   | 无                       | sanitize              | P1            |
| F004    | 页面/路由 | 单页静态应用                          | `index.html`           | `index.html`, `Main.js`                  | URL                          | App init                     | 全局 App                 | 静态资源              | P0            |
| F005    | 状态管理  | App 初始化                            | 自动                   | `App.js`                                 | 存档、资源                   | Game ready                   | App/pet/scene            | IndexedDB、资源       | P0            |
| F006    | 状态管理  | Frame loop                            | 自动                   | `App.js`, `Drawer.js`                    | delta time                   | draw tick                    | time/playTime            | requestAnimationFrame | P0            |
| F007    | 状态管理  | Periodic update                       | 自动                   | `App.js`                                 | 当前时间                     | birthday event               | event queue              | moment                | P1            |
| F008    | 数据模型  | PetDefinition                         | 各系统                 | `PetDefinition.js`                       | stats/sprite/family          | pet definition               | life stage/wants         | growth chart          | P0            |
| F009    | 数据模型  | Pet 实体                              | 画面/活动              | `Pet.js`                                 | PetDefinition                | 可绘制 pet                   | state/position           | Object2d              | P0            |
| F010    | 数据模型  | Plant                                 | Garden                 | `Plant.js`                               | plant save                   | plant state                  | growth/water/death       | weather/buffs         | P1            |
| F011    | 数据模型  | Animal                                | Backyard/Garden        | `Animal.js`                              | animal save                  | animal entity                | happiness/buffs          | PetDefinition         | P1            |
| F012    | 数据模型  | Mission                               | Care > Missions        | `Missions.js`                            | mission progress             | points/rewards               | mission state            | definitions           | P1            |
| F013    | 核心业务  | 首次进入 egg intro                    | 新用户                 | `App.js`, `Activities.js`, `Pet.js`      | 无存档                       | UFO egg、命名                | `is_egg=true`            | resources             | P0            |
| F014    | 核心业务  | Egg 孵化                              | 自动                   | `Pet.js`                                 | egg start time               | baby 可操作                  | `is_egg=false`           | time/draw             | P0            |
| F015    | 核心业务  | 宠物需求消耗                          | 自动                   | `Pet.js`                                 | delta/hour                   | stats 变化                   | hunger/sleep/fun 等      | traits/offline        | P0            |
| F016    | 核心业务  | 离线推进                              | 回访                   | `App.js`, `Pet.js`                       | lastTime                     | 模拟 stats                   | pet stats                | Date                  | P0            |
| F017    | 核心业务  | 成长/生日                             | Phone/自动             | `PetDefinition.js`, `Activities.js`      | time/care/skills             | new sprite/stage             | lastBirthday/lifeStage   | growth chart          | P0            |
| F018    | 核心业务  | Want                                  | Care/current want      | `PetDefinition.js`, `App.js`             | timer/trait/mood             | wish target                  | current_want             | definitions           | P1            |
| F019    | 核心业务  | 死亡                                  | 自动                   | `Pet.js`, `Activities.js`                | death tick                   | ghost/graveyard              | `is_dead=true`           | stats                 | P0            |
| F020    | 核心业务  | Revive                                | 死亡弹窗               | `Pet.js`, `Activities.js`                | gold/flag                    | revived pet                  | health/death_tick        | scene                 | P1            |
| F021    | 核心业务  | Fresh egg                             | death/move out         | `App.js`, `Activities.js`                | current pet                  | new egg                      | new generation           | inventory inherit     | P0            |
| F022    | 用户界面  | 主菜单                                | Canvas click           | `Definitions.js`, `App.js`               | click                        | 8 宫格                       | display stack            | UI helper             | P0            |
| F023    | 用户界面  | Back/Shell 按钮                       | shell button           | `App.js`                                 | click                        | back/menu/home               | display stack            | controls              | P0            |
| F024    | 用户界面  | Stats menu                            | Main > Stats           | `App.js`                                 | click                        | info list                    | 无/名字变更              | PetDefinition         | P1            |
| F025    | 用户界面  | Profile                               | Stats > Profile        | `App.js`                                 | username                     | profile UI                   | userName 可能变更        | moment                | P1            |
| F026    | 用户界面  | Family tree                           | Stats                  | `App.js`                                 | family data                  | tree/list                    | 无                       | PetDefinition         | P2            |
| F027    | 用户界面  | Collection                            | Stats                  | `App.js`                                 | records                      | collection UI                | 无                       | definitions           | P2            |
| F028    | 用户界面  | Achievements                          | Stats                  | `App.js`, `Definitions.js`               | records                      | reward                       | event history/gold/items | definitions           | P1            |
| F029    | 核心业务  | Feeding                               | Main > Feeding         | `App.js`, `Pet.js`                       | food item                    | eating animation             | hunger/effects           | food defs             | P0            |
| F030    | 核心业务  | Cooking                               | Feeding > cook         | `App.js`, `Activities.js`                | camera/harvest               | crafted food                 | inventory/skills         | plants                | P2            |
| F031    | 核心业务  | Medicine                              | Feeding > meds         | `App.js`, `Pet.js`                       | med item                     | health/sickness effect       | health flags             | food defs             | P1            |
| F032    | 核心业务  | Bathe                                 | Main > Bath            | `Activities.js`                          | click/task                   | clean pet                    | cleanliness              | bathroom scene        | P0            |
| F033    | 核心业务  | Toilet                                | Main > Bath            | `Activities.js`, `Pet.js`                | bladder/force                | poop cleared                 | bladder/potty            | bathroom              | P0            |
| F034    | 核心业务  | Brush teeth                           | Bath                   | `Activities.js`                          | interaction                  | hygiene effect               | cleanliness/health       | bathroom              | P2            |
| F035    | 核心业务  | Clean room                            | Bath                   | `App.js`, `Pet.js`                       | poop objects                 | room clean                   | poop count               | Object2d              | P1            |
| F036    | 核心业务  | Discipline praise/scold               | Care                   | `App.js`, `Pet.js`                       | button                       | feedback                     | discipline/care          | misbehaving           | P0            |
| F037    | 核心业务  | Sleep                                 | Care                   | `App.js`, `Pet.js`                       | sleep click                  | sleeping state               | sleep restored           | sleep hours           | P0            |
| F038    | 核心业务  | Petting                               | Care/direct            | `App.js`, `Activities.js`, `Pet.js`      | pointer input                | affection                    | fun/care/want            | hit detection         | P1            |
| F039    | 核心业务  | Missions                              | Care                   | `Missions.js`                            | task done/claim              | points/reward                | mission progress         | definitions           | P1            |
| F040    | 核心业务  | Parents daycare                       | Care                   | `Activities.js`                          | parents/time                 | daycare state                | `is_at_parents`          | family                | P2            |
| F041    | 核心业务  | Activity selector                     | Main > Activity        | `Activities.js`, `Definitions.js`        | direction/enter              | location                     | scene/control            | definitions           | P0            |
| F042    | 核心业务  | Park/playdate                         | Activity > Park        | `Activities.js`, `App.js`                | friend/NPC                   | interaction                  | friends/wants            | PetDefinition         | P1            |
| F043    | 核心业务  | Mall shop                             | Activity > Mall        | `Activities.js`, `App.js`                | purchase                     | item/furniture/accessory     | inventory/gold           | definitions           | P1            |
| F044    | 核心业务  | Market shop                           | Activity > Market      | `Activities.js`, `App.js`                | purchase                     | food/seed/animal             | inventory/gold           | definitions           | P1            |
| F045    | 核心业务  | Arcade games                          | Activity > Game Center | `Activities.js`                          | mini input                   | win/lose                     | gold/skills/tasks        | minigame scripts      | P2            |
| F046    | 核心业务  | School                                | Activity > School      | `Activities.js`, `App.js`                | class choice                 | skill points                 | skills/class count       | time reset            | P1            |
| F047    | 核心业务  | Hospital                              | Activity > Hospital    | `Activities.js`                          | doctor visit                 | health result                | health/sickness          | scene                 | P1            |
| F048    | 核心业务  | Restaurant                            | Activity > Restaurant  | `Activities.js`                          | guest/food                   | meal event                   | friendship/want          | food defs             | P2            |
| F049    | 核心业务  | Work                                  | Activity > Work        | `Activities.js`                          | elapsed/customers            | money                        | gold/achievement         | moodlets              | P2            |
| F050    | 核心业务  | Fortune Teller                        | Activity               | `Activities.js`                          | pet/friend                   | future reveal                | 无                       | growth chart          | P2            |
| F051    | 核心业务  | Rabbit hole                           | Activity               | `App.js`, `Activities.js`                | activity/friend              | timed trip                   | current_rabbit_hole      | Date                  | P2            |
| F052    | 核心业务  | Underworld                            | Activity               | `App.js`, `Activities.js`                | custom currency              | potions/tickets              | inventory                | ghost state           | P2            |
| F053    | 核心业务  | Stuff items                           | Main > Stuff           | `App.js`, `Activities.js`                | item                         | use animation                | inventory/effects        | definitions           | P1            |
| F054    | 核心业务  | Accessories                           | Stuff                  | `App.js`, `Activities.js`                | toggle/buy                   | dressed pet                  | accessories              | definitions           | P1            |
| F055    | 核心业务  | Furniture                             | Stuff                  | `App.js`, `Activities.js`                | add/edit/remove              | room decor                   | owned/active furniture   | room scene            | P2            |
| F056    | 核心业务  | Craft                                 | Stuff                  | `App.js`                                 | harvests                     | room/furniture/accessory     | harvest inventory        | plant defs            | P2            |
| F057    | 核心业务  | Garden planting                       | Care > Garden          | `Activities.js`, `Plant.js`              | seed/water                   | plant lifecycle              | plants/harvests          | weather/buffs         | P1            |
| F058    | 核心业务  | Backyard animals                      | Care > Backyard        | `Activities.js`, `Animal.js`             | feed/play                    | happiness/buffs              | animals                  | definitions           | P2            |
| F059    | API       | Hubchi online                         | Phone > Hubchi         | `App.js`, `Activities.js`                | username/pet def             | online pets                  | online temp/interactions | Google Apps Script    | P3            |
| F060    | API       | SnapMeal order                        | Phone                  | `App.js`, `Activities.js`                | order/cart                   | delivery                     | inventory/gold           | food defs             | P2            |
| F061    | 状态管理  | Friends                               | Phone/Stats/Park       | `App.js`, `PetDefinition.js`             | friend code/search           | friend list                  | friends                  | save/API              | P1            |
| F062    | 核心业务  | Social media                          | Phone                  | `App.js`                                 | post/explore                 | posts UI                     | temp/social              | friends               | P3            |
| F063    | 核心业务  | Vacation                              | Phone                  | `App.js`, `Activities.js`                | payment                      | vacation state               | `is_at_vacation`         | scene                 | P2            |
| F064    | 核心业务  | Move out                              | Phone                  | `Activities.js`, `App.js`                | confirm                      | new egg                      | predecessor/generation   | PetDefinition         | P0            |
| F065    | 状态管理  | Save/load                             | Settings/auto          | `App.js`                                 | app state                    | persisted data               | IndexedDB/localStorage   | idb-keyval            | P0            |
| F066    | 配置系统  | Gameplay settings                     | Settings               | `App.js`                                 | toggles                      | behavior changes             | settings                 | save                  | P1            |
| F067    | 配置系统  | System settings                       | Settings               | `App.js`                                 | toggles                      | sound/view/vibrate           | settings                 | browser APIs          | P1            |
| F068    | 配置系统  | Shell/theme                           | Settings               | `App.js`, `themes.css`                   | choices                      | UI shell                     | settings/css             | DOM                   | P2            |
| F069    | 配置系统  | Mods                                  | Settings               | `App.js`                                 | JSON file                    | mod loaded                   | mods/resources           | file input            | P3            |
| F070    | 后台任务  | Random encounters                     | 自动                   | `App.js`, `Activities.js`                | time/state                   | queued event                 | event history            | queueEvent            | P2            |
| F071    | 后台任务  | Newspaper/update prompts              | 自动                   | `App.js`, `Activities.js`                | date/version                 | popup                        | event history            | moment                | P3            |
| F072    | 错误处理  | Global errors                         | 自动                   | `Main.js`, `App.js`                      | thrown error                 | error UI/log                 | error log                | window.onerror        | P0            |
| F073    | 部署      | Service worker cache                  | install/fetch          | `service-worker.js`                      | assets                       | cached response              | cache storage            | SW APIs               | P2            |
| F074    | 部署      | PWA install                           | Settings/browser       | `App.js`, `manifest.webmanifest`         | install prompt               | installed app                | deferred prompt          | browser API           | P2            |
| F075    | CLI/脚本  | Asset lister/template                 | dev only               | `scripts/*.js`                           | local files                  | generated data               | files                    | Node 推断             | P3            |
| F076    | 测试      | 自动化测试                            | 无                     | 待确认                                   | 待确认                       | 待确认                       | 无                       | 无                    | P0 for target |
| F077    | 权限认证  | 本地用户名和在线功能门禁              | Profile/Phone/Hubchi   | `App.js`, `PetDefinition.js`             | username、online status、age | 允许/拒绝进入在线功能        | userName、online temp    | browser online/API    | P2            |
| F078    | 后端      | 原仓库无自有后端，Hubchi 依赖外部脚本 | Phone > Hubchi         | `App.js`                                 | pet summary/user id          | online pet list/interactions | online temp              | Google Apps Script    | P3            |

## 3. 功能优先级

P0 最小闭环：

- 初始化、渲染、存档、egg、孵化、宠物需求、喂食、睡眠、清洁、死亡、新 egg、主菜单。

P1 核心留存：

- 成长、生日、任务、商店、花园、学校、朋友、设置、离线推进。

P2 内容扩展：

- 小游戏、工作、餐厅、医院、家具、动物、vacation、rabbit hole、PWA。

P3 可延后或替代：

- Hubchi 在线、社交媒体、mod、运营弹窗、原部署脚本。P3 项仍保留行为规格，但默认不进入最小可运行闭环；目标项目可替代实现或明确不复刻。

## 4. 用户入口汇总

| 用户入口    | 功能                                                                          |
| ----------- | ----------------------------------------------------------------------------- |
| 首次打开    | loading、资源加载、egg intro、命名、孵化                                      |
| Canvas 点击 | 主菜单                                                                        |
| Stats       | 状态、Profile、家族树、收藏、成就、名字/性别、过去世代                        |
| Feeding     | food、snacks、meds、cook                                                      |
| Bath        | bathe、toilet、brush teeth、clean room                                        |
| Care        | discipline、missions、sleep、backyard、garden、pet、parents、want             |
| Activity    | 外出地点 selector                                                             |
| Stuff       | items、accessories、furniture、craft                                          |
| Phone       | Hubchi、SnapMeal、friends、birthday、social、vacation、move out、friend codes |
| Settings    | save、mods、gameplay、system、theme、shell、input code、reset、credits        |

## 5. 源文件映射

| 源文件                 | 主要功能                                            |
| ---------------------- | --------------------------------------------------- |
| `index.html`           | DOM、canvas、模板、脚本顺序                         |
| `src/Main.js`          | entry、custom element、error、service worker        |
| `src/App.js`           | 初始化、菜单、设置、存档、场景、API、事件、在线门禁 |
| `src/Pet.js`           | 宠物行为、需求、egg、dead、feed、sleep、discipline  |
| `src/PetDefinition.js` | 成长、life stage、want、friends、family、traits     |
| `src/Activities.js`    | 活动、小游戏、场景脚本                              |
| `src/Definitions.js`   | 菜单、食物、物品、家具、任务相关定义                |
| `src/Missions.js`      | 每日任务和奖励                                      |
| `src/Plant.js`         | 植物生命周期                                        |
| `src/Animal.js`        | 动物状态和 buff                                     |
| `service-worker.js`    | PWA 缓存                                            |
