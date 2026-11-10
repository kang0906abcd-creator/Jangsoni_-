import { companion as companionSource, companionFlipX } from 'mascot-assets';
import config from '../survey-config.json';
import { mountAtlas } from './sprite.js';

// 나가기 설문: 사용자가 떠나려 할 때 장손이가 별점과 개선 제안을 부탁한다.
// 응답은 survey-config.json의 endpoint(구글 Apps Script 웹 앱)로 보내고,
// 보내지 못한 응답은 이 브라우저에 모아 두었다가 다음 방문 때 다시 보낸다.

const poses = ['idle', 'notice', 'balance', 'dizzy'];
const doneKey = 'jangsoni:exit-survey:done';
const seenKey = 'jangsoni:exit-survey:seen';
const queueKey = 'jangsoni:exit-survey:queue';
const maxQueue = 20;
const maxComment = 1000;
const ratingWords = ['', '많이 아쉬웠어요', '조금 아쉬웠어요', '보통이에요', '좋았어요', '최고예요!'];
const ratingLines = [
  '별을 눌러 점수를 골라 주세요',
  '앗, 많이 불편하셨군요… 어떤 점이 힘드셨는지 꼭 알려 주세요!',
  '아쉬운 점을 알려 주시면 꼭 고쳐 볼게요!',
  '더 좋아질 수 있게 한마디 부탁드려요!',
  '고마워요! 더 좋아질 점이 있다면 알려 주세요.',
  '와, 최고라니 신나요! 바라는 점이 있다면 적어 주세요.',
];

const openingLines = {
  'task-done': '방금 기능, 도움이 됐나요? 별점 하나만 남겨 주시면 힘이 나요!',
  feedback: '어떤 의견이든 환영해요! 편하게 남겨 주세요.',
};
const taskDoneDelay = 3500;
const taskNames = { 'cardnews-save': '카드뉴스 저장', 'yakgwan-analysis': '약관 분석', 'pubmed-copy': '논문 인용 복사' };

const store = {
  get(area, key) { try { return window[area].getItem(key); } catch { return null; } },
  set(area, key, value) { try { window[area].setItem(key, value); } catch {} },
  remove(area, key) { try { window[area].removeItem(key); } catch {} },
};

function readQueue() {
  try {
    const queue = JSON.parse(store.get('localStorage', queueKey) || '[]');
    return Array.isArray(queue) ? queue : [];
  } catch { return []; }
}

function writeQueue(queue) {
  if (queue.length) store.set('localStorage', queueKey, JSON.stringify(queue.slice(-maxQueue)));
  else store.remove('localStorage', queueKey);
}

async function deliver(response) {
  if (!config.endpoint) return false;
  try {
    // text/plain + no-cors: Apps Script 웹 앱이 사전 요청 없이 받을 수 있는 형식
    await fetch(config.endpoint, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(response),
    });
    return true;
  } catch { return false; }
}

async function flushQueue() {
  const queue = readQueue();
  if (!queue.length || !config.endpoint) return;
  const left = [];
  for (const response of queue) if (!await deliver(response)) left.push(response);
  writeQueue(left);
}

function recentlyAnswered() {
  const at = Number(store.get('localStorage', doneKey));
  return at > 0 && Date.now() - at < config.askAgainAfterDays * 864e5;
}

