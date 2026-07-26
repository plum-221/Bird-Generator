<div align="center">

# Neko Generator

[中文](README.md) · [English](README.en.md) · **日本語**

体型や毛柄を作り、玩具で遊び、天気やモーションを切り替え、コレクションカードまで生成できるプロシージャル 3D 子猫ツールです。

[オンライン版](https://ringhyacinth.github.io/Neko-Generator/) · [不具合を報告](https://github.com/ringhyacinth/Neko-Generator/issues)

</div>

![中国語・日本語・英語に対応した Neko Generator の画面と子猫コレクションカード](docs/screenshot.png)

## Neko Generator について

**Neko Generator** は **Simon_阿文（Simon Lee）** と **Ring Hyacinth（海辛）** の共同制作です。すべての子猫はシードと編集可能なパラメーターからプロシージャルに生成されます。同じシードを使うと、体型、毛柄、ポーズ、玩具、ラグ、カード番号、レアリティまで同じ子猫を再生成できます。

本プロジェクトはローカルファーストのブラウザー体験です。アカウント登録は不要で、バックエンドサービスも使用しません。

## インスピレーション

![Neko Generator の着想源となった本物の茶白の子猫。丸い爪とぎの上で、魚の玩具、編みラグ、カラフルな猫用品に囲まれている](docs/inspiration.jpg)

Neko Generator の出発点は、私たちの日常にいる本物の子猫です。丸みのある体とくるりと休む姿勢、そして爪とぎ、魚の玩具、編みラグ、明るい生活空間の色彩が、キャラクター造形、シーン、玩具、カラーパレットの着想になりました。

## 主な機能

- 体型、丸み、脚、耳、しっぽ、毛量を調整できる SDF ベースのプロシージャルボディ
- 11 種類の毛柄プリセットと、色・模様のカスタマイズ
- 目の色、オッドアイ、瞳孔サイズ、涙目変形
- 複数の静止ポーズと穏やかな待機モーション
- 19 ボーンと 14 アニメーションを備えた実験的な Motion モード
- 手描き風アウトライン、セルシェーディング、調整可能なハッチング影
- 魚、アヒル、毛糸玉、猫ベッドなどをつかんで投げられる物理玩具
- 晴れ、曇り、雷、雨、魚の雨のシーン
- GLB 書き出しと PNG 子猫コレクションカード
- 中国語、英語、日本語インターフェース
- デスクトップとモバイルのレイアウト

## 子猫コレクションカード

**Capture PNG / 留影 PNG** を開くと、現在の子猫のベースカラー、主・副模様色、目の色を読み取り、その子専用のデフォルトカードテーマを作成します。

各子猫には次の要素が割り当てられます。

- `No. 2902 / 9999` のような固定コレクション番号
- シードから安定して決まる `R`、`SR`、`AR` のレアリティ
- 子猫自身の色から抽出したデフォルトパレット
- **スキン変更**で選べるドット、チェック、紙吹雪、ウェーブのテーマ
- プロジェクトを再発見できるよう、書き出し PNG に記載される公開リポジトリアドレス

## ローカルで起動

Node.js 20.19+ または 22.12+ が必要です。

```bash
npm install
npm run dev
```

その後、<http://localhost:8791> を開きます。

本番ビルド：

```bash
npm run build
npm run preview
```

## テスト

```bash
npm run test:share
npm run test:fish-pick
npm run test:poke
npm run test:motion
```

Motion テストでは、14 アニメーション、19 ボーン、スキンウェイト、ステートマシン入力、元アニメーションのサンプリングを確認します。

## 操作方法

- 左ドラッグ：カメラ回転
- マウスホイールまたはトラックパッド：ズーム
- 右ドラッグ：パン
- 玩具をドラッグ：つかむ・投げる
- 頬または後方のインタラクション領域をドラッグ：ソフトボディ操作
- 首の後ろをドラッグ：子猫を持ち上げる
- Motion モード：`WASD` または矢印キーを使用。アクションのショートカットは Motion パネルに表示されます

## プロジェクト構成

- `src/sdf.js` — SDF プリミティブと Surface Nets メッシュ生成
- `src/catBuilder.js` — 子猫の構築、毛柄レンダリング、顔のディテール
- `src/coats.js` — 毛柄、目、ポーズの定義
- `src/rug.js` — シードベースのラグとカラーパレット
- `src/toys.js` — Cannon-es による玩具物理とグラブ操作
- `src/weather.js` — 天気、稲妻、雨、雲、落下する魚
- `src/shareCard.js` — コレクションカードテーマと PNG 生成
- `src/mesh2motion*.js` — モーションサンプリング、リターゲット、リグ、スキニング
- `src/i18n.js` — 中国語、英語、日本語の UI テキスト

アプリにバックエンドはありません。実行状態と書き出しデータはブラウザーまたは利用者の端末内にのみ保持され、アクセス解析やアカウント機能も含まれていません。

## クリエイター

Neko Generator は Simon_阿文（Simon Lee）と Ring Hyacinth の共同制作です。

### Simon_阿文（Simon Lee）

- [Twitter / X](https://x.com/simonxxoo)
- [Weibo / 微博](https://weibo.com/u/1757693565)

### Ring Hyacinth / 海辛

- [Twitter / X](https://x.com/ring_hyacinth)
- [Instagram](https://www.instagram.com/ringhyacinth/)

今後のバージョン開発やコラボレーションのご相談は、[ringhyacinth@gmail.com](mailto:ringhyacinth@gmail.com) までご連絡ください。

## 素材、クレジット、ライセンス

- アプリデザイン、プロシージャル子猫システム、インターフェース、オリジナルのビジュアル素材、生成 BGM は Simon_阿文（Simon Lee）と Ring Hyacinth が本プロジェクトのために制作しました。
- `src/mesh2motionClips.json` の軽量な猫科モーションデータは、[CC0 1.0](https://github.com/Mesh2Motion/mesh2motion-assets/blob/main/LICENSE) で公開された [Mesh2Motion](https://mesh2motion.org/) のキツネ / 猫アセットをもとにしています。詳細は [`third_party/mesh2motion/README.md`](third_party/mesh2motion/README.md) を参照してください。
- Three.js、Cannon-es、Vite、および依存パッケージには、それぞれのライセンスが適用されます。

個別に明記された第三者素材を除き、本プロジェクトは [MIT License](LICENSE) の下で提供されます。元の著作権表示と許諾表示を保持することを条件に、ライセンス条項に従って利用、複製、変更、結合、公開、配布、サブライセンス、販売できます。

## 現在の状態

Web 版は継続開発中のクリエイティブツール・プロトタイプです。Motion セクションは明確に実験的な機能です。極端な体型パラメーター、長時間の WebGL 実行、モバイル性能は端末によって異なる場合があります。

再現可能な不具合報告やフィードバックを歓迎します。
