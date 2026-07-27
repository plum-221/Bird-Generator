import * as THREE from 'three';

const COPY = {
  'zh-CN': {
    bird: [
      '你回来啦？',
      '啾，我听见啦。',
      '今天也陪我一会儿吧。',
      '刚才那个声音是什么？',
      '尾羽要放整齐。',
      '这里看起来很安全。',
      '我在认真观察你。',
      '可以轻轻摸摸头。',
      '阳光落在羽毛上啦。',
      '等一下，我先歪个头。',
      '这个小球会自己跑吗？',
      '啾啾，今天心情很好。',
    ],
    fish: [
      '我是会滚动的小伙伴。',
      '小鸟刚才在看我。',
      '别担心，我只是玩具。',
      '地毯就是今天的海。',
      '谁来轻轻推我一下？',
      '我的尾巴今天很精神。',
      '保持安静，我在晒太阳。',
      '我们可以做朋友。',
    ],
    duck: [
      '嘎？这里不是池塘吗？',
      '我圆，但我有碰撞。',
      '别踢我，我会滚。',
      '今天负责假装镇定。',
      '那条鱼看起来可疑。',
      '小鸟来了，我让一点。',
      '嘎一下，气氛就有了。',
      '我只是黄，不代表胆小。',
      '刚才的雷不是我放的。',
      '窝满了，我睡地板。',
    ],
    weather: {
      bird: {
        thunder: ['雷声好大，我靠近一点。', '啾！刚才天空响了一下。'],
        rain: ['雨点在唱歌。', '下雨了，羽毛要保持干燥。'],
      },
      fish: {
        thunder: ['先别劈，我是布的！'],
        rain: ['雨来了，地毯海涨潮啦。'],
      },
      duck: {
        thunder: ['嘎！我什么都没做！'],
        rain: ['终于有点池塘气氛了。', '雨来了，鸭也精神了。'],
      },
    },
  },
  'ja-JP': {
    bird: [
      'おかえり？',
      'ピッ、ちゃんと聞こえたよ。',
      '今日もそばにいてね。',
      '今の音、なんだろう？',
      '尾羽をきれいに整えよう。',
      'ここなら安心できそう。',
      'じっと観察しています。',
      '頭をそっとなでてね。',
      '羽にお日さまが当たったよ。',
      'ちょっと首をかしげます。',
      'このボール、自分で動くの？',
      'ピヨピヨ、今日はごきげん。',
    ],
    fish: [
      'ころころ転がる仲間です。',
      '小鳥がこっちを見ていたよ。',
      '心配しないで、玩具です。',
      '今日はラグが海なんだ。',
      'だれかそっと押してくれる？',
      '尾びれは今日も元気です。',
      '静かに日なたぼっこ中。',
      '友だちになれるかな。',
    ],
    duck: [
      'ガー？池じゃないの？',
      '丸いけど衝突します。',
      '蹴らないで、転がるよ。',
      '今日は平静のふり担当。',
      'あの魚、ちょっと怪しい。',
      '小鳥が来たので少し譲る。',
      'ガーで空気が整います。',
      '黄色でも怖がりじゃない。',
      'さっきの雷、私じゃない。',
      '寝床が満員。床で寝る。',
    ],
    weather: {
      bird: {
        thunder: ['雷、大きいね。少し近くにいて。', 'ピッ！空が鳴ったよ。'],
        rain: ['雨粒が歌ってる。', '雨だ。羽を濡らさないようにしよう。'],
      },
      fish: {
        thunder: ['落とさないで、布製です！'],
        rain: ['雨だ。ラグの海が満ちてきた。'],
      },
      duck: {
        thunder: ['ガー！何もしてない！'],
        rain: ['やっと池っぽくなってきた。', '雨だ。アヒルも元気。'],
      },
    },
  },
  en: {
    bird: [
      'You are back!',
      'Chirp, I heard you.',
      'Stay with me for a while.',
      'What was that sound?',
      'Time to straighten my tail feathers.',
      'This place feels safe.',
      'I am watching you carefully.',
      'A gentle head scratch, please.',
      'Sunlight found my feathers.',
      'Wait. I need to tilt my head.',
      'Does this little ball move by itself?',
      'Chirp chirp. I feel happy today.',
    ],
    fish: [
      'I am the rolling little friend.',
      'The little bird was watching me.',
      'No worries. I am only a toy.',
      'The rug is today’s ocean.',
      'Will someone give me a gentle push?',
      'My tail feels lively today.',
      'Quiet. I am sunbathing.',
      'Maybe we can be friends.',
    ],
    duck: [
      'Quack? This is not a pond?',
      'Round, but collision-enabled.',
      'Do not kick me. I roll.',
      'Pretending to be calm today.',
      'That fish looks suspicious.',
      'Little bird coming through. I will move.',
      'One quack fixes the mood.',
      'Yellow does not mean timid.',
      'That thunder was not me.',
      'Nest full. Floor it is.',
    ],
    weather: {
      bird: {
        thunder: ['That thunder was loud. Stay close.', 'Chirp! The sky made a sound.'],
        rain: ['The raindrops are singing.', 'Rain! I should keep my feathers dry.'],
      },
      fish: {
        thunder: ['Do not zap me. I am fabric!'],
        rain: ['Rain! The rug ocean is rising.'],
      },
      duck: {
        thunder: ['Quack! I did nothing!'],
        rain: ['Finally, some pond atmosphere.', 'Rain! Duck energy restored.'],
      },
    },
  },
};

