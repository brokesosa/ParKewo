import './runtime.js'
import './runtime.js'

const DEFAULT_SPOT_LAYOUT = [
  { num: 1, x: 8, y: 5, w: 4.6, h: 11.4 }, { num: 2, x: 13.4, y: 5, w: 4.6, h: 11.4 }, { num: 3, x: 18.8, y: 5, w: 4.6, h: 11.4 },
  { num: 4, x: 24.2, y: 5, w: 4.6, h: 11.4 }, { num: 5, x: 29.6, y: 5, w: 4.6, h: 11.4 }, { num: 6, x: 35.8, y: 5, w: 4.6, h: 11.4 },
  { num: 7, x: 41.2, y: 5, w: 4.6, h: 11.4 }, { num: 8, x: 46.6, y: 5, w: 4.6, h: 11.4 }, { num: 9, x: 52, y: 5, w: 4.6, h: 11.4 },
  { num: 10, x: 57.4, y: 5, w: 4.6, h: 11.4 }, { num: 11, x: 62.8, y: 5, w: 4.6, h: 11.4 }, { num: 12, x: 68.2, y: 5, w: 4.6, h: 11.4 },
  { num: 13, x: 73.6, y: 5, w: 4.6, h: 11.4 }, { num: 14, x: 79, y: 5, w: 4.6, h: 11.4 }, { num: 15, x: 84.4, y: 5, w: 4.6, h: 11.4 },
  { num: 16, x: 24, y: 36.2, w: 4.6, h: 11.4 }, { num: 17, x: 29.5, y: 36.2, w: 4.6, h: 11.4 }, { num: 18, x: 35, y: 36.2, w: 4.6, h: 11.4 },
  { num: 19, x: 40.4, y: 36.2, w: 4.6, h: 11.4 }, { num: 20, x: 45.8, y: 36.2, w: 4.6, h: 11.4 }, { num: 21, x: 51.2, y: 36.2, w: 4.6, h: 11.4 },
  { num: 22, x: 56.6, y: 36.2, w: 4.6, h: 11.4 }, { num: 23, x: 62, y: 36.2, w: 4.6, h: 11.4 }, { num: 24, x: 67.4, y: 36.2, w: 4.6, h: 11.4 },
]

const STORAGE_KEYS = { spots: 'parkewo_spots_local', messages: 'parkewo_messages_local', users: 'parkewo_users_local', layout: 'parkewo_spot_layout_local' }
let currentUser = null
let usersData = {}
let parkingSpotsData = {}
let spotLayout = DEFAULT_SPOT_LAYOUT.map((s) => ({ ...s }))
let layoutMode = false
let selectedSpotNum = null
let isDraggingSpot = false
let dragOffset = { x: 0, y: 0 }

const els = {
  parkingSpots: document.getElementById('parking-spots'),
  loginModal: document.getElementById('login-modal'),
  loginForm: document.getElementById('login-form'),
  accountId: document.getElementById('account-id'),
  accountPassword: document.getElementById('account-password'),
  userPanel: document.getElementById('user-panel'),
  currentUserName: document.getElementById('current-user-name'),
  currentUserClass: document.getElementById('current-user-class'),
  currentUserStatus: document.getElementById('current-user-status'),
  currentUserSpot: document.getElementById('current-user-spot'),
  logoutBtn: document.getElementById('logout-btn'),
  releaseSpotBtn: document.getElementById('release-spot-btn'),
  chatInput: document.getElementById('chat-input'),
  sendMessageBtn: document.getElementById('send-message-btn'),
  toggleChatBtn: document.getElementById('toggle-chat'),
  chatContainer: document.getElementById('chat-container'),
  chatBody: document.getElementById('chat-body'),
  chatMessages: document.getElementById('chat-messages'),
  suggestSpotBtn: document.getElementById('suggest-spot-btn'),
  toggleLayoutModeBtn: document.getElementById('toggle-layout-mode-btn'),
  openAdminPanelBtn: document.getElementById('open-admin-panel-btn'),
  closeAdminPanelBtn: document.getElementById('close-admin-panel-btn'),
  adminPanel: document.getElementById('admin-panel'),
  adminOccupiedList: document.getElementById('admin-occupied-list'),
  adminUsersList: document.getElementById('admin-users-list'),
  layoutPanel: document.getElementById('layout-panel'),
  layoutSelectedLabel: document.getElementById('layout-selected-label'),
  layoutCoords: document.getElementById('layout-coords'),
  layoutWidthInput: document.getElementById('layout-width-input'),
  layoutHeightInput: document.getElementById('layout-height-input'),
  copyLayoutBtn: document.getElementById('copy-layout-btn'),
  resetLayoutBtn: document.getElementById('reset-layout-btn'),
  totalSpots: document.getElementById('total-spots'),
  occupiedSpots: document.getElementById('occupied-spots'),
  freeSpots: document.getElementById('free-spots'),
  toast: document.getElementById('toast'),
}

const fb = () => (!window.firebaseReady ? null : { db: window.firebaseDatabase, ref: window.firebaseRef, set: window.firebaseSet, onValue: window.firebaseOnValue, push: window.firebasePush, remove: window.firebaseRemove })
const read = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f } catch { return f } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
const isAdmin = () => Boolean(currentUser?.isAdmin)
const mySpot = () => Object.entries(parkingSpotsData).find(([, d]) => d?.userId === currentUser?.id)?.[0] ?? null
const accountById = (id) => PREDEFINED_ACCOUNTS.find((a) => a.id === id)

function toast(message, type = 'info') {
  const p = { info: 'text-sky-100', ok: 'text-emerald-100', warn: 'text-amber-100' }
  els.toast.className = `pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-white/15 bg-slate-900/95 px-4 py-2 text-sm font-medium shadow-xl ${p[type]}`
  els.toast.textContent = message
  els.toast.classList.remove('hidden')
  clearTimeout(toast._t)
  toast._t = setTimeout(() => els.toast.classList.add('hidden'), 1800)
}

function renderAccounts() {
  els.accountId.innerHTML = '<option value="">Choisir un compte</option>'
  PREDEFINED_ACCOUNTS.forEach((a) => {
    const o = document.createElement('option')
    o.value = a.id
    o.textContent = a.label
    els.accountId.appendChild(o)
  })
}

function setAdminVisibility() {
  const v = isAdmin()
  els.toggleLayoutModeBtn.classList.toggle('hidden', !v)
  els.openAdminPanelBtn.classList.toggle('hidden', !v)
  if (!v) { els.adminPanel.classList.add('hidden'); els.layoutPanel.classList.add('hidden'); layoutMode = false }
}

function showUser() {
  els.userPanel.classList.remove('hidden')
  els.currentUserName.textContent = `Nom: ${currentUser.name}`
  els.currentUserClass.textContent = `Classe/Role: ${currentUser.class}`
  els.currentUserStatus.textContent = currentUser.isAdmin ? 'Statut: Admin' : (currentUser.isStudent ? 'Statut: Étudiant' : 'Statut: Personnel')
  setAdminVisibility()
}

function showLogin() { els.loginModal.classList.remove('hidden') }
function hideLogin() { els.loginModal.classList.add('hidden') }

function addMessage(m) {
  const own = m.userId === currentUser?.id
  const item = document.createElement('div')
  item.className = `max-w-[85%] rounded-xl px-3 py-2 text-sm shadow ${own ? 'ml-auto bg-emerald-500 text-slate-950' : 'bg-slate-700/80 text-slate-100'}`
  item.innerHTML = `<div class="mb-1 text-[11px] font-semibold opacity-80">${m.spotNum ? `Place ${m.spotNum}` : m.userName}</div><div>${m.message}</div>`
  els.chatMessages.appendChild(item)
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight
}

function renderAdminPanel() {
  if (!isAdmin()) return
  const occupied = Object.entries(parkingSpotsData)
  els.adminOccupiedList.innerHTML = occupied.length ? occupied.map(([n, d]) => `<div class="flex justify-between rounded border border-white/10 px-2 py-1"><span>Place ${n} · ${d.userName}</span><button data-action="free" data-spot="${n}" class="text-amber-300">Libérer</button></div>`).join('') : '<p class="text-slate-400">Aucune place occupée.</p>'
  const users = Object.values(usersData)
  els.adminUsersList.innerHTML = users.length ? users.map((u) => `<div class="flex justify-between rounded border border-white/10 px-2 py-1"><span>${u.name} (${u.id})</span>${u.isAdmin ? '<span class="text-violet-300">Admin</span>' : `<button data-action="del-user" data-user="${u.id}" class="text-rose-300">Supprimer</button>`}</div>`).join('') : '<p class="text-slate-400">Aucun utilisateur actif.</p>'
}

function paintSpots() {
  document.querySelectorAll('.parking-spot').forEach((el) => {
    const d = parkingSpotsData[el.dataset.spot]
    const owner = el.querySelector('.spot-owner-info')
    el.className = 'parking-spot absolute flex min-h-[52px] min-w-[30px] items-center justify-center rounded-lg border-2 shadow-lg transition'
    if (!d) {
      el.classList.add('border-emerald-300/80', 'bg-emerald-500/75')
      owner.classList.add('hidden')
      owner.textContent = ''
    } else if (d.userId === currentUser?.id) {
      el.classList.add('border-sky-300/90', 'bg-sky-500/85')
      owner.classList.remove('hidden')
      owner.innerHTML = `<div class="font-semibold">${d.userName}</div><div>${d.userClass}</div>`
    } else {
      el.classList.add('border-rose-300/80', 'bg-rose-500/80')
      owner.classList.remove('hidden')
      owner.innerHTML = `<div class="font-semibold">${d.userName}</div><div>${d.userClass}</div>`
    }
  })
  els.totalSpots.textContent = String(spotLayout.length)
  els.occupiedSpots.textContent = String(Object.keys(parkingSpotsData).length)
  els.freeSpots.textContent = String(spotLayout.length - Object.keys(parkingSpotsData).length)
  if (currentUser) els.currentUserSpot.textContent = mySpot() ? `Ta place: ${mySpot()}` : 'Ta place: aucune'
  renderAdminPanel()
}

function renderSpots() {
  els.parkingSpots.innerHTML = spotLayout.map((s) => `<button type="button" class="parking-spot absolute flex min-h-[52px] min-w-[30px] items-center justify-center rounded-lg border-2 shadow-lg transition" data-spot="${s.num}" style="left:${s.x}%;top:${s.y}%;width:${s.w}%;height:${s.h}%"><span class="pointer-events-none text-sm font-black text-white drop-shadow md:text-lg">${s.num}</span><div class="spot-owner-info pointer-events-none absolute left-1/2 top-[calc(100%+2px)] hidden w-max max-w-[160px] -translate-x-1/2 rounded-md border border-white/10 bg-slate-950/95 px-2 py-1 text-[10px] leading-tight text-white shadow-lg md:text-[11px]"></div></button>`).join('')
  document.querySelectorAll('.parking-spot').forEach((el) => {
    el.addEventListener('click', () => onSpotClick(el.dataset.spot))
    el.addEventListener('mousedown', (e) => startDrag(e, el.dataset.spot))
  })
  paintSpots()
}

function freeSpot(num) {
  delete parkingSpotsData[num]
  const f = fb()
  if (f) f.remove(f.ref(f.db, `parkingSpots/${num}`))
  else write(STORAGE_KEYS.spots, parkingSpotsData)
  paintSpots()
}

function onSpotClick(num) {
  if (layoutMode && isAdmin()) return selectSpot(num)
  if (!currentUser) return toast('Connecte-toi d’abord', 'warn')
  if (parkingSpotsData[num]?.userId === currentUser.id) return freeSpot(num), toast(`Place ${num} libérée`, 'ok')
  if (parkingSpotsData[num]) return toast(`Place ${num} déjà occupée`, 'warn')
  if (mySpot()) return toast(`Tu occupes déjà la place ${mySpot()}`, 'warn')
  const data = { userId: currentUser.id, userName: currentUser.name, userClass: currentUser.class, isStudent: currentUser.isStudent }
  parkingSpotsData[num] = data
  const f = fb()
  if (f) f.set(f.ref(f.db, `parkingSpots/${num}`), data)
  else write(STORAGE_KEYS.spots, parkingSpotsData)
  paintSpots()
}

function deleteUser(id) {
  if (!id || id === 'admin') return
  Object.entries(parkingSpotsData).forEach(([n, d]) => { if (d.userId === id) delete parkingSpotsData[n] })
  delete usersData[id]
  const f = fb()
  if (f) f.remove(f.ref(f.db, `users/${id}`))
  else { write(STORAGE_KEYS.spots, parkingSpotsData); write(STORAGE_KEYS.users, usersData) }
  paintSpots()
}

function sendMessage() {
  if (!currentUser) return toast('Connecte-toi pour écrire', 'warn')
  const m = els.chatInput.value.trim()
  if (!m) return
  els.chatInput.value = ''
  const data = { spotNum: mySpot(), userId: currentUser.id, userName: currentUser.name, userClass: currentUser.class, message: m, timestamp: Date.now() }
  const f = fb()
  if (f) f.push(f.ref(f.db, 'messages'), data)
  else { const arr = read(STORAGE_KEYS.messages, []); arr.push(data); write(STORAGE_KEYS.messages, arr); addMessage(data) }
}

function loadData() {
  const f = fb()
  if (!f) {
    usersData = read(STORAGE_KEYS.users, {})
    parkingSpotsData = read(STORAGE_KEYS.spots, {})
    const msgs = read(STORAGE_KEYS.messages, [])
    const uid = localStorage.getItem('parkewo_userId')
    currentUser = uid ? usersData[uid] || null : null
    if (currentUser) hideLogin(), showUser()
    els.chatMessages.innerHTML = ''
    msgs.sort((a, b) => a.timestamp - b.timestamp).forEach(addMessage)
    paintSpots()
    return
  }
  f.onValue(f.ref(f.db, 'users'), (s) => {
    usersData = s.val() || {}
    const uid = localStorage.getItem('parkewo_userId')
    if (uid && usersData[uid]) { currentUser = usersData[uid]; hideLogin(); showUser() }
    renderAdminPanel()
  })
  f.onValue(f.ref(f.db, 'parkingSpots'), (s) => { parkingSpotsData = s.val() || {}; paintSpots() })
  f.onValue(f.ref(f.db, 'messages'), (s) => {
    const list = Object.values(s.val() || {}).sort((a, b) => a.timestamp - b.timestamp)
    els.chatMessages.innerHTML = ''
    list.forEach(addMessage)
  })
}

function login() {
  const account = accountById(els.accountId.value)
  if (!account || account.password !== els.accountPassword.value) return toast('Identifiants invalides', 'warn')
  currentUser = { id: account.id, name: account.name, class: account.class, isStudent: account.isStudent, isAdmin: account.isAdmin }
  usersData[currentUser.id] = currentUser
  localStorage.setItem('parkewo_userId', currentUser.id)
  const f = fb()
  if (f) f.set(f.ref(f.db, `users/${currentUser.id}`), currentUser)
  else write(STORAGE_KEYS.users, usersData)
  hideLogin()
  showUser()
  paintSpots()
}

