import { SUGGESTED_QUESTIONS, MAINTENANCE_TYPES, FUEL_TYPES, POPULAR_BRANDS, FALLBACK_CATALOG, WARNING_LIGHTS, URGENCY, TIPS } from './data.js';
import { state, save, replaceState, uid, vehicleName, getVehicle, primaryVehicle, reminderStatus, sortedReminders, formatDate, todayStr } from './store.js';

const $ = (s, r = document) => r.querySelector(s);
const main = $('#main');
const dialog = $('#dialog');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => Number(n || 0).toLocaleString();
const unit = () => state.settings.units;

/* ---------- icons ---------- */
const ICONS = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
  chat: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H6a2 2 0 0 1-2-2z"/>',
  car: '<path d="M3 16v-3l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v3a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1zM5 12h14"/>',
  wrench: '<path d="M14 6a4 4 0 0 1 5-1l-3 3 1 2 2 1 3-3a4 4 0 0 1-6 4l-8 8a2 2 0 0 1-3-3l8-8a4 4 0 0 1 1-3z"/>',
  history: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  send: '<path d="M4 12l16-8-6 16-3-6z"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="1"/>',
  light: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
  back: '<path d="M14 6l-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  bulb: '<path d="M9 18h6M10 21h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2z"/>',
};
const icon = (name) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const GLYPHS = {
  engine: '<path d="M9 22h5v-5h4v-3h10v3h4l3 4h4v4h3v8h-3v3h-5l-3 4H17l-4-5H9z"/>',
  battery: '<rect x="8" y="16" width="32" height="20" rx="2"/><path d="M13 16v-4h6v4M29 16v-4h6v4M14 26h6M28 26h6M31 23v6"/>',
  oil: '<path d="M6 24l6-2 4 4h12l12-8 2 2-9 14H16l-4-6-6 1z"/><path d="M40 28c1.5 2 2 3 2 4a2 2 0 0 1-4 0c0-1 .5-2 2-4z"/>',
  brake: '<circle cx="24" cy="24" r="10"/><path d="M24 18v7M24 29v.5M9 13a17 17 0 0 0 0 22M39 13a17 17 0 0 1 0 22"/>',
  tire: '<path d="M15 12c-6 7-6 17-1 24h20c5-7 5-17-1-24"/><path d="M12 40l3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2M24 17v10M24 31v.5"/>',
  abs: '<circle cx="24" cy="24" r="11"/><path d="M8 13a17 17 0 0 0 0 22M40 13a17 17 0 0 1 0 22"/><text x="24" y="28" text-anchor="middle" font-size="9" font-weight="800" fill="currentColor" stroke="none" font-family="Overpass, sans-serif">ABS</text>',
  airbag: '<circle cx="18" cy="13" r="4"/><path d="M16 19l-3 12h8l5 9M13 31l-3 9"/><circle cx="32" cy="22" r="7"/>',
  temp: '<path d="M24 8v20"/><circle cx="24" cy="31" r="4"/><path d="M24 13h6M24 18h6M24 23h6M6 38c3-3 6 3 9 0s6 3 9 0 6 3 9 0 6 3 9 0"/>',
  traction: '<path d="M11 24v-5l3-7h20l3 7v5M11 19h26M9 24h30v5H9z"/><path d="M15 33c-3 3 3 5 0 9M33 33c-3 3 3 5 0 9"/>',
  stability: '<path d="M24 8l17 30H7z"/><path d="M24 19v9M24 32v.5"/>',
};
const glyph = (name) => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[name] || ''}</svg>`;

/* ---------- small helpers ---------- */
let toastTimer;
function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function applyTheme() {
  const t = state.settings.theme;
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

function md(src) {
  const inline = (s) =>
    s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  let html = '';
  let list = null;
  let para = [];
  const flushP = () => {
    if (para.length) html += `<p>${inline(para.join('<br>'))}</p>`;
    para = [];
  };
  const flushL = () => {
    if (list) html += `</${list}>`;
    list = null;
  };
  for (const line of esc(src).split('\n')) {
    const h = line.match(/^#{1,4}\s+(.*)/);
    const ul = line.match(/^\s*[-*•]\s+(.*)/);
    const ol = line.match(/^\s*(\d+)[.)]\s+(.*)/);
    if (h) {
      flushP();
      flushL();
      html += `<h4>${inline(h[1])}</h4>`;
    } else if (ul || ol) {
      flushP();
      const type = ul ? 'ul' : 'ol';
      if (list !== type) {
        flushL();
        html += `<${type}>`;
        list = type;
      }
      html += ol ? `<li value="${ol[1]}">${inline(ol[2])}</li>` : `<li>${inline(ul[1])}</li>`;
    } else if (!line.trim()) {
      flushP();
    } else {
      flushL();
      para.push(line.trim());
    }
  }
  flushP();
  flushL();
  return html;
}

function openDialog(html, { wide = false } = {}) {
  dialog.className = wide ? 'wide' : '';
  dialog.innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
function closeDialog() {
  if (dialog.open) dialog.close();
  dialog.innerHTML = '';
}
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) closeDialog();
});

function confirmDialog(title, text, okLabel) {
  return new Promise((resolve) => {
    openDialog(`
      <form method="dialog" class="dlg">
        <h2>${esc(title)}</h2>
        <p>${esc(text)}</p>
        <div class="dlg-actions">
          <button type="button" class="btn ghost" data-confirm="no">Cancel</button>
          <button type="button" class="btn danger" data-confirm="yes">${esc(okLabel)}</button>
        </div>
      </form>`);
    const done = (v) => {
      dialog.removeEventListener('click', onClick);
      dialog.removeEventListener('close', onClose);
      closeDialog();
      resolve(v);
    };
    const onClick = (e) => {
      const b = e.target.closest('[data-confirm]');
      if (b) done(b.dataset.confirm === 'yes');
    };
    const onClose = () => done(false);
    dialog.addEventListener('click', onClick);
    dialog.addEventListener('close', onClose);
  });
}

/* ---------- navigation ---------- */
const NAV = [
  ['home', 'Home', 'home'],
  ['chat', 'Chat', 'chat'],
  ['cars', 'My Car', 'car'],
  ['maintenance', 'Maintenance', 'wrench', 'Service'],
  ['history', 'Chat History', 'history', 'History'],
  ['settings', 'Settings', 'settings'],
];

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  return { page: parts[0] || 'home', arg: parts[1] || '', arg2: parts[2] || '' };
}

function renderNav(page) {
  const active = page === 'lights' ? 'home' : page;
  const overdue = state.reminders.filter((r) => reminderStatus(r).status === 'overdue').length;
  $('#nav').innerHTML = `
    <a class="brand" href="#/home" aria-label="CarGPT home">
      <img src="assets/icon.svg" alt="" width="30" height="30"><span>CarGPT</span>
    </a>
    <ul>
      ${NAV.map(
        ([id, label, ic, short]) => `
        <li><a href="#/${id}" ${active === id ? 'aria-current="page"' : ''}>
          ${icon(ic)}<span class="long">${label}</span><span class="short" aria-hidden="true">${short || label}</span>
          ${id === 'maintenance' && overdue ? `<b class="count" aria-label="${overdue} overdue">${overdue}</b>` : ''}
        </a></li>`
      ).join('')}
    </ul>`;
}

function render() {
  const r = parseRoute();
  renderNav(r.page);
  main.className = 'page-' + r.page;
  const views = { home: viewHome, chat: viewChat, cars: viewCars, maintenance: viewMaintenance, history: viewHistory, settings: viewSettings, lights: viewLights };
  (views[r.page] || viewHome)(r);
  if (r.page !== 'chat') window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);

/* ---------- home ---------- */
function clusterHtml() {
  const v = primaryVehicle();
  if (!v) {
    return `
      <section class="cluster empty" aria-label="Your car">
        <div>
          <h2>Add your car</h2>
          <p>Tell CarGPT what you drive and its answers will fit your car: the right oil interval, tire pressures and service schedule.</p>
        </div>
        <button class="btn light" data-action="vehicle-add">${icon('plus')}Add a car</button>
      </section>`;
  }
  const mine = state.reminders.filter((r) => r.vehicleId === v.id && !r.done).map(reminderStatus);
  const count = (s) => mine.filter((m) => m.status === s).length;
  const lamps = [
    ['red', count('overdue'), 'overdue'],
    ['amber', count('soon'), 'due soon'],
    ['green', count('upcoming'), 'on track'],
  ];
  const digits = String(Math.max(0, Math.round(Number(v.mileage) || 0))).padStart(6, '0').slice(-7);
  return `
    <section class="cluster" aria-label="Your car">
      <div class="cluster-car">
        <p class="cluster-kicker">${state.vehicles.length > 1 ? 'Primary car' : 'Your car'}</p>
        <h2>${esc(vehicleName(v))}</h2>
        <p class="cluster-meta">${esc([v.trim, v.fuel, v.nickname ? `“${v.nickname}”` : ''].filter(Boolean).join(', ') || 'No extra details yet')}</p>
        <div class="cluster-actions">
          <button class="btn light small" data-action="mileage" data-id="${v.id}">Update mileage</button>
          <a class="btn outline-light small" href="#/cars">${state.vehicles.length > 1 ? 'Switch car' : 'Edit car'}</a>
        </div>
      </div>
      <div class="odo" aria-label="Mileage ${num(v.mileage)} ${unit()}">
        <div class="odo-digits" aria-hidden="true">${[...digits].map((d) => `<span>${d}</span>`).join('')}</div>
        <span class="odo-unit" aria-hidden="true">${unit()}</span>
      </div>
      <a class="lamps" href="#/maintenance" aria-label="Maintenance status">
        ${lamps.map(([tone, n, label]) => `<span class="lamp ${tone} ${n ? 'on' : ''}"><i></i><b>${n}</b> ${label}</span>`).join('')}
      </a>
    </section>`;
}

function reminderRow(r, s, compact) {
  const v = getVehicle(r.vehicleId);
  return `
    <li class="rem ${s.status}">
      <i class="dot" aria-hidden="true"></i>
      <div class="rem-body">
        <strong>${esc(r.type === 'Other' && r.customName ? r.customName : r.type)}</strong>
        <span>${esc([v ? vehicleName(v) : '', s.text, r.dueDate && !r.done ? formatDate(r.dueDate) : ''].filter(Boolean).join(' · '))}</span>
        ${!compact && r.notes ? `<span class="rem-notes">${esc(r.notes)}</span>` : ''}
      </div>
      <div class="rem-actions">
        ${r.done ? `<button class="btn ghost small" data-action="rem-undo" data-id="${r.id}">Undo</button>` : `<button class="btn small" data-action="rem-done" data-id="${r.id}">Mark done</button>`}
        ${compact ? '' : `<button class="btn ghost small" data-action="rem-edit" data-id="${r.id}">Edit</button><button class="btn ghost small" data-action="rem-delete" data-id="${r.id}">Delete</button>`}
      </div>
    </li>`;
}

function viewHome() {
  const name = state.profile.name.trim();
  const open = sortedReminders().filter((x) => !x.r.done);
  const overdue = open.filter((x) => x.s.status === 'overdue');
  const tip = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length];
  main.innerHTML = `
    <header class="hello">
      <h1>${name ? `Hey, ${esc(name)}!` : 'Hey there!'}</h1>
      <p>What is going on with your car today?</p>
    </header>

    <form class="ask" data-form="ask">
      <label class="sr" for="ask-input">Ask CarGPT</label>
      <input id="ask-input" name="q" autocomplete="off" placeholder="Ask CarGPT anything about your car...">
      <button class="btn" type="submit">Ask</button>
    </form>
    <ul class="chips" aria-label="Suggested questions">
      ${SUGGESTED_QUESTIONS.map((q) => `<li><button data-action="ask" data-q="${esc(q)}">${esc(q)}</button></li>`).join('')}
    </ul>

    ${overdue.length ? `<a class="alert" href="#/maintenance"><i class="dot"></i><span><strong>${overdue.length} maintenance ${overdue.length === 1 ? 'task is' : 'tasks are'} overdue.</strong> ${esc(overdue.map((x) => x.r.type === 'Other' && x.r.customName ? x.r.customName : x.r.type).slice(0, 3).join(', '))}</span><span class="alert-link">Review</span></a>` : ''}

    ${clusterHtml()}

    <div class="cols">
      <section class="panel">
        <div class="panel-head">
          <h2>Maintenance reminders</h2>
          <button class="btn ghost small" data-action="rem-add">${icon('plus')}Add</button>
        </div>
        ${open.length ? `<ul class="rems">${open.slice(0, 4).map((x) => reminderRow(x.r, x.s, true)).join('')}</ul>${open.length > 4 ? `<a class="more" href="#/maintenance">See all ${open.length} reminders</a>` : ''}` : `<p class="empty-note">No reminders yet. Add your next oil change or registration renewal and CarGPT will flag it when it is due.</p>`}
      </section>

      <div class="stack">
        <section class="panel tip">
          <h2>${icon('bulb')}Tip of the day</h2>
          <p>${esc(tip)}</p>
        </section>
        <section class="panel">
          <h2>Quick access</h2>
          <div class="quick">
            <a href="#/lights">${icon('light')}<span>Warning lights guide</span></a>
            <button data-action="photo-chat">${icon('camera')}<span>Ask with a photo</span></button>
            <a href="#/cars">${icon('search')}<span>Find a car model</span></a>
            <button data-action="rem-add">${icon('wrench')}<span>New reminder</span></button>
          </div>
        </section>
      </div>
    </div>`;
}

/* ---------- chat ---------- */
const session = { id: null, mode: 'brief', vehicleId: null, image: null, lastImage: null, busy: false, abort: null };
let pendingPrompt = null;
let openPhotoPicker = false;

const getChat = (id) => state.chats.find((c) => c.id === id) || null;

function askCarGPT(text) {
  pendingPrompt = text;
  if (parseRoute().page === 'chat' && !parseRoute().arg) render();
  else location.hash = '#/chat';
}

function messageHtml(m, i, last) {
  if (m.role === 'user') {
    return `<div class="msg user">${m.thumb ? `<img src="${esc(m.thumb)}" alt="Photo you sent">` : m.hadImage ? '<span class="photo-note">Photo sent</span>' : ''}${m.content ? `<p>${esc(m.content).replace(/\n/g, '<br>')}</p>` : ''}</div>`;
  }
  if (m.error) {
    return `<div class="msg bot error"><p>${esc(m.error)}</p>${last ? '<button class="btn small" data-action="retry">Try again</button>' : ''}</div>`;
  }
  const waiting = last && session.busy && !m.content;
  return `<div class="msg bot" ${last ? 'id="live"' : ''}>${waiting ? '<p class="typing" aria-label="CarGPT is thinking"><i></i><i></i><i></i></p>' : md(m.content)}</div>`;
}

function viewChat(r) {
  const chat = r.arg ? getChat(r.arg) : null;
  if (r.arg && !chat) {
    history.replaceState(null, '', '#/chat');
  }
  if (chat && session.id !== chat.id) {
    Object.assign(session, { id: chat.id, vehicleId: chat.vehicleId || null, mode: chat.mode || state.settings.mode, image: null, lastImage: null });
  } else if (!chat && (session.id || !session.fresh)) {
    const p = primaryVehicle();
    Object.assign(session, { id: null, vehicleId: p ? p.id : null, mode: state.settings.mode, image: null, lastImage: null, fresh: true });
  }
  if (session.forceVehicle) {
    session.vehicleId = session.forceVehicle;
    session.forceVehicle = null;
  }
  if (session.vehicleId && !getVehicle(session.vehicleId)) session.vehicleId = null;
  const msgs = chat ? chat.messages : [];

  main.innerHTML = `
    <div class="chat">
      <header class="chat-head">
        <h1>${chat ? esc(chat.title) : 'New chat'}</h1>
        <div class="chat-tools">
          <label class="sr" for="chat-vehicle">Car for this chat</label>
          <select id="chat-vehicle" data-change="chat-vehicle" title="Car for this chat">
            <option value="">No specific car</option>
            ${state.vehicles.map((v) => `<option value="${v.id}" ${v.id === session.vehicleId ? 'selected' : ''}>${esc(vehicleName(v))}</option>`).join('')}
          </select>
          ${chat ? `<a class="btn ghost small" href="#/chat">${icon('plus')}New chat</a>` : ''}
        </div>
      </header>

      <div class="thread" id="thread" aria-live="polite">
        ${
          msgs.length
            ? msgs.map((m, i) => messageHtml(m, i, i === msgs.length - 1)).join('')
            : `<div class="welcome">
                <h2>Ask about anything car or driving related</h2>
                <p>Describe a noise, a smell or a warning light in your own words, or attach a photo. ${state.vehicles.length ? '' : '<a href="#/cars">Add your car</a> to get answers that fit it.'}</p>
                <ul class="chips">${SUGGESTED_QUESTIONS.map((q) => `<li><button data-action="ask" data-q="${esc(q)}">${esc(q)}</button></li>`).join('')}</ul>
              </div>`
        }
      </div>

      <form class="composer" data-form="chat">
        <div id="attach-preview"></div>
        <div class="composer-row">
          <button type="button" class="icon-btn" data-action="attach" title="Attach a photo" aria-label="Attach a photo">${icon('camera')}</button>
          <input type="file" id="file" accept="image/*" hidden>
          <label class="sr" for="chat-input">Message</label>
          <textarea id="chat-input" name="q" rows="1" placeholder="Ask CarGPT anything about your car..."></textarea>
          <button type="submit" class="icon-btn primary" id="send-btn" aria-label="${session.busy ? 'Stop' : 'Send'}" title="${session.busy ? 'Stop' : 'Send'}">${icon(session.busy ? 'stop' : 'send')}</button>
        </div>
        <div class="composer-foot">
          <div class="seg" role="group" aria-label="Answer length">
            <button type="button" data-action="mode" data-mode="brief" aria-pressed="${session.mode === 'brief'}">Brief</button>
            <button type="button" data-action="mode" data-mode="detailed" aria-pressed="${session.mode === 'detailed'}">Detailed</button>
          </div>
          <small>CarGPT can be wrong and cannot inspect your car. For anything safety-related, have a mechanic check it.</small>
        </div>
      </form>
    </div>`;

  renderAttachment();
  scrollThread(true);
  const input = $('#chat-input');
  if (matchMedia('(min-width: 800px)').matches) input.focus();
  if (pendingPrompt) {
    const q = pendingPrompt;
    pendingPrompt = null;
    sendMessage(q);
  }
  if (openPhotoPicker) {
    openPhotoPicker = false;
    toast('Tap the camera button to choose a photo.');
    const cam = $('[data-action="attach"]');
    if (cam) cam.classList.add('pulse');
  }
}

function renderAttachment() {
  const box = $('#attach-preview');
  if (!box) return;
  box.innerHTML = session.image
    ? `<div class="attach"><img src="${esc(session.image.thumb)}" alt="Attached photo"><span>Photo attached</span><button type="button" class="icon-btn" data-action="attach-remove" aria-label="Remove photo">${icon('close')}</button></div>`
    : '';
}

function scrollThread(force) {
  const t = $('#thread');
  if (!t) return;
  if (force || t.scrollHeight - t.scrollTop - t.clientHeight < 160) t.scrollTop = t.scrollHeight;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('That file is not a photo.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const draw = (max, q) => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', q);
      };
      const out = { full: draw(1280, 0.82), thumb: draw(240, 0.7) };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That photo could not be opened. Try a JPG or PNG.'));
    };
    img.src = url;
  });
}

async function sendMessage(text) {
  if (session.busy) return;
  text = String(text || '').trim();
  const image = session.image;
  if (!text && !image) return;
  let chat = getChat(session.id);
  const now = new Date().toISOString();
  if (!chat) {
    chat = { id: uid(), title: (text || 'Photo question').slice(0, 60), createdAt: now, updatedAt: now, vehicleId: session.vehicleId, mode: session.mode, messages: [] };
    state.chats.push(chat);
    session.id = chat.id;
    session.fresh = false;
    history.replaceState(null, '', '#/chat/' + chat.id);
  }
  chat.messages.push({ role: 'user', content: text, thumb: image ? image.thumb : undefined, hadImage: !!image, at: now });
  session.lastImage = image ? image.full : null;
  session.image = null;
  await requestReply(chat);
}

async function requestReply(chat) {
  const reply = { role: 'assistant', content: '', mode: session.mode, at: new Date().toISOString() };
  const history_ = chat.messages.slice(-20);
  chat.messages.push(reply);
  chat.updatedAt = reply.at;
  chat.vehicleId = session.vehicleId;
  chat.mode = session.mode;
  session.busy = true;
  session.abort = new AbortController();
  save();
  if (parseRoute().page === 'chat') render();

  const v = getVehicle(session.vehicleId);
  const payload = {
    mode: session.mode,
    units: unit(),
    name: state.profile.name,
    vehicle: v ? { year: v.year, make: v.make, model: v.model, trim: v.trim, fuel: v.fuel, mileage: v.mileage } : null,
    messages: history_.map((m, i) => ({
      role: m.role,
      content: m.error ? '' : m.content,
      hadImage: !!m.hadImage,
      image: i === history_.length - 1 && session.lastImage ? session.lastImage : undefined,
    })),
  };

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: session.abort.signal,
    });
    if (!res.ok) {
      let msg = 'CarGPT could not answer that right now. Try again in a moment.';
      try {
        msg = (await res.json()).error || msg;
      } catch {}
      throw new Error(msg);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      reply.content += decoder.decode(value, { stream: true });
      const live = $('#live');
      if (live && session.id === chat.id) {
        live.innerHTML = md(reply.content);
        scrollThread(false);
      }
    }
    if (!reply.content.trim()) throw new Error('CarGPT did not return an answer. Try asking again.');
  } catch (err) {
    if (err.name === 'AbortError') {
      if (!reply.content) reply.content = '*Stopped.*';
    } else {
      reply.error = err instanceof TypeError ? 'CarGPT could not be reached. Check your internet connection and try again.' : err.message;
    }
  } finally {
    session.busy = false;
    session.abort = null;
    if (!save()) toast('Storage is full. Delete old chats in Chat History.');
    const r = parseRoute();
    if (r.page === 'chat' && session.id === chat.id) render();
  }
}

/* ---------- my car ---------- */
const catalog = { makes: null, live: false, loading: null, models: new Map() };

function loadMakes() {
  if (catalog.makes) return Promise.resolve(catalog.makes);
  if (!catalog.loading) {
    catalog.loading = fetch('/api/vehicles')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!Array.isArray(d.makes) || !d.makes.length) throw new Error();
        const known = new Set(d.makes.map((m) => m.toLowerCase()));
        catalog.makes = [...d.makes, ...Object.keys(FALLBACK_CATALOG).filter((m) => !known.has(m.toLowerCase()))].sort((a, b) => a.localeCompare(b));
        catalog.live = true;
      })
      .catch(() => {
        catalog.makes = Object.keys(FALLBACK_CATALOG).sort();
        catalog.live = false;
      })
      .then(() => catalog.makes);
  }
  return catalog.loading;
}

async function loadModels(make, year) {
  const key = `${make}|${year || ''}`.toLowerCase();
  if (catalog.models.has(key)) return catalog.models.get(key);
  let result;
  try {
    const r = await fetch(`/api/vehicles?make=${encodeURIComponent(make)}${year ? `&year=${year}` : ''}`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    result = { models: d.models || [], live: true };
  } catch {
    const k = Object.keys(FALLBACK_CATALOG).find((m) => m.toLowerCase() === make.toLowerCase());
    result = { models: k ? FALLBACK_CATALOG[k] : [], live: false };
  }
  catalog.models.set(key, result);
  return result;
}

const YEARS = () => {
  const y = new Date().getFullYear() + 1;
  return Array.from({ length: y - 1979 }, (_, i) => y - i);
};

function viewCars(r) {
  if (r.arg === 'brand' && r.arg2) return viewBrand(r.arg2);
  const prim = primaryVehicle();
  main.innerHTML = `
    <header class="page-head">
      <div><h1>My Car</h1><p>Save the cars you drive so CarGPT can tailor its answers.</p></div>
      <button class="btn" data-action="vehicle-add">${icon('plus')}Add a car</button>
    </header>

    ${
      state.vehicles.length
        ? `<ul class="cars">${state.vehicles
            .map((v) => {
              const isPrim = prim && prim.id === v.id;
              return `
            <li class="carcard ${isPrim ? 'primary' : ''}">
              <div class="carcard-top">
                <h2>${esc(vehicleName(v))}</h2>
                ${isPrim ? '<span class="tag">Primary</span>' : ''}
              </div>
              <p>${esc([v.nickname ? `“${v.nickname}”` : '', v.trim, v.fuel, v.mileage ? `${num(v.mileage)} ${unit()}` : 'Mileage not set'].filter(Boolean).join(' · '))}</p>
              <div class="carcard-actions">
                ${isPrim ? '' : `<button class="btn small" data-action="vehicle-primary" data-id="${v.id}">Set as primary</button>`}
                <button class="btn ghost small" data-action="vehicle-ask" data-id="${v.id}">Ask about this car</button>
                <button class="btn ghost small" data-action="vehicle-edit" data-id="${v.id}">Edit</button>
                <button class="btn ghost small" data-action="vehicle-remove" data-id="${v.id}">Remove</button>
              </div>
            </li>`;
            })
            .join('')}</ul>`
        : `<div class="panel empty-state"><h2>No cars saved yet</h2><p>Add your car, or search for a brand below and pick your model.</p></div>`
    }

    <section class="panel finder">
      <h2>Find a car</h2>
      <p>Search any brand to see its models, read an overview, or add one to My Car.</p>
      <div class="search">
        ${icon('search')}
        <label class="sr" for="make-search">Search car brands</label>
        <input id="make-search" type="search" placeholder="Search brands, for example Toyota or BMW" autocomplete="off" data-input="make-search">
      </div>
      <div id="make-results"></div>
    </section>`;
  renderMakeResults('');
  loadMakes().then(() => {
    const input = $('#make-search');
    if (input) renderMakeResults(input.value);
  });
}

function renderMakeResults(query) {
  const box = $('#make-results');
  if (!box) return;
  const q = query.trim().toLowerCase();
  if (!q) {
    box.innerHTML = `<h3>Popular brands</h3><ul class="brands">${POPULAR_BRANDS.map((b) => `<li><a href="#/cars/brand/${encodeURIComponent(b)}">${esc(b)}</a></li>`).join('')}</ul>`;
    return;
  }
  if (!catalog.makes) {
    box.innerHTML = '<p class="empty-note">Loading brands...</p>';
    return;
  }
  const hits = catalog.makes
    .filter((m) => m.toLowerCase().includes(q))
    .sort((a, b) => Number(b.toLowerCase().startsWith(q)) - Number(a.toLowerCase().startsWith(q)) || a.localeCompare(b))
    .slice(0, 36);
  box.innerHTML = hits.length
    ? `<h3>${hits.length === 36 ? 'Top matches' : `${hits.length} ${hits.length === 1 ? 'brand' : 'brands'} found`}</h3><ul class="brands">${hits.map((b) => `<li><a href="#/cars/brand/${encodeURIComponent(b)}">${esc(b)}</a></li>`).join('')}</ul>`
    : `<p class="empty-note">No brand matches “${esc(query)}”. You can still <button class="link" data-action="vehicle-add" data-make="${esc(query.trim())}">add it by typing the details</button>.</p>`;
}

let brandYear = '';
function viewBrand(make) {
  main.innerHTML = `
    <a class="backlink" href="#/cars">${icon('back')}My Car</a>
    <header class="page-head">
      <div><h1>${esc(make)}</h1><p>Pick a model to read about it or add it to My Car.</p></div>
      <div class="field inline">
        <label for="brand-year">Model year</label>
        <select id="brand-year" data-change="brand-year">
          <option value="">Any year</option>
          ${YEARS().map((y) => `<option ${String(y) === brandYear ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
      </div>
    </header>
    <div id="models"><p class="empty-note">Loading ${esc(make)} models...</p></div>`;
  loadModels(make, brandYear).then((res) => {
    const box = $('#models');
    const r = parseRoute();
    if (!box || r.arg2 !== make) return;
    box.innerHTML = res.models.length
      ? `${res.live ? '' : '<p class="notice">The full car database is not reachable right now, so this is a short list of popular models.</p>'}
         <ul class="models">${res.models.map((m) => `<li><button data-action="model" data-make="${esc(make)}" data-model="${esc(m)}">${esc(make)} ${esc(m)}</button></li>`).join('')}</ul>`
      : `<div class="panel empty-state"><h2>No models found${brandYear ? ` for ${brandYear}` : ''}</h2><p>Try another year, or add the car by typing its details.</p><button class="btn" data-action="vehicle-add" data-make="${esc(make)}">Add a ${esc(make)}</button></div>`;
  });
}

function modelDialog(make, model) {
  const label = [brandYear, make, model].filter(Boolean).join(' ');
  openDialog(`
    <div class="dlg">
      <h2>${esc(label)}</h2>
      <p>What would you like to do with this model?</p>
      <div class="choice">
        <button class="btn" data-action="model-add" data-make="${esc(make)}" data-model="${esc(model)}">${icon('plus')}Add to My Car</button>
        <button class="btn ghost" data-action="model-overview" data-label="${esc(label)}">Get an overview from CarGPT</button>
        <button class="btn ghost" data-action="model-specs" data-label="${esc(label)}">Ask about specs and running costs</button>
      </div>
      <div class="dlg-actions"><button class="btn ghost" data-action="dialog-close">Close</button></div>
    </div>`);
}

function vehicleDialog(v = {}) {
  const editing = !!v.id;
  openDialog(`
    <form class="dlg" data-form="vehicle">
      <h2>${editing ? 'Edit car' : 'Add a car'}</h2>
      <input type="hidden" name="id" value="${esc(v.id || '')}">
      <div class="fields">
        <div class="field"><label for="v-year">Year</label>
          <select id="v-year" name="year" required>
            <option value="">Choose</option>
            ${YEARS().map((y) => `<option ${String(v.year) === String(y) ? 'selected' : ''}>${y}</option>`).join('')}
          </select></div>
        <div class="field"><label for="v-make">Brand</label>
          <input id="v-make" name="make" required maxlength="40" list="makes-list" value="${esc(v.make || '')}" placeholder="Toyota" data-change="vehicle-make" autocomplete="off">
          <datalist id="makes-list">${(catalog.makes || Object.keys(FALLBACK_CATALOG)).map((m) => `<option value="${esc(m)}">`).join('')}</datalist></div>
        <div class="field"><label for="v-model">Model</label>
          <input id="v-model" name="model" required maxlength="60" list="models-list" value="${esc(v.model || '')}" placeholder="Camry" autocomplete="off">
          <datalist id="models-list"></datalist></div>
        <div class="field"><label for="v-trim">Trim or engine <span>(optional)</span></label>
          <input id="v-trim" name="trim" maxlength="40" value="${esc(v.trim || '')}" placeholder="SE 2.5L"></div>
        <div class="field"><label for="v-mileage">Mileage (${unit()})</label>
          <input id="v-mileage" name="mileage" type="number" min="0" max="9999999" step="1" inputmode="numeric" value="${esc(v.mileage || '')}" placeholder="45000"></div>
        <div class="field"><label for="v-fuel">Fuel type</label>
          <select id="v-fuel" name="fuel">
            <option value="">Not sure</option>
            ${FUEL_TYPES.map((f) => `<option ${v.fuel === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select></div>
        <div class="field wide"><label for="v-nick">Nickname <span>(optional)</span></label>
          <input id="v-nick" name="nickname" maxlength="30" value="${esc(v.nickname || '')}" placeholder="Family car"></div>
      </div>
      ${editing || !state.vehicles.length ? '' : '<label class="check"><input type="checkbox" name="primary"> Make this my primary car</label>'}
      <div class="dlg-actions">
        <button type="button" class="btn ghost" data-action="dialog-close">Cancel</button>
        <button type="submit" class="btn">${editing ? 'Save changes' : 'Add car'}</button>
      </div>
    </form>`, { wide: true });
  loadMakes().then((makes) => {
    const dl = $('#makes-list');
    if (dl) dl.innerHTML = makes.map((m) => `<option value="${esc(m)}">`).join('');
  });
  if (v.make) fillModelList(v.make);
}

async function fillModelList(make) {
  if (!make) return;
  const res = await loadModels(make, '');
  const dl = $('#models-list');
  if (dl) dl.innerHTML = res.models.map((m) => `<option value="${esc(m)}">`).join('');
}

function mileageDialog(id) {
  const v = getVehicle(id);
  if (!v) return;
  openDialog(`
    <form class="dlg" data-form="mileage">
      <h2>Update mileage</h2>
      <p>${esc(vehicleName(v))}</p>
      <input type="hidden" name="id" value="${v.id}">
      <div class="field"><label for="m-mileage">Current mileage (${unit()})</label>
        <input id="m-mileage" name="mileage" type="number" min="0" max="9999999" step="1" inputmode="numeric" required value="${esc(v.mileage || '')}"></div>
      <div class="dlg-actions">
        <button type="button" class="btn ghost" data-action="dialog-close">Cancel</button>
        <button type="submit" class="btn">Save mileage</button>
      </div>
    </form>`);
}

/* ---------- maintenance ---------- */
let remFilter = '';
function viewMaintenance() {
  const all = sortedReminders().filter((x) => !remFilter || x.r.vehicleId === remFilter);
  const groups = [
    ['overdue', 'Overdue'],
    ['soon', 'Due soon'],
    ['upcoming', 'Upcoming'],
    ['done', 'Completed'],
  ];
  main.innerHTML = `
    <header class="page-head">
      <div><h1>Maintenance</h1><p>Track services and renewals so nothing gets missed.</p></div>
      <button class="btn" data-action="rem-add">${icon('plus')}Add reminder</button>
    </header>
    ${
      state.vehicles.length > 1
        ? `<div class="field inline"><label for="rem-filter">Show</label>
            <select id="rem-filter" data-change="rem-filter">
              <option value="">All cars</option>
              ${state.vehicles.map((v) => `<option value="${v.id}" ${remFilter === v.id ? 'selected' : ''}>${esc(vehicleName(v))}</option>`).join('')}
            </select></div>`
        : ''
    }
    ${
      all.length
        ? groups
            .map(([key, label]) => {
              const items = all.filter((x) => x.s.status === key);
              return items.length ? `<section class="panel group ${key}"><h2>${label} <span>${items.length}</span></h2><ul class="rems">${items.map((x) => reminderRow(x.r, x.s, false)).join('')}</ul></section>` : '';
            })
            .join('')
        : `<div class="panel empty-state"><h2>No reminders yet</h2><p>Add one for your next oil change, tire rotation, inspection or registration renewal. You can set a date, a mileage, or both.</p><button class="btn" data-action="rem-add">${icon('plus')}Add reminder</button></div>`
    }`;
}

function reminderDialog(r = {}) {
  const editing = !!r.id;
  const type = r.type || MAINTENANCE_TYPES[0];
  const vid = r.vehicleId !== undefined ? r.vehicleId : (primaryVehicle() || {}).id || '';
  openDialog(`
    <form class="dlg" data-form="reminder">
      <h2>${editing ? 'Edit reminder' : 'Add reminder'}</h2>
      <input type="hidden" name="id" value="${esc(r.id || '')}">
      <div class="fields">
        <div class="field"><label for="r-type">Maintenance type</label>
          <select id="r-type" name="type" data-change="rem-type">
            ${MAINTENANCE_TYPES.map((t) => `<option ${t === type ? 'selected' : ''}>${t}</option>`).join('')}
          </select></div>
        <div class="field"><label for="r-vehicle">Car</label>
          <select id="r-vehicle" name="vehicleId">
            ${state.vehicles.map((v) => `<option value="${v.id}" ${v.id === vid ? 'selected' : ''}>${esc(vehicleName(v))}</option>`).join('')}
            <option value="" ${vid ? '' : 'selected'}>Not linked to a car</option>
          </select></div>
        <div class="field wide" id="r-custom-wrap" ${type === 'Other' ? '' : 'hidden'}><label for="r-custom">Task name</label>
          <input id="r-custom" name="customName" maxlength="60" value="${esc(r.customName || '')}" placeholder="Replace wiper blades"></div>
        <div class="field"><label for="r-date">Due date</label>
          <input id="r-date" name="dueDate" type="date" value="${esc(r.dueDate || '')}"></div>
        <div class="field"><label for="r-mileage">Due at mileage (${unit()}) <span>(optional)</span></label>
          <input id="r-mileage" name="dueMileage" type="number" min="0" max="9999999" step="1" inputmode="numeric" value="${esc(r.dueMileage || '')}"></div>
        <div class="field"><label for="r-repeat">Repeat</label>
          <select id="r-repeat" name="repeatMonths">
            ${[['', 'Does not repeat'], ['3', 'Every 3 months'], ['6', 'Every 6 months'], ['12', 'Every year'], ['24', 'Every 2 years']].map(([val, l]) => `<option value="${val}" ${String(r.repeatMonths || '') === val ? 'selected' : ''}>${l}</option>`).join('')}
          </select></div>
        <div class="field wide"><label for="r-notes">Notes <span>(optional)</span></label>
          <textarea id="r-notes" name="notes" rows="2" maxlength="300" placeholder="Garage name, parts needed, cost...">${esc(r.notes || '')}</textarea></div>
      </div>
      <p class="form-error" id="r-error" hidden></p>
      <div class="dlg-actions">
        <button type="button" class="btn ghost" data-action="dialog-close">Cancel</button>
        <button type="submit" class="btn">${editing ? 'Save changes' : 'Add reminder'}</button>
      </div>
    </form>`, { wide: true });
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T00:00');
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/* ---------- history ---------- */
function viewHistory() {
  main.innerHTML = `
    <header class="page-head">
      <div><h1>Chat History</h1><p>Pick up an earlier conversation where you left off.</p></div>
      ${state.chats.length ? '<button class="btn ghost" data-action="history-clear">Delete all chats</button>' : ''}
    </header>
    ${
      state.chats.length
        ? `<div class="search">${icon('search')}<label class="sr" for="history-search">Search chats</label><input id="history-search" type="search" placeholder="Search your chats" data-input="history-search" autocomplete="off"></div><div id="history-list"></div>`
        : `<div class="panel empty-state"><h2>No chats yet</h2><p>Your conversations with CarGPT are saved here on this device.</p><a class="btn" href="#/chat">Start a chat</a></div>`
    }`;
  renderHistoryList('');
}

function renderHistoryList(query) {
  const box = $('#history-list');
  if (!box) return;
  const q = query.trim().toLowerCase();
  const chats = [...state.chats]
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .filter((c) => !q || c.title.toLowerCase().includes(q) || c.messages.some((m) => (m.content || '').toLowerCase().includes(q)));
  box.innerHTML = chats.length
    ? `<ul class="chats">${chats
        .map((c) => {
          const v = getVehicle(c.vehicleId);
          const lastBot = [...c.messages].reverse().find((m) => m.role === 'assistant' && m.content);
          return `
        <li>
          <a href="#/chat/${c.id}">
            <strong>${esc(c.title)}</strong>
            <span>${esc([formatDate(c.updatedAt), v ? vehicleName(v) : '', `${c.messages.length} messages`].filter(Boolean).join(' · '))}</span>
            ${lastBot ? `<em>${esc(lastBot.content.replace(/[#*_`]/g, '').slice(0, 140))}</em>` : ''}
          </a>
          <div>
            <button class="btn ghost small" data-action="chat-rename" data-id="${c.id}">Rename</button>
            <button class="btn ghost small" data-action="chat-delete" data-id="${c.id}">Delete</button>
          </div>
        </li>`;
        })
        .join('')}</ul>`
    : `<p class="empty-note">No chats match “${esc(query)}”.</p>`;
}

/* ---------- settings ---------- */
function viewSettings() {
  const s = state.settings;
  const radio = (name, value, label, hint) => `<label class="option"><input type="radio" name="${name}" value="${value}" ${s[name] === value ? 'checked' : ''}><span><strong>${label}</strong>${hint ? `<small>${hint}</small>` : ''}</span></label>`;
  main.innerHTML = `
    <header class="page-head"><div><h1>Settings</h1><p>Changes are saved as you make them.</p></div></header>
    <form class="settings" data-form="settings">
      <section class="panel">
        <h2>Profile</h2>
        <div class="field"><label for="s-name">Display name</label>
          <input id="s-name" name="name" maxlength="40" value="${esc(state.profile.name)}" placeholder="Ahmed" autocomplete="given-name">
          <small>Shown in your greeting on the Home page.</small></div>
      </section>
      <section class="panel">
        <h2>Default answer length</h2>
        <div class="options">
          ${radio('mode', 'brief', 'Brief', 'Short, direct answers with the key points.')}
          ${radio('mode', 'detailed', 'Detailed', 'Causes, what to check, what to do and when to see a mechanic.')}
        </div>
        <small>You can still switch per message in the chat.</small>
      </section>
      <section class="panel">
        <h2>Distance units</h2>
        <div class="options">
          ${radio('units', 'km', 'Kilometres')}
          ${radio('units', 'mi', 'Miles')}
        </div>
      </section>
      <section class="panel">
        <h2>Appearance</h2>
        <div class="options three">
          ${radio('theme', 'system', 'Match device')}
          ${radio('theme', 'light', 'Light')}
          ${radio('theme', 'dark', 'Dark')}
        </div>
      </section>
    </form>
    <section class="panel">
      <h2>Your data</h2>
      <p>Your cars, reminders and chats are stored in this browser only. Chat messages and photos are sent to the AI provider (Google Gemini) to generate answers, and on its free tier Google may use them to improve its products, so avoid sharing personal details in chats.</p>
      <div class="row">
        <button class="btn ghost" data-action="export">Download a backup</button>
        <button class="btn ghost" data-action="import">Restore from backup</button>
        <input type="file" id="import-file" accept="application/json,.json" hidden>
        <button class="btn danger" data-action="wipe">Delete all my data</button>
      </div>
    </section>
    <section class="panel">
      <h2>About CarGPT</h2>
      <p>CarGPT explains cars in plain language for new drivers and first-time owners. It gives general guidance and cannot inspect your vehicle, so treat its answers as a starting point and have a qualified mechanic confirm anything safety-related.</p>
    </section>`;
}

/* ---------- warning lights ---------- */
function viewLights() {
  main.innerHTML = `
    <a class="backlink" href="#/home">${icon('back')}Home</a>
    <header class="page-head"><div><h1>Dashboard warning lights</h1><p>Red means stop safely. Amber means get it checked soon. Tap a light for what to do.</p></div></header>
    <ul class="lights">
      ${WARNING_LIGHTS.map((l) => {
        const u = URGENCY[l.urgency];
        return `
        <li class="lightcard ${u.tone}">
          <details>
            <summary>
              <span class="telltale">${glyph(l.glyph)}</span>
              <span class="light-title"><strong>${esc(l.name)}</strong><span class="urg">${u.label}</span></span>
            </summary>
            <div class="light-body">
              <h3>What it means</h3><p>${esc(l.meaning)}</p>
              <h3>Possible causes</h3><ul>${l.causes.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
              <h3>What to do</h3><p>${esc(l.action)}</p>
              <button class="btn small" data-action="ask" data-q="${esc(`My ${l.name.toLowerCase()} is on. What should I check and what should I do?`)}">Ask CarGPT about this light</button>
            </div>
          </details>
        </li>`;
      }).join('')}
    </ul>
    <p class="notice">Not sure which light you are seeing? <button class="link" data-action="photo-chat">Send CarGPT a photo of your dashboard.</button></p>`;
}

/* ---------- events ---------- */
const actions = {
  ask: (el) => askCarGPT(el.dataset.q),
  'photo-chat': () => {
    openPhotoPicker = true;
    if (parseRoute().page === 'chat' && !parseRoute().arg) render();
    else location.hash = '#/chat';
  },
  'dialog-close': closeDialog,
  attach: () => $('#file').click(),
  'attach-remove': () => {
    session.image = null;
    renderAttachment();
  },
  mode: (el) => {
    session.mode = el.dataset.mode;
    document.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === session.mode)));
  },
  retry: () => {
    const chat = getChat(session.id);
    if (!chat || session.busy) return;
    if (chat.messages.length && chat.messages[chat.messages.length - 1].role === 'assistant') chat.messages.pop();
    requestReply(chat);
  },
  'vehicle-add': (el) => vehicleDialog({ make: el.dataset.make || '' }),
  'vehicle-edit': (el) => vehicleDialog(getVehicle(el.dataset.id) || {}),
  'vehicle-primary': (el) => {
    state.primaryVehicleId = el.dataset.id;
    save();
    render();
    toast('Primary car updated');
  },
  'vehicle-ask': (el) => {
    session.fresh = false;
    session.id = null;
    session.forceVehicle = el.dataset.id;
    if (parseRoute().page === 'chat' && !parseRoute().arg) render();
    else location.hash = '#/chat';
  },
  'vehicle-remove': async (el) => {
    const v = getVehicle(el.dataset.id);
    if (!v) return;
    const linked = state.reminders.filter((r) => r.vehicleId === v.id).length;
    const ok = await confirmDialog(`Remove ${vehicleName(v)}?`, linked ? `Its ${linked} maintenance ${linked === 1 ? 'reminder' : 'reminders'} will be removed too. This cannot be undone.` : 'This cannot be undone.', 'Remove car');
    if (!ok) return;
    state.vehicles = state.vehicles.filter((x) => x.id !== v.id);
    state.reminders = state.reminders.filter((r) => r.vehicleId !== v.id);
    if (state.primaryVehicleId === v.id) state.primaryVehicleId = state.vehicles[0] ? state.vehicles[0].id : null;
    save();
    render();
    toast('Car removed');
  },
  mileage: (el) => mileageDialog(el.dataset.id),
  model: (el) => modelDialog(el.dataset.make, el.dataset.model),
  'model-add': (el) => vehicleDialog({ make: el.dataset.make, model: el.dataset.model, year: brandYear }),
  'model-overview': (el) => {
    closeDialog();
    askCarGPT(`Give me a beginner-friendly overview of the ${el.dataset.label}: what kind of car it is, what it is known for, and what owners should watch out for.`);
  },
  'model-specs': (el) => {
    closeDialog();
    askCarGPT(`What are the key specifications of the ${el.dataset.label} (engine options, fuel economy, size, safety features), and what does it typically cost to run and maintain?`);
  },
  'rem-add': () => reminderDialog(),
  'rem-edit': (el) => reminderDialog(state.reminders.find((r) => r.id === el.dataset.id) || {}),
  'rem-done': (el) => {
    const r = state.reminders.find((x) => x.id === el.dataset.id);
    if (!r) return;
    r.done = true;
    r.doneAt = todayStr();
    let msg = 'Marked done';
    if (r.repeatMonths) {
      const months = Number(r.repeatMonths);
      const base = r.dueDate && r.dueDate > todayStr() ? r.dueDate : todayStr();
      state.reminders.push({ ...r, id: uid(), done: false, doneAt: null, dueDate: addMonths(base, months), dueMileage: '' });
      msg = `Marked done. Next one is due ${formatDate(addMonths(base, months))}.`;
    }
    save();
    render();
    toast(msg);
  },
  'rem-undo': (el) => {
    const r = state.reminders.find((x) => x.id === el.dataset.id);
    if (!r) return;
    r.done = false;
    r.doneAt = null;
    save();
    render();
  },
  'rem-delete': async (el) => {
    const r = state.reminders.find((x) => x.id === el.dataset.id);
    if (!r) return;
    if (!(await confirmDialog('Delete this reminder?', `${r.type === 'Other' && r.customName ? r.customName : r.type} will be removed. This cannot be undone.`, 'Delete reminder'))) return;
    state.reminders = state.reminders.filter((x) => x.id !== r.id);
    save();
    render();
    toast('Reminder deleted');
  },
  'chat-rename': (el) => {
    const c = getChat(el.dataset.id);
    if (!c) return;
    openDialog(`
      <form class="dlg" data-form="chat-rename">
        <h2>Rename chat</h2>
        <input type="hidden" name="id" value="${c.id}">
        <div class="field"><label for="c-title">Title</label><input id="c-title" name="title" required maxlength="60" value="${esc(c.title)}"></div>
        <div class="dlg-actions"><button type="button" class="btn ghost" data-action="dialog-close">Cancel</button><button type="submit" class="btn">Save title</button></div>
      </form>`);
  },
  'chat-delete': async (el) => {
    const c = getChat(el.dataset.id);
    if (!c) return;
    if (!(await confirmDialog('Delete this chat?', `“${c.title}” will be removed. This cannot be undone.`, 'Delete chat'))) return;
    state.chats = state.chats.filter((x) => x.id !== c.id);
    if (session.id === c.id) session.id = null;
    save();
    render();
    toast('Chat deleted');
  },
  'history-clear': async () => {
    if (!(await confirmDialog('Delete all chats?', `All ${state.chats.length} conversations will be removed. This cannot be undone.`, 'Delete all chats'))) return;
    state.chats = [];
    session.id = null;
    save();
    render();
    toast('All chats deleted');
  },
  export: () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cargpt-backup-${todayStr()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  import: () => $('#import-file').click(),
  wipe: async () => {
    if (!(await confirmDialog('Delete all your data?', 'Your cars, reminders, chats and settings will be removed from this browser. This cannot be undone.', 'Delete everything'))) return;
    replaceState(null);
    session.id = null;
    applyTheme();
    location.hash = '#/home';
    render();
    toast('All data deleted');
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) {
    e.preventDefault();
    fn(el);
  }
});

const formData = (form) => Object.fromEntries(new FormData(form).entries());

const forms = {
  ask: (f) => {
    const q = f.q.value.trim();
    if (q) askCarGPT(q);
    else location.hash = '#/chat';
  },
  chat: (f) => {
    if (session.busy) {
      if (session.abort) session.abort.abort();
      return;
    }
    const q = f.q.value;
    if (!q.trim() && !session.image) return;
    sendMessage(q);
  },
  vehicle: (f) => {
    const d = formData(f);
    const data = {
      year: d.year,
      make: d.make.trim(),
      model: d.model.trim(),
      trim: d.trim.trim(),
      mileage: d.mileage ? Math.round(Number(d.mileage)) : '',
      fuel: d.fuel,
      nickname: d.nickname.trim(),
    };
    if (d.id) {
      Object.assign(getVehicle(d.id) || {}, data);
      toast('Car updated');
    } else {
      const v = { id: uid(), ...data };
      state.vehicles.push(v);
      if (!state.primaryVehicleId || d.primary) state.primaryVehicleId = v.id;
      toast(`${vehicleName(v)} added to My Car`);
    }
    save();
    closeDialog();
    if (parseRoute().page === 'cars' && parseRoute().arg) location.hash = '#/cars';
    else render();
  },
  mileage: (f) => {
    const v = getVehicle(f.elements.id.value);
    if (v) v.mileage = Math.round(Number(f.mileage.value));
    save();
    closeDialog();
    render();
    toast('Mileage updated');
  },
  reminder: (f) => {
    const d = formData(f);
    const err = $('#r-error');
    const fail = (msg) => {
      err.textContent = msg;
      err.hidden = false;
    };
    if (d.type === 'Other' && !d.customName.trim()) return fail('Give the task a name.');
    if (!d.dueDate && !d.dueMileage) return fail('Set a due date, a due mileage, or both.');
    const data = {
      type: d.type,
      customName: d.type === 'Other' ? d.customName.trim() : '',
      vehicleId: d.vehicleId,
      dueDate: d.dueDate,
      dueMileage: d.dueMileage ? Math.round(Number(d.dueMileage)) : '',
      repeatMonths: d.repeatMonths,
      notes: d.notes.trim(),
    };
    if (d.id) {
      Object.assign(state.reminders.find((r) => r.id === d.id) || {}, data);
      toast('Reminder updated');
    } else {
      state.reminders.push({ id: uid(), done: false, doneAt: null, ...data });
      toast('Reminder added');
    }
    save();
    closeDialog();
    render();
  },
  'chat-rename': (f) => {
    const c = getChat(f.elements.id.value);
    if (c && f.elements.title.value.trim()) c.title = f.elements.title.value.trim();
    save();
    closeDialog();
    render();
  },
  settings: () => {},
};

document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  forms[f.dataset.form](f);
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.input === 'make-search') renderMakeResults(t.value);
  else if (t.dataset.input === 'history-search') renderHistoryList(t.value);
  else if (t.id === 'chat-input') {
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 160) + 'px';
  } else if (t.id === 's-name') {
    state.profile.name = t.value.trim();
    save();
  }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.id === 'file') {
    const file = t.files[0];
    t.value = '';
    if (!file) return;
    try {
      session.image = await loadImage(file);
      renderAttachment();
      $('#chat-input').focus();
    } catch (err) {
      toast(err.message);
    }
  } else if (t.id === 'import-file') {
    const file = t.files[0];
    t.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !Array.isArray(data.vehicles) || !Array.isArray(data.chats)) throw new Error();
      if (!(await confirmDialog('Restore this backup?', 'It will replace the cars, reminders, chats and settings currently in this browser.', 'Restore backup'))) return;
      replaceState({
        profile: { name: String((data.profile || {}).name || '').slice(0, 40) },
        settings: { mode: 'brief', theme: 'system', units: 'km', ...(data.settings || {}) },
        vehicles: data.vehicles,
        primaryVehicleId: data.primaryVehicleId || null,
        reminders: Array.isArray(data.reminders) ? data.reminders : [],
        chats: data.chats,
      });
      applyTheme();
      render();
      toast('Backup restored');
    } catch {
      toast('That file is not a CarGPT backup.');
    }
  } else if (t.dataset.change === 'chat-vehicle') {
    session.vehicleId = t.value || null;
    const chat = getChat(session.id);
    if (chat) {
      chat.vehicleId = session.vehicleId;
      save();
    }
  } else if (t.dataset.change === 'brand-year') {
    brandYear = t.value;
    render();
  } else if (t.dataset.change === 'rem-filter') {
    remFilter = t.value;
    render();
  } else if (t.dataset.change === 'rem-type') {
    $('#r-custom-wrap').hidden = t.value !== 'Other';
  } else if (t.dataset.change === 'vehicle-make') {
    fillModelList(t.value.trim());
  } else if (t.closest('[data-form="settings"]') && t.type === 'radio') {
    state.settings[t.name] = t.value;
    save();
    applyTheme();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target.id === 'chat-input' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    e.target.form.requestSubmit();
  }
});

applyTheme();
if (!location.hash) history.replaceState(null, '', '#/home');
render();
