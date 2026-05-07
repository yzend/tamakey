# 技术方案-01-login与宠物命名onboard流程

> 功能定位: 在首次进入游戏时提供本地假登录和宠物命名，引导用户创建第一份本地存档
> 模块归属: L3 应用编排层 - 启动流程 / 本地身份 / 存档初始化
> 关联模块: GameBootstrap, GameScreen, HybridSaveRepository, createInitialGame, PWA/TestKit
> 创建日期: 2026-05-08
> 状态: 开发中

## 1. 方案要点

| 项           | 结论                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------- |
| 改造还是新建 | 新建 login/onboard 页面，改造 GameBootstrap 初始化分支                                   |
| 登录方式     | V1 使用本地假登录，不接后端，不创建真实账号                                              |
| 数据存储     | 照护者 session 写 localStorage；宠物名和照护者名写入现有 IndexedDB/localStorage 游戏存档 |
| UI 形态      | 独立页面，进入游戏前拦截展示                                                             |
| onboard 触发 | 已本地登录 + 无现有游戏存档 + 非 testkit 模式                                            |
| V1 不做的    | 后端账号、邮箱/手机号、OAuth、云同步、验证码、找回账号、多账号切换                       |
| 防滥用策略   | V1 不做服务端防滥用；前端限制名称长度和空值                                              |
| TestKit 兼容 | `?testkit=1` 自动创建测试 session 并跳过 onboard，避免已有 E2E 被阻断                    |

## 2. 核心机制

### 2.1 本地假登录机制

```txt
用户打开 /
  |
  +-- localStorage 无 tamakey.localSession.v1
  |     |
  |     +-> 展示 LoginPage
  |         |
  |         +-- 名称校验失败 -> 留在 LoginPage + 显示错误
  |         |
  |         +-- 名称校验通过 -> 写入 localStorage session -> 进入启动流程
  |
  +-- localStorage 有有效 session
        |
        +-> 进入 GameBootstrap
```

### 2.2 首次宠物命名机制

```txt
GameBootstrap 启动
  |
  +-> HybridSaveRepository.load()
      |
      +-- status = ok/corrupt
      |     |
      |     +-> restoreGame() -> 初始化 Worker -> 展示 GameScreen
      |
      +-- status = empty
            |
            +-- testkit 模式
            |     |
            |     +-> createInitialGame(now) -> 展示 GameScreen
            |
            +-- 正常用户
                  |
                  +-> 展示 OnboardingPage
                      |
                      +-- 宠物名校验失败 -> 留在 OnboardingPage + 显示错误
                      |
                      +-- 校验通过 -> createInitialGame(now, names)
                          |
                          +-> 初始化 Worker
                          |
                          +-> SaveCoordinator 首次保存
                          |
                          +-> 展示 GameScreen
```

## 3. 数据模型

### 3.1 表结构（SQL）

V1 无 SQL 表。当前项目是本地优先游戏，继续使用浏览器存储：

| 存储         | Key / DB                  | 用途                       |
| ------------ | ------------------------- | -------------------------- |
| localStorage | `tamakey.localSession.v1` | 假登录 session             |
| IndexedDB    | `tamakey-save-db`         | 主游戏存档                 |
| localStorage | 既有 save key             | IndexedDB 失败或旧存档兜底 |

### 3.2 数据示例

未登录:

```json
{
  "tamakey.localSession.v1": null,
  "save": null
}
```

已登录但未命名宠物:

```json
{
  "tamakey.localSession.v1": {
    "caretakerName": "阿钥",
    "createdAt": 1778198400000
  },
  "save": null
}
```

已完成 onboard:

```json
{
  "session": {
    "caretakerName": "阿钥",
    "createdAt": 1778198400000
  },
  "save": {
    "schemaVersion": 3,
    "profile": {
      "username": "阿钥",
      "generation": 1,
      "achievements": [],
      "friendCode": "TK-XXXX"
    },
    "game": {
      "pet": {
        "name": "泡泡",
        "stage": "egg",
        "species": "starter"
      }
    }
  }
}
```

### 3.3 查询场景