const ROLE_WEIGHTS = [
  ['bird', 0.5],
  ['fish', 0.26],
  ['duck', 0.24],
];

const anchorWorld = new THREE.Vector3();
const anchorScreen = new THREE.Vector3();

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandom(items, excluded = '') {
  if (!items.length) return '';
  const available = items.length > 1 ? items.filter((item) => item !== excluded) : items;
  return available[Math.floor(Math.random() * available.length)] ?? items[0];
}

function weightedRole(availableRoles) {
  const choices = ROLE_WEIGHTS.filter(([role]) => availableRoles.has(role));
  const total = choices.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = Math.random() * total;
  for (const [role, weight] of choices) {
    cursor -= weight;
    if (cursor <= 0) return role;
  }
  return choices.at(-1)?.[0] ?? 'bird';
}

function localizedCopy(locale) {
  return COPY[locale] ?? COPY['zh-CN'];
}

function actorAnchor(actor, role) {
  if (role === 'bird') {
    actor.updateWorldMatrix(true, false);
    anchorWorld.copy(actor.userData.headC ?? new THREE.Vector3(0, 1, 0));
    anchorWorld.y += (actor.userData.hr ?? 0.42) * 1.02;
    return actor.localToWorld(anchorWorld);
  }

  actor.mesh.updateWorldMatrix(true, false);
  actor.mesh.getWorldPosition(anchorWorld);
  anchorWorld.y += Math.max(0.18, actor.radius * (role === 'duck' ? 1.42 : 1.12));
  return anchorWorld;
}