function logout() {
  if (!currentUser) return
  const id = currentUser.id
  if (mySpot()) freeSpot(mySpot())
  const f = fb()
  if (f) f.remove(f.ref(f.db, `users/${id}`))
  else { delete usersData[id]; write(STORAGE_KEYS.users, usersData) }
  currentUser = null
  localStorage.removeItem('parkewo_userId')
  els.userPanel.classList.add('hidden')
  showLogin()
}

function selectSpot(num) {
  selectedSpotNum = num
  document.querySelectorAll('.parking-spot').forEach((el) => {
    const selected = el.dataset.spot === String(num)
    el.classList.toggle('ring-4', selected)
    el.classList.toggle('ring-sky-300/80', selected)
  })
  const s = spotLayout.find((x) => String(x.num) === String(num))
  if (!s) return
  els.layoutPanel.classList.remove('hidden')
  els.layoutSelectedLabel.textContent = `Place sélectionnée: ${s.num}`
  els.layoutCoords.textContent = `x: ${s.x.toFixed(1)}%, y: ${s.y.toFixed(1)}%, w: ${s.w.toFixed(1)}%, h: ${s.h.toFixed(1)}%`
  els.layoutWidthInput.value = String(s.w)
  els.layoutHeightInput.value = String(s.h)
}

function startDrag(e, num) {
  if (!layoutMode || !isAdmin()) return
  const s = spotLayout.find((x) => String(x.num) === String(num))
  if (!s) return
  const r = els.parkingSpots.getBoundingClientRect()
  dragOffset = { x: ((e.clientX - r.left) / r.width) * 100 - s.x, y: ((e.clientY - r.top) / r.height) * 100 - s.y }
  selectedSpotNum = num
  isDraggingSpot = true
}

function initEvents() {
  els.loginForm.addEventListener('submit', (e) => { e.preventDefault(); login() })
  els.logoutBtn.addEventListener('click', logout)
  els.releaseSpotBtn.addEventListener('click', () => (mySpot() ? freeSpot(mySpot()) : toast('Aucune place à libérer', 'info')))
  els.sendMessageBtn.addEventListener('click', sendMessage)
  els.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage() })

  let collapsed = false
  els.toggleChatBtn.addEventListener('click', () => {
    collapsed = !collapsed
    els.chatBody.classList.toggle('hidden', collapsed)
    els.chatContainer.classList.toggle('h-[58px]', collapsed)
    els.chatContainer.classList.toggle('h-[300px]', !collapsed)
    els.chatContainer.classList.toggle('md:h-[360px]', !collapsed)
    els.toggleChatBtn.textContent = collapsed ? '+' : '−'
  })

  els.suggestSpotBtn.addEventListener('click', () => {
    const free = spotLayout.find((s) => !parkingSpotsData[String(s.num)])
    if (!free) return
    const target = document.querySelector(`.parking-spot[data-spot="${free.num}"]`)
    if (!target) return
    target.classList.add('ring-4', 'ring-amber-300/80')
    setTimeout(() => target.classList.remove('ring-4', 'ring-amber-300/80'), 1000)
  })

  els.toggleLayoutModeBtn.addEventListener('click', () => {
    if (!isAdmin()) return toast('Accès admin requis', 'warn')
    layoutMode = !layoutMode
    els.toggleLayoutModeBtn.textContent = layoutMode ? 'Placement ON' : 'Mode placement'
    if (!layoutMode) els.layoutPanel.classList.add('hidden')
  })

  els.openAdminPanelBtn.addEventListener('click', () => isAdmin() && els.adminPanel.classList.remove('hidden'))
  els.closeAdminPanelBtn.addEventListener('click', () => els.adminPanel.classList.add('hidden'))
  els.adminPanel.addEventListener('click', (e) => {
    const t = e.target
    if (!(t instanceof HTMLElement) || !isAdmin()) return
    if (t.dataset.action === 'free') freeSpot(t.dataset.spot)
    if (t.dataset.action === 'del-user') deleteUser(t.dataset.user)
  })

  els.layoutWidthInput.addEventListener('input', () => {
    if (!isAdmin() || !selectedSpotNum) return
    const s = spotLayout.find((x) => String(x.num) === String(selectedSpotNum))
    if (!s) return
    s.w = Number(els.layoutWidthInput.value)
    s.x = clamp(s.x, 0, 100 - s.w)
    write(STORAGE_KEYS.layout, spotLayout)
    renderSpots()
    selectSpot(selectedSpotNum)
  })
  els.layoutHeightInput.addEventListener('input', () => {
    if (!isAdmin() || !selectedSpotNum) return
    const s = spotLayout.find((x) => String(x.num) === String(selectedSpotNum))
    if (!s) return
    s.h = Number(els.layoutHeightInput.value)
    s.y = clamp(s.y, 0, 100 - s.h)
    write(STORAGE_KEYS.layout, spotLayout)
    renderSpots()
    selectSpot(selectedSpotNum)
  })
  els.copyLayoutBtn.addEventListener('click', async () => {
    if (!isAdmin()) return
    try { await navigator.clipboard.writeText(JSON.stringify(spotLayout, null, 2)); toast('Layout copié', 'ok') } catch {}
  })
  els.resetLayoutBtn.addEventListener('click', () => {
    if (!isAdmin()) return
    spotLayout = DEFAULT_SPOT_LAYOUT.map((s) => ({ ...s }))
    write(STORAGE_KEYS.layout, spotLayout)
    renderSpots()
  })

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingSpot || !layoutMode || !selectedSpotNum) return
    const s = spotLayout.find((x) => String(x.num) === String(selectedSpotNum))
    if (!s) return
    const r = els.parkingSpots.getBoundingClientRect()
    s.x = clamp(((e.clientX - r.left) / r.width) * 100 - dragOffset.x, 0, 100 - s.w)
    s.y = clamp(((e.clientY - r.top) / r.height) * 100 - dragOffset.y, 0, 100 - s.h)
    write(STORAGE_KEYS.layout, spotLayout)
    renderSpots()
    selectSpot(selectedSpotNum)
  })
  window.addEventListener('mouseup', () => { isDraggingSpot = false })
}

function init() {
  const saved = read(STORAGE_KEYS.layout, null)
  if (Array.isArray(saved) && saved.length) spotLayout = saved
  renderAccounts()
  renderSpots()
  loadData()
  if (!currentUser) showLogin()
  initEvents()
}

document.addEventListener('DOMContentLoaded', init)
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) e.preventDefault()
}, { passive: false })

const PREDEFINED_ACCOUNTS = [
  { id: 'admin', label: 'Admin principal', password: 'admin123', name: 'Admin', class: 'Administration', isStudent: false, isAdmin: true },
  { id: 'eleve_1', label: 'Élève - Alex Martin', password: 'alex123', name: 'Alex Martin', class: '3ème A', isStudent: true, isAdmin: false },
  { id: 'eleve_2', label: 'Élève - Lina Perez', password: 'lina123', name: 'Lina Perez', class: '3ème B', isStudent: true, isAdmin: false },
  { id: 'prof_1', label: 'Prof - M. Dupont', password: 'dupont123', name: 'M. Dupont', class: 'Professeur', isStudent: false, isAdmin: false },
]

const DEFAULT_SPOT_LAYOUT = [
  { num: 1, x: 8, y: 5, w: 4.6, h: 11.4 }, { num: 2, x: 13.4, y: 5, w: 4.6, h: 11.4 },
  { num: 3, x: 18.8, y: 5, w: 4.6, h: 11.4 }, { num: 4, x: 24.2, y: 5, w: 4.6, h: 11.4 },
  { num: 5, x: 29.6, y: 5, w: 4.6, h: 11.4 }, { num: 6, x: 35.8, y: 5, w: 4.6, h: 11.4 },
  { num: 7, x: 41.2, y: 5, w: 4.6, h: 11.4 }, { num: 8, x: 46.6, y: 5, w: 4.6, h: 11.4 },
  { num: 9, x: 52, y: 5, w: 4.6, h: 11.4 }, { num: 10, x: 57.4, y: 5, w: 4.6, h: 11.4 },
  { num: 11, x: 62.8, y: 5, w: 4.6, h: 11.4 }, { num: 12, x: 68.2, y: 5, w: 4.6, h: 11.4 },
  { num: 13, x: 73.6, y: 5, w: 4.6, h: 11.4 }, { num: 14, x: 79, y: 5, w: 4.6, h: 11.4 },
  { num: 15, x: 84.4, y: 5, w: 4.6, h: 11.4 }, { num: 16, x: 24, y: 36.2, w: 4.6, h: 11.4 },
  { num: 17, x: 29.5, y: 36.2, w: 4.6, h: 11.4 }, { num: 18, x: 35, y: 36.2, w: 4.6, h: 11.4 },
  { num: 19, x: 40.4, y: 36.2, w: 4.6, h: 11.4 }, { num: 20, x: 45.8, y: 36.2, w: 4.6, h: 11.4 },
  { num: 21, x: 51.2, y: 36.2, w: 4.6, h: 11.4 }, { num: 22, x: 56.6, y: 36.2, w: 4.6, h: 11.4 },
  { num: 23, x: 62, y: 36.2, w: 4.6, h: 11.4 }, { num: 24, x: 67.4, y: 36.2, w: 4.6, h: 11.4 },
]

const STORAGE_KEYS = { spots: 'parkewo_spots_local', messages: 'parkewo_messages_local', users: 'parkewo_users_local', layout: 'parkewo_spot_layout_local' }

let currentUser = null
let usersData = {}
let parkingSpotsData = {}
let spotLayout = DEFAULT_SPOT_LAYOUT.map((s) => ({ ...s }))
let layoutMode = false
let selectedSpotNum = null
let isDraggingSpot = false
let dragOffset = { x: 0, y: 0 }

const els = {
  parkingSpots: document.getElementById('parking-spots'),
  loginModal: document.getElementById('login-modal'),
  loginForm: document.getElementById('login-form'),
  accountId: document.getElementById('account-id'),
  accountPassword: document.getElementById('account-password'),
  userPanel: document.getElementById('user-panel'),
  currentUserName: document.getElementById('current-user-name'),
  currentUserClass: document.getElementById('current-user-class'),
  currentUserStatus: document.getElementById('current-user-status'),
  currentUserSpot: document.getElementById('current-user-spot'),
  logoutBtn: document.getElementById('logout-btn'),
  releaseSpotBtn: document.getElementById('release-spot-btn'),
  chatInput: document.getElementById('chat-input'),
  sendMessageBtn: document.getElementById('send-message-btn'),
  toggleChatBtn: document.getElementById('toggle-chat'),
  chatContainer: document.getElementById('chat-container'),
  chatBody: document.getElementById('chat-body'),
  chatMessages: document.getElementById('chat-messages'),
  suggestSpotBtn: document.getElementById('suggest-spot-btn'),
  toggleLayoutModeBtn: document.getElementById('toggle-layout-mode-btn'),
  openAdminPanelBtn: document.getElementById('open-admin-panel-btn'),
  closeAdminPanelBtn: document.getElementById('close-admin-panel-btn'),
  adminPanel: document.getElementById('admin-panel'),
  adminOccupiedList: document.getElementById('admin-occupied-list'),
  adminUsersList: document.getElementById('admin-users-list'),
  layoutPanel: document.getElementById('layout-panel'),
  layoutSelectedLabel: document.getElementById('layout-selected-label'),
  layoutCoords: document.getElementById('layout-coords'),
  layoutWidthInput: document.getElementById('layout-width-input'),
  layoutHeightInput: document.getElementById('layout-height-input'),
  copyLayoutBtn: document.getElementById('copy-layout-btn'),
  resetLayoutBtn: document.getElementById('reset-layout-btn'),
  totalSpots: document.getElementById('total-spots'),
  occupiedSpots: document.getElementById('occupied-spots'),
  freeSpots: document.getElementById('free-spots'),
  toast: document.getElementById('toast'),
}

const fb = () => (!window.firebaseReady ? null : { db: window.firebaseDatabase, ref: window.firebaseRef, set: window.firebaseSet, onValue: window.firebaseOnValue, push: window.firebasePush, remove: window.firebaseRemove })
const read = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f } catch { return f } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
const isAdmin = () => Boolean(currentUser?.isAdmin)
const mySpot = () => Object.entries(parkingSpotsData).find(([, d]) => d?.userId === currentUser?.id)?.[0] ?? null
const accountById = (id) => PREDEFINED_ACCOUNTS.find((a) => a.id === id)

function toast(message, type = 'info') {
  const p = { info: 'text-sky-100', ok: 'text-emerald-100', warn: 'text-amber-100' }
  els.toast.className = `pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-white/15 bg-slate-900/95 px-4 py-2 text-sm font-medium shadow-xl ${p[type]}`
  els.toast.textContent = message
  els.toast.classList.remove('hidden')
  clearTimeout(toast._t)
  toast._t = setTimeout(() => els.toast.classList.add('hidden'), 1800)
}

function renderAccounts() {
  els.accountId.innerHTML = '<option value="">Choisir un compte</option>'
  PREDEFINED_ACCOUNTS.forEach((a) => {
    const o = document.createElement('option')
    o.value = a.id
    o.textContent = a.label
    els.accountId.appendChild(o)
  })
}

function renderSpots() {
  els.parkingSpots.innerHTML = spotLayout.map((s) => `
    <button type="button" class="parking-spot absolute flex min-h-[52px] min-w-[30px] items-center justify-center rounded-lg border-2 shadow-lg transition" data-spot="${s.num}" style="left:${s.x}%;top:${s.y}%;width:${s.w}%;height:${s.h}%">
      <span class="pointer-events-none text-sm font-black text-white drop-shadow md:text-lg">${s.num}</span>
      <div class="spot-owner-info pointer-events-none absolute left-1/2 top-[calc(100%+2px)] hidden w-max max-w-[160px] -translate-x-1/2 rounded-md border border-white/10 bg-slate-950/95 px-2 py-1 text-[10px] leading-tight text-white shadow-lg md:text-[11px]"></div>
    </button>
  `).join('')
  document.querySelectorAll('.parking-spot').forEach((el) => {
    el.addEventListener('click', () => onSpotClick(el.dataset.spot))
    el.addEventListener('mousedown', (e) => startDrag(e, el.dataset.spot))
  })
  paintSpots()
}

function paintSpots() {
  document.querySelectorAll('.parking-spot').forEach((el) => {
    const d = parkingSpotsData[el.dataset.spot]
    const owner = el.querySelector('.spot-owner-info')
    el.className = 'parking-spot absolute flex min-h-[52px] min-w-[30px] items-center justify-center rounded-lg border-2 shadow-lg transition'
    if (!d) {
      el.classList.add('border-emerald-300/80', 'bg-emerald-500/75')
      owner.classList.add('hidden')
      owner.textContent = ''
    } else if (d.userId === currentUser?.id) {
      el.classList.add('border-sky-300/90', 'bg-sky-500/85')
      owner.classList.remove('hidden')
      owner.innerHTML = `<div class="font-semibold">${d.userName}</div><div>${d.userClass}</div>`
    } else {
      el.classList.add('border-rose-300/80', 'bg-rose-500/80')
      owner.classList.remove('hidden')
      owner.innerHTML = `<div class="font-semibold">${d.userName}</div><div>${d.userClass}</div>`
    }
  })
  els.totalSpots.textContent = String(spotLayout.length)
  els.occupiedSpots.textContent = String(Object.keys(parkingSpotsData).length)
  els.freeSpots.textContent = String(spotLayout.length - Object.keys(parkingSpotsData).length)
  if (currentUser) els.currentUserSpot.textContent = mySpot() ? `Ta place: ${mySpot()}` : 'Ta place: aucune'
  renderAdminPanel()
}