| 业务场景                   | 读取内容                    | 条件                                          |
| -------------------------- | --------------------------- | --------------------------------------------- |
| App 首屏判断               | localStorage session        | `caretakerName` 为字符串且 `createdAt` 为数字 |
| GameBootstrap 判断 onboard | HybridSaveRepository.load() | `status === "empty"` 且不是 testkit           |
| 恢复老用户                 | IndexedDB/localStorage save | `status === "ok"` 直接恢复，不要求重新命名    |
| 损坏存档恢复               | load 结果 corrupt           | 走 createInitialGame，保留损坏存档备份        |

### 3.4 性能考虑

| 项       | 说明                                                                  |
| -------- | --------------------------------------------------------------------- |
| 数据量   | session 小于 1KB；存档仍沿用现有 GameState 快照                       |
| 索引     | V1 无服务端查询，无需数据库索引                                       |
| 缓存     | localStorage 直接同步读取，避免登录页闪烁                             |
| 保存频率 | 首次命名后由 SaveCoordinator 保存，后续沿用 tick/interaction 节流策略 |

## 4. 路由逻辑

V1 无 HTTP API。所有逻辑在单页应用 `/` 内完成。

```txt
GET /
  |
  +-- DEV + ?testkit=1
  |     -> 200 index.html
  |     -> 前端自动创建测试 session + 跳过 onboard
  |
  +-- 无本地 session
  |     -> 200 index.html
  |     -> 前端展示 LoginPage
  |
  +-- 有本地 session + 无存档
  |     -> 200 index.html
  |     -> 前端展示 OnboardingPage
  |
  +-- 有本地 session + 有存档
        -> 200 index.html
        -> 前端展示 GameScreen
```

## 5. 用户操作视角

### 5.1 触发入口

| 入口       | 位置          | 触发条件       | 行为                         |
| ---------- | ------------- | -------------- | ---------------------------- |
| 登录页     | `/` 首屏      | 无本地 session | 输入照护者名字后进入启动流程 |
| 宠物命名页 | `/` 首屏      | 已登录但无存档 | 输入宠物名并创建第一份存档   |
| 游戏页     | `/` 首屏      | 已登录且有存档 | 直接恢复游戏                 |
| TestKit    | `/?testkit=1` | 开发测试环境   | 自动跳过登录和 onboard       |

### 5.2 主操作流程

```txt
打开 /
  |
  +-- 无 session
        |
        v
  +--------------------------------------+
  | 照护者登录                            |
  |                                      |
  | 创建一个本地身份...                   |
  |                                      |
  | 照护者名字                           |
  | [________________]                   |
  |                                      |
  |                         [进入]       |
  +--------------------------------------+
        |
        +-- 名称少于 2 个字符
        |     -> 输入框下方显示红色错误
        |     -> 停留当前页
        |
        +-- 校验通过
              |
              v
  +--------------------------------------+
  | 给宠物命名                            |
  |                                      |
  | 欢迎，{照护者名}                      |
  |                                      |
  | 宠物名字                             |
  | [________________]                   |
  |                                      |
  |                      [开始照护]      |
  +--------------------------------------+
              |
              +-- 名称少于 2 个字符
              |     -> 输入框下方显示红色错误
              |     -> 停留当前页
              |
              +-- 校验通过
                    -> 按钮提交
                    -> 创建初始 GameState
                    -> 进入游戏主界面
                    -> 状态栏展示宠物名
```

### 5.3 不同状态的界面

```txt
页面加载
  |
  +-- 未登录
  |     +------------------------------+
  |     | 照护者登录                    |
  |     | [照护者名字]                  |
  |     | [进入]                        |
  |     +------------------------------+
  |
  +-- 已登录 + 无存档
  |     +------------------------------+
  |     | 给宠物命名                    |
  |     | 欢迎，{照护者名}              |
  |     | [宠物名字]                    |
  |     | [开始照护]                    |
  |     +------------------------------+
  |
  +-- Loading / Worker 未 ready
  |     +------------------------------+
  |     | 游戏主界面                    |
  |     | 宠物画面可见                  |
  |     | 操作按钮 disabled             |
  |     | 提示: 运行时加载中            |
  |     +------------------------------+
  |
  +-- 加载失败 / Worker 错误
  |     +------------------------------+
  |     | 状态栏显示错误摘要            |
  |     | 系统面板保留重来/导入入口     |
  |     +------------------------------+
  |
  +-- 空状态
  |     +------------------------------+
  |     | 给宠物命名                    |
  |     | 无存档时不展示空列表          |
  |     +------------------------------+
  |
  +-- 有数据
        +------------------------------+
        | 游戏主界面                    |
        | 状态栏: {宠物名} 蛋/幼体...  |
        | 状态菜单: {照护者名}          |
        +------------------------------+
```

