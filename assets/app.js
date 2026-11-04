/* ==========================================================================
   DAR AL-QASID — interaction layer
   UI first, 3D last (so a CDN failure can never break the page).
   ========================================================================== */

/* ---------- 1. Header state + mobile sheet ---------- */
const header = document.querySelector('.header');
const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const burger = document.querySelector('.burger');
const sheet = document.querySelector('.sheet');
if (burger && sheet) {
  const toggle = (force) => {
    const open = force ?? !sheet.classList.contains('open');
    sheet.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggle());
  sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
  window.addEventListener('keydown', e => e.key === 'Escape' && toggle(false));
}

/* ---------- 2. Scroll reveal (staggered) ---------- */
(() => {
  const items = [...document.querySelectorAll('.reveal,.reveal-x,.reveal-s')];
  if (!items.length) return;
  const show = el => el.classList.add('in');
  if (!('IntersectionObserver' in window)) { items.forEach(show); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const parent = e.target.parentElement;
      const sibs = parent ? [...parent.children].filter(c => c.matches('.reveal,.reveal-x,.reveal-s')) : [];
      const i = Math.max(0, sibs.indexOf(e.target));
      e.target.style.setProperty('--d', (i * 0.08) + 's');
      show(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  items.forEach(el => io.observe(el));
  // safety net: anything already on screen must never stay hidden
  requestAnimationFrame(() => items.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) show(el);
  }));
})();

/* ---------- 3. Pointer spotlight + card light ---------- */
(() => {
  if (!window.matchMedia('(pointer:fine)').matches) return;
  const spot = document.querySelector('.spot');
  let tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty, raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    if (spot) spot.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    raf = requestAnimationFrame(loop);
  };
  window.addEventListener('pointermove', e => {
    tx = e.clientX; ty = e.clientY;
    if (spot) spot.classList.add('on');
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });

  document.addEventListener('pointermove', e => {
    const cell = e.target.closest?.('.cell');
    if (!cell) return;
    const r = cell.getBoundingClientRect();
    cell.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    cell.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  }, { passive: true });
})();

/* ---------- 4. Parallax ---------- */
(() => {
  const layers = [...document.querySelectorAll('[data-parallax]')];
  const tilt = document.querySelector('.hero-visual');
  if (!layers.length && !tilt) return;
  let mx = 0, my = 0, sy = window.scrollY, raf = 0;
  const apply = () => {
    raf = 0;
    layers.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      el.style.transform = `scale(1.14) translate3d(0,${(-p * 60).toFixed(2)}px,0)`;
    });
    if (tilt) tilt.style.transform = `perspective(1200px) rotateY(${mx * 5}deg) rotateX(${-my * 5}deg) translate3d(0,${(sy * -0.03).toFixed(2)}px,0)`;
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
  window.addEventListener('scroll', () => { sy = window.scrollY; queue(); }, { passive: true });
  window.addEventListener('pointermove', e => {
    if (!tilt) return;
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
    queue();
  }, { passive: true });
  apply();
})();

/* ---------- 5. Page transitions ---------- */
window.addEventListener('pageshow', () => document.documentElement.classList.remove('leaving'));
document.addEventListener('click', e => {
  const a = e.target.closest?.('a[href]');
  if (!a) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname === location.pathname || a.target === '_blank' || a.hasAttribute('download')) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  document.documentElement.classList.add('leaving');
  setTimeout(() => { location.href = a.href; }, 300);
});