function setPanelVisibility() {
  const visible = isAdmin()
  els.toggleLayoutModeBtn.classList.toggle('hidden', !visible)
  els.openAdminPanelBtn.classList.toggle('hidden', !visible)
  if (!visible) { els.adminPanel.classList.add('hidden'); els.layoutPanel.classList.add('hidden'); layoutMode = false }
}

function showUser() {
  els.userPanel.classList.remove('hidden')
  els.currentUserName.textContent = `Nom: ${currentUser.name}`
  els.currentUserClass.textContent = `Classe/Role: ${currentUser.class}`
  els.currentUserStatus.textContent = currentUser.isAdmin ? 'Statut: Admin' : (currentUser.isStudent ? 'Statut: Étudiant' : 'Statut: Personnel')
  setPanelVisibility()
}

function hideUser() {
  els.userPanel.classList.add('hidden')
  setPanelVisibility()
}

function showLogin() { els.loginModal.classList.remove('hidden') }
function hideLogin() { els.loginModal.classList.add('hidden') }

function saveSpots() {
  const f = fb()
  if (!f) return write(STORAGE_KEYS.spots, parkingSpotsData)
  Object.entries(parkingSpotsData).forEach(([n, d]) => f.set(f.ref(f.db, `parkingSpots/${n}`), d))
}

function freeSpot(num) {
  delete parkingSpotsData[num]
  const f = fb()
  if (f) f.remove(f.ref(f.db, `parkingSpots/${num}`))
  else write(STORAGE_KEYS.spots, parkingSpotsData)
  paintSpots()
}

function onSpotClick(num) {
  if (layoutMode && isAdmin()) return selectSpot(num)
  if (!currentUser) return toast('Connecte-toi d’abord', 'warn')
  if (parkingSpotsData[num]?.userId === currentUser.id) return freeSpot(num), toast(`Place ${num} libérée`, 'ok')
  if (parkingSpotsData[num]) return toast(`Place ${num} déjà occupée`, 'warn')
  if (mySpot()) return toast(`Tu occupes déjà la place ${mySpot()}`, 'warn')
  const data = { userId: currentUser.id, userName: currentUser.name, userClass: currentUser.class, isStudent: currentUser.isStudent }
  parkingSpotsData[num] = data
  const f = fb()
  if (f) f.set(f.ref(f.db, `parkingSpots/${num}`), data)
  else write(STORAGE_KEYS.spots, parkingSpotsData)
  paintSpots()
  toast(`Place ${num} réservée`, 'ok')
}

function renderAdminPanel() {
  if (!isAdmin()) return
  const occupied = Object.entries(parkingSpotsData)
  els.adminOccupiedList.innerHTML = occupied.length ? occupied.map(([n, d]) => `<div class="flex justify-between rounded border border-white/10 px-2 py-1"><span>Place ${n} · ${d.userName}</span><button data-action="free" data-spot="${n}" class="text-amber-300">Libérer</button></div>`).join('') : '<p class="text-slate-400">Aucune place occupée.</p>'
  const users = Object.values(usersData)
  els.adminUsersList.innerHTML = users.length ? users.map((u) => `<div class="flex justify-between rounded border border-white/10 px-2 py-1"><span>${u.name} (${u.id})</span>${u.isAdmin ? '<span class="text-violet-300">Admin</span>' : `<button data-action="del-user" data-user="${u.id}" class="text-rose-300">Supprimer</button>`}</div>`).join('') : '<p class="text-slate-400">Aucun utilisateur actif.</p>'
}

function deleteUser(id) {
  if (!id || id === 'admin') return
  Object.entries(parkingSpotsData).forEach(([n, d]) => { if (d.userId === id) delete parkingSpotsData[n] })
  delete usersData[id]
  const f = fb()
  if (f) {
    f.remove(f.ref(f.db, `users/${id}`))
  } else {
    write(STORAGE_KEYS.spots, parkingSpotsData)
    write(STORAGE_KEYS.users, usersData)
  }
  paintSpots()
  toast(`Utilisateur ${id} supprimé`, 'ok')
}

function sendMessage() {
  if (!currentUser) return toast('Connecte-toi pour écrire', 'warn')
  const m = els.chatInput.value.trim()
  if (!m) return
  els.chatInput.value = ''
  const data = { spotNum: mySpot(), userId: currentUser.id, userName: currentUser.name, userClass: currentUser.class, message: m, timestamp: Date.now() }
  const f = fb()
  if (f) f.push(f.ref(f.db, 'messages'), data)
  else {
    const arr = read(STORAGE_KEYS.messages, [])
    arr.push(data)
    write(STORAGE_KEYS.messages, arr)
    addMessage(data)
  }
}

function addMessage(m) {
  const item = document.createElement('div')
  const own = m.userId === currentUser?.id
  item.className = `max-w-[85%] rounded-xl px-3 py-2 text-sm shadow ${own ? 'ml-auto bg-emerald-500 text-slate-950' : 'bg-slate-700/80 text-slate-100'}`
  item.innerHTML = `<div class="mb-1 text-[11px] font-semibold opacity-80">${m.spotNum ? `Place ${m.spotNum}` : m.userName}</div><div>${m.message}</div>`
  els.chatMessages.appendChild(item)
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight
}

function loadData() {
  const f = fb()
  if (!f) {
    usersData = read(STORAGE_KEYS.users, {})
    parkingSpotsData = read(STORAGE_KEYS.spots, {})
    const msgs = read(STORAGE_KEYS.messages, [])
    const uid = localStorage.getItem('parkewo_userId')
    currentUser = uid ? usersData[uid] || null : null
    if (currentUser) hideLogin(), showUser()
    els.chatMessages.innerHTML = ''
    msgs.sort((a, b) => a.timestamp - b.timestamp).forEach(addMessage)
    paintSpots()
    toast('Mode local actif (Firebase non configuré)', 'info')
    return
  }

  f.onValue(f.ref(f.db, 'users'), (s) => {
    usersData = s.val() || {}
    const uid = localStorage.getItem('parkewo_userId')
    if (uid && usersData[uid]) { currentUser = usersData[uid]; hideLogin(); showUser() }
    renderAdminPanel()
  })
  f.onValue(f.ref(f.db, 'parkingSpots'), (s) => { parkingSpotsData = s.val() || {}; paintSpots() })
  f.onValue(f.ref(f.db, 'messages'), (s) => {
    const list = Object.values(s.val() || {}).sort((a, b) => a.timestamp - b.timestamp)
    els.chatMessages.innerHTML = ''
    list.forEach(addMessage)
  })
}

function login() {
  const account = accountById(els.accountId.value)
  if (!account || account.password !== els.accountPassword.value) return toast('Identifiants invalides', 'warn')
  currentUser = { id: account.id, name: account.name, class: account.class, isStudent: account.isStudent, isAdmin: account.isAdmin }
  usersData[currentUser.id] = currentUser
  localStorage.setItem('parkewo_userId', currentUser.id)
  const f = fb()
  if (f) f.set(f.ref(f.db, `users/${currentUser.id}`), currentUser)
  else write(STORAGE_KEYS.users, usersData)
  hideLogin()
  showUser()
  paintSpots()
  toast(`Bienvenue ${currentUser.name}`, 'ok')
}

function logout() {
  if (!currentUser) return
  const id = currentUser.id
  if (mySpot()) freeSpot(mySpot())
  const f = fb()
  if (f) f.remove(f.ref(f.db, `users/${id}`))
  else { delete usersData[id]; write(STORAGE_KEYS.users, usersData) }
  currentUser = null
  localStorage.removeItem('parkewo_userId')
  hideUser()
  showLogin()
}

function selectSpot(num) {
  selectedSpotNum = num
  document.querySelectorAll('.parking-spot').forEach((el) => {
    const selected = el.dataset.spot === String(num)
    el.classList.toggle('ring-4', selected)
    el.classList.toggle('ring-sky-300/80', selected)
  })
  const s = spotLayout.find((x) => String(x.num) === String(num))
  if (!s) return
  els.layoutPanel.classList.remove('hidden')
  els.layoutSelectedLabel.textContent = `Place sélectionnée: ${s.num}`
  els.layoutCoords.textContent = `x: ${s.x.toFixed(1)}%, y: ${s.y.toFixed(1)}%, w: ${s.w.toFixed(1)}%, h: ${s.h.toFixed(1)}%`
  els.layoutWidthInput.value = String(s.w)
  els.layoutHeightInput.value = String(s.h)
}

function startDrag(e, num) {
  if (!layoutMode || !isAdmin()) return
  const s = spotLayout.find((x) => String(x.num) === String(num))
  if (!s) return
  const r = els.parkingSpots.getBoundingClientRect()
  dragOffset = { x: ((e.clientX - r.left) / r.width) * 100 - s.x, y: ((e.clientY - r.top) / r.height) * 100 - s.y }
  selectedSpotNum = num
  isDraggingSpot = true
}

function init() {
  const savedLayout = read(STORAGE_KEYS.layout, null)
  if (Array.isArray(savedLayout) && savedLayout.length) spotLayout = savedLayout

  renderAccounts()
  renderSpots()
  loadData()
  if (!currentUser) showLogin()

  els.loginForm.addEventListener('submit', (e) => { e.preventDefault(); login() })
  els.logoutBtn.addEventListener('click', logout)
  els.releaseSpotBtn.addEventListener('click', () => (mySpot() ? freeSpot(mySpot()) : toast('Aucune place à libérer', 'info')))
  els.sendMessageBtn.addEventListener('click', sendMessage)
  els.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage() })

  let collapsed = false
  els.toggleChatBtn.addEventListener('click', () => {
    collapsed = !collapsed
    els.chatBody.classList.toggle('hidden', collapsed)
    els.chatContainer.classList.toggle('h-[58px]', collapsed)
    els.chatContainer.classList.toggle('h-[300px]', !collapsed)
    els.chatContainer.classList.toggle('md:h-[360px]', !collapsed)
    els.toggleChatBtn.textContent = collapsed ? '+' : '−'
  })

  els.suggestSpotBtn.addEventListener('click', () => {
    const free = spotLayout.find((s) => !parkingSpotsData[String(s.num)])
    if (!free) return toast('Aucune place libre', 'warn')
    const target = document.querySelector(`.parking-spot[data-spot="${free.num}"]`)
    if (target) {
      target.classList.add('ring-4', 'ring-amber-300/80')
      setTimeout(() => target.classList.remove('ring-4', 'ring-amber-300/80'), 1200)
    }
  })

  els.toggleLayoutModeBtn.addEventListener('click', () => {
    if (!isAdmin()) return toast('Accès admin requis', 'warn')
    layoutMode = !layoutMode
    els.toggleLayoutModeBtn.textContent = layoutMode ? 'Placement ON' : 'Mode placement'
    if (!layoutMode) els.layoutPanel.classList.add('hidden')
  })

  els.openAdminPanelBtn.addEventListener('click', () => isAdmin() && els.adminPanel.classList.remove('hidden'))
  els.closeAdminPanelBtn.addEventListener('click', () => els.adminPanel.classList.add('hidden'))
  els.adminPanel.addEventListener('click', (e) => {
    const t = e.target
    if (!(t instanceof HTMLElement) || !isAdmin()) return
    if (t.dataset.action === 'free') freeSpot(t.dataset.spot)
    if (t.dataset.action === 'del-user') deleteUser(t.dataset.user)
  })

  els.layoutWidthInput.addEventListener('input', () => {
    if (!isAdmin() || !selectedSpotNum) return
    const s = spotLayout.find((x) => String(x.num) === String(selectedSpotNum))
    if (!s) return
    s.w = Number(els.layoutWidthInput.value)
    s.x = clamp(s.x, 0, 100 - s.w)
    write(STORAGE_KEYS.layout, spotLayout)
    renderSpots()
    selectSpot(selectedSpotNum)
  })
  els.layoutHeightInput.addEventListener('input', () => {
    if (!isAdmin() || !selectedSpotNum) return
    const s = spotLayout.find((x) => String(x.num) === String(selectedSpotNum))
    if (!s) return
    s.h = Number(els.layoutHeightInput.value)
    s.y = clamp(s.y, 0, 100 - s.h)
    write(STORAGE_KEYS.layout, spotLayout)
    renderSpots()
    selectSpot(selectedSpotNum)
  })
  els.copyLayoutBtn.addEventListener('click', async () => {
    if (!isAdmin()) return
    const json = JSON.stringify(spotLayout, null, 2)
    try { await navigator.clipboard.writeText(json); toast('Layout copié', 'ok') } catch { console.log(json) }
  })
  els.resetLayoutBtn.addEventListener('click', () => {
    if (!isAdmin()) return
    spotLayout = DEFAULT_SPOT_LAYOUT.map((s) => ({ ...s }))
    write(STORAGE_KEYS.layout, spotLayout)
    renderSpots()
  })

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingSpot || !layoutMode || !selectedSpotNum) return
    const s = spotLayout.find((x) => String(x.num) === String(selectedSpotNum))
    if (!s) return
    const r = els.parkingSpots.getBoundingClientRect()
    s.x = clamp(((e.clientX - r.left) / r.width) * 100 - dragOffset.x, 0, 100 - s.w)
    s.y = clamp(((e.clientY - r.top) / r.height) * 100 - dragOffset.y, 0, 100 - s.h)
    write(STORAGE_KEYS.layout, spotLayout)
    renderSpots()
    selectSpot(selectedSpotNum)
  })
  window.addEventListener('mouseup', () => { isDraggingSpot = false })
}

document.addEventListener('DOMContentLoaded', init)
document.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) e.preventDefault()
  },
  { passive: false },
)

const PREDEFINED_ACCOUNTS = [
  { id: 'admin', label: 'Admin principal', password: 'admin123', name: 'Admin', class: 'Administration', isStudent: false, isAdmin: true },
  { id: 'eleve_1', label: 'Élève - Alex Martin', password: 'alex123', name: 'Alex Martin', class: '3ème A', isStudent: true, isAdmin: false },
  { id: 'eleve_2', label: 'Élève - Lina Perez', password: 'lina123', name: 'Lina Perez', class: '3ème B', isStudent: true, isAdmin: false },
  { id: 'prof_1', label: 'Prof - M. Dupont', password: 'dupont123', name: 'M. Dupont', class: 'Professeur', isStudent: false, isAdmin: false },
  { id: 'prof_2', label: 'Prof - Mme Bernard', password: 'bernard123', name: 'Mme Bernard', class: 'Professeur', isStudent: false, isAdmin: false },
]