### 5.4 管理/详情界面

V1 不新增账号管理页。已有系统面板继续承担重来、导入、导出、设置等二级操作。

### 5.5 完整流转图

```txt
+---------+      +--------------+      +--------------+
| 打开 /  | ---> | LoginPage    | ---> | OnboardPage  |
+----+----+      +--------------+      +------+-------+
     |                                        |
     |                                        v
     |                                  +------------+
     +--------------------------------> | GameScreen |
                                        +------------+

?testkit=1 ---------------------------> GameScreen
已有 session + 已有存档 --------------> GameScreen
```

## 6. 技术实现视角

### 6.1 本地登录流程

```txt
触发: 用户点击「进入」
  |
  v
前端 LoginPage submit
  |
  +-- ① 参数校验
  |     |
  |     +-- 名称 trim 后少于 2 个字符
  |     |     -> 无 HTTP 状态码
  |     |     -> UI 显示 { error: "请输入至少 2 个字符。" }
  |     |
  |     +-- 校验通过
  |           |
  |           v
  +-- ② sanitizeDisplayName()
  |     -> 合并空白，截断到 16 字符
  |
  +-- ③ localStorage 写入
  |     -> key: tamakey.localSession.v1
  |     -> fields: caretakerName, createdAt
  |
  +-- ④ App state 更新
        -> 渲染 GameBootstrap
```

### 6.2 宠物命名与初始存档流程

```txt
触发: 用户点击「开始照护」
  |
  v
前端 OnboardingPage submit
  |
  +-- ① 参数校验
  |     |
  |     +-- 宠物名少于 2 个字符
  |     |     -> 无 HTTP 状态码
  |     |     -> UI 显示 { error: "宠物名字至少需要 2 个字符。" }
  |     |
  |     +-- 校验通过
  |           |
  |           v
  +-- ② createInitialGame(now, { caretakerName, petName })
  |     -> pet.name = 宠物名
  |     -> profile.username = 照护者名
  |
  +-- ③ GameBootstrap 初始化运行时
  |     -> useGameStore.setSnapshot(state)
  |     -> createGameWorkerClient()
  |     -> worker.post INIT
  |
  +-- ④ Worker READY
  |     -> 返回 GameState
  |     -> SaveCoordinator.saveThrottled(state)
  |
  +-- ⑤ 持久化
        -> IndexedDB: 保存 SaveData
        -> localStorage: 仅作为 HybridSaveRepository fallback
```

### 6.3 API 端点汇总

| 端点 | 方法 | 功能            | 鉴权       | 现状     |
| ---- | ---- | --------------- | ---------- | -------- |
| 无   | 无   | V1 不接后端 API | 本地假登录 | ❌不新增 |

### 6.4 文件变更清单

| 文件路径                                    | 操作 | 说明                                    |
| ------------------------------------------- | ---- | --------------------------------------- |
| `src/app/AuthFlow.tsx`                      | 新增 | LoginPage + OnboardingPage              |
| `src/app/auth-flow.css`                     | 新增 | 登录/onboard 独立页面样式               |
| `src/app/session.ts`                        | 新增 | 本地 session 读写和名称清洗             |
| `src/App.tsx`                               | 改造 | 增加 session 判断和 testkit 跳过        |
| `src/app/GameBootstrap.tsx`                 | 改造 | 增加空存档 onboard 分支和自定义初始状态 |
| `src/game/application/createInitialGame.ts` | 改造 | 支持传入 caretakerName/petName          |
| `src/game/rendering/viewModels.ts`          | 改造 | PetScreenSnapshot 暴露 petName          |
| `src/app/GameScreen.tsx`                    | 改造 | 将 state.pet.name 映射到 UI snapshot    |
| `src/app/components/StatusIsland.tsx`       | 改造 | 状态栏展示宠物名                        |
| `tests/e2e/onboarding.spec.ts`              | 新增 | 覆盖假登录 + 宠物命名流程               |

