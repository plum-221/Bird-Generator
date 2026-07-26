const STORAGE_KEY = 'meow-generator-locale';
const SUPPORTED_LOCALES = new Set(['zh-CN', 'ja-JP', 'en']);

const COPY = {
  '小猫罐头正在准备画布': { 'ja-JP': 'ねこ缶がキャンバスを準備中', en: 'The canned kitten is preparing the canvas' },
  '正在开罐，马上就好…': { 'ja-JP': '缶を開けています、もうすぐです…', en: 'Opening the can, almost ready…' },
  '场景控制': { 'ja-JP': 'シーン操作', en: 'Scene controls' },
  '拖动光照球调整光照方向': { 'ja-JP': 'ライト球をドラッグして光の向きを変更', en: 'Drag the light orb to change lighting direction' },
  '拖动小太阳，改变光照方向': { 'ja-JP': '小さな太陽をドラッグして光の向きを変更', en: 'Drag the sun to change lighting direction' },
  '音乐': { 'ja-JP': '音楽', en: 'Music' },
  '光照': { 'ja-JP': '照明', en: 'Light' },
  '天气': { 'ja-JP': '天気', en: 'Weather' },
  '☀️ 晴天': { 'ja-JP': '☀️ 晴れ', en: '☀️ Sunny' },
  '☁️ 阴天': { 'ja-JP': '☁️ くもり', en: '☁️ Cloudy' },
  '⚡ 打雷': { 'ja-JP': '⚡ 雷', en: '⚡ Thunder' },
  '🌧️ 下雨': { 'ja-JP': '🌧️ 雨', en: '🌧️ Rain' },
  '可与阴天或下雨叠加': { 'ja-JP': 'くもり・雨と同時に使えます', en: 'Can be combined with cloudy or rain' },
  '雨量和落鱼量可分别调整': { 'ja-JP': '雨量と魚の量を個別に調整', en: 'Rain and fish amounts can be adjusted separately' },
  '天气参数': { 'ja-JP': '天気パラメータ', en: 'Weather settings' },
  '雨量': { 'ja-JP': '雨量', en: 'Rain' },
  '云量': { 'ja-JP': '雲量', en: 'Clouds' },
  '鱼量': { 'ja-JP': '魚量', en: 'Fish' },
  '拖拽旋转 · 滚轮缩放 · 右键平移': { 'ja-JP': 'ドラッグ回転・ホイール拡大縮小・右ドラッグ移動', en: 'Drag to orbit · Wheel to zoom · Right-drag to pan' },
  '拖拽旋转 · 双指平移 · 捏合缩放': { 'ja-JP': 'ドラッグ回転・2本指移動・ピンチ拡大縮小', en: 'Drag to orbit · Two-finger pan · Pinch to zoom' },
  '参数分类': { 'ja-JP': 'パラメータ分類', en: 'Parameter categories' },
  '🐾 随机遇见小猫': { 'ja-JP': '🐾 ランダムねこ', en: '🐾 Random kitten' },
  '带走 GLB': { 'ja-JP': 'GLB を保存', en: 'Save GLB' },
  '留影 PNG': { 'ja-JP': 'PNG を撮影', en: 'Capture PNG' },
  '播放背景音乐': { 'ja-JP': 'BGM を再生', en: 'Play background music' },
  '暂停背景音乐': { 'ja-JP': 'BGM を一時停止', en: 'Pause background music' },
  '造型': { 'ja-JP': 'スタイル', en: 'Style' },
  '姿势': { 'ja-JP': 'ポーズ', en: 'Pose' },
  '站立': { 'ja-JP': '立つ', en: 'Stand' },
  '猫咪面包': { 'ja-JP': '香箱座り', en: 'Loaf' },
  '随机猫窝': { 'ja-JP': 'ランダム猫ベッド', en: 'Random cat nest' },
  '伸懒腰': { 'ja-JP': '伸び', en: 'Stretch' },
  '双足直立': { 'ja-JP': '二足立ち', en: 'Biped' },
  '岔腿坐': { 'ja-JP': 'だらり座り', en: 'Slouch sit' },
  '侧卧摊平': { 'ja-JP': '横向きぺたん', en: 'Side flop' },
  '香蕉站立': { 'ja-JP': 'バナナ立ち', en: 'Banana stand' },
  '猫窝大小': { 'ja-JP': '猫ベッドの大きさ', en: 'Nest size' },
  '实验：软体填充': { 'ja-JP': '実験：ソフト充填', en: 'Experimental: soft fill' },
  '实验：软体碰撞': { 'ja-JP': '実験：ぷるぷる衝突', en: 'Experimental: squishy collision' },
  '动态模式': { 'ja-JP': 'モーションモード', en: 'Motion mode' },
  '键盘状态机': { 'ja-JP': 'キーボード操作', en: 'Keyboard state machine' },
  '动作': { 'ja-JP': 'アクション', en: 'Action' },
  '速度': { 'ja-JP': '速度', en: 'Speed' },
  '幅度': { 'ja-JP': '強さ', en: 'Intensity' },
  '小猫归位': { 'ja-JP': 'ねこを戻す', en: 'Reset kitten' },
  'Experimental': { 'ja-JP': 'Experimental', en: 'Experimental' },
  '实验功能：动作适配与网格表现仍在持续调整。': {
    'ja-JP': '実験機能：モーション適応とメッシュ表現は調整中です。',
    en: 'Experimental: motion retargeting and mesh behavior are still being refined.',
  },
  '花纹': { 'ja-JP': '毛柄', en: 'Coat' },
  '花纹与眼睛': { 'ja-JP': '毛柄と目', en: 'Coat & eyes' },
  '花色': { 'ja-JP': '毛柄', en: 'Coat' },
  '自定义花色': { 'ja-JP': 'カスタム毛柄', en: 'Custom coat' },
  '启用自定义花色': { 'ja-JP': 'カスタム毛柄を有効化', en: 'Enable custom coat' },
  '花色底色': { 'ja-JP': 'ベース色', en: 'Base color' },
  '主色块': { 'ja-JP': 'メイン模様', en: 'Primary patch' },
  '辅助色块': { 'ja-JP': 'サブ模様', en: 'Secondary patch' },
  '随机花色参数': { 'ja-JP': '毛柄をランダム', en: 'Randomize coat' },
  '身体环纹': { 'ja-JP': '胴体の縞', en: 'Body stripes' },
  '头部额纹': { 'ja-JP': '額の縞', en: 'Forehead stripes' },
  '密度': { 'ja-JP': '密度', en: 'Density' },
  '宽度': { 'ja-JP': '幅', en: 'Width' },
  '抖动': { 'ja-JP': '揺らぎ', en: 'Wobble' },
  '边缘晕染': { 'ja-JP': 'ぼかし', en: 'Edge blur' },
  '色块数量': { 'ja-JP': '模様の数', en: 'Patch count' },
  '色块大小': { 'ja-JP': '模様の大きさ', en: 'Patch size' },
  '不规则度': { 'ja-JP': '不規則さ', en: 'Irregularity' },
  '身体条纹密度': { 'ja-JP': '胴縞の密度', en: 'Body stripe density' },
  '身体条纹宽度': { 'ja-JP': '胴縞の幅', en: 'Body stripe width' },
  '身体条纹抖动': { 'ja-JP': '胴縞の揺らぎ', en: 'Body stripe wobble' },
  '头部额纹密度': { 'ja-JP': '額縞の密度', en: 'Forehead stripe density' },
  '头部额纹宽度': { 'ja-JP': '額縞の幅', en: 'Forehead stripe width' },
  '头部额纹抖动': { 'ja-JP': '額縞の揺らぎ', en: 'Forehead stripe wobble' },
  '眼睛': { 'ja-JP': '目', en: 'Eyes' },
  '眼睛颜色': { 'ja-JP': '目の色', en: 'Eye color' },
  '右眼颜色': { 'ja-JP': '右目の色', en: 'Right eye color' },
  '异瞳': { 'ja-JP': 'オッドアイ', en: 'Odd eyes' },
  '眼睛大小': { 'ja-JP': '目の大きさ', en: 'Eye size' },
  '瞳孔大小': { 'ja-JP': '瞳の大きさ', en: 'Pupil size' },
  '泪眼模式': { 'ja-JP': 'うるうる目', en: 'Watery eyes' },
  '泪眼形变': { 'ja-JP': 'うるうる変形', en: 'Watery deformation' },
  '体型': { 'ja-JP': '体型', en: 'Body' },
  '身体尺寸': { 'ja-JP': 'ボディサイズ', en: 'Body size' },
  '头身比': { 'ja-JP': '頭身比', en: 'Head ratio' },
  '圆润度': { 'ja-JP': 'ふっくら', en: 'Roundness' },
  '腿长': { 'ja-JP': '脚の長さ', en: 'Leg length' },
  '耳朵大小': { 'ja-JP': '耳の大きさ', en: 'Ear size' },
  '尾巴长度': { 'ja-JP': 'しっぽの長さ', en: 'Tail length' },
  '尾巴卷曲': { 'ja-JP': 'しっぽの巻き', en: 'Tail curl' },
  '毛发': { 'ja-JP': '毛', en: 'Fur' },
  '炸毛': { 'ja-JP': '逆立ち毛', en: 'Fluff up' },
  '炸毛程度': { 'ja-JP': '逆立ち具合', en: 'Fluff amount' },
  '线条': { 'ja-JP': '線', en: 'Line' },
  '手绘抖动': { 'ja-JP': '手描きの揺れ', en: 'Hand-drawn wobble' },
  '捏猫': { 'ja-JP': 'ねこをつまむ', en: 'Sculpt kitten' },
  '范围': { 'ja-JP': '範囲', en: 'Radius' },
  '软硬': { 'ja-JP': '柔らかさ', en: 'Softness' },
  'Q弹': { 'ja-JP': 'ぷるぷる', en: 'Bounce' },
  '垫子': { 'ja-JP': 'マット', en: 'Rug' },
  '显示垫子': { 'ja-JP': 'マットを表示', en: 'Show rug' },
  '随机垫子': { 'ja-JP': 'マットをランダム', en: 'Random rug' },
  '木地板': { 'ja-JP': '木の床', en: 'Wood floor' },
  '随机木地板': { 'ja-JP': '床をランダム', en: 'Random floor' },
  '木板底色': { 'ja-JP': '床のベース色', en: 'Floor base' },
  '缝隙颜色': { 'ja-JP': '目地の色', en: 'Seam color' },
  '木纹颜色': { 'ja-JP': '木目の色', en: 'Grain color' },
  '木板宽度': { 'ja-JP': '板の幅', en: 'Plank width' },
  '木纹密度': { 'ja-JP': '木目の密度', en: 'Grain density' },
  '地板方向': { 'ja-JP': '床の向き', en: 'Floor direction' },
  '粗细': { 'ja-JP': '太さ', en: 'Thickness' },
  '密度': { 'ja-JP': '密度', en: 'Density' },
  '抖动': { 'ja-JP': '揺らぎ', en: 'Wobble' },
  '倾斜': { 'ja-JP': '傾き', en: 'Slant' },
  '虚线水平拉伸': { 'ja-JP': '破線の横伸び', en: 'Dash stretch' },
  '地面影子': { 'ja-JP': '床の影', en: 'Ground shadow' },
  '排线颜色': { 'ja-JP': 'ハッチ色', en: 'Hatch color' },
  '色块颜色': { 'ja-JP': '影の色', en: 'Shadow fill' },
  '对齐镜头': { 'ja-JP': 'カメラに合わせる', en: 'Align to camera' },
  '身上阴影': { 'ja-JP': '体の影', en: 'Body shading' },
  '渲染与场景': { 'ja-JP': '描画とシーン', en: 'Rendering & scene' },
  '场景与渲染': { 'ja-JP': 'シーンと描画', en: 'Scene & rendering' },
  '阴影浓度': { 'ja-JP': '影の濃さ', en: 'Shadow opacity' },
  '阴影颜色': { 'ja-JP': '影の色', en: 'Shadow color' },
  '排线浓度': { 'ja-JP': 'ハッチ濃度', en: 'Hatch opacity' },
  '大橘': { 'ja-JP': '茶トラ', en: 'Orange tabby' },
  '灰狸花': { 'ja-JP': 'サバトラ', en: 'Grey tabby' },
  '棕狸花': { 'ja-JP': 'キジトラ', en: 'Brown tabby' },
  '奶油': { 'ja-JP': 'クリーム', en: 'Cream' },
  '奶牛': { 'ja-JP': 'ハチワレ', en: 'Tuxedo' },
  '三花': { 'ja-JP': '三毛', en: 'Calico' },
  '玳瑁': { 'ja-JP': 'サビ', en: 'Tortoiseshell' },
  '暹罗': { 'ja-JP': 'シャム', en: 'Siamese' },
  '黑猫': { 'ja-JP': '黒猫', en: 'Black' },
  '白猫': { 'ja-JP': '白猫', en: 'White' },
  '蓝灰': { 'ja-JP': 'ブルーグレー', en: 'Blue grey' },
  '纸箱': { 'ja-JP': '段ボール箱', en: 'Cardboard box' },
  '花盆': { 'ja-JP': '植木鉢', en: 'Flowerpot' },
  '藤编篮': { 'ja-JP': '藤かご', en: 'Wicker basket' },
  '搪瓷盆': { 'ja-JP': 'ホーロー盆', en: 'Enamel basin' },
  '小水桶': { 'ja-JP': '小さなバケツ', en: 'Small bucket' },
  '布艺收纳箱': { 'ja-JP': '布収納箱', en: 'Fabric bin' },
  '待机': { 'ja-JP': '待機', en: 'Idle' },
  '警觉待机': { 'ja-JP': '警戒', en: 'Alert idle' },
  '行走': { 'ja-JP': '歩く', en: 'Walk' },
  '奔跑': { 'ja-JP': '走る', en: 'Run' },
  '潜行': { 'ja-JP': '忍び歩き', en: 'Sneak' },
  '跳跃': { 'ja-JP': 'ジャンプ', en: 'Jump' },
  '落下': { 'ja-JP': '落下', en: 'Fall' },
  '坐下': { 'ja-JP': '座る', en: 'Sit' },
  '休息姿势': { 'ja-JP': '休む', en: 'Rest' },
  '叫唤': { 'ja-JP': '鳴く', en: 'Meow' },
  '咬咬': { 'ja-JP': 'かむ', en: 'Bite' },
  '扑接': { 'ja-JP': '飛びつく', en: 'Pounce' },
  '仰头叫': { 'ja-JP': '遠吠え', en: 'Howl' },
  '倒地': { 'ja-JP': '倒れる', en: 'Collapse' },
  '固定网格': { 'ja-JP': '固定メッシュ', en: 'Fixed mesh' },
  '骨骼蒙皮': { 'ja-JP': 'ボーンスキン', en: 'bone skinning' },
  '前进': { 'ja-JP': '前進', en: 'Forward' },
  '后退': { 'ja-JP': '後退', en: 'Backward' },
  '转向': { 'ja-JP': '旋回', en: 'Turn' },
  '警觉 / 坐下 / 休息': { 'ja-JP': '警戒 / 座る / 休む', en: 'Alert / Sit / Rest' },
  '叫 / 咬 / 扑接 / 仰头叫': { 'ja-JP': '鳴く / かむ / 飛びつく / 遠吠え', en: 'Meow / Bite / Pounce / Howl' },
  '落下 / 倒地': { 'ja-JP': '落下 / 倒れる', en: 'Fall / Collapse' },
};