const DEFAULT_SPOT_LAYOUT = [
  { num: 1, x: 7.7, y: 4.6, w: 4.6, h: 11.4 }, { num: 2, x: 13.1, y: 4.6, w: 4.6, h: 11.4 },
  { num: 3, x: 18.6, y: 4.6, w: 4.6, h: 11.4 }, { num: 4, x: 24.0, y: 4.6, w: 4.6, h: 11.4 },
  { num: 5, x: 29.5, y: 4.6, w: 4.6, h: 11.4 }, { num: 6, x: 35.8, y: 4.6, w: 4.6, h: 11.4 },
  { num: 7, x: 41.2, y: 4.6, w: 4.6, h: 11.4 }, { num: 8, x: 46.6, y: 4.6, w: 4.6, h: 11.4 },
  { num: 9, x: 52.0, y: 4.6, w: 4.6, h: 11.4 }, { num: 10, x: 57.4, y: 4.6, w: 4.6, h: 11.4 },
  { num: 11, x: 62.8, y: 4.6, w: 4.6, h: 11.4 }, { num: 12, x: 68.2, y: 4.6, w: 4.6, h: 11.4 },
  { num: 13, x: 73.6, y: 4.6, w: 4.6, h: 11.4 }, { num: 14, x: 79.0, y: 4.6, w: 4.6, h: 11.4 },
  { num: 15, x: 84.4, y: 4.6, w: 4.6, h: 11.4 }, { num: 16, x: 24.0, y: 36.2, w: 4.6, h: 11.4 },
  { num: 17, x: 29.5, y: 36.2, w: 4.6, h: 11.4 }, { num: 18, x: 35.0, y: 36.2, w: 4.6, h: 11.4 },
  { num: 19, x: 40.4, y: 36.2, w: 4.6, h: 11.4 }, { num: 20, x: 45.8, y: 36.2, w: 4.6, h: 11.4 },
  { num: 21, x: 51.2, y: 36.2, w: 4.6, h: 11.4 }, { num: 22, x: 56.6, y: 36.2, w: 4.6, h: 11.4 },
  { num: 23, x: 62.0, y: 36.2, w: 4.6, h: 11.4 }, { num: 24, x: 67.4, y: 36.2, w: 4.6, h: 11.4 },
]

const STORAGE_KEYS = {
  spots: 'parkewo_spots_local',
  messages: 'parkewo_messages_local',
  users: 'parkewo_users_local',
  layout: 'parkewo_spot_layout_local',
}

let currentUser = null
let usersData = {}
let parkingSpotsData = {}
let spotLayout = DEFAULT_SPOT_LAYOUT.map((s) => ({ ...s }))
let layoutMode = false
let selectedSpotNum = null
let isDraggingSpot = false
let dragOffsetPercent = { x: 0, y: 0 }
let usingFirebase = false

const els = {
  parkingSpots: document.getElementById('parking-spots'),
  loginModal: document.getElementById('login-modal'),
  loginForm: document.getElementById('login-form'),
  accountId: document.getElementById('account-id'),
  accountPassword: document.getElementById('account-password'),
  userPanel: document.getElementById('user-panel'),
  currentUserName: document.getElementById('current-user-name'),
  currentUserClass: document.getElementById('current-user-class'),
  currentUserStatus: document.getElementById('current-user-status'),
  currentUserSpot: document.getElementById('current-user-spot'),
  logoutBtn: document.getElementById('logout-btn'),
  releaseSpotBtn: document.getElementById('release-spot-btn'),
  chatInput: document.getElementById('chat-input'),
  sendMessageBtn: document.getElementById('send-message-btn'),
  toggleChatBtn: document.getElementById('toggle-chat'),
  chatContainer: document.getElementById('chat-container'),
  chatBody: document.getElementById('chat-body'),
  chatMessages: document.getElementById('chat-messages'),
  suggestSpotBtn: document.getElementById('suggest-spot-btn'),
  toggleLayoutModeBtn: document.getElementById('toggle-layout-mode-btn'),
  openAdminPanelBtn: document.getElementById('open-admin-panel-btn'),
  closeAdminPanelBtn: document.getElementById('close-admin-panel-btn'),
  adminPanel: document.getElementById('admin-panel'),
  adminOccupiedList: document.getElementById('admin-occupied-list'),
  adminUsersList: document.getElementById('admin-users-list'),
  layoutPanel: document.getElementById('layout-panel'),
  layoutSelectedLabel: document.getElementById('layout-selected-label'),
  layoutCoords: document.getElementById('layout-coords'),
  layoutWidthInput: document.getElementById('layout-width-input'),
  layoutHeightInput: document.getElementById('layout-height-input'),
  copyLayoutBtn: document.getElementById('copy-layout-btn'),
  resetLayoutBtn: document.getElementById('reset-layout-btn'),
  toast: document.getElementById('toast'),
  totalSpots: document.getElementById('total-spots'),
  occupiedSpots: document.getElementById('occupied-spots'),
  freeSpots: document.getElementById('free-spots'),
}

function getFirebase() {
  if (!window.firebaseReady) return null
  const api = {
        db: window.firebaseDatabase,
        ref: window.firebaseRef,
        set: window.firebaseSet,
        onValue: window.firebaseOnValue,
        push: window.firebasePush,
    remove: window.firebaseRemove,
  }
  const ok = typeof api.ref === 'function' && typeof api.set === 'function' && typeof api.onValue === 'function'
  return ok ? api : null
}

function readLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocalJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function showToast(message, type = 'info') {
  const palette = {
    info: 'border-sky-300/30 text-sky-100',
    ok: 'border-emerald-300/30 text-emerald-100',
    warn: 'border-amber-300/30 text-amber-100',
  }
  els.toast.className = `pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border bg-slate-900/95 px-4 py-2 text-sm font-medium shadow-xl ${palette[type] || palette.info}`
  els.toast.textContent = message
  els.toast.classList.remove('hidden')
  clearTimeout(showToast._t)
  showToast._t = setTimeout(() => els.toast.classList.add('hidden'), 2000)
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function isAdmin() {
  return Boolean(currentUser?.isAdmin)
}

function getCurrentUserSpotNumber() {
  if (!currentUser) return null
  for (const [num, spot] of Object.entries(parkingSpotsData)) {
    if (spot?.userId === currentUser.id) return num
  }
  return null
}

function findLayoutSpot(num) {
  return spotLayout.find((s) => String(s.num) === String(num))
}

function persistLayout() {
  writeLocalJSON(STORAGE_KEYS.layout, spotLayout)
}

function updateStats() {
  const total = spotLayout.length
  const occupied = Object.keys(parkingSpotsData).length
  els.totalSpots.textContent = String(total)
  els.occupiedSpots.textContent = String(occupied)
  els.freeSpots.textContent = String(total - occupied)
}

function showLoginModal() {
  els.loginModal.classList.remove('hidden')
}

function hideLoginModal() {
  els.loginModal.classList.add('hidden')
}

function updateAdminButtonsVisibility() {
  const visible = isAdmin()
  els.toggleLayoutModeBtn.classList.toggle('hidden', !visible)
  els.openAdminPanelBtn.classList.toggle('hidden', !visible)
  if (!visible) {
    els.adminPanel.classList.add('hidden')
    layoutMode = false
    els.layoutPanel.classList.add('hidden')
  }
}

function showUserPanel() {
  els.userPanel.classList.remove('hidden')
  els.currentUserName.textContent = `Nom: ${currentUser.name}`
  els.currentUserClass.textContent = `Classe/Role: ${currentUser.class}`
  els.currentUserStatus.textContent = currentUser.isAdmin ? 'Statut: Admin' : (currentUser.isStudent ? 'Statut: Étudiant' : 'Statut: Personnel')
  const spotNum = getCurrentUserSpotNumber()
  els.currentUserSpot.textContent = spotNum ? `Ta place: ${spotNum}` : 'Ta place: aucune'
  updateAdminButtonsVisibility()
}

function hideUserPanel() {
  els.userPanel.classList.add('hidden')
  updateAdminButtonsVisibility()
}

function hydrateAccountSelect() {
  els.accountId.innerHTML = '<option value="">Choisir un compte</option>'
  PREDEFINED_ACCOUNTS.forEach((acc) => {
    const option = document.createElement('option')
    option.value = acc.id
    option.textContent = acc.label
    els.accountId.appendChild(option)
  })
}

function updateLayoutPanel() {
  if (!layoutMode || !isAdmin()) {
    els.layoutPanel.classList.add('hidden')
    return
  }
  els.layoutPanel.classList.remove('hidden')
  const selected = findLayoutSpot(selectedSpotNum)
  els.layoutSelectedLabel.textContent = `Place sélectionnée: ${selected ? selected.num : '-'}`
  els.layoutCoords.textContent = selected
    ? `x: ${selected.x.toFixed(1)}%, y: ${selected.y.toFixed(1)}%, w: ${selected.w.toFixed(1)}%, h: ${selected.h.toFixed(1)}%`
    : 'x: -, y: -, w: -, h: -'
  if (selected) {
    els.layoutWidthInput.value = String(selected.w)
    els.layoutHeightInput.value = String(selected.h)
  }
}

function selectSpot(num) {
  selectedSpotNum = num
  document.querySelectorAll('.parking-spot').forEach((el) => {
    const selected = el.dataset.spot === String(num)
    el.classList.toggle('ring-4', selected)
    el.classList.toggle('ring-sky-300/80', selected)
  })
  updateLayoutPanel()
}

function getClientPosition(event) {
  if (event.touches && event.touches[0]) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  return { x: event.clientX, y: event.clientY }
}

function startSpotDrag(event, num) {
  if (!layoutMode || !isAdmin()) return
  const mapRect = els.parkingSpots.getBoundingClientRect()
  const spot = findLayoutSpot(num)
  if (!spot || mapRect.width === 0 || mapRect.height === 0) return
  const pos = getClientPosition(event)
  const cursorX = ((pos.x - mapRect.left) / mapRect.width) * 100
  const cursorY = ((pos.y - mapRect.top) / mapRect.height) * 100
  dragOffsetPercent = { x: cursorX - spot.x, y: cursorY - spot.y }
  selectedSpotNum = num
  isDraggingSpot = true
  selectSpot(num)
}

function dragSelectedSpot(event) {
  if (!isDraggingSpot || !layoutMode || !isAdmin() || !selectedSpotNum) return
  const mapRect = els.parkingSpots.getBoundingClientRect()
  const spot = findLayoutSpot(selectedSpotNum)
  if (!spot || mapRect.width === 0 || mapRect.height === 0) return
  const pos = getClientPosition(event)
  const cursorX = ((pos.x - mapRect.left) / mapRect.width) * 100
  const cursorY = ((pos.y - mapRect.top) / mapRect.height) * 100
  spot.x = clamp(cursorX - dragOffsetPercent.x, 0, 100 - spot.w)
  spot.y = clamp(cursorY - dragOffsetPercent.y, 0, 100 - spot.h)
  persistLayout()
  renderParkingSpots()
  updateParkingSpotsDisplay()
  selectSpot(selectedSpotNum)
}

function renderParkingSpots() {
  els.parkingSpots.innerHTML = spotLayout
    .map(
      (spot) => `
    <button
      type="button"
      class="parking-spot absolute flex min-h-[52px] min-w-[30px] items-center justify-center rounded-lg border-2 border-emerald-300/80 bg-emerald-500/75 shadow-lg shadow-slate-950/45 transition hover:scale-[1.03]"
      data-spot="${spot.num}"
      style="left:${spot.x}%;top:${spot.y}%;width:${spot.w}%;height:${spot.h}%"
    >
      <span class="pointer-events-none text-sm font-black text-white drop-shadow md:text-lg">${spot.num}</span>
      <div class="spot-owner-info pointer-events-none absolute left-1/2 top-[calc(100%+2px)] hidden w-max max-w-[160px] -translate-x-1/2 rounded-md border border-white/10 bg-slate-950/95 px-2 py-1 text-[10px] leading-tight text-white shadow-lg md:text-[11px]"></div>
    </button>
  `,
    )
    .join('')

  document.querySelectorAll('.parking-spot').forEach((spotEl) => {
    const num = spotEl.dataset.spot
    spotEl.addEventListener('click', () => handleSpotClick(num))
    spotEl.addEventListener('mousedown', (e) => startSpotDrag(e, num))
    spotEl.addEventListener('touchstart', (e) => startSpotDrag(e, num), { passive: true })
  })
}

function renderAdminPanel() {
  if (!isAdmin()) return
  const occupiedEntries = Object.entries(parkingSpotsData)
  els.adminOccupiedList.innerHTML = occupiedEntries.length
    ? occupiedEntries
        .map(
          ([spotNum, data]) => `
      <div class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-slate-900/70 px-2 py-1">
        <span>Place ${spotNum} · ${data.userName}</span>
        <button data-action="free-spot" data-spot="${spotNum}" class="rounded border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-amber-200">Libérer</button>
      </div>
    `,
        )
        .join('')
    : '<p class="text-slate-400">Aucune place occupée.</p>'

  const users = Object.values(usersData)
  els.adminUsersList.innerHTML = users.length
    ? users
        .map(
          (u) => `
      <div class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-slate-900/70 px-2 py-1">
        <span>${u.name} (${u.id})</span>
        ${
          u.isAdmin
            ? '<span class="text-violet-300">Admin</span>'
            : `<button data-action="delete-user" data-user-id="${u.id}" class="rounded border border-rose-400/40 bg-rose-500/20 px-2 py-1 text-rose-200">Supprimer</button>`
        }
      </div>
    `,
        )
        .join('')
    : '<p class="text-slate-400">Aucun utilisateur actif.</p>'
}

function updateParkingSpotsDisplay() {
  document.querySelectorAll('.parking-spot').forEach((spotEl) => {
    const num = spotEl.dataset.spot
    const data = parkingSpotsData[num]
    const owner = spotEl.querySelector('.spot-owner-info')
    spotEl.classList.remove('border-emerald-300/80', 'bg-emerald-500/75', 'border-rose-300/80', 'bg-rose-500/80', 'border-sky-300/90', 'bg-sky-500/85')
    if (!data) {
      spotEl.classList.add('border-emerald-300/80', 'bg-emerald-500/75')
      owner.classList.add('hidden')
      owner.innerHTML = ''
      return
    }
    const mine = currentUser && data.userId === currentUser.id
    if (mine) {
      spotEl.classList.add('border-sky-300/90', 'bg-sky-500/85')
        } else {
      spotEl.classList.add('border-rose-300/80', 'bg-rose-500/80')
    }
    owner.classList.remove('hidden')
    owner.innerHTML = `<div class="font-semibold">${data.userName}</div><div>${data.userClass} · ${data.isStudent ? 'Étudiant' : 'Personnel'}</div>`
  })

  updateStats()
  if (currentUser) {
    const currentSpot = getCurrentUserSpotNumber()
    els.currentUserSpot.textContent = currentSpot ? `Ta place: ${currentSpot}` : 'Ta place: aucune'
  }
  renderAdminPanel()
}

function addChatMessage(sender, message, isOwn) {
  const msg = document.createElement('div')
  msg.className = `max-w-[85%] rounded-xl px-3 py-2 text-sm shadow ${isOwn ? 'ml-auto bg-emerald-500 text-slate-950' : 'bg-slate-700/80 text-slate-100'}`
  msg.innerHTML = `<div class="mb-1 text-[11px] font-semibold opacity-80">${sender}</div><div>${message}</div>`
  els.chatMessages.appendChild(msg)
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight
}

function persistUsersLocal() {
  writeLocalJSON(STORAGE_KEYS.users, usersData)
}

function saveUserSession(userData) {
  usersData[userData.id] = userData
  localStorage.setItem('parkewo_userId', userData.id)
}

function deleteUserById(userId) {
  if (!userId || userId === 'admin') return
  const spotsToFree = []
  Object.entries(parkingSpotsData).forEach(([spotNum, data]) => {
    if (data.userId === userId) spotsToFree.push(spotNum)
  })
  spotsToFree.forEach((s) => delete parkingSpotsData[s])
  delete usersData[userId]

  if (currentUser?.id === userId) {
    currentUser = null
    localStorage.removeItem('parkewo_userId')
    hideUserPanel()
    showLoginModal()
  }

  const fb = getFirebase()
  if (fb) {
    fb.remove(fb.ref(fb.db, `users/${userId}`))
    spotsToFree.forEach((s) => fb.remove(fb.ref(fb.db, `parkingSpots/${s}`)))
        } else {
    writeLocalJSON(STORAGE_KEYS.spots, parkingSpotsData)
    persistUsersLocal()
  }
  updateParkingSpotsDisplay()
  showToast(`Utilisateur ${userId} supprimé`, 'ok')
}

function occupySpot(spotNum) {
  const userData = {
    userId: currentUser.id,
    userName: currentUser.name,
    userClass: currentUser.class,
    isStudent: currentUser.isStudent,
  }
  parkingSpotsData[spotNum] = userData
  const fb = getFirebase()
  if (fb) {
    fb.set(fb.ref(fb.db, `parkingSpots/${spotNum}`), userData)
  } else {
    writeLocalJSON(STORAGE_KEYS.spots, parkingSpotsData)
  }
  updateParkingSpotsDisplay()
}

function freeSpot(spotNum) {
  delete parkingSpotsData[spotNum]
  const fb = getFirebase()
  if (fb) {
    fb.remove(fb.ref(fb.db, `parkingSpots/${spotNum}`))
  } else {
    writeLocalJSON(STORAGE_KEYS.spots, parkingSpotsData)
  }
  updateParkingSpotsDisplay()
}

function handleSpotClick(spotNum) {
  if (layoutMode && isAdmin()) {
    selectSpot(spotNum)
    return
  }
  if (!currentUser) {
    showLoginModal()
    showToast('Connecte-toi d’abord', 'warn')
    return
  }
  const spotData = parkingSpotsData[spotNum]
  const mySpot = getCurrentUserSpotNumber()
  if (spotData?.userId === currentUser.id) {
    freeSpot(spotNum)
    showToast(`Place ${spotNum} libérée`, 'ok')
    return
  }
  if (spotData) return showToast(`Place ${spotNum} déjà occupée`, 'warn')
  if (mySpot) return showToast(`Tu occupes déjà la place ${mySpot}`, 'warn')
  occupySpot(spotNum)
  showToast(`Place ${spotNum} réservée`, 'ok')
}

function sendChatMessage(message) {
  const spotNum = getCurrentUserSpotNumber()
  const payload = {
    spotNum,
    userId: currentUser.id,
    userName: currentUser.name,
    userClass: currentUser.class,
    message,
    timestamp: Date.now(),
  }
  const fb = getFirebase()
  if (fb) {
    fb.push(fb.ref(fb.db, 'messages'), payload)
  } else {
    const messages = readLocalJSON(STORAGE_KEYS.messages, [])
    messages.push(payload)
    writeLocalJSON(STORAGE_KEYS.messages, messages)
    addChatMessage(spotNum ? `Place ${spotNum}` : currentUser.name, message, true)
  }
}

function loadData() {
  const fb = getFirebase()
  usingFirebase = Boolean(fb)
  if (!fb) {
    usersData = readLocalJSON(STORAGE_KEYS.users, {})
    parkingSpotsData = readLocalJSON(STORAGE_KEYS.spots, {})
    const messages = readLocalJSON(STORAGE_KEYS.messages, [])
    const userId = localStorage.getItem('parkewo_userId')
    currentUser = userId ? usersData[userId] || null : null
    if (currentUser) {
      hideLoginModal()
      showUserPanel()
    }
    els.chatMessages.innerHTML = ''
    messages.sort((a, b) => a.timestamp - b.timestamp).forEach((m) => {
      addChatMessage(m.spotNum ? `Place ${m.spotNum}` : m.userName, m.message, m.userId === currentUser?.id)
    })
    updateParkingSpotsDisplay()
    return
  }

  fb.onValue(fb.ref(fb.db, 'users'), (snap) => {
    usersData = snap.val() || {}
    const userId = localStorage.getItem('parkewo_userId')
    if (userId && usersData[userId]) {
      currentUser = usersData[userId]
      hideLoginModal()
      showUserPanel()
    }
    renderAdminPanel()
  })

  fb.onValue(fb.ref(fb.db, 'parkingSpots'), (snap) => {
    parkingSpotsData = snap.val() || {}
    updateParkingSpotsDisplay()
  })

  fb.onValue(fb.ref(fb.db, 'messages'), (snap) => {
    const data = snap.val() || {}
    const messages = Object.values(data).sort((a, b) => a.timestamp - b.timestamp)
    els.chatMessages.innerHTML = ''
    messages.forEach((m) => addChatMessage(m.spotNum ? `Place ${m.spotNum}` : m.userName, m.message, m.userId === currentUser?.id))
  })
}

function login() {
  const account = PREDEFINED_ACCOUNTS.find((a) => a.id === els.accountId.value)
  if (!account || account.password !== els.accountPassword.value) {
    showToast('Identifiants invalides', 'warn')
    return
  }
            currentUser = {
    id: account.id,
    name: account.name,
    class: account.class,
    isStudent: account.isStudent,
    isAdmin: account.isAdmin,
  }
  saveUserSession(currentUser)
  const fb = getFirebase()
  if (fb) {
    fb.set(fb.ref(fb.db, `users/${currentUser.id}`), currentUser)
        } else {
    persistUsersLocal()
  }
  hideLoginModal()
  showUserPanel()
  updateParkingSpotsDisplay()
  showToast(`Bienvenue ${currentUser.name}`, 'ok')
}

function logout() {
  if (!currentUser) return
  const myId = currentUser.id
  const mySpot = getCurrentUserSpotNumber()
  if (mySpot) freeSpot(mySpot)
  const fb = getFirebase()
  if (fb) {
    fb.remove(fb.ref(fb.db, `users/${myId}`))
  } else {
    delete usersData[myId]
    persistUsersLocal()
  }
  currentUser = null
  localStorage.removeItem('parkewo_userId')
  hideUserPanel()
  showLoginModal()
  showToast('Déconnecté', 'info')
}

function sendMessage() {
  if (!currentUser) return showToast('Connecte-toi pour écrire', 'warn')
  const text = els.chatInput.value.trim()
  if (!text) return
  els.chatInput.value = ''
  sendChatMessage(text)
}

function initEvents() {
  els.loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    login()
  })

  els.logoutBtn.addEventListener('click', logout)

  els.releaseSpotBtn.addEventListener('click', () => {
    const mySpot = getCurrentUserSpotNumber()
    if (!mySpot) return showToast('Aucune place à libérer', 'info')
    freeSpot(mySpot)
    showToast(`Place ${mySpot} libérée`, 'ok')
  })

  els.sendMessageBtn.addEventListener('click', sendMessage)
  els.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage()
  })

  let chatCollapsed = false
  els.toggleChatBtn.addEventListener('click', () => {
    chatCollapsed = !chatCollapsed
    els.chatBody.classList.toggle('hidden', chatCollapsed)
    els.chatContainer.classList.toggle('h-[58px]', chatCollapsed)
    els.chatContainer.classList.toggle('h-[300px]', !chatCollapsed)
    els.chatContainer.classList.toggle('md:h-[360px]', !chatCollapsed)
    els.toggleChatBtn.textContent = chatCollapsed ? '+' : '−'
  })

  els.suggestSpotBtn.addEventListener('click', () => {
    const free = spotLayout.find((s) => !parkingSpotsData[String(s.num)])
    if (!free) return showToast('Aucune place libre', 'warn')
    const target = document.querySelector(`.parking-spot[data-spot="${free.num}"]`)
    if (target) {
      target.classList.add('ring-4', 'ring-amber-300/80')
      setTimeout(() => target.classList.remove('ring-4', 'ring-amber-300/80'), 1200)
    }
    showToast(`Place suggérée: ${free.num}`, 'info')
  })

  els.toggleLayoutModeBtn.addEventListener('click', () => {
    if (!isAdmin()) return showToast('Accès admin requis', 'warn')
    layoutMode = !layoutMode
    els.toggleLayoutModeBtn.textContent = layoutMode ? 'Placement ON' : 'Mode placement'
    updateLayoutPanel()
  })

  els.layoutWidthInput.addEventListener('input', () => {
    if (!isAdmin() || !selectedSpotNum) return
    const spot = findLayoutSpot(selectedSpotNum)
    if (!spot) return
    spot.w = Number(els.layoutWidthInput.value)
    spot.x = clamp(spot.x, 0, 100 - spot.w)
    persistLayout()
    renderParkingSpots()
    updateParkingSpotsDisplay()
    selectSpot(selectedSpotNum)
  })

  els.layoutHeightInput.addEventListener('input', () => {
    if (!isAdmin() || !selectedSpotNum) return
    const spot = findLayoutSpot(selectedSpotNum)
    if (!spot) return
    spot.h = Number(els.layoutHeightInput.value)
    spot.y = clamp(spot.y, 0, 100 - spot.h)
    persistLayout()
    renderParkingSpots()
    updateParkingSpotsDisplay()
    selectSpot(selectedSpotNum)
  })

  els.copyLayoutBtn.addEventListener('click', async () => {
    if (!isAdmin()) return
    const data = JSON.stringify(spotLayout, null, 2)
    try {
      await navigator.clipboard.writeText(data)
      showToast('Layout copié', 'ok')
    } catch {
      console.log(data)
      showToast('Copie impossible, voir console', 'warn')
    }
  })

  els.resetLayoutBtn.addEventListener('click', () => {
    if (!isAdmin()) return
    spotLayout = DEFAULT_SPOT_LAYOUT.map((s) => ({ ...s }))
    persistLayout()
    renderParkingSpots()
    updateParkingSpotsDisplay()
    selectedSpotNum = null
    updateLayoutPanel()
  })

  els.openAdminPanelBtn.addEventListener('click', () => {
    if (!isAdmin()) return
    els.adminPanel.classList.remove('hidden')
    renderAdminPanel()
  })

  els.closeAdminPanelBtn.addEventListener('click', () => {
    els.adminPanel.classList.add('hidden')
  })

  els.adminPanel.addEventListener('click', (e) => {
    const target = e.target
    if (!(target instanceof HTMLElement)) return
    if (!isAdmin()) return
    if (target.dataset.action === 'free-spot') {
      freeSpot(target.dataset.spot)
      showToast(`Place ${target.dataset.spot} libérée`, 'ok')
    }
    if (target.dataset.action === 'delete-user') {
      deleteUserById(target.dataset.userId)
    }
  })

  window.addEventListener('mousemove', dragSelectedSpot)
  window.addEventListener('touchmove', dragSelectedSpot, { passive: true })
  window.addEventListener('mouseup', () => {
    isDraggingSpot = false
  })
  window.addEventListener('touchend', () => {
    isDraggingSpot = false
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const savedLayout = readLocalJSON(STORAGE_KEYS.layout, null)
  if (Array.isArray(savedLayout) && savedLayout.length > 0) {
    spotLayout = savedLayout
  }

  hydrateAccountSelect()
  renderParkingSpots()
  initEvents()
  loadData()
  updateStats()
  updateAdminButtonsVisibility()

  if (!currentUser) showLoginModal()
  if (!usingFirebase) showToast('Mode local actif (Firebase non configuré)', 'info')
})
document.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) e.preventDefault()
  },
  { passive: false },
)

const PREDEFINED_ACCOUNTS = [
  { id: 'admin', label: 'Admin principal', password: 'admin123', name: 'Admin', class: 'Administration', isStudent: false, isAdmin: true },
  { id: 'eleve_1', label: 'Élève - Alex Martin', password: 'alex123', name: 'Alex Martin', class: '3ème A', isStudent: true, isAdmin: false },
  { id: 'eleve_2', label: 'Élève - Lina Perez', password: 'lina123', name: 'Lina Perez', class: '3ème B', isStudent: true, isAdmin: false },
  { id: 'prof_1', label: 'Prof - M. Dupont', password: 'dupont123', name: 'M. Dupont', class: 'Professeur', isStudent: false, isAdmin: false },
  { id: 'prof_2', label: 'Prof - Mme Bernard', password: 'bernard123', name: 'Mme Bernard', class: 'Professeur', isStudent: false, isAdmin: false },
]

const DEFAULT_SPOT_LAYOUT = [
  { num: 1, x: 7.7, y: 4.6, w: 4.6, h: 11.4 }, { num: 2, x: 13.1, y: 4.6, w: 4.6, h: 11.4 },
  { num: 3, x: 18.6, y: 4.6, w: 4.6, h: 11.4 }, { num: 4, x: 24.0, y: 4.6, w: 4.6, h: 11.4 },
  { num: 5, x: 29.5, y: 4.6, w: 4.6, h: 11.4 }, { num: 6, x: 35.8, y: 4.6, w: 4.6, h: 11.4 },
  { num: 7, x: 41.2, y: 4.6, w: 4.6, h: 11.4 }, { num: 8, x: 46.6, y: 4.6, w: 4.6, h: 11.4 },
  { num: 9, x: 52.0, y: 4.6, w: 4.6, h: 11.4 }, { num: 10, x: 57.4, y: 4.6, w: 4.6, h: 11.4 },
  { num: 11, x: 62.8, y: 4.6, w: 4.6, h: 11.4 }, { num: 12, x: 68.2, y: 4.6, w: 4.6, h: 11.4 },
  { num: 13, x: 73.6, y: 4.6, w: 4.6, h: 11.4 }, { num: 14, x: 79.0, y: 4.6, w: 4.6, h: 11.4 },
  { num: 15, x: 84.4, y: 4.6, w: 4.6, h: 11.4 }, { num: 16, x: 24.0, y: 36.2, w: 4.6, h: 11.4 },
  { num: 17, x: 29.5, y: 36.2, w: 4.6, h: 11.4 }, { num: 18, x: 35.0, y: 36.2, w: 4.6, h: 11.4 },
  { num: 19, x: 40.4, y: 36.2, w: 4.6, h: 11.4 }, { num: 20, x: 45.8, y: 36.2, w: 4.6, h: 11.4 },
  { num: 21, x: 51.2, y: 36.2, w: 4.6, h: 11.4 }, { num: 22, x: 56.6, y: 36.2, w: 4.6, h: 11.4 },
  { num: 23, x: 62.0, y: 36.2, w: 4.6, h: 11.4 }, { num: 24, x: 67.4, y: 36.2, w: 4.6, h: 11.4 },
]

const STORAGE_KEYS = {
  spots: 'parkewo_spots_local',
  messages: 'parkewo_messages_local',
  users: 'parkewo_users_local',
  layout: 'parkewo_spot_layout_local',
}

let currentUser = null
let usersData = {}
let parkingSpotsData = {}
let spotLayout = DEFAULT_SPOT_LAYOUT.map((s) => ({ ...s }))
let layoutMode = false
let selectedSpotNum = null
let isDraggingSpot = false
let dragOffsetPercent = { x: 0, y: 0 }
let usingFirebase = false

