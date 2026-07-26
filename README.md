# Neko Generator

> A playful, local-first procedural 3D kitten generator built with Three.js.
>
> 一个可以捏体型、换花色、玩玩具、切天气、做动作并生成收藏卡片的程序化 3D 小猫工具。

**Neko Generator** is co-created by [Ring Hyacinth / 海辛](https://github.com/ringhyacinth) and [Simon / 阿文](https://github.com/simonxxooxxoo).

[Live Demo](https://ringhyacinth.github.io/Neko-Generator/) · [Report an issue](https://github.com/ringhyacinth/Neko-Generator/issues)

![Neko Generator screenshot](docs/screenshot.png)

## What it does

Every kitten is generated from a seed and editable parameters. The same seed recreates the same kitten, including its body, coat, pose, toys, rug, collectible-card number, and rarity.

- Procedural SDF body with adjustable proportions, ears, legs, tail, and fluff
- 11 coat presets plus custom colors and pattern controls
- Eye colors, heterochromia, pupil size, and watery-eye deformation
- Eight static forms with soft idle motion
- Experimental fixed-mesh motion mode with 19-bone skinning and 14 animation clips
- Hand-drawn toon outlines, cel shading, and configurable hatch shadows
- Interactive physics toys, cat beds, fish, ducks, yarn balls, and rugs
- Sunny, cloudy, thunder, rain, and fish-rain scene states
- GLB export and collectible PNG share cards
- Chinese, Japanese, and English interfaces
- Desktop and mobile layouts

## Collectible share cards

Opening **Capture PNG / 留影 PNG** creates a card theme from the current kitten’s base coat, primary and secondary pattern colors, and eye color.

Each kitten receives:

- a stable collection number, such as `第 2902 张 / 9999`;
- a deterministic `R`, `SR`, or `AR` rarity;
- a kitten-derived default palette;
- optional remixed skins using rug-inspired dots, checks, confetti, and waves;
- a repository address printed into the exported PNG so the project can be found again.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Then open <http://localhost:8791>.

Production build:

```bash
npm run build
npm run preview
```

## Tests

```bash
npm run test:share
npm run test:fish-pick
npm run test:poke
npm run test:motion
```

The motion test covers the 14 animation actions, the 19-bone rig, skin weights, state-machine inputs, and source-frame sampling.

## Controls

- Drag: orbit camera
- Mouse wheel / trackpad: zoom
- Right-drag: pan
- Drag toys: grab and throw
- Drag cheeks or the rear interaction area: soft-body poke
- Drag the back of the neck: lift the kitten
- Motion mode: use `WASD` or arrow keys; action shortcuts are shown in the Motion panel

## Project structure

- `src/sdf.js` — signed-distance primitives and surface-nets meshing
- `src/catBuilder.js` — kitten construction, coat shading, and facial details
- `src/coats.js` — coat, eye, and pose definitions
- `src/rug.js` — seed-based rugs and palettes
- `src/toys.js` — Cannon-es toy physics and grabbing
- `src/weather.js` — weather, lightning, rain, clouds, and falling fish
- `src/shareCard.js` — collectible-card themes and PNG generation
- `src/mesh2motion*.js` — motion sampling, retargeting, rigging, and skinning
- `src/i18n.js` — Chinese, Japanese, and English UI copy

The app has no backend. Runtime state and exports stay in the browser or on the user’s device; the project does not include analytics or account systems.

## Creators

Neko Generator is a project by **海辛阿文工作室 / Haixin & Awen Studio**.

### Ring Hyacinth / 海辛

- [GitHub](https://github.com/ringhyacinth)
- [X](https://x.com/ring_hyacinth)
- [Instagram](https://www.instagram.com/ringhyacinth/)
- [Weibo](https://weibo.com/u/1309158107)
- [Xiaohongshu / 小红书](https://www.xiaohongshu.com/user/profile/648a5137000000002a0360e5)
- [3D Portfolio](https://ringhyacinth.github.io/hyacinth.im-site/)

### Simon / 阿文

- [GitHub](https://github.com/simonxxooxxoo)

## Assets, attribution, and reuse

- The application design, procedural kitten system, interface, original visual assets, and generated BGM were created for this project by Ring Hyacinth and Simon.
- Compact feline motion data in `src/mesh2motionClips.json` is derived from [Mesh2Motion](https://mesh2motion.org/) fox/cat assets released under [CC0 1.0](https://github.com/Mesh2Motion/mesh2motion-assets/blob/main/LICENSE). See [`third_party/mesh2motion/README.md`](third_party/mesh2motion/README.md).
- Three.js, Cannon-es, Vite, and their transitive dependencies retain their respective licenses.

No project-wide open-source license has been selected yet. The repository is public for viewing, testing, and discussion, but publication does not grant permission to reuse the original code, design, branding, music, or visual assets. Please contact the creators before redistribution or commercial use.

## Status

The web version is an active creative-tool prototype. The Motion section is explicitly experimental. Extreme body parameters, long-running WebGL sessions, and mobile performance may vary by device.

Issues and reproducible bug reports are welcome.