const textRecords = new WeakMap();
const attributeRecords = new WeakMap();
let activeLocale = 'zh-CN';
let translating = false;

function normalizedLocale(value) {
  return SUPPORTED_LOCALES.has(value) ? value : 'zh-CN';
}

function translatedCore(source, locale) {
  if (locale === 'zh-CN') return source;
  if (COPY[source]?.[locale]) return COPY[source][locale];
  if (source.startsWith('当前猫窝：')) {
    const prefix = locale === 'ja-JP' ? '現在の猫ベッド：' : 'Current nest: ';
    return `${prefix}${translatedCore(source.slice(5), locale)}`;
  }
  return source
    .split(' · ')
    .map((part) => COPY[part]?.[locale] ?? part)
    .join(' · ');
}

export function t(source, locale = activeLocale) {
  const match = String(source).match(/^(\s*)(.*?)(\s*)$/s);
  if (!match) return source;
  return `${match[1]}${translatedCore(match[2], locale)}${match[3]}`;
}

function translateTextNode(node) {
  const current = node.nodeValue ?? '';
  const previous = textRecords.get(node);
  const source = previous && current === previous.translated ? previous.source : current;
  const translated = t(source);
  textRecords.set(node, { source, translated });
  if (translated !== current) node.nodeValue = translated;
}

