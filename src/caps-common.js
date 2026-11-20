// ============================================================
//  CAPS Portal - shared helpers (auth guard, notifications, photos)
// ============================================================
import { auth, db, ADMIN_EMAIL } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc,
  updateDoc, getDocs, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ---------- small utilities ---------- */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const statusSteps = ['Pending', 'Under Review', 'In Progress', 'Resolved'];
export const statusStyle = {
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Under Review': 'bg-sky-50 text-sky-700 border-sky-200',
  'In Progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200'
};
export function initialsOf(name) {
  return String(name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}
export const toDate = (ts) => (ts && ts.toDate) ? ts.toDate() : (ts instanceof Date ? ts : null);
export const ms = (ts) => { const d = toDate(ts); return d ? d.getTime() : Date.now(); };
export const fmtDate = (ts) => (toDate(ts) || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtDateTime = (ts) => (toDate(ts) || new Date()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const docData = (d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) });

export function setAvatar(el, picture, ini) {
  if (!el) return;
  if (picture) { el.classList.add('overflow-hidden'); el.innerHTML = `<img src="${esc(picture)}" alt="" class="w-full h-full object-cover">`; }
  else el.textContent = ini;
}

/* ---------- auth guard ---------- */
// Resolves with { user, profile, isAdmin }. Redirects when the person should not be on this page.
export function requireUser({ admin = false } = {}) {
  return new Promise((resolve) => {
    let started = false;
    onAuthStateChanged(auth, async (user) => {
      if (!user) { location.replace('login.html'); return; }
      if (started) return;
      started = true;
      const isAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
      if (admin && !isAdmin) { location.replace('dashboard.html'); return; }
      if (!admin && isAdmin) { location.replace('admin.html'); return; }

      let profile = null;
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) profile = snap.data();
        else {
          const parts = (user.displayName || '').split(' ');
          profile = {
            uid: user.uid, firstName: parts[0] || '', middleName: '', lastName: parts.slice(1).join(' '),
            fullName: user.displayName || '', email: user.email, mobile: '', address: '',
            role: isAdmin ? 'admin' : 'resident', createdAt: serverTimestamp()
          };
          await setDoc(ref, profile);
        }
      } catch (e) { console.error('profile load failed', e); }
      profile = profile || { fullName: user.displayName || '', email: user.email };
      resolve({ user, profile, isAdmin });
    });
  });
}

export async function logout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('loggedInUser');
  try { await signOut(auth); } catch (e) { console.error(e); }
  location.href = 'login.html';
}

/* ---------- notifications ---------- */
// toUid is a resident's uid, or the word "admin" for the admin inbox.
export function notify({ toUid, type, reportId, text, id }) {
  const data = { toUid, type, reportId, text, read: false, fromUid: auth.currentUser.uid, createdAt: serverTimestamp() };
  return id ? setDoc(doc(db, 'notifications', id), data) : addDoc(collection(db, 'notifications'), data);
}

export function listenNotifications(toUid, onList, onNew) {
  let first = true;
  return onSnapshot(query(collection(db, 'notifications'), where('toUid', '==', toUid)), (snap) => {
    const items = snap.docs.map(docData).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
    onList(items);
    if (!first && onNew) {
      snap.docChanges().forEach(ch => {
        if (ch.type === 'added' && !ch.doc.metadata.hasPendingWrites) onNew(docData(ch.doc));
      });
    }
    first = false;
  }, (err) => console.error('notifications listener', err));
}

export const markNotifRead = (id) => updateDoc(doc(db, 'notifications', id), { read: true });
export async function markAllNotifsRead(items) {
  const unread = items.filter(n => !n.read);
  if (!unread.length) return;
  const b = writeBatch(db);
  unread.forEach(n => b.update(doc(db, 'notifications', n.id), { read: true }));
  await b.commit();
}

