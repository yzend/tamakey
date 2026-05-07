# Tamaweb 流程与功能梳理

调研对象：[autosam/Tamaweb](https://github.com/autosam/Tamaweb)，源码版本 `3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975`，提交时间 2026-04-26。

本文只梳理流程、状态和产品能力，不复制 Tamaweb 的代码、素材、数值表、字段名设计或 UI 表达。Tamaweb 仓库声明为 CC BY-NC-SA 4.0，Tamakey 只能提炼通用玩法和工程经验。

## 1. 结论先行

Tamaweb 不是“一进游戏就直接进入可操作游戏”。它的真实启动路径分两种：

1. 没有存档时：页面初始化、加载资源、创建一个 `is_egg=true` 的宠物定义，然后播放 UFO 送蛋动画，弹出命名流程。此时宠物实体已经创建，但游戏控制被 egg 状态锁住。蛋会在 15-30 秒内自动孵化，孵化后才进入正常 baby 可操作状态。
2. 有存档时：页面初始化、恢复存档、恢复场景和状态。如果存档里的宠物仍是 egg，继续显示 egg 并等待孵化；如果已经是 baby/child/teen/adult/elder，则直接恢复 Home 场景和常规交互。

关键细节：Tamaweb 的 egg 不是 baby sprite。初始化时先随机选择一个 baby 角色 sprite 作为孵化后的形态，但 `Pet.handleEgg()` 会把宠物本体移到屏幕外，并单独创建 egg 图像对象。玩家看到的 egg 像素来自 `resources/img/misc/egg_01.png`、angel egg 或 devil egg；baby sprite 只在孵化完成后出现。

## 2. 源码入口

页面入口是 `index.html`，它提供 DOM shell、两个 canvas、弹窗模板和脚本加载顺序。核心画面由 `.graphics-canvas` 承载，点击 canvas 会触发主菜单。

脚本入口是 `src/Main.js`。它负责：

- 注册自定义 `<c-sprite>` 元素，用 sprite sheet cell 显示 UI 小图标。
- 绑定全局错误处理，把加载错误显示到 loading/error 容器。
- 注册 service worker 和更新提示。
- 调用 `App.init()` 启动游戏。

主业务入口是 `src/App.js` 的 `App.init()`。宠物对象、场景、资源预加载、存档恢复、离线推进、任务、随机事件都从这里挂起。

主要源码参考：

- [README.md](https://github.com/autosam/Tamaweb/blob/3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975/README.md)
- [index.html](https://github.com/autosam/Tamaweb/blob/3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975/index.html)
- [src/Main.js](https://github.com/autosam/Tamaweb/blob/3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975/src/Main.js)
- [src/App.js](https://github.com/autosam/Tamaweb/blob/3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975/src/App.js)
- [src/Pet.js](https://github.com/autosam/Tamaweb/blob/3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975/src/Pet.js)
- [src/PetDefinition.js](https://github.com/autosam/Tamaweb/blob/3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975/src/PetDefinition.js)
- [src/Activities.js](https://github.com/autosam/Tamaweb/blob/3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975/src/Activities.js)
- [src/Definitions.js](https://github.com/autosam/Tamaweb/blob/3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975/src/Definitions.js)
- [src/Missions.js](https://github.com/autosam/Tamaweb/blob/3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975/src/Missions.js)

## 3. 启动流程

### 3.1 页面加载

浏览器加载 `index.html` 后，页面先显示 loading 文案和一个 96x96 的游戏 canvas。脚本加载完成后，`Main.js` 注册错误处理、PWA service worker 和自定义 sprite 元素，然后进入 `App.init()`。

### 3.2 App 初始化顺序

`App.init()` 的关键顺序如下：

1. 注册 DOMContentLoaded 和 animation frame 更新。
2. 判断运行平台，例如 itch 或 electron client。
3. 初始化音频。
4. 创建 `Drawer`，绑定 `.graphics-canvas`，并让所有 `Object2d` 使用这个 Drawer。
5. 从 IndexedDB/localStorage 读取存档。
6. 恢复事件历史、记录、shell 背景、mod、设置、家具、植物、动物。
7. 预加载所有基础图像、宠物角色、NPC 和动物 sprite。
8. 创建背景、食物 sprite、UI 食物节点、暗色睡眠遮罩、天空和天气对象。
9. 创建 `PetDefinition`：随机名字、随机 baby sprite、`is_egg=true`，再用存档覆盖 stats/accessories。
10. 如果开启 automatic aging，检查是否错过自动生日，循环补齐 age up。
11. 如果不是测试模式，并且当前是睡眠时间，把非 egg 宠物设置为睡眠。
12. 调用 `createActivePet()` 创建当前宠物实体。
13. 如果没有旧存档，播放 UFO 送蛋动画，然后弹命名。
14. 设置 Home 场景并应用天空。
15. 如果存档里处于 rabbit hole、parents daycare、vacation，恢复对应活动状态。
16. 如果有 `lastTime`，计算离线时间并执行离线推进，超过 30 秒显示 welcome back。
17. 初始化 Missions。
18. 恢复房间自定义。
19. 注册游戏内事件、随机遭遇和输入更新。
20. 关闭 loading，启动周期更新和 6 秒一次的自动存档。

### 3.3 首次进入的玩家路径

首次无存档的玩家路径是：

1. 进入页面，看到 loading。
2. 资源加载结束，系统已创建一个 `is_egg=true` 的宠物定义。
3. Home 场景建立。
4. 约 100ms 后播放 UFO 把 egg 放下来的动画。
5. 动画结束后弹出设置宠物名字的对话。
6. egg 状态下，普通游戏操作被禁用；点击会提示等待孵化。
7. egg 自动摇动，达到孵化时间后切换到 cracked egg 画面。
8. 孵化完成：`is_egg=false`，删除 egg 对象，恢复 Home 场景和控制，baby sprite 出现在 canvas。

因此，首次进入不是立即开始自由操作，而是先经历 egg intro、命名和自动孵化。

## 4. Egg 流程细节

Egg 流程在 `Pet.handleEgg()` 中完成，是 Tamaweb 里很容易误读的部分。

### 4.1 为什么初始化看到的是 baby 定义

`App.init()` 创建 `PetDefinition` 时会随机选一个 `PET_BABY_CHARACTERS` 里的 sprite。这是未来孵化后的 baby 外观，不代表当前就显示 baby。

随后它调用 `setStats({ is_egg: true })`。只要 `is_egg` 为 true，`Pet.behavior()` 会先走 `handleEgg()`，不会走正常 pet 行为。

### 4.2 Egg 渲染方式

在 egg 状态：

- 宠物本体的坐标被放到屏幕外。
- 游戏控制被关闭。
- 创建一个独立的 egg `Object2d`，selector 类似 egg。
- egg 图像根据宠物幽灵/阵营状态选择普通 egg、angel egg 或 devil egg。
- egg 自己有 shake 动画和 spritesheet cell 切换。
- 孵化前 canvas 上应该看到 egg 对象，而不是 baby 宠物 sprite。

这解释了为什么“reset 看到 baby”是不完整判断：数据里确实预选了 baby sprite，但画面应该由 egg object 接管。如果用户 canvas 看不到 egg 像素，应优先检查 egg object 是否创建、资源是否加载、对象是否被 z-index/hidden/offscreen/scene 清理影响。

### 4.3 Egg 孵化触发

Egg start time 会记录到 stats 中。孵化耗时是随机 15-30 秒。期间 egg shake 逐渐变强；到达阈值后切换 cracked cell，并播放音效。

孵化结束时：

- `is_egg=false`
- 回到 Home 场景
- 恢复 gameplay controls
- 移除 egg object
- 宠物切换到不舒服/欢呼等过渡状态
- 播放闪光和粒子

### 4.4 新蛋和重开

`transferAndGetFreshEgg()` 用于获得新 egg。它会移除当前宠物，创建新的 `PetDefinition`，仍然随机 baby sprite 并设置 `is_egg=true`，继承部分 inventory/gold，记录 predecessor，然后创建新的 active pet，播放 UFO egg intro 并回 Home。

触发新蛋的路径包括：

- 死亡后选择 get new egg。
- move out/abandon 后回到新 egg。
- 某些婚姻/后代流程最终产生新 egg。

## 5. 主循环和时间推进

Tamaweb 有两套时间推进：

1. 前台 frame loop：`requestAnimationFrame` 驱动 draw 和注册的 draw events。
2. 后台/离线模拟：页面恢复或长时间卡顿后，把经过时间折算成 stats 推进。

### 5.1 Frame loop

每帧逻辑会：

- 计算 `App.time`、`accurateDeltaTime` 和 `playTime`。
- 把单帧 delta 限制到 0-100ms，避免一次性跳太多。
- 如果发现大于 5 秒的时间跳跃，调用 `simulateAwayProgression()`。
- 调用 Drawer 绘制。
- 执行 `App.onDraw` 和已注册 draw events。

### 5.2 Periodic update

启动后约 2 秒执行一次 `onPeriodicUpdate()`，之后每 30 秒执行一次。这里主要负责 automatic aging：如果当前时间超过下一次自动生日，并且 30 分钟节流允许，就把 birthday event 放进事件队列。

### 5.3 离线推进

离线推进在读到 `lastTime` 后执行。生产环境会把离线时间模拟进宠物状态，最多处理 7 天。离线时夜间倍率更低，父母家和 vacation 也会影响消耗。

如果离线超过 30 秒，会弹出 welcome back，告诉玩家宠物想念了多久。

## 6. 存档流程

### 6.1 读取

Tamaweb 先用 IndexedDB `idb-keyval` 读取，并带 localStorage fallback。主要恢复内容包括：

- pet stats 和基础数据
- settings
- last_time
- ingame events history
- room customization
- mods
- records
- user id/name
- play time
- shell background
- missions
- furniture
- plants
- animals

### 6.2 保存

保存会同时写 localStorage 和 IndexedDB。自动保存间隔是 6 秒，手动保存会显示保存提示。自动保存会做节流，避免过于频繁。

保存内容覆盖当前 pet、settings、last_time、用户信息、事件历史、play_time、shell、mod、记录、房间、missions、家具、植物和动物。

### 6.3 导入导出

Settings 里有 save management：

- Import：从文件读取 save code。
- Export：导出存档。
- Copy：复制 `save:` 开头、`:endsave` 结尾的 save code，用于跨设备迁移。

浏览器存储未持久化时，Settings 会显示红色风险提示并建议备份。

## 7. 场景系统

Tamaweb 把所有地点作为 `App.scene` 维护。`setScene()` 会卸载当前场景、设置背景、更新 pet 位置、执行场景加载钩子、应用天空和天气。

主要场景包括：

- Home、Kitchen、Bathroom
- Park、Market、Mall Walkway、Mall Interior
- Arcade、Arcade Game
- Hospital Exterior/Interior
- Parents Home
- Sea Vacation
- Graveyard、Reviver Den
- Battle、Stand、Office、Classroom、Music Classroom
- Garden、Inner Garden、Beach、Skate Park、Forest
- Online Hub
- Fortune Teller
- Homeworld Getaways
- Devil/Angel 相关场景
- Restaurant、Galaxy 等特殊地点

场景不是纯背景切换。很多活动会通过场景钩子、pet scripted state、Object2d 临时对象和 UI display 组合成完整流程。

## 8. 输入与主菜单

玩家点击主 canvas 会调用 `open_main_menu()`。但它会先检查控制状态：

- 如果 `preventNextGameplayControl` 为 true，本次点击被吞掉。
- 如果 gameplay controls 被禁用，优先执行当前活动覆写的控制回调。
- 如果启用 classic menu UI，也走覆写控制。
- 否则打开 8 宫格主菜单。

主菜单有 8 个入口：

| 入口     | 功能                                                                 |
| -------- | -------------------------------------------------------------------- |
| Stats    | 状态、Profile、家族树、收藏、成就、昵称/名字/性别、历代记录          |
| Feeding  | 食物、零食、药、烹饪                                                 |
| Bath     | 洗澡、上厕所、刷牙、清理房间                                         |
| Care     | 纪律、任务、睡觉、后院、花园、抚摸、父母托管、当前 want              |
| Activity | 外出地点选择                                                         |
| Stuff    | 物品、饰品、家具、合成/制作                                          |
| Phone    | Hubchi、SnapMeal、朋友、生日、社交、vacation、move out、friend codes |
| Settings | 存档、mod、玩法设置、系统设置、shell、主题、输入码、重置、反馈等     |

Shell 按钮也参与导航：有 display 时用于关闭/返回，没有 display 时打开主菜单或回 Home；活动锁控制时可能触发活动指定回调。

## 9. Stats / Information

Stats 入口在源码里标题是 Information，不只是属性面板。它包含：

- Stats：显示 hunger、sleep、fun、bladder、health、cleanliness、discipline、care、gold、skills 等当前状态。
- Profile：需要 username；显示宠物 avatar、life stage、generation、出生时间、play time、user id、experience traits 和 personality traits。
- Family tree：查看父母、伴侣、孩子、朋友等关系链。
- Collection：查看角色收集进度。
- Achievements：展示成就、领取奖励；未领取奖励会在 Stats 入口显示 badge。
- Set name/gender 或 set nickname：取决于 gendered pets 设置。
- Past generations：有 deceased predecessors 时可查看过去世代，并从那里进入家族树。

Profile 里有三类 experience trait 标识：potty-trained、revived、immortal。Personality trait 则来自成长过程中发展的 traits，会影响需求消耗、want 倾向或技能收益。

## 10. Stuff / Inventory / Customization

Stuff 入口包含 items、accessories、furniture、craft 四类。

Items：

- 从 inventory 里选择可使用物品。
- 常见结果是触发 `Activities.useItem()`，进入 scripted state，播放手持/玩具互动。
- 部分 item 会影响 want、missions、fun、skills 或特殊状态。

Accessories：

- 普通模式下只显示已拥有饰品。
- 可 toggle equipped/not equipped。
- 切换时会播放 get dressed 流程，再调用 equip accessories。
- 商店购买模式会显示价格、是否 owned、sales day 折扣和 unlock 条件。

Furniture：

- 如果当前 Home room 还不是可自定义房间，会先询问是否移除默认家具并 redecor room。
- 可放置最多 5 件家具。
- 已放置家具可编辑位置或移除。
- 未放置但已拥有的家具可添加到房间。
- Mall 中可购买 furniture，craft 中也可制作 furniture。

Craft：

- 使用 garden harvest 作为材料。
- 可制作 room background、furniture、accessory。
- 制作 room 会触发 redecor room 并替换 Home 背景。
- 制作 furniture 会加入 owned furniture，但不会自动摆放。
- 制作 accessory 会加入宠物 accessory inventory。
- Craft 同时给 expression 和 logic 少量收益。

## 11. 宠物生命周期

### 9.1 Life stage

Tamaweb 的 life stage 由 sprite/growth chart 决定，不是简单地用 `ageSeconds` 显示。阶段包括：

- egg：由 stats `is_egg=true` 表示，独立于 `LIFE_STAGE` 数字。
- baby
- child
- teen
- adult
- elder

手动生日阈值：

- baby 约 1 小时后可手动生日。
- child 约 9 小时后可手动生日。
- teen 约 12 小时后可手动生日。
- adult 约 72 小时后可手动生日。

自动生日阈值：

- baby 约 24 小时。
- child 约 36 小时。
- teen 约 48 小时。
- adult 约 336 小时，也就是约 14 天。

### 9.2 Age up

生日流程通过 `Activities.birthday()` 表现为 party、朋友/NPC、蛋糕和音乐。真正变化由 `PetDefinition.ageUp()` 完成。

Age up 会：

- 基于 growth chart 取可能 evolution。
- 根据 care rating 选择进化方向。
- 如果开启 skills affecting evolution，最高技能也可能影响方向。
- 更新 sprite 和 last birthday。
- 记录成就。
- 如果是玩家宠物，可能发展 trait。
- 如果有 NPC friends，朋友也可能同步成长。

### 9.3 Move out / 新一代

Phone 里有 move out。child 或更小阶段显示为 abandon，其他阶段显示 move out。确认后宠物回到 home planet，玩家得到 fresh egg。流程会记录 predecessor 和部分继承数据。

### 9.4 Death / revive / new egg

如果健康、清洁、乐趣、饥饿等关键状态长期为 0，death tick 会下降，归零后宠物死亡。

死亡后：

- 宠物本体隐藏。
- 控制关闭。
- 场景切到 graveyard。
- 显示 ghost object。
- 如果从未 revive，可选择付费一次性 revive 或 get new egg。
- 如果已经 revive 过，只能 get new egg。

Revive 流程在 reviver den 中播放仪式，恢复 health/death tick，并标记 `is_revived_once=true`。

## 12. 宠物状态机

`Pet.behavior()` 的最高优先级是：

1. dead：走死亡处理。
2. egg：走 egg 处理。
3. normal：执行思考、移动、状态管理、动画和像素呼吸。

常见状态和控制规则：

- Egg：宠物本体屏幕外，显示 egg object，控制禁用，等待自动孵化。
- Sleeping：Home 场景中睡觉，控制禁用，点击可醒；睡满且非睡眠时间会自动醒。
- Misbehaving：可能拒绝吃饭、睡觉或响应 scold/praise；scold 成功会清除 misbehaving。
- Eating：进入 Kitchen 场景，展示食物 UI，处理食物效果和 want/mission。
- Bath/poop/brush teeth：进入 Bathroom 场景，使用 activity 的 mini task 控制互动。
- At parents：父母家托管，指定时间段内需求由系统照顾。
- Vacation：vacation 期间需求不下降，直到玩家结束。
- Rabbit hole：定时外出，完成后给奖励或返回。
- Dead：graveyard/ghost，进入 revive 或 new egg 分支。

## 13. 需求和健康系统

PetDefinition 的默认 stats 包括：

- hunger
- sleep
- fun
- bladder
- health
- cleanliness
- death tick
- care
- discipline
- gold
- is sleeping / is egg / is dead
- poop、misbehaving、parents/vacation/rabbit hole
- wants
- skills：expression、logic、endurance
- school 计数和历史
- inventory、friends、predecessors 等

`statsManager()` 负责需求消耗：

- 离线时总体消耗降低。
- 夜间离线消耗更低。
- baby/child/teen 有不同倍率。
- parents/vacation 会显著降低或反转消耗。
- trait 会影响 hunger/sleep/fun/bladder/health/cleanliness。
- 睡觉会恢复 sleep。
- bladder 归零会产生 poop，potty trained 可能自动上厕所。
- 有 poop 或脏污会持续降低 health/cleanliness。
- 低 discipline 可能触发 misbehaving。
- 关键需求全为 0 时 death tick 开始下降。
- 关键需求保持良好时 care 可能回升。

## 14. Want 系统

Want 是宠物临时愿望。分类包括：

- food
- snack
- playdate
- item
- minigame

刷新规则会考虑当前 want、冷却、trait 和 moodlet。例如 hungry 更偏向 food，introvert/charismatic/treasurer 等 trait 会改变愿望倾向。

完成 want 会：

- 清除当前 want。
- 增加 fun/discipline/care 等收益。
- 记录任务进度，例如 fulfill_want。

没完成或处理不当可能降低 care。

## 15. Discipline 与直接互动

Care 菜单提供 praise 和 scold：

- Praise：非 misbehaving 时有冷却，可能增加 discipline；错误 praise 可能反向影响纪律。
- Scold：misbehaving 时有成功率，成功增加 discipline 并清除 misbehaving；错误 scold 会降低 fun/discipline/care。

直接点击/拖动宠物也可触发抚摸。`createActivePet()` 注册了 draw-event 检测：Home 场景、无 display、控制可用、鼠标按在宠物范围内时，进入 direct interaction。结束时交给 `handleDirectInteractionEnd()` 处理反馈。

## 16. Feeding / Cooking

Feeding 菜单分为：

- food
- snacks
- meds
- cook

Cook 对 baby 及以下禁用。Cooking 有两种入口：

- camera：拍 3 张照片作为汤的素材，然后搅拌。
- harvests：消耗花园 harvest 作为食材，制作指定食物。

喂食流程会进入 Kitchen 场景。宠物如果已经吃饱、正在 misbehaving、短时间重复吃同样东西，可能拒绝。药、milk、特定 hunger 状态有例外。

食物会改变 hunger、fun、health、sleep、技能或特殊状态，并可能完成 food/snack/med/order_food/cook 等任务。

## 17. Bath / Clean 流程

Bath 菜单包括：

- Bathe：进入 Bathroom，可能因为 misbehaving 拒绝；通过泡沫/点击互动增加 cleanliness 和 discipline。
- Use toilet：bladder 未到阈值时可能拒绝；成功会清空 bladder 和 poop；baby/child 多次使用可 potty train。
- Brush teeth：打开嘴部状态，执行刷牙交互。
- Clean room：清理房间里的 poop/脏污对象。

相关流程会影响 cleanliness、health、discipline、missions 和 achievements。

## 18. Care 菜单

Care 菜单是“照料”总入口：

- Discipline：praise/scold。
- Missions：每日任务和奖励。
- Sleep：让宠物睡觉。
- Backyard：外层花园/动物区域。
- Garden：内层种植区域。
- Pet：进入抚摸活动。
- Stay with parents：有父母时可用，只能在 3:00-18:00 留在父母家。
- Current want：展示并引导当前愿望。

Sleep 有条件限制：Home 场景、非睡眠中、不能 misbehaving；如果已经 rested 且不是睡眠时间，会拒绝入睡。

## 19. Activity / 外出

Activity 菜单进入横向地点选择器。玩家左右切换建筑，选择进入。外出期间通常会禁用普通控制，由活动脚本接管。

主外出地点：

- Home
- Mall
- Market
- Game Center
- Homeworld Getaways：child 及以下禁用。
- Fortune Teller
- Park
- School：child/teen 可用。
- Hospital
- Restaurant：baby 及以下禁用。
- Work：adult 及以上。
- Underworld Entrance

Underworld 还有自己的二级活动列表：Overworld Entrance、Gathering、Clothing Store 等。

几个容易漏的外出分支：

- Fortune Teller：切到 fortune teller 场景，展示当前宠物未来可能 evolution；如果带另一个宠物进入，则展示双方 offspring 可能形态。
- Work：adult 及以上可进入 stand work。宠物在摊位接待随机顾客，顾客反应受宠物负面 moodlet 影响，结束后按时长和顾客反应结算收入。
- Homeworld Getaways / Rabbit hole：玩家选择活动和是否带朋友，宠物离开一段真实时间；回访时会恢复这个离开状态，时间到后返回并给奖励。
- Underworld：从外出入口进入特殊地点，使用 underworld treat currency 兑换 tickets、aging/skill/behavior 相关 potions，并可进入 Gathering 或特殊服装店。

## 20. School

School 对 child/teen 开放。每天最多上 10 节课，早上 7 点附近会重置计数。

课程/小游戏包括：

- Expression：Tune Practice、Flip Cards。
- Logic：Track、Flip Cards。
- Endurance：Skipping Rope、Flip Cards。

成功会增加对应 skill point、discipline，并推进 `earn_school_points` 任务。Trait 可能放大技能收益。

## 21. Game Center / 小游戏

Arcade/Game Center 入口提供多种小游戏，按年龄和上下文限制：

- Flags
- Pet Grooming / dog washing
- Crop Match / plant matching
- Rod Rush / bar timing
- Catch / falling stuff
- Mimic / opponent mimic
- Leaves
- Trick or Treat 等季节活动

小游戏结束后通常通过 helper 结算 money、skill、mission 或成就。

## 22. Market / Mall / Shop

Market 和 Mall 是购买型地点：

- Market 更偏食物、种子、动物、部分材料。
- Mall 更偏饰品、家具、物品、服装或特殊商店。
- Purchased items 会通过收货动画进入 inventory。

商店统一使用 inventory、price、pay、owned amount 和 display list/slider 组合实现。

## 23. Garden / Backyard / Animals / Plants

### 21.1 Backyard

Backyard 是外层花园，能看到动物、挖宝点、宠物碗等对象。动物会在这里活动，玩家可以喂动物或和动物玩。

### 21.2 Inner Garden

Inner Garden 是种植区。典型流程：

- 选择空地。
- 种 seed。
- 给植物浇水。
- 等待成长。
- 成熟后 harvest。
- 死亡或不需要时移除。

植物状态包括 seedling、tiny、grown、dead。默认成长约 9 小时，浇水持续约 2 小时，枯死窗口约 20 小时。雨雪会自动浇水。动物 buff 和 botanist trait 会影响浇水、死亡和成长时长。

### 21.3 Animals

AnimalDefinition 继承 PetDefinition，但有自己的 happiness 和 gameplay buff。动物 happiness 大约 48 小时降到 0。动物能在 home/garden/inner garden 出现，自动与宠物或其他动物互动，并影响植物系统。

## 24. Phone

Phone 是高级功能入口：

- Hubchi：在线 hub。baby 及以下禁用，需要联网、username 和足够 sleep。
- SnapMeal：在线点餐。baby 及以下禁用，价格有 markup，订购后通过收货活动加入 inventory。
- Friends：查看朋友，添加朋友，搜索 Hubchi 用户。
- Have birthday：手动生日。如果没到阈值，会提示还要等多久；elder 不显示。
- Social media：child 及以下禁用，可发帖、探索帖子、朋友互动。
- Go on vacation：baby 及以下禁用，花费 250，期间需求不下降。
- Move out / abandon：送宠物回 home planet，获得新 egg。
- Friend codes：导出/输入 friend code，用本地 save 里的 pet 定义添加朋友。

Hubchi 的在线能力不是实时多人。它通过 Google Apps Script 接口上传自己的宠物定义、获取自己的在线定义、拉取随机宠物定义、记录互动次数。

## 25. Missions

Missions 是每日任务系统。它每天刷新，生成 8 个不重复任务。每个任务有目标次数和点数，完成后在 Missions 菜单领取点数。

任务类型包括：

- food
- pat
- gift
- cook
- win_game
- online_interact
- buy_food
- playdate
- check_social_post
- find_park_friend
- use_bath
- use_toilet
- clean_room
- visit_doctor
- fulfill_want
- play_item
- visit_online_hub
- visit_mall
- visit_market
- plant_in_garden
- water_crop
- play_with_animal
- feed_animal
- order_food
- earn_school_points
- go_to_restaurant
- go_to_rabbithole

奖励商店消耗 mission points，奖励包括 Standard Chest、Uncommon Chest、Exclusive Potions。奖励池里有食物、物品、饰品、药水和 gold，部分节日会改变数量。

## 26. Random encounters / 游戏内事件

Tamaweb 不是只有玩家点菜单触发事件。系统会根据条件排队：

- 首次进入后的 onboarding/tap reminder。
- username 设置提示。
- 更新公告、评分提示、Discord 邀请等运营提示。
- child/teen 的 school invite。
- 每日 newspaper。
- revived 后的 reckoning/encounter。
- 随机实体遭遇。
- 夜间睡觉被抢劫。

`queueEvent()` 会等到满足条件才执行：宠物不在 scripted state、没有 display、不是 egg、没死、不在父母家、当前 Home 场景。这样避免事件打断关键流程。

## 27. Restaurant / Park / Social / Date

Restaurant 会让宠物和另一个宠物一起吃东西，触发对话和食物对象。

Park 用于遇见朋友、playdate、互动、找朋友任务。Playdate 会切换场景，生成另一个 pet，并用 scripted state 表演一起玩。

Social media 允许宠物发帖、查看帖子、和朋友产生轻量互动。Date 流程可能走到 proposal/wedding，婚礼后会更新家族/后代关系，并可能导向新 egg。

Friends 列表本身也有分支：

- Info：查看朋友 life stage、friendship 和 ghost/angel/devil 状态。
- Go on date：双方 adult 且不是家族关系；friendship 低时会拒绝，romantic trait 可降低限制。
- Ghost conversion：如果朋友是 angel/devil ghost，且 friendship 足够高，玩家宠物可以请求被转换。
- Angel interactions：玩家是 angel ghost 时，可对非同类朋友 Bless、Grant Wish 或 Gift Divinity。
- Devil interactions：玩家是 devil ghost 时，可对非同类朋友 Scare、Whisper 或 Place curse。

这些互动不是普通菜单改数值，而是切换场景、生成 TimelineDirector/Pet/Object2d，并在动画结束后恢复 Home 和控制。

## 28. Hospital / Doctor

Hospital/clinic 用于看医生。流程会进入 hospital 场景，医生 NPC 检查宠物，根据状态处理 health/sickness，完成 visit_doctor 任务。

Phone 里也存在 doctor visit 入口，但源码里被 `_ignore: true` 隐藏。

## 29. Vacation / Parents / Rabbit Hole

Parents daycare：

- 需要宠物有 parents。
- 只能在 3:00-18:00 送去。
- 在父母家期间普通控制被替换为 pickup/end flow。
- stats 消耗被特殊处理。

Vacation：

- Phone 中触发。
- 价格 250。
- baby 及以下不能去。
- vacation 期间需求不会下降。
- 玩家手动结束后返回。

Rabbit hole：

- Homeworld Getaways 入口。
- child 及以下禁用。
- 设置当前 rabbit hole 和结束时间。
- 启动时或回访时如果仍在 rabbit hole，会恢复对应状态。
- 时间到后返回并发奖励。

## 30. Settings

Settings 覆盖了系统级能力：

- 存档风险提示和紧急备份。
- 手动保存。
- PWA 安装。
- Save management：Import/Export/Copy。
- Mods：导入、查看、卸载，itch 环境禁用。
- Gameplay settings：睡眠时间、automatic aging、season、显示 want 名、gendered pets、skills affecting evolution 等。
- System settings：音效、背景音乐、震动、classic menu、背景色、图案、view size。
- Theme。
- Shell settings：显示 shell/buttons/logo、shell size、shape、background、自定义 shell。
- Input code。
- Reset pet data。
- Factory reset。
- Credits、feedback、rate、changelog、Discord、版本信息。

Notifications 相关代码存在，但设置项被隐藏，实际不是面向普通玩家的功能。

## 31. PWA / 安装 / 更新

Main.js 注册 service worker。页面会监听 install/update，并用 BroadcastChannel 接收 service worker 状态。浏览器触发 `beforeinstallprompt` 时保存 install prompt，Settings 中可出现 install app。

在 itch 环境下，部分 PWA、mod、剪贴板行为会降级或隐藏。

## 32. 对 Tamakey 的借鉴点

可借鉴的通用模式：

- 启动阶段先建模再解锁操作，避免用户在资源和状态不完整时点击。
- Egg 应作为独立 stage/render object，不要只用 baby sprite 伪装。
- 前台 frame loop 与离线推进分离。
- 事件队列要判断 pet/scene/display/control 状态，避免打断关键动画。
- 存档要覆盖宠物、世界、任务、植物、动物、设置、外出状态，而不是只存宠物 stats。
- 新手流程应明确：loading -> egg intro -> naming -> locked egg -> hatch -> baby interaction。
- 活动应是“场景 + scripted state + 临时对象 + UI”的组合，而不是单个按钮改数值。

不应直接继承的部分：

- 不能复制 Tamaweb 的素材、sprite、声音、字体、UI 图标组合、数值表和成长表。
- 不应复用它的存档 key、任务枚举、资源路径和接口 endpoint。
- 不应让 egg 只停留在数据状态，必须在 canvas 明确显示 egg 像素。

## 33. 自审记录

### Review 1：入口链路完整性

已按 `index.html -> Main.js -> App.init -> PetDefinition -> createActivePet -> Pet.behavior` 对照。文档覆盖了 loading、service worker、错误处理、资源预加载、存档读取、Home 场景、UFO egg intro、命名、孵化、周期更新和自动存档。

补充项：明确了首次无存档和有存档两条启动路径，避免误写成统一“进入即开始”。

### Review 2：Egg/Baby 易错点

已按 `App.init()` 和 `Pet.handleEgg()` 对照。文档明确说明：随机 baby sprite 是孵化后的形态；egg 状态会隐藏宠物本体，并单独渲染 egg object。这样能解释“reset 数据像 baby，但画面应该看到 egg”的差异。

补充项：加入了 canvas 看不到 egg 时的排查方向，包括资源加载、Object2d 创建、hidden/offscreen、z-index 和场景清理。

### Review 3：玩家主路径覆盖

已按 8 个主菜单入口逐项覆盖：Stats、Feeding、Bath、Care、Activity、Stuff、Phone、Settings。每个入口至少列出主要子功能和年龄/状态限制。

补充项：Phone 中的 Hubchi、SnapMeal、Have birthday、Vacation、Move out、Friend codes 已单独展开；Activity 中的 School、Arcade、Garden、Hospital、Restaurant、Parents、Rabbit hole、Fortune Teller、Work、Underworld 已单独展开；Stats 和 Stuff 也补齐了 Profile、Achievements、Accessories、Furniture、Craft 等二级流程。

### Review 4：后台系统覆盖

已覆盖 frame loop、periodic update、offline progression、save/load、missions、random encounters、wants、traits/skills 影响、plants/animals、PWA 和 API service。

补充项：明确 `queueEvent()` 的执行前置条件，避免遗漏系统事件为什么不会在 egg/dead/display 中打断玩家。

### Review 5：风险与适配

已加入许可和不可复制项。本文只保留流程和产品设计层面的观察，不建议直接搬运源代码、素材、数值、endpoint、任务枚举或资源路径。

## 34. 面向当前 Egg 问题的检查清单

如果 Tamakey 当前 reset 后只看到 baby、canvas 没有 egg 像素，应按这个顺序检查：

1. Domain state：reset 后 pet stage/status 是否真的是 egg，而不是直接 baby。
2. Render selection：egg stage 是否走 egg render 分支，而不是复用 baby idle animation。
3. Asset：egg 图片/texture 是否存在并加载成功。
4. Visibility：egg sprite 是否 hidden、alpha=0、坐标在视口外、scale 太小或 zIndex 被覆盖。
5. Scene lifecycle：Home scene 初始化或 reset 后是否把 egg display object 清掉。
6. Control lock：egg 阶段是否禁用 feed/play/bath 等普通操作，只允许等待 hatch。
7. Hatch timer：是否有明确的 egg start time 和 hatch due time。
8. Transition：hatch 时是否先移除 egg，再显示 baby，避免 egg/baby 同时或都不显示。