const els = {
  parkingSpots: document.getElementById('parking-spots'),
  loginModal: document.getElementById('login-modal'),
  loginForm: document.getElementById('login-form'),
  accountId: document.getElementById('account-id'),
  accountPassword: document.getElementById('account-password'),
  userPanel: document.getElementById('user-panel'),
  currentUserName: document.getElementById('current-user-name'),
  currentUserClass: document.getElementById('current-user-class'),
  currentUserStatus: document.getElementById('current-user-status'),
  currentUserSpot: document.getElementById('current-user-spot'),
  logoutBtn: document.getElementById('logout-btn'),
  releaseSpotBtn: document.getElementById('release-spot-btn'),
  chatInput: document.getElementById('chat-input'),
  sendMessageBtn: document.getElementById('send-message-btn'),
  toggleChatBtn: document.getElementById('toggle-chat'),
  chatContainer: document.getElementById('chat-container'),
  chatBody: document.getElementById('chat-body'),
  chatMessages: document.getElementById('chat-messages'),
  suggestSpotBtn: document.getElementById('suggest-spot-btn'),
  toggleLayoutModeBtn: document.getElementById('toggle-layout-mode-btn'),
  openAdminPanelBtn: document.getElementById('open-admin-panel-btn'),
  closeAdminPanelBtn: document.getElementById('close-admin-panel-btn'),
  adminPanel: document.getElementById('admin-panel'),
  adminOccupiedList: document.getElementById('admin-occupied-list'),
  adminUsersList: document.getElementById('admin-users-list'),
  layoutPanel: document.getElementById('layout-panel'),
  layoutSelectedLabel: document.getElementById('layout-selected-label'),
  layoutCoords: document.getElementById('layout-coords'),
  layoutWidthInput: document.getElementById('layout-width-input'),
  layoutHeightInput: document.getElementById('layout-height-input'),
  copyLayoutBtn: document.getElementById('copy-layout-btn'),
  resetLayoutBtn: document.getElementById('reset-layout-btn'),
  toast: document.getElementById('toast'),
  totalSpots: document.getElementById('total-spots'),
  occupiedSpots: document.getElementById('occupied-spots'),
  freeSpots: document.getElementById('free-spots'),
}

function getFirebase() {
  if (!window.firebaseReady) return null
  const api = {
    db: window.firebaseDatabase,
    ref: window.firebaseRef,
    set: window.firebaseSet,
    onValue: window.firebaseOnValue,
    push: window.firebasePush,
    remove: window.firebaseRemove,
  }
  const ok = typeof api.ref === 'function' && typeof api.set === 'function' && typeof api.onValue === 'function'
  return ok ? api : null
}

function readLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocalJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function showToast(message, type = 'info') {
  const palette = {
    info: 'border-sky-300/30 text-sky-100',
    ok: 'border-emerald-300/30 text-emerald-100',
    warn: 'border-amber-300/30 text-amber-100',
  }
  els.toast.className = `pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border bg-slate-900/95 px-4 py-2 text-sm font-medium shadow-xl ${palette[type] || palette.info}`
  els.toast.textContent = message
  els.toast.classList.remove('hidden')
  clearTimeout(showToast._t)
  showToast._t = setTimeout(() => els.toast.classList.add('hidden'), 2000)
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function getCurrentUserSpotNumber() {
  if (!currentUser) return null
  for (const [num, spot] of Object.entries(parkingSpotsData)) {
    if (spot?.userId === currentUser.id) return num
  }
  return null
}

function isAdmin() {
  return Boolean(currentUser?.isAdmin)
}

function hydrateAccountSelect() {
  els.accountId.innerHTML = '<option value="">Choisir un compte</option>'
  PREDEFINED_ACCOUNTS.forEach((acc) => {
    const option = document.createElement('option')
    option.value = acc.id
    option.textContent = acc.label
    els.accountId.appendChild(option)
  })
}

function findLayoutSpot(num) {
  return spotLayout.find((s) => String(s.num) === String(num))
}

function persistLayout() {
  writeLocalJSON(STORAGE_KEYS.layout, spotLayout)
}

function updateStats() {
  const total = spotLayout.length
  const occupied = Object.keys(parkingSpotsData).length
  els.totalSpots.textContent = String(total)
  els.occupiedSpots.textContent = String(occupied)
  els.freeSpots.textContent = String(total - occupied)
}

function showLoginModal() {
  els.loginModal.classList.remove('hidden')
}

function hideLoginModal() {
  els.loginModal.classList.add('hidden')
}

function updateAdminButtonsVisibility() {
  const visible = isAdmin()
  els.toggleLayoutModeBtn.classList.toggle('hidden', !visible)
  els.openAdminPanelBtn.classList.toggle('hidden', !visible)
  if (!visible) {
    els.adminPanel.classList.add('hidden')
    layoutMode = false
    els.layoutPanel.classList.add('hidden')
  }
}

function showUserPanel() {
  els.userPanel.classList.remove('hidden')
  els.currentUserName.textContent = `Nom: ${currentUser.name}`
  els.currentUserClass.textContent = `Classe/Role: ${currentUser.class}`
  els.currentUserStatus.textContent = currentUser.isAdmin ? 'Statut: Admin' : (currentUser.isStudent ? 'Statut: Étudiant' : 'Statut: Personnel')
  const spotNum = getCurrentUserSpotNumber()
  els.currentUserSpot.textContent = spotNum ? `Ta place: ${spotNum}` : 'Ta place: aucune'
  updateAdminButtonsVisibility()
}

function hideUserPanel() {
  els.userPanel.classList.add('hidden')
  updateAdminButtonsVisibility()
}

function updateLayoutPanel() {
  if (!layoutMode || !isAdmin()) {
    els.layoutPanel.classList.add('hidden')
    return
  }
  els.layoutPanel.classList.remove('hidden')
  const selected = findLayoutSpot(selectedSpotNum)
  els.layoutSelectedLabel.textContent = `Place sélectionnée: ${selected ? selected.num : '-'}`
  els.layoutCoords.textContent = selected
    ? `x: ${selected.x.toFixed(1)}%, y: ${selected.y.toFixed(1)}%, w: ${selected.w.toFixed(1)}%, h: ${selected.h.toFixed(1)}%`
    : 'x: -, y: -, w: -, h: -'
  if (selected) {
    els.layoutWidthInput.value = String(selected.w)
    els.layoutHeightInput.value = String(selected.h)
  }
}

function selectSpot(num) {
  selectedSpotNum = num
  document.querySelectorAll('.parking-spot').forEach((el) => {
    const selected = el.dataset.spot === String(num)
    el.classList.toggle('ring-4', selected)
    el.classList.toggle('ring-sky-300/80', selected)
  })
  updateLayoutPanel()
}

function getClientPosition(event) {
  if (event.touches && event.touches[0]) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  return { x: event.clientX, y: event.clientY }
}

function startSpotDrag(event, num) {
  if (!layoutMode || !isAdmin()) return
  const mapRect = els.parkingSpots.getBoundingClientRect()
  const spot = findLayoutSpot(num)
  if (!spot || mapRect.width === 0 || mapRect.height === 0) return
  const pos = getClientPosition(event)
  const cursorX = ((pos.x - mapRect.left) / mapRect.width) * 100
  const cursorY = ((pos.y - mapRect.top) / mapRect.height) * 100
  dragOffsetPercent = { x: cursorX - spot.x, y: cursorY - spot.y }
  selectedSpotNum = num
  isDraggingSpot = true
  selectSpot(num)
}

function dragSelectedSpot(event) {
  if (!isDraggingSpot || !layoutMode || !isAdmin() || !selectedSpotNum) return
  const mapRect = els.parkingSpots.getBoundingClientRect()
  const spot = findLayoutSpot(selectedSpotNum)
  if (!spot || mapRect.width === 0 || mapRect.height === 0) return
  const pos = getClientPosition(event)
  const cursorX = ((pos.x - mapRect.left) / mapRect.width) * 100
  const cursorY = ((pos.y - mapRect.top) / mapRect.height) * 100
  spot.x = clamp(cursorX - dragOffsetPercent.x, 0, 100 - spot.w)
  spot.y = clamp(cursorY - dragOffsetPercent.y, 0, 100 - spot.h)
  persistLayout()
  renderParkingSpots()
  updateParkingSpotsDisplay()
  selectSpot(selectedSpotNum)
}

function renderParkingSpots() {
  els.parkingSpots.innerHTML = spotLayout.map((spot) => `
    <button
      type="button"
      class="parking-spot absolute flex min-h-[52px] min-w-[30px] items-center justify-center rounded-lg border-2 border-emerald-300/80 bg-emerald-500/75 shadow-lg shadow-slate-950/45 transition hover:scale-[1.03]"
      data-spot="${spot.num}"
      style="left:${spot.x}%;top:${spot.y}%;width:${spot.w}%;height:${spot.h}%"
    >
      <span class="pointer-events-none text-sm font-black text-white drop-shadow md:text-lg">${spot.num}</span>
      <div class="spot-owner-info pointer-events-none absolute left-1/2 top-[calc(100%+2px)] hidden w-max max-w-[160px] -translate-x-1/2 rounded-md border border-white/10 bg-slate-950/95 px-2 py-1 text-[10px] leading-tight text-white shadow-lg md:text-[11px]"></div>
    </button>
  `).join('')

  document.querySelectorAll('.parking-spot').forEach((spotEl) => {
    const num = spotEl.dataset.spot
    spotEl.addEventListener('click', () => handleSpotClick(num))
    spotEl.addEventListener('mousedown', (e) => startSpotDrag(e, num))
    spotEl.addEventListener('touchstart', (e) => startSpotDrag(e, num), { passive: true })
  })
}

function renderAdminPanel() {
  if (!isAdmin()) return
  const occupiedEntries = Object.entries(parkingSpotsData)
  els.adminOccupiedList.innerHTML = occupiedEntries.length
    ? occupiedEntries
        .map(([spotNum, data]) => `
          <div class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-slate-900/70 px-2 py-1">
            <span>Place ${spotNum} · ${data.userName}</span>
            <button data-action="free-spot" data-spot="${spotNum}" class="rounded border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-amber-200">Libérer</button>
          </div>
        `)
        .join('')
    : '<p class="text-slate-400">Aucune place occupée.</p>'

  const users = Object.values(usersData)
  els.adminUsersList.innerHTML = users.length
    ? users
        .map((u) => `
          <div class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-slate-900/70 px-2 py-1">
            <span>${u.name} (${u.id})</span>
            ${u.isAdmin ? '<span class="text-violet-300">Admin</span>' : `<button data-action="delete-user" data-user-id="${u.id}" class="rounded border border-rose-400/40 bg-rose-500/20 px-2 py-1 text-rose-200">Supprimer</button>`}
          </div>
        `)
        .join('')
    : '<p class="text-slate-400">Aucun utilisateur actif.</p>'
}

function updateParkingSpotsDisplay() {
  document.querySelectorAll('.parking-spot').forEach((spotEl) => {
    const num = spotEl.dataset.spot
    const data = parkingSpotsData[num]
    const owner = spotEl.querySelector('.spot-owner-info')
    spotEl.classList.remove('border-emerald-300/80', 'bg-emerald-500/75', 'border-rose-300/80', 'bg-rose-500/80', 'border-sky-300/90', 'bg-sky-500/85')
    if (!data) {
      spotEl.classList.add('border-emerald-300/80', 'bg-emerald-500/75')
      owner.classList.add('hidden')
      owner.innerHTML = ''
      return
    }
    const mine = currentUser && data.userId === currentUser.id
    if (mine) {
      spotEl.classList.add('border-sky-300/90', 'bg-sky-500/85')
    } else {
      spotEl.classList.add('border-rose-300/80', 'bg-rose-500/80')
    }
    owner.classList.remove('hidden')
    owner.innerHTML = `<div class="font-semibold">${data.userName}</div><div>${data.userClass} · ${data.isStudent ? 'Étudiant' : 'Personnel'}</div>`
  })

  updateStats()
  if (currentUser) {
    const currentSpot = getCurrentUserSpotNumber()
    els.currentUserSpot.textContent = currentSpot ? `Ta place: ${currentSpot}` : 'Ta place: aucune'
  }
  renderAdminPanel()
}

function addChatMessage(sender, message, isOwn) {
  const msg = document.createElement('div')
  msg.className = `max-w-[85%] rounded-xl px-3 py-2 text-sm shadow ${isOwn ? 'ml-auto bg-emerald-500 text-slate-950' : 'bg-slate-700/80 text-slate-100'}`
  msg.innerHTML = `<div class="mb-1 text-[11px] font-semibold opacity-80">${sender}</div><div>${message}</div>`
  els.chatMessages.appendChild(msg)
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight
}

function persistUsersLocal() {
  writeLocalJSON(STORAGE_KEYS.users, usersData)
}

function saveUserSession(userData) {
  usersData[userData.id] = userData
  localStorage.setItem('parkewo_userId', userData.id)
}

function deleteUserById(userId) {
  if (!userId || userId === 'admin') return

  Object.entries(parkingSpotsData).forEach(([spotNum, data]) => {
    if (data.userId === userId) delete parkingSpotsData[spotNum]
  })

  delete usersData[userId]
  if (currentUser?.id === userId) {
    currentUser = null
    localStorage.removeItem('parkewo_userId')
    hideUserPanel()
    showLoginModal()
  }

  const fb = getFirebase()
  if (fb) {
    fb.remove(fb.ref(fb.db, `users/${userId}`))
    Object.entries(parkingSpotsData).forEach(([spotNum, data]) => {
      if (data.userId === userId) fb.remove(fb.ref(fb.db, `parkingSpots/${spotNum}`))
    })
  } else {
    writeLocalJSON(STORAGE_KEYS.spots, parkingSpotsData)
    persistUsersLocal()
  }
  updateParkingSpotsDisplay()
  showToast(`Utilisateur ${userId} supprimé`, 'ok')
}

function occupySpot(spotNum) {
            const userData = {
                userId: currentUser.id,
                userName: currentUser.name,
                userClass: currentUser.class,
    isStudent: currentUser.isStudent,
  }
  parkingSpotsData[spotNum] = userData
  const fb = getFirebase()
  if (fb) {
    fb.set(fb.ref(fb.db, `parkingSpots/${spotNum}`), userData)
  } else {
    writeLocalJSON(STORAGE_KEYS.spots, parkingSpotsData)
  }
  updateParkingSpotsDisplay()
}

function freeSpot(spotNum) {
  delete parkingSpotsData[spotNum]
  const fb = getFirebase()
  if (fb) {
    fb.remove(fb.ref(fb.db, `parkingSpots/${spotNum}`))
  } else {
    writeLocalJSON(STORAGE_KEYS.spots, parkingSpotsData)
  }
  updateParkingSpotsDisplay()
}

function handleSpotClick(spotNum) {
  if (layoutMode && isAdmin()) {
    selectSpot(spotNum)
    return
  }
  if (!currentUser) {
    showLoginModal()
    showToast('Connecte-toi d’abord', 'warn')
    return
  }
  const spotData = parkingSpotsData[spotNum]
  const mySpot = getCurrentUserSpotNumber()
  if (spotData?.userId === currentUser.id) {
    freeSpot(spotNum)
    showToast(`Place ${spotNum} libérée`, 'ok')
    return
  }
  if (spotData) {
    showToast(`Place ${spotNum} déjà occupée`, 'warn')
    return
  }
  if (mySpot) {
    showToast(`Tu occupes déjà la place ${mySpot}`, 'warn')
    return
  }
  occupySpot(spotNum)
  showToast(`Place ${spotNum} réservée`, 'ok')
}

function sendChatMessage(message) {
  const spotNum = getCurrentUserSpotNumber()
  const payload = {
    spotNum,
    userId: currentUser.id,
    userName: currentUser.name,
    userClass: currentUser.class,
    message,
    timestamp: Date.now(),
  }
  const fb = getFirebase()
  if (fb) {
    fb.push(fb.ref(fb.db, 'messages'), payload)
  } else {
    const messages = readLocalJSON(STORAGE_KEYS.messages, [])
    messages.push(payload)
    writeLocalJSON(STORAGE_KEYS.messages, messages)
    addChatMessage(spotNum ? `Place ${spotNum}` : currentUser.name, message, true)
  }
}

function loadData() {
  const fb = getFirebase()
  usingFirebase = Boolean(fb)
  if (!fb) {
    usersData = readLocalJSON(STORAGE_KEYS.users, {})
    parkingSpotsData = readLocalJSON(STORAGE_KEYS.spots, {})
    const messages = readLocalJSON(STORAGE_KEYS.messages, [])
    const userId = localStorage.getItem('parkewo_userId')
    currentUser = userId ? usersData[userId] || null : null
    if (currentUser) {
      hideLoginModal()
      showUserPanel()
    }
    els.chatMessages.innerHTML = ''
    messages.sort((a, b) => a.timestamp - b.timestamp).forEach((m) => {
      addChatMessage(m.spotNum ? `Place ${m.spotNum}` : m.userName, m.message, m.userId === currentUser?.id)
    })
    updateParkingSpotsDisplay()
    renderAdminPanel()
    return
  }

  fb.onValue(fb.ref(fb.db, 'users'), (snap) => {
    usersData = snap.val() || {}
    const userId = localStorage.getItem('parkewo_userId')
    if (userId && usersData[userId]) {
      currentUser = usersData[userId]
      hideLoginModal()
      showUserPanel()
    }
    renderAdminPanel()
  })

  fb.onValue(fb.ref(fb.db, 'parkingSpots'), (snap) => {
    parkingSpotsData = snap.val() || {}
    updateParkingSpotsDisplay()
  })

  fb.onValue(fb.ref(fb.db, 'messages'), (snap) => {
    const data = snap.val() || {}
    const messages = Object.keys(data).map((k) => ({ id: k, ...data[k] })).sort((a, b) => a.timestamp - b.timestamp)
    els.chatMessages.innerHTML = ''
    messages.forEach((m) => addChatMessage(m.spotNum ? `Place ${m.spotNum}` : m.userName, m.message, m.userId === currentUser?.id))
  })
}

function login() {
  const accountId = els.accountId.value
  const password = els.accountPassword.value
  const account = PREDEFINED_ACCOUNTS.find((a) => a.id === accountId)
  if (!account || account.password !== password) {
    showToast('Identifiants invalides', 'warn')
    return
  }
  currentUser = {
    id: account.id,
    name: account.name,
    class: account.class,
    isStudent: account.isStudent,
    isAdmin: account.isAdmin,
  }
  saveUserSession(currentUser)
  const fb = getFirebase()
  if (fb) {
    fb.set(fb.ref(fb.db, `users/${currentUser.id}`), currentUser)
  } else {
    persistUsersLocal()
  }
  hideLoginModal()
  showUserPanel()
  updateParkingSpotsDisplay()
  showToast(`Bienvenue ${currentUser.name}`, 'ok')
}

function logout() {
  if (!currentUser) return
  const myId = currentUser.id
  const mySpot = getCurrentUserSpotNumber()
  if (mySpot) freeSpot(mySpot)
  const fb = getFirebase()
  if (fb) {
    fb.remove(fb.ref(fb.db, `users/${myId}`))
  } else {
    delete usersData[myId]
    persistUsersLocal()
  }
  currentUser = null
  localStorage.removeItem('parkewo_userId')
  hideUserPanel()
  showLoginModal()
  showToast('Déconnecté', 'info')
}
    
    function sendMessage() {
  if (!currentUser) return showToast('Connecte-toi pour écrire', 'warn')
  const text = els.chatInput.value.trim()
  if (!text) return
  els.chatInput.value = ''
  sendChatMessage(text)
}

function initEvents() {
  els.loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    login()
  })

  els.logoutBtn.addEventListener('click', logout)

  els.releaseSpotBtn.addEventListener('click', () => {
    const mySpot = getCurrentUserSpotNumber()
    if (!mySpot) return showToast('Aucune place à libérer', 'info')
    freeSpot(mySpot)
    showToast(`Place ${mySpot} libérée`, 'ok')
  })

  els.sendMessageBtn.addEventListener('click', sendMessage)
  els.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage()
  })

  let chatCollapsed = false
  els.toggleChatBtn.addEventListener('click', () => {
    chatCollapsed = !chatCollapsed
    els.chatBody.classList.toggle('hidden', chatCollapsed)
    els.chatContainer.classList.toggle('h-[58px]', chatCollapsed)
    els.chatContainer.classList.toggle('h-[300px]', !chatCollapsed)
    els.chatContainer.classList.toggle('md:h-[360px]', !chatCollapsed)
    els.toggleChatBtn.textContent = chatCollapsed ? '+' : '−'
  })

  els.suggestSpotBtn.addEventListener('click', () => {
    const free = spotLayout.find((s) => !parkingSpotsData[String(s.num)])
    if (!free) return showToast('Aucune place libre', 'warn')
    const target = document.querySelector(`.parking-spot[data-spot="${free.num}"]`)
    if (target) {
      target.classList.add('ring-4', 'ring-amber-300/80')
      setTimeout(() => target.classList.remove('ring-4', 'ring-amber-300/80'), 1200)
    }
    showToast(`Place suggérée: ${free.num}`, 'info')
  })

  els.toggleLayoutModeBtn.addEventListener('click', () => {
    if (!isAdmin()) return showToast('Accès admin requis', 'warn')
    layoutMode = !layoutMode
    els.toggleLayoutModeBtn.textContent = layoutMode ? 'Placement ON' : 'Mode placement'
    updateLayoutPanel()
  })

  els.layoutWidthInput.addEventListener('input', () => {
    if (!isAdmin() || !selectedSpotNum) return
    const spot = findLayoutSpot(selectedSpotNum)
    if (!spot) return
    spot.w = Number(els.layoutWidthInput.value)
    spot.x = clamp(spot.x, 0, 100 - spot.w)
    persistLayout()
    renderParkingSpots()
    updateParkingSpotsDisplay()
    selectSpot(selectedSpotNum)
  })

  els.layoutHeightInput.addEventListener('input', () => {
    if (!isAdmin() || !selectedSpotNum) return
    const spot = findLayoutSpot(selectedSpotNum)
    if (!spot) return
    spot.h = Number(els.layoutHeightInput.value)
    spot.y = clamp(spot.y, 0, 100 - spot.h)
    persistLayout()
    renderParkingSpots()
    updateParkingSpotsDisplay()
    selectSpot(selectedSpotNum)
  })

  els.copyLayoutBtn.addEventListener('click', async () => {
    if (!isAdmin()) return
    const data = JSON.stringify(spotLayout, null, 2)
    try {
      await navigator.clipboard.writeText(data)
      showToast('Layout copié', 'ok')
    } catch {
      console.log(data)
      showToast('Copie impossible, voir console', 'warn')
    }
  })

  els.resetLayoutBtn.addEventListener('click', () => {
    if (!isAdmin()) return
    spotLayout = DEFAULT_SPOT_LAYOUT.map((s) => ({ ...s }))
    persistLayout()
    renderParkingSpots()
    updateParkingSpotsDisplay()
    selectedSpotNum = null
    updateLayoutPanel()
  })

  els.openAdminPanelBtn.addEventListener('click', () => {
    if (!isAdmin()) return
    els.adminPanel.classList.remove('hidden')
    renderAdminPanel()
  })

  els.closeAdminPanelBtn.addEventListener('click', () => {
    els.adminPanel.classList.add('hidden')
  })

  els.adminPanel.addEventListener('click', (e) => {
    const target = e.target
    if (!(target instanceof HTMLElement)) return
    const action = target.dataset.action
    if (!action || !isAdmin()) return
    if (action === 'free-spot') {
      freeSpot(target.dataset.spot)
      showToast(`Place ${target.dataset.spot} libérée`, 'ok')
    } else if (action === 'delete-user') {
      deleteUserById(target.dataset.userId)
    }
  })

  window.addEventListener('mousemove', dragSelectedSpot)
  window.addEventListener('touchmove', dragSelectedSpot, { passive: true })
  window.addEventListener('mouseup', () => {
    isDraggingSpot = false
  })
  window.addEventListener('touchend', () => {
    isDraggingSpot = false
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const savedLayout = readLocalJSON(STORAGE_KEYS.layout, null)
  if (Array.isArray(savedLayout) && savedLayout.length > 0) {
    spotLayout = savedLayout
  }

  hydrateAccountSelect()
  renderParkingSpots()
  initEvents()
  loadData()
  updateStats()
  updateAdminButtonsVisibility()
  if (!currentUser) showLoginModal()
  if (!usingFirebase) showToast('Mode local actif (Firebase non configuré)', 'info')
})

