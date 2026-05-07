# 07-test-plan.md

## 1. 测试目标

测试目标是证明目标项目按 clean-room 规格复刻核心行为，并避免两个高风险问题：

- reset/首次进入显示 baby 而不是 egg。
- 状态推进、存档、活动结束后出现不可恢复状态。

## 2. 单元测试计划

| 模块             | 测试项                                                                              |
| ---------------- | ----------------------------------------------------------------------------------- |
| `eggLifecycle`   | egg 创建、计时、孵化、幂等、刷新恢复                                                |
| `needs`          | hunger/sleep/fun/bladder/health/cleanliness 消耗，sleep 恢复，vacation/parents 倍率 |
| `growth`         | 未到生日拒绝、到点成长、elder 边界、技能开关                                        |
| `death`          | deathSafety 下降、死亡事件、revive once、新 egg                                     |
| `wants`          | want 刷新、完成、过期、trait 权重                                                   |
| `missions`       | 任务进度、领取、每日刷新、重复领取防护                                              |
| `plantRules`     | 种植、浇水、成熟、枯死、harvest                                                     |
| `eventQueue`     | egg/dead/modal/activity gating                                                      |
| `saveRepository` | save/load roundtrip、schema migration、非法导入                                     |
| `selectors`      | menu availability、render model、derived moodlets                                   |

## 3. 集成测试计划

| 场景         | 步骤                                 | 预期                                     |
| ------------ | ------------------------------------ | ---------------------------------------- |
| 首次进入     | 清空存档 -> 打开                     | loading -> egg intro -> egg visible      |
| 孵化         | 快速 hatch clock -> tick             | egg 移除，baby visible，controls enabled |
| 喂食         | baby -> feeding -> food              | hunger 改变，inventory/mission 更新      |
| 睡眠         | Care -> sleep -> tick                | status sleeping，sleep 恢复，点击可醒    |
| 清洁         | 生成 poop -> clean/toilet/bath       | poop/cleanliness 正确变化                |
| 离线恢复     | 保存 -> mock now +1h -> restore      | needs 按规则推进，弹 welcome 可选        |
| 生日         | 到达 birthday time -> phone birthday | stage/form 更新，不重复触发              |
| death/revive | 需求归零 -> death -> revive          | grave/dead state，revive once            |
| 活动锁       | 进入 activity -> 点击 canvas         | 不打开主菜单，活动结束回 Home            |
| 存档导入     | 导出 -> 清空 -> 导入                 | 状态恢复，schema 校验                    |

## 4. E2E 测试计划

工具建议：Playwright。

核心 E2E：

1. `new-user-egg.spec.ts`
   - 清空 IndexedDB。
   - 打开应用。
   - 等待 canvas。
   - 通过 pixel/snapshot 确认 egg 区域非空。
   - 确认 baby sprite 不可见。

2. `hatch-flow.spec.ts`
   - 启用 fast hatch。
   - 等待 hatch。
   - 确认 baby 出现、菜单可打开。

3. `care-loop.spec.ts`
   - 喂食、睡觉、洗澡、厕所。
   - 确认 stats 变化。

4. `save-restore.spec.ts`
   - 改名、喂食、保存。
   - reload。
   - 状态保持。

5. `activity-lock.spec.ts`
   - 进入 school/shop/garden。
   - activity 中点击 canvas。
   - 主菜单不弹出。

## 5. 视觉测试计划

必须验证：

- egg 可见。
- baby 可见。
- sleeping overlay 可见。
- poop 可见。
- dead/ghost/fallback dead state 可见。
- 家具/饰品保存恢复后可见。

测试方法：

- Playwright screenshot。
- canvas pixel sampling。
- render model snapshot。

## 6. 边界条件测试

| 边界             | 预期                             |
| ---------------- | -------------------------------- |
| 系统时间倒退     | 忽略负 elapsed，不破坏存档       |
| 离线超过上限     | clamp 到最大模拟窗口             |
| IndexedDB 不可用 | fallback，显示风险               |
| 资源加载失败     | fallback asset，不白屏           |
| 活动异常         | finally 回 Home、unlock controls |
| 重复点击生日     | 只 age 一次                      |
| 重复 hatch tick  | 只产生一次 hatch event           |
| 导入旧 schema    | migration 后可用                 |
| 导入非法 schema  | 拒绝并保留当前存档               |

## 7. 回归清单

每次改 domain/render/persistence 后跑：

- Egg 首次进入。
- Hatch。
- Save/load。
- Needs tick。
- Offline progression。
- Menu gating。
- Activity lock。
- Death/new egg。
