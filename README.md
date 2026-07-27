# Bird Generator

一个可以捏体型、换羽色、玩玩具、切换天气、尝试动作并生成收藏卡片的程序化 3D 小鸟工具。默认角色来自一只真实的白色虎皮鹦鹉。

▶ [在线体验](https://plum-221.github.io/Bird-Generator/)

> 本项目是 [Meow Generator](https://github.com/ringhyacinth/Meow-Generator) 的非商业二次创作。原项目由 Simon_阿文（Simon Lee）与海辛（Ring Hyacinth）共同创作；本项目保留原许可、署名和第三方声明。

## 主要功能

- 圆润手绘感的程序化 3D 小鸟，可调整头身比、圆润度、腿、翅膀、尾羽与蓬松程度
- 默认“照片同款·奶油白”虎皮鹦鹉，以及蓝白、黄绿、纯黄、薄荷青等羽色
- 黑豆眼、异瞳、自定义羽色和可复现随机种子
- 8 种静态造型与轻微待机动作
- 实验性的 Motion 模式：14 段程序化鸟类动作与 11 个语义骨骼
- 手绘描边、三渲二明暗和可调排线阴影
- 可抓取和投掷的小球、铃铛、布偶、鸟窝等物理玩具
- 晴天、阴天、雷雨、下雨与谷子雨场景
- GLB 模型、PNG 小鸟收藏卡和 Codex 宠物交接文件
- 中文、英文、日文界面
- 桌面端与移动端布局

## 默认白色鹦鹉

固定种子 `521075` 会生成默认角色：奶油白羽毛、圆润身体、小黑豆眼、浅黄色弯喙和淡灰粉脚爪。所有参数都可继续调整，也可以随机生成其他小鸟。

## 操作方式

- 左键拖动：旋转摄影机
- 滚轮或触控板：缩放
- 右键拖动：平移
- 拖动玩具：抓取与投掷
- 拖动小鸟：软体互动
- Motion 模式：使用 `WASD`、方向键和面板中的动作快捷键

## 本地运行

需要 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev
```

打开 `http://localhost:8791`。

生产构建与测试：

```bash
npm test
npm run build
```

## 项目结构

- `src/birdBuilder.js` — 小鸟结构、面部、翅膀、尾羽和脚爪
- `src/birdPresets.js` — 羽色、眼睛与姿势预设
- `src/birdParams.js` — 默认参数与安全范围
- `src/birdMotionRig.js` — 程序化鸟类动作
- `src/birdMotionStateMachine.js` — 键盘动作状态机
- `src/main.js` — 场景、界面、交互与导出调度
- `src/toys.js` — Cannon-es 玩具物理与抓取
- `src/weather.js` — 天气、闪电、雨、云与谷子雨
- `src/shareCard.js` — 收藏卡片与 PNG 生成
- `src/sdf.js` — 原项目保留的 SDF 基础能力
- `src/i18n.js` — 中文、英文与日文文案

## 来源、署名与许可

本项目基于 Meow Generator 进行非商业改造，保留：

- `LICENSE` — PolyForm Noncommercial License 1.0.0
- `COMMERCIAL-LICENSE.md` — 原项目商业使用与合作说明
- `third_party/mesh2motion/README.md` — 原动作数据来源与 CC0 声明

除另行注明的第三方内容外，本项目仅用于个人学习、研究、实验和非商业展示。商业使用不在当前授权范围内。

原创白色鹦鹉品牌图由 OpenAI 图像生成工具根据用户提供的宠物参考照片生成；私人参考照片未包含在仓库中。

## 致谢

感谢 Meow Generator 原作者 Simon_阿文与海辛公开这套富有创意的程序化 3D 生成器。本项目的相机、场景、物理、天气、收藏卡、多语言和响应式布局均建立在原项目成果之上。