function getFirebase() {
  if (!window.firebaseReady) return null
  const api = {
    db: window.firebaseDatabase,
    ref: window.firebaseRef,
    set: window.firebaseSet,
    onValue: window.firebaseOnValue,
    push: window.firebasePush,
    remove: window.firebaseRemove,
  }
  const isValid = typeof api.ref === 'function' && typeof api.set === 'function' && typeof api.onValue === 'function'
  return isValid ? api : null
}

function readLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocalJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

function loadLocalModeData() {
  const userId = localStorage.getItem('parkewo_userId')
  parkingSpotsData = readLocalJSON(STORAGE_KEYS.spots, {})
  const localUsers = readLocalJSON(STORAGE_KEYS.userData, {})
  const messagesArray = readLocalJSON(STORAGE_KEYS.messages, [])

  if (userId && localUsers[userId]) {
    currentUser = localUsers[userId]
    hideLoginModal()
    showUserPanel()
  }

  updateParkingSpotsDisplay()
  els.chatMessages.innerHTML = ''
  messagesArray
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((msg) => {
      const sender = msg.spotNum ? `Place ${msg.spotNum}` : msg.userName
      const isOwn = currentUser && currentUser.id === msg.userId
      addChatMessage(sender, msg.message, isOwn)
    })
}

function showToast(message, type = 'info') {
  if (!els.toast) return
  const palette = {
    info: 'border-sky-300/30 text-sky-100',
    ok: 'border-emerald-300/30 text-emerald-100',
    warn: 'border-amber-300/30 text-amber-100',
  }
  els.toast.className = `pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border bg-slate-900/95 px-4 py-2 text-sm font-medium shadow-xl ${palette[type] || palette.info}`
  els.toast.textContent = message
  els.toast.classList.remove('hidden')
  window.clearTimeout(showToast._t)
  showToast._t = window.setTimeout(() => els.toast.classList.add('hidden'), 2200)
}

function getCurrentUserSpotNumber() {
  if (!currentUser) return null
  for (const [spotNum, data] of Object.entries(parkingSpotsData)) {
    if (data?.userId === currentUser.id) return spotNum
  }
  return null
}

function renderParkingSpots() {
  els.parkingSpots.innerHTML = spotLayout.map((spot) => {
    return `
      <button
        type="button"
        class="parking-spot absolute flex min-h-[48px] min-w-[28px] items-center justify-center rounded-lg border-2 border-emerald-300/80 bg-emerald-500/70 shadow-lg shadow-slate-950/40 transition hover:scale-105 hover:shadow-emerald-500/35 md:min-h-[64px] md:min-w-[36px]"
        data-spot="${spot.num}"
        data-x="${spot.x}"
        data-y="${spot.y}"
        data-w="${spot.w}"
        data-h="${spot.h}"
        style="left:${spot.x}%;top:${spot.y}%;width:${spot.w}%;height:${spot.h}%"
      >
        <span class="pointer-events-none text-sm font-black text-white drop-shadow md:text-lg">${spot.num}</span>
        <div class="spot-owner-info pointer-events-none absolute left-1/2 top-[calc(100%+2px)] hidden w-max max-w-[140px] -translate-x-1/2 rounded-md border border-white/15 bg-slate-950/90 px-2 py-1 text-[10px] leading-tight text-white shadow-lg md:text-[11px]"></div>
      </button>
    `
  }).join('')

  const spots = document.querySelectorAll('.parking-spot')
  spots.forEach((spot) => {
    spot.addEventListener('click', () => handleSpotClick(spot.dataset.spot, spot))
    spot.addEventListener('mousedown', (e) => startSpotDrag(e, spot.dataset.spot))
    spot.addEventListener(
      'touchstart',
      (e) => {
        if (!layoutMode) return
        startSpotDrag(e, spot.dataset.spot)
      },
      { passive: true },
    )
  })
}

