// All user data lives in the browser (localStorage). Nothing is sent to a server except chat messages.

const KEY = 'cargpt.v1';

const defaults = () => ({
  profile: { name: '' },
  settings: { mode: 'brief', theme: 'system', units: 'km' },
  vehicles: [],
  primaryVehicleId: null,
  reminders: [],
  chats: [],
});

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 12);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return defaults();
    const d = defaults();
    return {
      ...d,
      ...raw,
      profile: { ...d.profile, ...(raw.profile || {}) },
      settings: { ...d.settings, ...(raw.settings || {}) },
      vehicles: Array.isArray(raw.vehicles) ? raw.vehicles : [],
      reminders: Array.isArray(raw.reminders) ? raw.reminders : [],
      chats: Array.isArray(raw.chats) ? raw.chats : [],
    };
  } catch {
    return defaults();
  }
}

export const state = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    // Storage is full: drop stored photo thumbnails from the oldest chats and retry once.
    state.chats.slice(0, -3).forEach((c) => c.messages.forEach((m) => delete m.thumb));
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }
}

export function replaceState(next) {
  const d = defaults();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, d, next || {});
  save();
}

export const vehicleName = (v) => (v ? [v.year, v.make, v.model].filter(Boolean).join(' ') : '');

export const getVehicle = (id) => state.vehicles.find((v) => v.id === id) || null;

export const primaryVehicle = () => getVehicle(state.primaryVehicleId) || state.vehicles[0] || null;

const DAY = 86400000;
export const todayStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// Returns { status: 'done' | 'overdue' | 'soon' | 'upcoming', text }
export function reminderStatus(r) {
  if (r.done) return { status: 'done', text: r.doneAt ? `Done ${formatDate(r.doneAt)}` : 'Done' };
  const unit = state.settings.units;
  const v = getVehicle(r.vehicleId);
  let status = 'upcoming';
  const parts = [];
  if (r.dueDate) {
    const days = Math.round((new Date(r.dueDate + 'T00:00') - new Date(todayStr() + 'T00:00')) / DAY);
    if (days < 0) {
      status = 'overdue';
      parts.push(`${-days} day${days === -1 ? '' : 's'} overdue`);
    } else if (days === 0) {
      status = 'soon';
      parts.push('Due today');
    } else {
      if (days <= 14) status = 'soon';
      parts.push(`Due in ${days} day${days === 1 ? '' : 's'}`);
    }
  }
  if (r.dueMileage && v && v.mileage) {
    const left = Number(r.dueMileage) - Number(v.mileage);
    if (left <= 0) {
      status = 'overdue';
      parts.push(`${Math.abs(left).toLocaleString()} ${unit} past due`);
    } else {
      if (left <= 500 && status !== 'overdue') status = 'soon';
      parts.push(`${left.toLocaleString()} ${unit} to go`);
    }
  } else if (r.dueMileage) {
    parts.push(`At ${Number(r.dueMileage).toLocaleString()} ${unit}`);
  }
  if (!parts.length) parts.push('No due date');
  return { status, text: parts.join(', ') };
}

export function formatDate(s) {
  if (!s) return '';
  const d = new Date(s.length === 10 ? s + 'T00:00' : s);
  if (isNaN(d)) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const ORDER = { overdue: 0, soon: 1, upcoming: 2, done: 3 };
export function sortedReminders() {
  return state.reminders
    .map((r) => ({ r, s: reminderStatus(r) }))
    .sort((a, b) => ORDER[a.s.status] - ORDER[b.s.status] || String(a.r.dueDate || '9999').localeCompare(String(b.r.dueDate || '9999')));
}
