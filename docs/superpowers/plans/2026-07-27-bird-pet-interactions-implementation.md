# 小鸟宠物互动与丰富表情实施计划

## 目标

在不重写现有软体物理、玩具和动作系统的前提下，让网页中的小鸟可被摸头、挠胸、碰鸟喙、触碰翅膀、连续逗弄和托起，并以十种模型表情和短暂漫画符号反馈。

## 成功标准

- 头、胸、鸟喙、左右翅膀和身体托举区域可稳定识别。
- 慢速抚摸、轻点、快速逗弄和托举能触发不同语义事件。
- 十种表情支持优先级、延时、冷却、恢复和空闲困倦。
- 表情不破坏眼睛曲面吸附、眨眼、追视、待机或 Motion。
- 桌面与 390×844 触屏视口可操作，漫画符号不遮挡眼睛和鸟喙。
- 全量测试、生产构建和线上验证通过。

## 实施步骤

### 1. 纯逻辑状态机

新建 `src/birdPetInteractions.js`：

- 定义十种表情和九种语义互动事件。
- 实现 `createBirdGestureTracker()`，根据区域、距离、速度、持续时间和重复次数输出事件。
- 实现 `createBirdExpressionController()`，处理优先级、持续时间、冷却和空闲状态。

新建 `scripts/test_bird_pet_interactions.mjs`，先写失败断言，再实现到通过。把测试加入 `npm test`。

### 2. 鸟体接口与表情叠加

修改 `src/birdBuilder.js`：

- 暴露头、胸、鸟喙、左右翅膀和身体托举锚点。
- 增加 `applyExpression(sample)` 和 `clearExpression()`。
- 只操作头、翅膀、身体和内层 `EyeGaze` 的增量状态。
- 参数重建时由新模型重新生成锚点，不持有旧节点。

扩展鸟体测试，覆盖极小/极大头型、体宽和翅膀尺寸。

### 3. 主交互接线

修改 `src/main.js`：

- 射线拾取返回命中对象名称和本地坐标。
- 把猫的 `cheek/butt/lift` 区域映射替换为鸟类 `head/chest/beak/wing/body-lift`。
- 复用 `softPoke.js` 产生触觉形变，同时把指针序列交给手势跟踪器。
- 主循环在待机和追视之后叠加当前表情。
- Motion 模式仅保留轻点表情，禁用托举和软体拖拽。

### 4. 漫画表情层与提示

修改 `index.html`、`src/style.css`，新建 `src/birdExpressionOverlay.js`：

- 用统一手绘 SVG/文字轮廓显示爱心、红晕线、问号、井号、汗滴、星星、音符和 `Z`。
- 覆盖层跟随头部屏幕坐标，单实例复用，不堆叠 DOM。
- 增加首次互动提示，成功触发后自动隐藏。
- 支持 `prefers-reduced-motion`，触屏不依赖悬停。

### 5. 台词与回归

修改 `src/speechBubbles.js`：

- 增加中、英、日互动状态短句。
- 暴露按表情状态显示的入口，保持 25% 触发概率和去重。

执行：

- `npm run test:bird-pet`
- `npm test`
- `npm run build`
- `git diff --check`
- 浏览器桌面、移动端、默认/极值参数和 Motion 视觉验收
- 推送 `origin/main`，等待 Pages 并线上复核

## 改动边界

- 不重写 `softPoke.js` 或 `toys.js` 物理核心。
- 不增加好感度、喂养、账号存档、音频素材或独立表情包下载器。
- 不恢复腮部几何，不修改已经验收的翅膀、脚和面部曲面锚点。