function updateStats() {
  const total = spotLayout.length
  const occupied = Object.keys(parkingSpotsData).length
  const free = total - occupied
  els.totalSpots.textContent = String(total)
  els.occupiedSpots.textContent = String(occupied)
  els.freeSpots.textContent = String(free)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function findSpotByNum(spotNum) {
  return spotLayout.find((s) => String(s.num) === String(spotNum))
}

function updateLayoutPanel() {
  if (!els.layoutPanel) return
  if (!layoutMode) {
    els.layoutPanel.classList.add('hidden')
    return
  }
  els.layoutPanel.classList.remove('hidden')

  const selected = findSpotByNum(selectedSpotNum)
  els.layoutSelectedLabel.textContent = `Place sélectionnée: ${selected ? selected.num : '-'}`
  els.layoutCoords.textContent = selected
    ? `x: ${selected.x.toFixed(1)}%, y: ${selected.y.toFixed(1)}%, w: ${selected.w.toFixed(1)}%, h: ${selected.h.toFixed(1)}%`
    : 'x: -, y: -, w: -, h: -'

  if (selected) {
    els.layoutWidthInput.value = String(selected.w)
    els.layoutHeightInput.value = String(selected.h)
  }
}

function persistLayout() {
  writeLocalJSON(STORAGE_KEYS.layout, spotLayout)
}

function selectSpot(spotNum) {
  selectedSpotNum = spotNum
  document.querySelectorAll('.parking-spot').forEach((spotEl) => {
    const isSelected = spotEl.dataset.spot === String(spotNum)
    spotEl.classList.toggle('ring-4', isSelected)
    spotEl.classList.toggle('ring-sky-300/80', isSelected)
  })
  updateLayoutPanel()
}

function getClientPosition(event) {
  if (event.touches && event.touches[0]) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  return { x: event.clientX, y: event.clientY }
}

function startSpotDrag(e, spotNum) {
  if (!layoutMode) return
  const mapRect = els.parkingSpots.getBoundingClientRect()
  const selected = findSpotByNum(spotNum)
  if (!selected || mapRect.width === 0 || mapRect.height === 0) return
  isDraggingSpot = true
  selectedSpotNum = spotNum

  const pointer = getClientPosition(e)
  const cursorXPercent = ((pointer.x - mapRect.left) / mapRect.width) * 100
  const cursorYPercent = ((pointer.y - mapRect.top) / mapRect.height) * 100
  dragOffsetPercent = {
    x: cursorXPercent - selected.x,
    y: cursorYPercent - selected.y,
  }
  selectSpot(spotNum)
}

function dragSelectedSpot(e) {
  if (!layoutMode || !isDraggingSpot || !selectedSpotNum) return
  const selected = findSpotByNum(selectedSpotNum)
  if (!selected) return
  const mapRect = els.parkingSpots.getBoundingClientRect()
  if (mapRect.width === 0 || mapRect.height === 0) return

  const pointer = getClientPosition(e)
  const cursorXPercent = ((pointer.x - mapRect.left) / mapRect.width) * 100
  const cursorYPercent = ((pointer.y - mapRect.top) / mapRect.height) * 100
  selected.x = clamp(cursorXPercent - dragOffsetPercent.x, 0, 100 - selected.w)
  selected.y = clamp(cursorYPercent - dragOffsetPercent.y, 0, 100 - selected.h)
  persistLayout()
  renderParkingSpots()
  updateParkingSpotsDisplay()
  selectSpot(selectedSpotNum)
}

function showLoginModal() {
  els.loginModal.classList.remove('hidden')
}

function hideLoginModal() {
  els.loginModal.classList.add('hidden')
}

function showUserPanel() {
  els.userPanel.classList.remove('hidden')
  els.currentUserName.textContent = `Nom: ${currentUser.name}`
  els.currentUserClass.textContent = currentUser.class ? `Classe: ${currentUser.class}` : 'Classe: non renseignée'
  els.currentUserStatus.textContent = currentUser.isStudent ? 'Statut: Étudiant' : 'Statut: Non étudiant'
  const spot = getCurrentUserSpotNumber()
  els.currentUserSpot.textContent = spot ? `Ta place: ${spot}` : 'Ta place: aucune'
}

function hideUserPanel() {
  els.userPanel.classList.add('hidden')
}

function refreshUserSpotText() {
  if (!currentUser) return
  const spot = getCurrentUserSpotNumber()
  els.currentUserSpot.textContent = spot ? `Ta place: ${spot}` : 'Ta place: aucune'
}

function updateParkingSpotsDisplay() {
  const spots = document.querySelectorAll('.parking-spot')
  spots.forEach((spot) => {
    const spotNum = spot.dataset.spot
    const spotData = parkingSpotsData[spotNum]
    const ownerInfo = spot.querySelector('.spot-owner-info')

    spot.classList.remove(
      'border-emerald-300/80',
      'bg-emerald-500/70',
      'hover:shadow-emerald-500/35',
      'border-rose-300/80',
      'bg-rose-500/75',
      'hover:shadow-rose-500/35',
      'border-sky-300/90',
      'bg-sky-500/80',
      'hover:shadow-sky-500/45',
    )
        
        if (spotData) {
      const isMine = currentUser && spotData.userId === currentUser.id
      if (isMine) {
        spot.classList.add('border-sky-300/90', 'bg-sky-500/80', 'hover:shadow-sky-500/45')
      } else {
        spot.classList.add('border-rose-300/80', 'bg-rose-500/75', 'hover:shadow-rose-500/35')
      }

      ownerInfo.classList.remove('hidden')
            ownerInfo.innerHTML = `
        <div class="font-bold">${spotData.userName}</div>
        <div>${spotData.userClass || 'Sans classe'} · ${spotData.isStudent ? 'Étudiant' : 'Non étudiant'}</div>
      `
        } else {
      spot.classList.add('border-emerald-300/80', 'bg-emerald-500/70', 'hover:shadow-emerald-500/35')
      ownerInfo.classList.add('hidden')
      ownerInfo.innerHTML = ''
    }
  })

  updateStats()
  refreshUserSpotText()
}

function addChatMessage(sender, message, isOwn) {
  const msg = document.createElement('div')
  msg.className = `max-w-[85%] rounded-xl px-3 py-2 text-sm shadow ${isOwn ? 'ml-auto bg-emerald-500 text-slate-950' : 'bg-slate-700/80 text-slate-100'}`
  msg.innerHTML = `<div class="mb-1 text-[11px] font-semibold opacity-80">${sender}</div><div>${message}</div>`
  els.chatMessages.appendChild(msg)
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight
}

function loadData() {
  const fb = getFirebase()
  if (!fb) {
    loadLocalModeData()
    showToast('Mode local actif (Firebase non configuré)', 'info')
    return
  }
  const userId = localStorage.getItem('parkewo_userId')
  if (userId) {
    const userRef = fb.ref(fb.db, `users/${userId}`)
    fb.onValue(userRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        currentUser = data
        hideLoginModal()
        showUserPanel()
      }
    })
  }

  const spotsRef = fb.ref(fb.db, 'parkingSpots')
  fb.onValue(spotsRef, (snapshot) => {
    parkingSpotsData = snapshot.val() || {}
    updateParkingSpotsDisplay()
  })

  const messagesRef = fb.ref(fb.db, 'messages')
  fb.onValue(messagesRef, (snapshot) => {
    const data = snapshot.val() || {}
    const messagesArray = Object.keys(data)
      .map((key) => ({ id: key, ...data[key] }))
      .sort((a, b) => a.timestamp - b.timestamp)

    els.chatMessages.innerHTML = ''
    messagesArray.forEach((msg) => {
      const sender = msg.spotNum ? `Place ${msg.spotNum}` : msg.userName
      const isOwn = currentUser && currentUser.id === msg.userId
      addChatMessage(sender, msg.message, isOwn)
    })
  })
}

function saveUser(userData) {
  const fb = getFirebase()
  if (fb) {
    const userRef = fb.ref(fb.db, `users/${userData.id}`)
    fb.set(userRef, userData)
  } else {
    const users = readLocalJSON(STORAGE_KEYS.userData, {})
    users[userData.id] = userData
    writeLocalJSON(STORAGE_KEYS.userData, users)
  }
  localStorage.setItem('parkewo_userId', userData.id)
}

function occupySpot(spotNum, userData) {
  const fb = getFirebase()
  parkingSpotsData[spotNum] = userData
  updateParkingSpotsDisplay()
  if (fb) {
    const spotRef = fb.ref(fb.db, `parkingSpots/${spotNum}`)
    fb.set(spotRef, userData)
  } else {
    writeLocalJSON(STORAGE_KEYS.spots, parkingSpotsData)
  }
}

function freeSpot(spotNum) {
  const fb = getFirebase()
  delete parkingSpotsData[spotNum]
  updateParkingSpotsDisplay()
  if (fb) {
    const spotRef = fb.ref(fb.db, `parkingSpots/${spotNum}`)
    fb.remove(spotRef)
  } else {
    writeLocalJSON(STORAGE_KEYS.spots, parkingSpotsData)
  }
}

function sendChatMessage(messageData) {
  const fb = getFirebase()
  if (fb) {
    const messagesRef = fb.ref(fb.db, 'messages')
    fb.push(messagesRef, messageData)
  } else {
    const messages = readLocalJSON(STORAGE_KEYS.messages, [])
    messages.push(messageData)
    writeLocalJSON(STORAGE_KEYS.messages, messages)
    const sender = messageData.spotNum ? `Place ${messageData.spotNum}` : messageData.userName
    addChatMessage(sender, messageData.message, true)
  }
}

function handleSpotClick(spotNum, spotElement) {
  if (layoutMode) {
    selectSpot(spotNum)
    return
  }

  if (!currentUser) {
    showToast('Connecte-toi pour réserver une place', 'warn')
    showLoginModal()
    return
  }

  const spotData = parkingSpotsData[spotNum]
  const currentUserSpotNum = getCurrentUserSpotNumber()

  if (spotData && spotData.userId === currentUser.id) {
    freeSpot(spotNum)
    showToast(`Place ${spotNum} libérée`, 'ok')
    return
  }

  if (spotData) {
    showToast(`Place ${spotNum} déjà prise`, 'warn')
    return
  }

  if (currentUserSpotNum) {
    showToast(`Tu as déjà la place ${currentUserSpotNum}`, 'warn')
    return
  }

  occupySpot(spotNum, {
    userId: currentUser.id,
    userName: currentUser.name,
    userClass: currentUser.class,
    isStudent: currentUser.isStudent,
  })
  spotElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  showToast(`Place ${spotNum} réservée`, 'ok')
}

function sendMessage() {
  if (!currentUser) {
    showToast('Connecte-toi pour écrire dans le chat', 'warn')
    return
  }
  const message = els.chatInput.value.trim()
  if (!message) return

  const userSpotNum = getCurrentUserSpotNumber()
  const messageData = {
    spotNum: userSpotNum,
    userId: currentUser.id,
    userName: currentUser.name,
    userClass: currentUser.class,
    message,
    timestamp: Date.now(),
  }

  els.chatInput.value = ''
  sendChatMessage(messageData)
}

function initEvents() {
  els.isStudentCheckbox.addEventListener('change', () => {
    if (els.isStudentCheckbox.checked) {
      els.userClassInput.removeAttribute('disabled')
    } else {
      els.userClassInput.setAttribute('disabled', 'disabled')
      els.userClassInput.value = ''
    }
  })

  els.loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const name = document.getElementById('user-name').value.trim()
    const userClass = document.getElementById('user-class').value.trim()
    const isStudent = document.getElementById('is-student').checked

    if (!name) {
      showToast('Le nom est requis', 'warn')
      return
    }

    currentUser = {
      name,
      class: userClass || '',
      isStudent,
      id: Date.now().toString(),
    }
    saveUser(currentUser)
    hideLoginModal()
    showUserPanel()
    updateParkingSpotsDisplay()
    showToast(`Bienvenue ${currentUser.name} 👋`, 'ok')
  })

  els.logoutBtn.addEventListener('click', () => {
    const fb = getFirebase()
    const currentSpot = getCurrentUserSpotNumber()
    if (currentSpot) freeSpot(currentSpot)

    if (fb && currentUser?.id) {
      const userRef = fb.ref(fb.db, `users/${currentUser.id}`)
      fb.remove(userRef)
    } else if (currentUser?.id) {
      const users = readLocalJSON(STORAGE_KEYS.userData, {})
      delete users[currentUser.id]
      writeLocalJSON(STORAGE_KEYS.userData, users)
    }

    currentUser = null
    localStorage.removeItem('parkewo_userId')
    hideUserPanel()
    showLoginModal()
    updateParkingSpotsDisplay()
    showToast('Déconnecté', 'info')
  })

  els.releaseSpotBtn.addEventListener('click', () => {
    if (!currentUser) return
    const spot = getCurrentUserSpotNumber()
    if (!spot) {
      showToast('Aucune place à libérer', 'info')
      return
    }
    freeSpot(spot)
    showToast(`Place ${spot} libérée`, 'ok')
  })

  els.sendMessageBtn.addEventListener('click', sendMessage)
  els.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage()
  })

  let chatCollapsed = false
  els.toggleChatBtn.addEventListener('click', () => {
    chatCollapsed = !chatCollapsed
    els.chatBody.classList.toggle('hidden', chatCollapsed)
    els.chatContainer.classList.toggle('h-[58px]', chatCollapsed)
    els.chatContainer.classList.toggle('h-[300px]', !chatCollapsed)
    els.chatContainer.classList.toggle('md:h-[360px]', !chatCollapsed)
    els.toggleChatBtn.textContent = chatCollapsed ? '+' : '−'
  })

  els.toggleLayoutModeBtn.addEventListener('click', () => {
    layoutMode = !layoutMode
    els.toggleLayoutModeBtn.textContent = layoutMode ? 'Mode placement: ON' : 'Mode placement'
    els.toggleLayoutModeBtn.classList.toggle('bg-sky-500/45', layoutMode)
    if (!layoutMode) {
      selectedSpotNum = null
      isDraggingSpot = false
      document.querySelectorAll('.parking-spot').forEach((spotEl) => {
        spotEl.classList.remove('ring-4', 'ring-sky-300/80')
      })
    }
    updateLayoutPanel()
    showToast(layoutMode ? 'Déplace les places avec la souris' : 'Mode placement désactivé', 'info')
  })

  els.layoutWidthInput.addEventListener('input', () => {
    const selected = findSpotByNum(selectedSpotNum)
    if (!selected) return
    selected.w = Number(els.layoutWidthInput.value)
    selected.x = clamp(selected.x, 0, 100 - selected.w)
    persistLayout()
    renderParkingSpots()
    updateParkingSpotsDisplay()
    selectSpot(selectedSpotNum)
  })

  els.layoutHeightInput.addEventListener('input', () => {
    const selected = findSpotByNum(selectedSpotNum)
    if (!selected) return
    selected.h = Number(els.layoutHeightInput.value)
    selected.y = clamp(selected.y, 0, 100 - selected.h)
    persistLayout()
    renderParkingSpots()
    updateParkingSpotsDisplay()
    selectSpot(selectedSpotNum)
  })

  els.copyLayoutBtn.addEventListener('click', async () => {
    const layoutJson = JSON.stringify(spotLayout, null, 2)
    try {
      await navigator.clipboard.writeText(layoutJson)
      showToast('Layout copié dans le presse-papiers', 'ok')
    } catch {
      showToast('Impossible de copier automatiquement', 'warn')
      console.log(layoutJson)
    }
  })

  els.resetLayoutBtn.addEventListener('click', () => {
    spotLayout = DEFAULT_SPOT_LAYOUT.map((spot) => ({ ...spot }))
    writeLocalJSON(STORAGE_KEYS.layout, spotLayout)
    selectedSpotNum = null
    renderParkingSpots()
    updateParkingSpotsDisplay()
    updateLayoutPanel()
    showToast('Layout réinitialisé', 'ok')
  })

  window.addEventListener('mousemove', dragSelectedSpot)
  window.addEventListener('touchmove', dragSelectedSpot, { passive: true })
  window.addEventListener('mouseup', () => {
    isDraggingSpot = false
  })
  window.addEventListener('touchend', () => {
    isDraggingSpot = false
  })

  els.suggestSpotBtn.addEventListener('click', () => {
    const free = spotLayout.find((s) => !parkingSpotsData[String(s.num)])
    if (!free) {
      showToast('Aucune place libre pour le moment', 'warn')
      return
    }
    const target = document.querySelector(`.parking-spot[data-spot="${free.num}"]`)
    if (target) {
      target.classList.add('ring-4', 'ring-amber-300/70')
      window.setTimeout(() => target.classList.remove('ring-4', 'ring-amber-300/70'), 1500)
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
    showToast(`Place suggérée: ${free.num}`, 'info')
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const savedLayout = readLocalJSON(STORAGE_KEYS.layout, null)
  if (Array.isArray(savedLayout) && savedLayout.length > 0) {
    spotLayout = savedLayout
  }

  renderParkingSpots()
  initEvents()
  updateStats()
  updateLayoutPanel()

  window.setTimeout(() => {
    loadData()
    if (!currentUser) showLoginModal()
  }, 400)
})