function translateAttributes(element) {
  if (!(element instanceof Element) || element.closest('[data-i18n-ignore]')) return;
  const previous = attributeRecords.get(element) ?? {};
  const next = { ...previous };
  for (const attribute of ['aria-label', 'title', 'placeholder']) {
    if (!element.hasAttribute(attribute)) continue;
    const current = element.getAttribute(attribute) ?? '';
    const record = previous[attribute];
    const source = record && current === record.translated ? record.source : current;
    const translated = t(source);
    next[attribute] = { source, translated };
    if (translated !== current) element.setAttribute(attribute, translated);
  }
  attributeRecords.set(element, next);
}

function translateSubtree(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root);
    return;
  }
  if (!(root instanceof Element) && root !== document) return;
  if (root instanceof Element) translateAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
    else translateAttributes(node);
    node = walker.nextNode();
  }
}

function refreshLocaleButtons() {
  document.querySelectorAll('[data-locale]').forEach((button) => {
    const selected = button.dataset.locale === activeLocale;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

export function setLocale(locale) {
  activeLocale = normalizedLocale(locale);
  localStorage.setItem(STORAGE_KEY, activeLocale);
  document.documentElement.lang = activeLocale;
  document.title = 'Meow Generator';
  translating = true;
  translateSubtree(document.body);
  translating = false;
  refreshLocaleButtons();
  window.dispatchEvent(new CustomEvent('meow:localechange', { detail: { locale: activeLocale } }));
}

export function initI18n() {
  activeLocale = normalizedLocale(localStorage.getItem(STORAGE_KEY) ?? 'zh-CN');
  document.querySelectorAll('[data-locale]').forEach((button) => {
    button.addEventListener('click', () => setLocale(button.dataset.locale));
  });
  const observer = new MutationObserver((mutations) => {
    if (translating) return;
    translating = true;
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') translateTextNode(mutation.target);
      for (const node of mutation.addedNodes) translateSubtree(node);
      if (mutation.type === 'attributes') translateAttributes(mutation.target);
    }
    translating = false;
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title', 'placeholder'],
  });
  setLocale(activeLocale);
  return {
    get locale() { return activeLocale; },
    setLocale,
    translate: t,
    disconnect: () => observer.disconnect(),
  };
}