/* ---------- 7. Verse explorer (poem page) ---------- */
(() => {
  const verses = [...document.querySelectorAll('.verse')];
  if (!verses.length) return;
  const data = window.POEM || [];
  const $ = id => document.getElementById(id);
  const NUM = ['٨', '٩', '١٠', '١١', '١٢', '١٣'];
  let current = Math.max(0, verses.findIndex(v => v.classList.contains('active')));

  const render = (i) => {
    current = (i + verses.length) % verses.length;
    verses.forEach((v, n) => v.classList.toggle('active', n === current));
    const d = data[current];
    if (!d) return;
    const lbl = document.querySelector('.detail .lbl');
    if (lbl) lbl.textContent = 'نافذة المعنى · البيت ' + NUM[current];
    if ($('detailTitle')) $('detailTitle').textContent = d[0];
    if ($('detailText')) $('detailText').textContent = d[1];
    if ($('detailValue')) $('detailValue').textContent = d[2];
    if ($('detailNote')) $('detailNote').textContent = d[3] || '';
    const panel = document.querySelector('.detail');
    if (panel) { panel.animate([{ opacity: .35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' }); }
  };
  verses.forEach((v, i) => v.addEventListener('click', () => render(i)));
  $('nextVerse')?.addEventListener('click', () => render(current + 1));
  $('openVerse')?.addEventListener('click', () => {
    const d = data[current];
    if (!d || !$('verseModal')) return;
    $('modalTitle').textContent = d[0];
    $('modalVerse').textContent = (verses[current].querySelector('.txt') || {}).textContent || '';
    $('modalExplain').textContent = d[1];
    $('verseModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  const close = () => { $('verseModal')?.classList.remove('open'); document.body.style.overflow = ''; };
  $('closeModal')?.addEventListener('click', close);
  $('verseModal')?.addEventListener('click', e => { if (e.target.id === 'verseModal') close(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

/* ---------- 8. Quiz ---------- */
(() => {
  const items = [...document.querySelectorAll('.mcq')];
  const check = document.getElementById('checkQuiz');
  if (!items.length || !check) return;
  check.addEventListener('click', () => {
    let score = 0;
    items.forEach(item => {
      const chosen = item.querySelector('input:checked');
      const fb = item.querySelector('.feedback');
      fb.className = 'feedback';
      if (chosen && chosen.value === item.dataset.answer) {
        score++; fb.textContent = '✓ إجابة صحيحة'; fb.classList.add('good');
      } else {
        fb.textContent = '✕ ' + (chosen ? 'إجابة غير صحيحة' : 'لم تختر إجابة') + ' — راجع الاختيار الصحيح.';
        fb.classList.add('bad');
      }
    });
    const s = document.getElementById('quizScore');
    s.textContent = `نتيجتك: ${score} من ${items.length}`;
  });
  document.getElementById('resetQuiz')?.addEventListener('click', () => {
    items.forEach(x => {
      x.querySelectorAll('input').forEach(r => { r.checked = false; });
      const f = x.querySelector('.feedback'); f.textContent = ''; f.className = 'feedback';
    });
    document.getElementById('quizScore').textContent = '';
  });
})();

/* ---------- 9. Assistant (ask page) — Gemini + offline fallback ---------- */
(() => {
  const form = document.getElementById('chatForm');
  if (!form) return;
  const box = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const statusEl = document.querySelector('.chat-top .st');
  const dotEl = document.querySelector('.chat-top .dot');
  const sendBtn = form.querySelector('button');

  const CFG = Object.assign({
    key: '',
    models: ['gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-3.8-flash'],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/',
    timeout: 22000,
    turns: 12
  }, window.CHAT_CONFIG || {});
  const KEY = CFG.key;

  /* --- system prompt: the poem, its explanations, vocabulary and quiz facts --- */
  const SYSTEM = [
    'أنت «مساعد دار القصيد»، مساعد تعليمي داخل متحف الشعر العربي التفاعلي «دار القصيد».',
    'أجب بالعربية الفصحى المبسطة، في ٢ إلى ٥ أسطر، بأسلوب ودّي ومباشر، دون مقدمات طويلة.',
    '',
    'سياق القصيدة (الأبيات ٨–١٣) في مكارم الأخلاق:',
    '٨: وَإِنْ ضَيَّعُوا غَيْبِي حَفِظْتُ غُيُوبَهُمْ — حفظ الأسرار وتمني الخير للآخرين.',
    '٩: وَإِنْ زَجَرُوا طَيْرًا بِنَحْسٍ… — التفاؤل بالآخرين وحسن النية بهم.',
    '١٠: وَإِنْ قَطَعُوا مِنِّي الأَوَاصِرَ… — صلة الرحم ووصل من قطع، بدل القطيعة بالقطيعة.',
    '١١: وَلَا أَحْمِلُ الحِقْدَ القَدِيمَ — ترك الحقد والضغائن، العفو وصفاء القلب.',
    '١٢: لَهُمْ جُلُّ مَالِي… — الكرم والعطاء، وعدم تكليف الآخرين إن قلّ مالي.',
    '١٣: وَإِنِّي لَعَبْدُ الضَّيْفِ مَا دَامَ نَازِلًا — إكرام الضيف والتواضع وخدمته.',
    '',
    'المفردات: الأواصر = الروابط والصلات بين الناس. الرِّفد = العون والمساعدة. شيمة = الخُلُق أو الصفة الثابتة. الغيب = ما غاب عنك.',
    'القيم: الوفاء، حفظ الأسرار، التسامح، الكرم، حسن النية، إكرام الضيف، ترك الحقد.',
    'أسئلة الاختبار وصحيحها: الفكرة العامة = التحلي بمكارم الأخلاق؛ الأواصر = الروابط والصلات؛ إذا قلّ مالي = لا أكلّف الآخرين مساعدتي؛ البيت الأخير = إكرام الضيف.',
    '',
    'قواعد: لا تخترع أبياتًا أو معلومات غير موجودة في النص. إن سُئلت عن موضوع خارج القصيدة، أجب بإجابة قصيرة صحيحة ثم عد بلطف إلى موضوع القصيدة. لا تذكر أنك نموذج لغوي.'
  ].join('\n');

  /* ---------- local fallback engine (used when the API is unreachable) ---------- */
  const norm = s => (s || '')
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))   // ٠-٩ → 0-9
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه').replace(/[^\u0621-\u064Aa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim().toLowerCase();

  const LOCAL = [
    { k: ['السلام', 'مرحبا', 'اهلا', 'هلا', 'هاي', 'صباح', 'مساء', 'أهلا'], a: 'أهلًا بك في دار القصيد 🌿 اسألني عن أي بيت من الأبيات ٨–١٣، أو عن معنى كلمة، أو عن القيمة التي يدعو إليها الشاعر.' },
    { k: ['الفكره العامه', 'الفكرة العامة', 'ملخص', 'تلخيص', 'عن القصيده', 'بماذا تدور'], a: 'تدور الأبيات حول مكارم الأخلاق: الوفاء وحفظ الأسرار، وتمني الخير للآخرين، وصلة من قطعك، وترك الحقد، والكرم، وإكرام الضيف.' },
    { k: ['اواصر'], a: '«الأواصر» هي الروابط والصلات التي تجمع الناس: القرابة، والصداقة، والمودة. يقول الشاعر إنه يصلها حتى لو قُطعت.' },
    { k: ['رفد'], a: 'الرِّفد يعني العون أو المساعدة. ويقول الشاعر: إن قلّ مالي لم أكلّف الآخرين رفدًا، أي لم أُثقِل عليهم.' },
    { k: ['شيمه', 'شيمة'], a: '«شيمة» تعني الخُلُق أو الصفة الثابتة في الإنسان. ويصف الشاعر شيمته بأنها إكرام الضيف.' },
    { k: ['حقد', 'ضغينه', 'ضغائن'], a: 'يدعو البيت إلى ترك الضغينة والتحلي بالعفو وصفاء القلب، لأن الكريم لا يحمل الحقد.' },
    { k: ['ضيف', 'ضيافه', 'اكرام'], a: 'يُبالغ الشاعر في إكرام الضيف: يخدمه ويعتني به ما دام مقيمًا عنده، ويعده من أبرز صفاته.' },
    { k: ['القيم', 'قيمه', 'صفات', 'يمدح', 'ادب', 'اخلاقي'], a: 'يمدح الشاعر الوفاء، وحفظ الأسرار، والتسامح، والكرم، وحسن النية، وإكرام الضيف، وترك الحقد.' },
    { k: ['اختبار', 'اسئله', 'اختبر', 'تدريب'], a: 'لديك أسئلة اختيار من متعدد وأسئلة قصيرة في صفحة القصيدة. جرّب: ما معنى «الأواصر»؟ أو ماذا يفعل الشاعر إذا قلّ ماله؟' },
    { k: ['عدد الابيات', 'كم بيت', 'كم عدد'], a: 'يعرض المتحف ستة أبيات تفاعلية (٨–١٣) من قصيدة في مكارم الأخلاق، مع شرح لكل بيت وأسئلة تدريبية.' },
    { k: ['من انت', 'مين انت', 'اسمك', 'من معك'], a: 'أنا مساعد دار القصيد، رفيقك داخل المتحف: أشرح الأبيات، وأجيب عن المفردات، وأساعدك في فهم القيم والدلالات.' },
    { k: ['الشاعر', 'من قال', 'صاحب القصيده'], a: 'النص مقتطف من قصيدة في مكارم الأخلاق، وضمن الأبيات ٨–١٣ التي يعرضها متحفنا بشرحها وأسئلتها.' },
    { k: ['شكرا', 'تسلم', 'مشكور', 'يعطيك'], a: 'على الرحب والسعة 🌿 إن أردت، اسأل عن بيتٍ بعينه أو عن مفردة جديدة.' }
  ];

  const offline = (q) => {
    const n = norm(q);
    if (!n) return 'اكتب سؤالك عن القصيدة، مثل: ما معنى «الأواصر»؟';
    let best = null, score = 0;
    for (const item of LOCAL) {
      const s = item.k.reduce((t, k) => t + (n.includes(norm(k)) ? 1 : 0), 0);
      if (s > score) { score = s; best = item; }
    }
    if (best) return best.a;
    const ORD = { 'الثامن': 8, 'التاسع': 9, 'العاشر': 10, 'الحادي عشر': 11, 'الثاني عشر': 12, 'الثالث عشر': 13, 'الاول': 8, 'الاخير': 13 };
    let num = null;
    for (const w in ORD) { if (n.includes(w)) { num = ORD[w]; break; } }
    if (num === null) { const m1 = n.match(/\b(8|9|10|11|12|13)\b/); if (m1) num = +m1[1]; }
    if (num !== null) {
      const map = {
        8: 'البيت ٨ يدور حول حفظ غيوب الناس وتمني الخير لهم: «وإن ضيّعوا غيبي حفظت غيوبهم».',
        9: 'البيت ٩ يعبّر عن التفاؤل بالآخرين: يتمنى لهم الخير حتى لو صنعوا ما لا يسرّه.',
        10: 'البيت ١٠ عن صلة الأواصر: يصل من قطعه بالمحبة والود بدل أن يقابل القطيعة بها.',
        11: 'البيت ١١ يؤكد أنه لا يحمل الحقد القديم، وأن الكريم لا يجعله صفة.',
        12: 'البيت ١٢ عن الكرم: يعطي من ماله عند اليسار، ولا يكلّف الآخرين إن قلّ ماله.',
        13: 'البيت ١٣ هو بيت إكرام الضيف: «وإني لعبد الضيف ما دام نازلاً».'
      };
      if (map[num]) return map[num];
    }
    return 'يمكنني شرح أي بيت من الأبيات ٨–١٣، ومعاني المفردات (الأواصر، الرِّفد، شيمة)، والقيم التي يدعو إليها الشاعر، ومساعدتك في أسئلة الاختبار. جرّب أحد هذه الأسئلة.';
  };

  /* ---------- Gemini ---------- */
  const history = [];
  const SYSTEM_PROMPT = SYSTEM;

  const askAI = async (text) => {
    if (!KEY) return null;
    history.push({ role: 'user', parts: [{ text }] });
    const contents = history.slice(-CFG.turns);
    const base = { systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents };

    let lastErr = null;
    for (const model of CFG.models) {
      for (const fast of [true, false]) {            // first without thinking, then with
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), CFG.timeout);
        try {
          const body = Object.assign({}, base);
          body.generationConfig = fast
            ? { maxOutputTokens: 700, temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } }
            : { maxOutputTokens: 700, temperature: 0.7 };
          const res = await fetch(CFG.endpoint + model + ':generateContent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
            signal: ctl.signal,
            body: JSON.stringify(body)
          });
          const j = await res.json().catch(() => ({}));
          clearTimeout(timer);
          if (!res.ok) {
            lastErr = (j.error && j.error.message) || ('HTTP ' + res.status);
            if (res.status === 400 && fast) continue;    // this model rejects thinkingConfig — retry without
            break;                                        // otherwise go to the next model
          }
          const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
          const reply = parts.map(p => p.text || '').join('').trim();
          if (!reply) { lastErr = 'empty'; break; }
          history.push({ role: 'model', parts: [{ text: reply }] });
          return reply;
        } catch (e) {
          clearTimeout(timer);
          lastErr = e;
          if (fast) continue;                            // timeout/network — try again without thinking
          break;
        }
      }
    }
    history.pop();               // keep history clean when every model failed
    return { error: String(lastErr || 'unreachable') };
  };

  /* ---------- UI ---------- */
  const setStatus = (text, mode) => {
    if (!statusEl) return;
    statusEl.innerHTML = '';
    if (dotEl && mode === 'ai') statusEl.appendChild(dotEl);
    statusEl.appendChild(document.createTextNode(text));
    if (dotEl) dotEl.style.background = mode === 'ai' ? '' : '#c2554b';
  };
  if (KEY) setStatus('GEMINI · متصل', 'ai');
  else setStatus('LOCAL · وضع محلي', 'local');

  const addMsg = (cls, text) => {
    const d = document.createElement('div');
    d.className = 'msg ' + cls;
    d.textContent = text;
    box.appendChild(d);
    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    return d;
  };

  let busy = false;
  const send = async (q) => {
    q = (q || '').trim();
    if (!q || busy) return;
    busy = true;
    if (sendBtn) sendBtn.disabled = true;
    addMsg('user', q);

    const typing = document.createElement('div');
    typing.className = 'msg bot typing';
    typing.innerHTML = '<i></i><i></i><i></i>';
    box.appendChild(typing);
    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });

    let answer = null;
    try { answer = await askAI(q); } catch (e) { answer = { error: String(e) }; }

    typing.remove();
    if (typeof answer === 'string' && answer) {
      setStatus('GEMINI · متصل', 'ai');
      addMsg('bot', answer);
    } else {
      setStatus('OFFLINE · إجابات محلية', 'local');
      addMsg('bot', offline(q));
    }
    busy = false;
    if (sendBtn) sendBtn.disabled = false;
  };

  form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; send(v); });
  document.querySelectorAll('.chip[data-q]').forEach(b => b.addEventListener('click', () => send(b.dataset.q)));
})();

/* ---------- 10. 3D artifact (Three.js, lazy + failure-safe) ---------- */
(async () => {
  const canvas = document.getElementById('artifact');
  const stage = document.querySelector('.stage');
  if (!canvas || !stage) return;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.WebGLRenderingContext) { stage.classList.add('no-gl'); return; }

  let THREE;
  try {
    THREE = await import('https://unpkg.com/three@0.161.0/build/three.module.min.js');
  } catch (err) {
    stage.classList.add('no-gl');   // CSS rings + light remain as the visual
    return;
  }

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    const group = new THREE.Group();
    scene.add(group);

    // core solid — reads as a dark museum artifact
    const geo = new THREE.IcosahedronGeometry(1.7, 1);
    const core = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x0a1224 }));
    group.add(core);

    // wire cage
    const cage = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x7db4ff, transparent: true, opacity: 0.55 })
    );
    cage.scale.setScalar(1.005);
    group.add(cage);

    // vertex nodes
    const nodes = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.9, sizeAttenuation: true })
    );
    nodes.scale.setScalar(1.01);
    group.add(nodes);

    // inner glow shell
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.05, 2),
      new THREE.MeshBasicMaterial({ color: 0x3d7dff, transparent: true, opacity: 0.055, wireframe: true })
    );
    group.add(shell);

    // orbital ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.75, 0.008, 8, 220),
      new THREE.MeshBasicMaterial({ color: 0x3d7dff, transparent: true, opacity: 0.75 })
    );
    ring.rotation.x = Math.PI / 2.35;
    group.add(ring);

    const ring2 = ring.clone();
    ring2.rotation.set(Math.PI / 1.7, 0.5, 0.9);
    ring2.scale.setScalar(1.18);
    ring2.material = ring.material.clone();
    ring2.material.opacity = 0.35;
    group.add(ring2);

    // orbiting marker
    const marker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.11, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    group.add(marker);

    // depth dust
    const N = 520, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 7 + Math.random() * 9, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      pos[i * 3 + 2] = r * Math.cos(p) - 4;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9db8e6, size: 0.045, transparent: true, opacity: 0.55 }));
    scene.add(dust);

    // sizing
    const resize = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (calm) renderer.render(scene, camera);   // static frame for reduced-motion
    };
    resize();
    new ResizeObserver(resize).observe(stage);

    // pointer parallax
    let px = 0, py = 0, tx = 0, ty = 0;
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }, { passive: true });
    stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; }, { passive: true });

    // visibility gating
    let visible = true, hidden = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.01 }).observe(stage);
    document.addEventListener('visibilitychange', () => { hidden = document.hidden; });

    const clock = new THREE.Clock();
    const tick = () => {
      requestAnimationFrame(tick);
      if (!visible || hidden) return;
      const t = clock.getElapsedTime();

      if (!calm) {
        group.rotation.y += 0.0026;
        group.rotation.x = Math.sin(t * 0.35) * 0.16;
        shell.rotation.y -= 0.0016;
        shell.rotation.z += 0.0009;
        ring.rotation.z += 0.0012;
        ring2.rotation.z -= 0.0008;
        dust.rotation.y = t * 0.014;

        const a = t * 0.55;
        marker.position.set(Math.cos(a) * 2.75, Math.sin(a) * 0.72, Math.sin(a) * 2.6);
        marker.rotation.x = t * 1.4;
        marker.rotation.y = t * 1.1;

        px += (tx - px) * 0.05;
        py += (ty - py) * 0.05;
        group.position.x = px * 0.35;
        group.position.y = -py * 0.3;
        camera.position.x = px * 0.55;
        camera.position.y = -py * 0.45;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };
    if (calm) renderer.render(scene, camera);
    else tick();
    canvas.dataset.ready = '1';
  } catch (err) {
    stage.classList.add('no-gl');
  }
})();

/* signal that the UI layer booted (head fallback uses this) */
window.__UI_READY = true;