export function setupExitSurvey({ reduce, currentScreen }) {
  const panel = document.getElementById('exit-survey');
  const art = panel.querySelector('.exit-survey-art');
  const bubble = panel.querySelector('.exit-survey-bubble');
  const form = panel.querySelector('form');
  const stars = [...panel.querySelectorAll('.exit-survey-star')];
  const ratingLabel = panel.querySelector('.exit-survey-rating-label');
  const comment = form.querySelector('textarea');
  const counter = form.querySelector('.exit-survey-count');
  const submit = form.querySelector('[type="submit"]');
  const trap = form.querySelector('input[name="website"]');
  const ask = panel.querySelector('.exit-survey-ask');
  const thanks = panel.querySelector('.exit-survey-thanks');
  const loadedAt = Date.now();
  const image = new Image();
  let sprite, tileWidth, tileHeight;
  let rating = 0;
  let trigger = '';
  let afterClose = null;
  let closeTimer = 0;

  function setPose(pose) {
    if (!sprite) return;
    const index = poses.indexOf(pose);
    sprite.setAttribute('viewBox', [(index % 2) * tileWidth, Math.floor(index / 2) * tileHeight, tileWidth, tileHeight].join(' '));
    if (art.dataset.pose === pose) return;
    art.dataset.pose = pose;
    if (!reduce.matches) {
      art.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-10px) scale(1.04, .97)' },
        { transform: 'translateY(0) scale(1)' },
      ], { duration: 420, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    }
  }

  function paintStars(value) {
    stars.forEach((star, index) => star.classList.toggle('is-lit', index < value));
  }

  function choose(value) {
    rating = value;
    stars.forEach((star, index) => {
      star.setAttribute('aria-checked', String(index + 1 === value));
      star.tabIndex = (value ? index + 1 === value : index === 0) ? 0 : -1;
    });
    paintStars(value);
    ratingLabel.textContent = ratingWords[value] || ' ';
    bubble.textContent = ratingLines[value];
    submit.disabled = !value;
    setPose(value >= 4 ? 'dizzy' : value && value <= 2 ? 'balance' : value === 3 ? 'idle' : 'notice');
  }

  function reset() {
    clearTimeout(closeTimer);
    form.reset();
    counter.textContent = `0 / ${maxComment}`;
    ask.hidden = false;
    thanks.hidden = true;
    choose(0);
    bubble.textContent = '벌써 가시나요? 30초만 시간을 내서 장손이를 도와주세요!';
  }

  function open(reason, then, label) {
    reset();
    if (openingLines[reason]) bubble.textContent = openingLines[reason];
    trigger = label || reason;
    afterClose = then || null;
    store.set('sessionStorage', seenKey, '1');
    panel.hidden = false;
    if (!panel.open) panel.showModal();
    stars[0].focus({ preventScroll: true });
    setPose('notice');
  }

  function finish() {
    clearTimeout(closeTimer);
    if (panel.open) panel.close();
    panel.hidden = true;
    const next = afterClose;
    afterClose = null;
    next?.();
  }

  // 같은 방문에서 한 번만, 그리고 최근에 응답한 사람에게는 묻지 않는다.
  function canAsk() {
    if (panel.open || recentlyAnswered()) return false;
    if (store.get('sessionStorage', seenKey)) return false;
    return Date.now() - loadedAt >= config.minEngagementSeconds * 1000;
  }

  function request(reason, then, label) {
    if (!canAsk()) return false;
    open(reason, then, label);
    return true;
  }

  stars.forEach((star, index) => {
    star.addEventListener('click', () => choose(index + 1));
    star.addEventListener('pointerenter', () => paintStars(index + 1));
    star.addEventListener('pointerleave', () => paintStars(rating));
    star.addEventListener('keydown', event => {
      const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = Math.min(5, Math.max(1, (rating || (step > 0 ? 0 : 6)) + step));
      choose(next);
      stars[next - 1].focus();
    });
  });

  comment.addEventListener('input', () => {
    counter.textContent = `${comment.value.length} / ${maxComment}`;
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!rating) return;
    store.set('localStorage', doneKey, String(Date.now()));
    if (!trap.value) {
      const response = {
        submittedAt: new Date().toISOString(),
        rating,
        comment: comment.value.trim().slice(0, maxComment),
        screen: currentScreen() || '',
        trigger,
        device: matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop',
        viewport: `${innerWidth}x${innerHeight}`,
      };
      writeQueue([...readQueue(), response]);
      flushQueue();
    }
    ask.hidden = true;
    thanks.hidden = false;
    bubble.textContent = '소중한 의견 고마워요! 꼭 반영할게요.';
    setPose('dizzy');
    panel.querySelector('[data-survey-done]').focus({ preventScroll: true });
    closeTimer = setTimeout(finish, 2600);
  });

  panel.querySelectorAll('[data-survey-skip], [data-survey-done]').forEach(button => {
    button.addEventListener('click', finish);
  });
  panel.addEventListener('cancel', event => {
    event.preventDefault();
    finish();
  });
  panel.addEventListener('click', event => {
    if (event.target === panel) finish();
  });

  // 데스크톱: 마우스가 창 위쪽(탭·주소창·닫기 버튼 방향)으로 나갈 때
  document.addEventListener('mouseout', event => {
    if (!event.relatedTarget && event.clientY <= 0) request('exit-intent');
  });

  // 휴대전화: 다른 앱·탭으로 갔다가 돌아왔을 때 (떠나는 순간에는 화면을 띄울 수 없음)
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > 1500 && matchMedia('(pointer: coarse)').matches) request('returned');
  });

  // 기능을 끝까지 쓴 직후(카드뉴스 저장, 약관 분석 완료, 논문 인용 복사): 결과를 볼 시간을 두고 묻는다.
  let taskTimer = 0;
  document.addEventListener('jangsoni:task-done', event => {
    clearTimeout(taskTimer);
    taskTimer = setTimeout(() => {
      const busy = document.activeElement?.matches('input, select, textarea, [contenteditable]')
        || document.querySelector('dialog:modal');
      if (!busy && document.visibilityState === 'visible') request('task-done', null, `기능 사용 후 (${taskNames[event.detail] || event.detail})`);
    }, taskDoneDelay);
  });

  // 업무 코드(analysis.js)는 건드리지 않고, 화면에 나타나는 완료 표시를 보고 알아챈다.
  const taskDone = kind => document.dispatchEvent(new CustomEvent('jangsoni:task-done', { detail: kind }));
  const watch = (node, options, check) => node && new MutationObserver(check).observe(node, options);
  const cardStatus = document.getElementById('cn-status');
  watch(cardStatus, { childList: true, characterData: true, subtree: true }, () => {
    if (cardStatus.textContent.includes('저장했어요')) taskDone('cardnews-save');
  });
  const yakLive = document.getElementById('yak-live');
  watch(yakLive, { childList: true }, () => {
    if (yakLive.querySelector('.yak-panel')) taskDone('yakgwan-analysis');
  });
  const watchToast = toast => watch(toast, { childList: true, characterData: true, subtree: true }, () => {
    if (toast.textContent.includes('복사했어요')) taskDone('pubmed-copy');
  });
  if (document.getElementById('pm-toast')) watchToast(document.getElementById('pm-toast'));
  else {
    const waitForToast = new MutationObserver(() => {
      const toast = document.getElementById('pm-toast');
      if (!toast) return;
      waitForToast.disconnect();
      watchToast(toast);
      taskDone('pubmed-copy');
    });
    waitForToast.observe(document.body, { childList: true });
  }

  // 도움말 창의 '의견 보내기': 횟수 제한 없이 언제든 연다.
  document.addEventListener('jangsoni:open-survey', () => {
    if (!panel.open) open('feedback', null, '의견 보내기 버튼');
  });

  if (new URLSearchParams(location.search).has('survey')) {
    store.remove('sessionStorage', seenKey);
    setTimeout(() => open('manual'), 300);
  }

  image.onload = () => {
    tileWidth = image.naturalWidth / 2;
    tileHeight = image.naturalHeight / 2;
    sprite = mountAtlas(art, image, [0, 0, tileWidth, tileHeight], 'exit-survey-sprite', companionFlipX);
    setPose(art.dataset.pose || 'notice');
  };
  image.src = companionSource;
  flushQueue();

  return { request, open };
}