const notifIcons = { comment: 'message-circle', upvote: 'thumbs-up', status: 'refresh-cw', new_report: 'file-plus' };
// Calls window.openNotif('<id>') when an item is clicked (each page defines it)
export function notifListHTML(items) {
  if (!items.length) return '<li class="px-4 py-8 text-center text-xs text-slate-400">No notifications yet.</li>';
  return items.map(n => `
    <li>
      <button onclick="openNotif('${esc(n.id)}')" class="w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition ${n.read ? '' : 'bg-emerald-50/60'}">
        <span class="mt-0.5 w-8 h-8 shrink-0 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center"><i data-lucide="${notifIcons[n.type] || 'bell'}" class="w-4 h-4"></i></span>
        <span class="min-w-0">
          <span class="block text-xs text-slate-700 leading-snug">${esc(n.text)}</span>
          <span class="block text-[10px] text-slate-400 mt-0.5">${esc(fmtDateTime(n.createdAt))}</span>
        </span>
        ${n.read ? '' : '<span class="ml-auto mt-1 w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>'}
      </button>
    </li>`).join('');
}

export function toast(text) {
  let box = document.getElementById('caps-toasts');
  if (!box) {
    box = document.createElement('div');
    box.id = 'caps-toasts';
    box.className = 'fixed top-20 right-4 z-[80] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-xs pointer-events-none';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'pointer-events-auto bg-white border border-emerald-200 shadow-xl rounded-xl px-4 py-3 text-xs text-slate-700 flex gap-2 items-start';
  t.innerHTML = `<span class="mt-0.5 w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span><span>${esc(text)}</span>`;
  box.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 450); }, 5000);
}

/* ---------- photos (stored in Firestore: reports/{id}/media/{mid}) ---------- */
export async function compressImage(file, max = 1000) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  let q = 0.65, data = c.toDataURL('image/jpeg', q);
  while (data.length > 600000 && q > 0.3) { q -= 0.1; data = c.toDataURL('image/jpeg', q); }
  return data;
}

const mediaCache = new Map();
const mediaBusy = new Set();
const gridHTML = (items) => {
  const n = items.length;
  return `<div class="mt-3 grid gap-2 ${n > 1 ? 'grid-cols-2' : 'grid-cols-1'}">` + items.map((x, i) =>
    `<div class="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 ${n > 2 && i === 0 ? 'col-span-2' : ''}">
       <img src="${x.data}" alt="Report photo" onclick="openLightbox(this.src)" class="w-full max-h-96 object-cover cursor-zoom-in"></div>`).join('') + '</div>';
};
export function mediaHTML(rep) {
  if (!rep.mediaCount) return '';
  const c = mediaCache.get(rep.id);
  return `<div data-media-for="${esc(rep.id)}" data-count="${Number(rep.mediaCount)}">${c ? gridHTML(c) : '<div class="mt-3 h-24 rounded-xl bg-slate-100 animate-pulse"></div>'}</div>`;
}
async function fetchMedia(id, count) {
  for (let a = 0; a < 5; a++) {
    try {
      const snap = await getDocs(collection(db, 'reports', id, 'media'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => (x.order || 0) - (y.order || 0));
      if (items.length >= count || a === 4) {
        if (items.length) mediaCache.set(id, items);
        document.querySelectorAll(`[data-media-for="${id}"]`).forEach(el => { el.innerHTML = items.length ? gridHTML(items) : ''; });
        return;
      }
    } catch (e) { console.error('media load', e); }
    await new Promise(r => setTimeout(r, 1200));   // the author may still be uploading
  }
}
export function hydrateMedia() {
  document.querySelectorAll('[data-media-for]').forEach(el => {
    const id = el.dataset.mediaFor;
    if (mediaCache.has(id) || mediaBusy.has(id)) return;
    mediaBusy.add(id);
    fetchMedia(id, Number(el.dataset.count)).finally(() => mediaBusy.delete(id));
  });
}
export async function deleteReportMedia(reportId) {
  const snap = await getDocs(collection(db, 'reports', reportId, 'media'));
  const b = writeBatch(db);
  snap.docs.forEach(d => b.delete(d.ref));
  if (!snap.empty) await b.commit();
  mediaCache.delete(reportId);
}

window.openLightbox = (src) => {
  if (!src) return;
  const d = document.createElement('div');
  d.className = 'fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4';
  d.innerHTML = `<img src="${src}" class="max-w-full max-h-full object-contain">`;
  d.onclick = () => d.remove();
  document.body.appendChild(d);
};