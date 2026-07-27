# Bird Generator 实施计划

## 原则

每个阶段先加/改测试，再做最小实现；固定种子 `521075` 作为默认白色鹦鹉视觉基线。公共场景能力保留，猫专属能力通过角色接口逐步替换，任何阶段都保持可构建。

## 1. 项目身份与可回退基线

- 修改：`package.json`、`index.html`、`vite.config.js`、`.github/workflows/deploy-pages.yml`、三语 README。
- 保留许可、原作者与第三方署名；设置 `Bird-Generator` 名称、Pages base 和新仓库地址。
- 验证：原测试及 `npm run build` 持续通过。

## 2. 鸟类参数与预设

- 新建：`src/birdPresets.js`、`src/birdParams.js`、`scripts/test_bird_params.mjs`。
- 定义体型、喙、翅膀、尾羽、腿脚、羽色和安全范围；默认预设对应参考白色虎皮鹦鹉。
- 验证：固定种子复现、范围钳制、所有预设字段完整。

## 3. 程序化鸟体

- 新建：`src/birdBuilder.js`；复用 `src/sdf.js`、`src/hatch.js`、`src/softPoke.js`。
- 先实现站立体与 `userData` 公共契约，再补蹲卧、蓬毛、伸展等静态姿势。
- 验证：草稿/高清网格均有效，无 NaN、空网格、越界碰撞体。

## 4. 羽色与面部细节

- 在鸟体曲面加入脸罩、颊斑、翼纹、喉点、喙、鼻蜡膜、黑豆眼和羽片层次。
- 将动态猫纹替换为可复现的虎皮羽纹；保留自定义配色。
- 验证：白色默认、蓝白、黄绿、纯黄预设可稳定复现。

## 5. 动作、骨骼与交互

- 新建：`src/birdMotionStateMachine.js`、`src/birdMotionRig.js`、`scripts/test_bird_motion.mjs`。
- 实现眨眼、歪头、抖羽、蓬毛、啄食、走跳、扇翅、飞行；建立鸟类躯干/颈/头/双翼/腿/尾羽骨骼。
- 将摸脸、提后颈改为摸头、碰喙、托起、栖木落脚；保留软体按压框架。
- 验证：状态转换、骨骼安全、地面接触、飞行起落和极端比例。

## 6. 鸟玩具、场景与 UI

- 新建/改造：鸟类玩具与谷子雨；鸟窝、栖木、铃铛、秋千、谷穗、小球、镜子。
- 更新 `src/main.js`、`src/i18n.js`、`src/style.css` 和 `index.html` 的参数面板、三语文案、移动端布局。
- 验证：鼠标、触摸、键盘、随机化和天气模式。

## 7. 收藏卡、存档与导出

- 改造 `src/shareCard.js` 和导出流程：鸟爪/羽毛装饰、新仓库地址、`bird_card_*.png`、鸟参数 JSON 与 GLB。
- 验证：导出/导入往返一致，固定种子编号与稀有度稳定。

## 8. 视觉验收、优化与发布

- 浏览器逐项验收桌面/手机；对照参考图调整默认轮廓、配色和站姿。
- 运行全部测试与生产构建，检查许可、链接、资源体积和控制台错误。
- 创建 `plum-221/Bird-Generator`，推送 `main`，启用 GitHub Pages并验证在线网址。