export function createSpeechBubbleController({
  element,
  viewport,
  camera,
  getCat,
  getToys,
  getLocale,
  getWeather,
}) {
  let elapsed = 0;
  let nextAt = randomBetween(3.2, 6.2);
  let active = null;
  let activeUntil = 0;
  let lastText = '';
  let bubbleWidth = 180;

  function setDiagnostics(visible, role = '', text = '') {
    viewport.dataset.speechVisible = String(visible);
    viewport.dataset.speechSpeaker = role;
    viewport.dataset.speechText = text;
  }

  function availableActors() {
    const result = new Map();
    const bird = getCat();
    if (bird?.visible) result.set('bird', [bird]);
    for (const toy of getToys()) {
      if (!toy.mesh.visible || !['fish', 'duck'].includes(toy.kind)) continue;
      if (!result.has(toy.kind)) result.set(toy.kind, []);
      result.get(toy.kind).push(toy);
    }
    return result;
  }

  function messageFor(role) {
    const localeCopy = localizedCopy(getLocale());
    const weather = getWeather();
    const contexts = [];
    if (weather.thunder) contexts.push('thunder');
    if (weather.mode === 'fishRain') contexts.push('rain');
    const contextual = contexts.flatMap((key) => localeCopy.weather[role]?.[key] ?? []);
    const useContext = contextual.length > 0 && Math.random() < 0.58;
    return pickRandom(useContext ? contextual : localeCopy[role], lastText);
  }

  function positionActive() {
    if (!active) return false;
    const anchor = actorAnchor(active.actor, active.role);
    anchorScreen.copy(anchor).project(camera);
    const visible = (
      anchorScreen.z >= -1
      && anchorScreen.z <= 1
      && anchorScreen.x >= -1.2
      && anchorScreen.x <= 1.2
      && anchorScreen.y >= -1.2
      && anchorScreen.y <= 1.2
    );
    element.classList.toggle('is-offscreen', !visible);
    if (!visible) return false;

    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const rawX = (anchorScreen.x * 0.5 + 0.5) * width;
    const rawY = (-anchorScreen.y * 0.5 + 0.5) * height;
    const halfBubble = bubbleWidth * 0.5;
    const x = THREE.MathUtils.clamp(rawX, halfBubble + 12, width - halfBubble - 12);
    const y = THREE.MathUtils.clamp(rawY, 76, height - 28);
    const tailX = THREE.MathUtils.clamp(rawX - x + halfBubble, 20, bubbleWidth - 20);
    element.style.left = `${x.toFixed(1)}px`;
    element.style.top = `${y.toFixed(1)}px`;
    element.style.setProperty('--bubble-tail-x', `${tailX.toFixed(1)}px`);
    return true;
  }

  function showNow(preferredRole = '') {
    const actors = availableActors();
    if (!actors.size) return false;
    const roles = new Set(actors.keys());
    const normalizedRole = preferredRole === 'cat' ? 'bird' : preferredRole;
    const role = roles.has(normalizedRole) ? normalizedRole : weightedRole(roles);
    const roleActors = actors.get(role);
    const actor = pickRandom(roleActors);
    const text = messageFor(role);
    if (!actor || !text) return false;

    active = { role, actor };
    lastText = text;
    element.textContent = text;
    element.dataset.speaker = role;
    element.classList.remove('is-visible', 'is-offscreen');
    bubbleWidth = Math.max(120, element.offsetWidth);
    positionActive();
    requestAnimationFrame(() => element.classList.add('is-visible'));
    activeUntil = elapsed + THREE.MathUtils.clamp(2.8 + text.length * 0.065, 3.15, 4.5);
    setDiagnostics(true, role, text);
    return true;
  }

  function hide() {
    element.classList.remove('is-visible');
    active = null;
    nextAt = elapsed + randomBetween(4.2, 8);
    setDiagnostics(false);
  }

  function update(dt) {
    elapsed += dt;
    if (active) {
      positionActive();
      if (elapsed >= activeUntil) hide();
      return;
    }
    if (elapsed >= nextAt && !showNow()) {
      nextAt = elapsed + 1;
    }
  }

  function refreshLocale() {
    if (!active) return;
    const text = messageFor(active.role);
    lastText = text;
    element.textContent = text;
    bubbleWidth = Math.max(120, element.offsetWidth);
    positionActive();
    setDiagnostics(true, active.role, text);
  }

  setDiagnostics(false);
  return {
    update,
    showNow,
    hide,
    refreshLocale,
    get activeRole() { return active?.role ?? ''; },
    get activeText() { return active ? element.textContent : ''; },
  };
}

export const SPEECH_BUBBLE_COPY = COPY;