### 6.5 与现有系统的差距

| 项       | 现状                               | 需改为                                 |
| -------- | ---------------------------------- | -------------------------------------- |
| 登录     | 无登录页，打开即进入 GameBootstrap | 先进入本地假登录                       |
| 首次命名 | createInitialGame 固定 `Tamakey`   | 首次空存档时收集宠物名                 |
| 照护者名 | 默认 `本地照护者`                  | 登录页输入并写入 profile.username      |
| E2E      | 默认打开 testkit 后直接游戏        | testkit 保持自动跳过，新增普通入口测试 |

## 7. 状态机

```txt
anonymous
  -> local_logged_in
  -> onboarding_required
  -> onboarding_completed
  -> game_running

game_running
  -> restore_failed
  -> game_running
```

### 状态值说明

| 状态                   | 含义                   | 触发条件                        |
| ---------------------- | ---------------------- | ------------------------------- |
| `anonymous`            | 没有本地 session       | 首次打开或清空 localStorage     |
| `local_logged_in`      | 已完成假登录           | LoginPage 提交成功              |
| `onboarding_required`  | 已登录但无存档         | HybridSaveRepository 返回 empty |
| `onboarding_completed` | 已创建初始 GameState   | 宠物命名提交成功                |
| `game_running`         | 游戏运行中             | Worker READY 或 SYNC            |
| `restore_failed`       | 存档损坏或 Worker 错误 | restoreGame 失败或 Worker ERROR |

### 异常场景

| 异常              | 触发条件              | 处理方式                      | 恢复方式                     |
| ----------------- | --------------------- | ----------------------------- | ---------------------------- |
| 登录名为空        | trim 后少于 2 字符    | 显示红色错误                  | 用户修改后重新提交           |
| 宠物名为空        | trim 后少于 2 字符    | 显示红色错误                  | 用户修改后重新提交           |
| session JSON 损坏 | localStorage 解析失败 | 当作未登录                    | 用户重新登录                 |
| 存档损坏          | validate/migrate 失败 | 创建新宠物并显示启动提示      | 用户继续新存档或通过导入恢复 |
| IndexedDB 不可用  | 浏览器限制或写入失败  | HybridSaveRepository fallback | 自动使用 localStorage        |

删除策略: V1 不新增删除账号；已有“重来”仍是清空并重建游戏存档。

## 8. 优先级

| 优先级        | 功能               | 说明                             |
| ------------- | ------------------ | -------------------------------- |
| **P0 - V1**   | 本地假登录         | 没有入口就无法建立照护者身份     |
| **P0 - V1**   | 宠物命名 onboard   | 首次空存档必须让用户命名宠物     |
| **P0 - V1**   | 写入初始 GameState | 宠物名和照护者名必须进入存档     |
| **P1 - V1**   | TestKit 跳过       | 保持开发测试效率和现有用例稳定   |
| **P1 - V1**   | E2E 覆盖           | 防止入口流程回归                 |
| **P2 - V1.1** | 修改照护者/宠物名  | 在设置或状态页提供编辑入口       |
| **P3 - V1.2** | 真实账号/云同步    | 接后端认证、同步、限流和隐私策略 |

## 9. 自检

- [x] 方案要点表没有"待定"项
- [x] 模块归属和关联模块已标注
- [x] 触发入口没有遗漏
- [x] 用户操作流程用 ASCII 流程图画出（含所有分支）
- [x] 不同用户状态的 UI 都画了（含空状态、Loading、错误）
- [x] 技术实现流程用 ASCII 流程图画出（前端->API->后端->数据库->异步）
- [x] 每个 API 分支都标注了 HTTP 状态码和返回体格式
- [x] 后端步骤有编号（①②③）
- [x] 数据库操作列出了具体表名和字段变更
- [x] 数据模型有示例数据（按状态分组）
- [x] 索引覆盖了主查询场景
- [x] 状态机覆盖了异常情况，异常有恢复方式
- [x] 优先级按版本排列
- [x] 文件变更清单区分了新增/改造
- [x] 差距表（改造类）已列出
