if (window.__parkewoBooted) {
  // Already initialized.
} else {
  window.__parkewoBooted = true

  var DEFAULT_LAYOUT = [
    { num: 1, x: 7.865879834913661, y: 15.569334291064568, w: 4.6, h: 11.4 },
    { num: 2, x: 12.327038679309304, y: 15.710258748278763, w: 4.6, h: 11.4 },
    { num: 3, x: 17.190558018963955, y: 15.851183205492958, w: 4.6, h: 11.4 },
    { num: 4, x: 27.955364622417434, y: 16.133032119921346, w: 4.6, h: 11.4 },
    { num: 5, x: 27.722317688791286, y: 68.13415683195902, w: 4.6, h: 11.4 },
    { num: 6, x: 17.291417218085492, y: 48.827506193614425, w: 4.6, h: 11.4 },
    { num: 7, x: 16.991310201916175, y: 63.34272528667641, w: 4.6, h: 11.4 },
    { num: 8, x: 4.28508791526068, y: 82.36752701059264, w: 4.6, h: 11.4 },
    { num: 9, x: 52, y: 5, w: 4.6, h: 11.4 },
    { num: 10, x: 57.4, y: 5, w: 4.6, h: 11.4 },
    { num: 11, x: 62.8, y: 5, w: 4.6, h: 11.4 },
    { num: 12, x: 68.2, y: 5, w: 4.6, h: 11.4 },
    { num: 13, x: 73.6, y: 5, w: 4.6, h: 11.4 },
    { num: 14, x: 79, y: 5, w: 4.6, h: 11.4 },
    { num: 15, x: 84.4, y: 5, w: 4.6, h: 11.4 },
    { num: 16, x: 32.986051060784575, y: 14.074860217371501, w: 4.6, h: 11.4 },
    { num: 17, x: 29.5, y: 36.2, w: 4.6, h: 11.4 },
    { num: 18, x: 35, y: 36.2, w: 4.6, h: 11.4 },
    { num: 19, x: 40.4, y: 36.2, w: 4.6, h: 11.4 },
    { num: 20, x: 45.8, y: 36.2, w: 4.6, h: 11.4 },
    { num: 21, x: 51.2, y: 36.2, w: 4.6, h: 11.4 },
    { num: 22, x: 56.6, y: 36.2, w: 4.6, h: 11.4 },
    { num: 23, x: 62, y: 36.2, w: 4.6, h: 11.4 },
    { num: 24, x: 67.4, y: 36.2, w: 4.6, h: 11.4 },
  ]

  var KEYS = { layout: 'parkewo_spot_layout_local' }
  var state = {
    currentUser: null,
    users: {},
    spots: {},
    layout: DEFAULT_LAYOUT.slice(),
    mobileUserOpen: false,
    mobileChatOpen: false,
    layoutMode: false,
    selectedSpot: null,
    dragging: false,
    dx: 0,
    dy: 0,
  }

  var el = {
    parkingMap: document.getElementById('parking-map'),
    parkingCanvas: document.getElementById('parking-canvas'),
    parkingSpots: document.getElementById('parking-spots'),
    loginModal: document.getElementById('login-modal'),
    loginForm: document.getElementById('login-form'),
    accountEmail: document.getElementById('account-email'),
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
    chatMessages: document.getElementById('chat-messages'),
    toggleChatBtn: document.getElementById('toggle-chat'),
    chatContainer: document.getElementById('chat-container'),
    chatBody: document.getElementById('chat-body'),
    suggestSpotBtn: document.getElementById('suggest-spot-btn'),
    toggleLayoutModeBtn: document.getElementById('toggle-layout-mode-btn'),
    layoutPanel: document.getElementById('layout-panel'),
    layoutSelectedLabel: document.getElementById('layout-selected-label'),
    layoutCoords: document.getElementById('layout-coords'),
    layoutWidthInput: document.getElementById('layout-width-input'),
    layoutHeightInput: document.getElementById('layout-height-input'),
    copyLayoutBtn: document.getElementById('copy-layout-btn'),
    resetLayoutBtn: document.getElementById('reset-layout-btn'),
    openAdminPanelBtn: document.getElementById('open-admin-panel-btn'),
    closeAdminPanelBtn: document.getElementById('close-admin-panel-btn'),
    adminPanel: document.getElementById('admin-panel'),
    adminOccupiedList: document.getElementById('admin-occupied-list'),
    adminUsersList: document.getElementById('admin-users-list'),
    totalSpots: document.getElementById('total-spots'),
    occupiedSpots: document.getElementById('occupied-spots'),
    freeSpots: document.getElementById('free-spots'),
    mobileActionsToggle: document.getElementById('mobile-actions-toggle'),
    mobileSuggestBtn: document.getElementById('mobile-suggest-btn'),
    mobileUserBtn: document.getElementById('mobile-user-btn'),
    mobileChatBtn: document.getElementById('mobile-chat-btn'),
    mobileLayoutBtn: document.getElementById('mobile-layout-btn'),
    mobileAdminBtn: document.getElementById('mobile-admin-btn'),
    toast: document.getElementById('toast'),
  }

  function fb() {
    if (!window.firebaseReady) return null
    return {
      db: window.firebaseDb,
      auth: window.firebaseAuth,
      ref: window.firebaseRef,
      get: window.firebaseGet,
      set: window.firebaseSet,
      onValue: window.firebaseOnValue,
      push: window.firebasePush,
      remove: window.firebaseRemove,
      signInWithEmailAndPassword: window.firebaseSignInWithEmailAndPassword,
      signOut: window.firebaseSignOut,
      onAuthStateChanged: window.firebaseOnAuthStateChanged,
    }
  }

  function readLayout() {
    try {
      var raw = localStorage.getItem(KEYS.layout)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function saveLayout() {
    localStorage.setItem(KEYS.layout, JSON.stringify(state.layout))
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n))
  }

  function isAdmin() {
    return Boolean(state.currentUser && state.currentUser.isAdmin)
  }

  function mySpot() {
    for (var num in state.spots) {
      if (state.spots[num] && state.spots[num].userId === (state.currentUser && state.currentUser.id)) return num
    }
    return null
  }

  function toast(msg) {
    if (!el.toast) return
    el.toast.textContent = msg
    el.toast.classList.remove('hidden')
    el.toast.classList.remove('opacity-0')
    el.toast.classList.add('opacity-100')
    clearTimeout(toast._timer)
    toast._timer = setTimeout(function () {
      el.toast.classList.remove('opacity-100')
      el.toast.classList.add('opacity-0')
      el.toast.classList.add('hidden')
    }, 2000)
  }

  function addMessage(m) {
    var line = document.createElement('div')
    line.className = 'rounded-xl border border-white/10 bg-slate-800/75 p-3 text-sm text-slate-100'
    line.innerHTML =
      '<div class="mb-1 flex items-center justify-between gap-2"><strong class="text-emerald-300">' +
      (m.userName || 'Utilisateur') +
      '</strong><span class="text-xs text-slate-400">' +
      new Date(m.timestamp || Date.now()).toLocaleTimeString() +
      '</span></div>' +
      '<div class="text-slate-200">' +
      (m.message || '') +
      '</div>'
    el.chatMessages.appendChild(line)
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight
  }

  function showUser() {
    if (!state.currentUser) return
    var isMobile = window.innerWidth < 768
    el.userPanel.classList.toggle('hidden', isMobile && !state.mobileUserOpen)
    el.loginModal.classList.add('hidden')
    el.currentUserName.textContent = state.currentUser.name || state.currentUser.email || 'Utilisateur'
    el.currentUserClass.textContent = state.currentUser.role || 'Utilisateur'
    var mine = mySpot()
    el.currentUserStatus.textContent = mine ? 'Place occupée' : 'Aucune place'
    el.currentUserSpot.textContent = mine ? '#' + mine : '-'
    el.openAdminPanelBtn.classList.toggle('hidden', !isAdmin())
    el.toggleLayoutModeBtn.classList.toggle('hidden', !isAdmin())
    if (el.mobileLayoutBtn) el.mobileLayoutBtn.classList.toggle('hidden', !isAdmin())
    if (el.mobileAdminBtn) el.mobileAdminBtn.classList.toggle('hidden', !isAdmin())
  }

  function renderAdminPanel() {
    el.adminOccupiedList.innerHTML = ''
    var occupied = Object.entries(state.spots).filter(function (entry) { return Boolean(entry[1] && entry[1].userId) })
    occupied.forEach(function (entry) {
      var li = document.createElement('li')
      li.className = 'flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-sm'
      li.innerHTML =
        '<span>Place ' + entry[0] + ' - ' + (entry[1].userName || 'Inconnu') + '</span>' +
        '<button data-action="free" data-spot="' + entry[0] + '" class="rounded-md bg-rose-500 px-2 py-1 text-xs text-white">Libérer</button>'
      el.adminOccupiedList.appendChild(li)
    })

    el.adminUsersList.innerHTML = ''
    Object.values(state.users).forEach(function (u) {
      var li = document.createElement('li')
      li.className = 'flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-sm'
      li.innerHTML =
        '<span>' + (u.name || u.email || u.id) + (u.isAdmin ? ' (admin)' : '') + '</span>' +
        '<button data-action="del-user" data-user="' + u.id + '" class="rounded-md bg-rose-500 px-2 py-1 text-xs text-white">Supprimer</button>'
      el.adminUsersList.appendChild(li)
    })
  }

  function paintSpots() {
    Array.from(el.parkingSpots.children).forEach(function (node) {
      var num = node.dataset.spot
      var s = state.spots[num]
      var occupied = Boolean(s && s.userId)
      node.className =
        'absolute rounded-lg border-2 transition ' +
        (occupied ? 'border-rose-200 bg-rose-500/40' : 'border-emerald-200 bg-emerald-500/30 hover:bg-emerald-500/45')
      node.innerHTML = occupied
        ? '<div class="h-full w-full p-1 text-[10px] text-white"><div class="font-bold">#' + num + '</div><div class="truncate">' + (s.userName || '') + '</div></div>'
        : '<div class="flex h-full items-center justify-center text-xs font-semibold text-white">#' + num + '</div>'
    })

    var occupiedCount = Object.values(state.spots).filter(function (spot) { return Boolean(spot && spot.userId) }).length
    el.totalSpots.textContent = String(state.layout.length)
    el.occupiedSpots.textContent = String(occupiedCount)
    el.freeSpots.textContent = String(Math.max(0, state.layout.length - occupiedCount))
    renderAdminPanel()
    if (state.currentUser) showUser()
  }

  function renderSpots() {
    el.parkingSpots.innerHTML = ''
    state.layout.forEach(function (s) {
      var b = document.createElement('button')
      b.type = 'button'
      b.dataset.spot = String(s.num)
      b.style.left = s.x + '%'
      b.style.top = s.y + '%'
      b.style.width = s.w + '%'
      b.style.height = s.h + '%'
      b.addEventListener('click', function () {
        if (state.layoutMode && isAdmin()) {
          selectSpot(String(s.num))
          return
        }
        if (!state.currentUser) return toast('Connecte-toi d’abord')
        occupySpot(String(s.num))
      })
      b.addEventListener('mousedown', function (e) {
        if (!state.layoutMode || !isAdmin()) return
        state.selectedSpot = String(s.num)
        state.dragging = true
        state.dx = (e.offsetX / b.clientWidth) * s.w
        state.dy = (e.offsetY / b.clientHeight) * s.h
        selectSpot(String(s.num))
      })
      el.parkingSpots.appendChild(b)
    })
    paintSpots()
  }

  function selectSpot(num) {
    state.selectedSpot = num
    var s = state.layout.find(function (x) { return String(x.num) === String(num) })
    if (!s) return
    el.layoutPanel.classList.remove('hidden')
    el.layoutSelectedLabel.textContent = '#' + s.num
    el.layoutCoords.textContent = 'x: ' + s.x.toFixed(2) + ' | y: ' + s.y.toFixed(2)
    el.layoutWidthInput.value = String(s.w)
    el.layoutHeightInput.value = String(s.h)
  }

  function suggestSpot() {
    if (!state.currentUser) return toast('Connecte-toi d’abord')
    var mine = mySpot()
    if (mine) return toast('Tu as déjà la place #' + mine)
    var free = state.layout.find(function (s) { return !state.spots[String(s.num)] })
    if (!free) return toast('Aucune place libre')
    occupySpot(String(free.num))
  }

  async function occupySpot(num) {
    var f = fb()
    if (!f || !state.currentUser) return
    var mine = mySpot()
    if (mine && mine !== num) return toast('Tu occupes déjà une place')
    var payload = {
      userId: state.currentUser.id,
      userName: state.currentUser.name || state.currentUser.email || 'Utilisateur',
      userClass: state.currentUser.role || 'Utilisateur',
      timestamp: Date.now(),
    }
    await f.set(f.ref(f.db, 'parkingSpots/' + num), payload)
  }

  async function freeSpot(num) {
    var f = fb()
    if (!f) return
    var current = state.spots[num]
    if (!current) return
    var mine = state.currentUser && current.userId === state.currentUser.id
    if (!mine && !isAdmin()) return toast('Accès refusé')
    await f.remove(f.ref(f.db, 'parkingSpots/' + num))
  }

  function bindFirebase() {
    var f = fb()
    if (!f) {
      toast('Firebase non configuré')
      return
    }

    f.onAuthStateChanged(f.auth, async function (user) {
      if (!user) {
        state.currentUser = null
        localStorage.removeItem('parkewo_auth_uid')
        el.userPanel.classList.add('hidden')
        el.loginModal.classList.remove('hidden')
        return
      }

      localStorage.setItem('parkewo_auth_uid', user.uid)
      var snap = await f.get(f.ref(f.db, 'users/' + user.uid))
      var profile = snap.val()
      if (!profile) {
        await f.signOut(f.auth)
        toast('Compte non autorisé (profil absent en DB)')
        return
      }
      state.currentUser = profile
      state.users[user.uid] = profile
      showUser()
      paintSpots()
    })

    f.onValue(f.ref(f.db, 'users'), function (s) {
      state.users = s.val() || {}
      renderAdminPanel()
    })
    f.onValue(f.ref(f.db, 'parkingSpots'), function (s) {
      state.spots = s.val() || {}
      paintSpots()
    })
    f.onValue(f.ref(f.db, 'messages'), function (s) {
      var arr = Object.values(s.val() || {}).sort(function (a, b) { return (a.timestamp || 0) - (b.timestamp || 0) })
      el.chatMessages.innerHTML = ''
      arr.forEach(addMessage)
    })
  }

  function initEvents() {
    el.loginForm.addEventListener('submit', async function (e) {
      e.preventDefault()
      var f = fb()
      if (!f || !f.auth || !f.signInWithEmailAndPassword) return toast('Firebase Auth indisponible')
      var email = String(el.accountEmail.value || '').trim()
      var password = String(el.accountPassword.value || '')
      if (!email || !password) return toast('Email et mot de passe requis')
      try {
        await f.signInWithEmailAndPassword(f.auth, email, password)
      } catch {
        toast('Identifiants invalides')
      }
    })

    el.logoutBtn.addEventListener('click', async function () {
      var f = fb()
      if (f && f.auth && f.signOut) await f.signOut(f.auth)
      state.mobileUserOpen = false
    })

    el.releaseSpotBtn.addEventListener('click', function () {
      var mine = mySpot()
      if (mine) freeSpot(mine)
      else toast('Tu n’as pas de place')
    })

    el.suggestSpotBtn.addEventListener('click', suggestSpot)
    if (el.mobileSuggestBtn) el.mobileSuggestBtn.addEventListener('click', suggestSpot)
    if (el.mobileUserBtn) {
      el.mobileUserBtn.addEventListener('click', function () {
        if (!state.currentUser) return toast('Connecte-toi d’abord')
        state.mobileUserOpen = !state.mobileUserOpen
        showUser()
      })
    }
    if (el.mobileChatBtn) {
      el.mobileChatBtn.addEventListener('click', function () {
        state.mobileChatOpen = !state.mobileChatOpen
        el.chatContainer.classList.toggle('hidden', !state.mobileChatOpen && window.innerWidth < 768)
        el.chatContainer.classList.toggle('flex', state.mobileChatOpen || window.innerWidth >= 768)
      })
    }

    el.sendMessageBtn.addEventListener('click', async function () {
      var f = fb()
      if (!f || !state.currentUser) return toast('Connexion requise')
      var msg = el.chatInput.value.trim()
      if (!msg) return
      await f.push(f.ref(f.db, 'messages'), {
        spotNum: mySpot(),
        userId: state.currentUser.id,
        userName: state.currentUser.name || state.currentUser.email || 'Utilisateur',
        userClass: state.currentUser.role || 'Utilisateur',
        message: msg,
        timestamp: Date.now(),
      })
      el.chatInput.value = ''
    })

    var collapsed = false
    el.toggleChatBtn.addEventListener('click', function () {
      collapsed = !collapsed
      el.chatBody.classList.toggle('hidden', collapsed)
      el.chatContainer.classList.toggle('h-[58px]', collapsed)
      el.chatContainer.classList.toggle('h-[36vh]', !collapsed)
      el.chatContainer.classList.toggle('md:h-[320px]', !collapsed)
      el.toggleChatBtn.textContent = collapsed ? '+' : '−'
    })

    el.toggleLayoutModeBtn.addEventListener('click', function () {
      if (!isAdmin()) return toast('Accès admin requis')
      state.layoutMode = !state.layoutMode
      el.toggleLayoutModeBtn.textContent = state.layoutMode ? 'Placement ON' : 'Mode placement'
      if (!state.layoutMode) el.layoutPanel.classList.add('hidden')
    })
    el.openAdminPanelBtn.addEventListener('click', function () { if (isAdmin()) el.adminPanel.classList.remove('hidden') })
    el.closeAdminPanelBtn.addEventListener('click', function () { el.adminPanel.classList.add('hidden') })

    el.adminPanel.addEventListener('click', function (e) {
      var t = e.target
      if (!(t instanceof HTMLElement) || !isAdmin()) return
      if (t.dataset.action === 'free') freeSpot(t.dataset.spot)
      if (t.dataset.action === 'del-user') {
        var uid = t.dataset.user
        if (!uid || (state.currentUser && uid === state.currentUser.id)) return
        var f = fb()
        if (f) f.remove(f.ref(f.db, 'users/' + uid))
      }
    })

    el.layoutWidthInput.addEventListener('input', function () {
      if (!isAdmin() || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      s.w = Number(el.layoutWidthInput.value)
      s.x = clamp(s.x, 0, 100 - s.w)
      saveLayout()
      renderSpots()
      selectSpot(state.selectedSpot)
    })
    el.layoutHeightInput.addEventListener('input', function () {
      if (!isAdmin() || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      s.h = Number(el.layoutHeightInput.value)
      s.y = clamp(s.y, 0, 100 - s.h)
      saveLayout()
      renderSpots()
      selectSpot(state.selectedSpot)
    })
    el.copyLayoutBtn.addEventListener('click', function () {
      if (!isAdmin()) return
      navigator.clipboard.writeText(JSON.stringify(state.layout, null, 2))
    })
    el.resetLayoutBtn.addEventListener('click', function () {
      if (!isAdmin()) return
      state.layout = DEFAULT_LAYOUT.slice()
      saveLayout()
      renderSpots()
    })

    window.addEventListener('mousemove', function (e) {
      if (!state.dragging || !state.layoutMode || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      var r = el.parkingSpots.getBoundingClientRect()
      s.x = clamp(((e.clientX - r.left) / r.width) * 100 - state.dx, 0, 100 - s.w)
      s.y = clamp(((e.clientY - r.top) / r.height) * 100 - state.dy, 0, 100 - s.h)
      saveLayout()
      renderSpots()
      selectSpot(state.selectedSpot)
    })
    window.addEventListener('mouseup', function () { state.dragging = false })
    window.addEventListener('resize', function () {
      var isMobile = window.innerWidth < 768
      if (!isMobile) {
        state.mobileChatOpen = true
        if (state.currentUser) state.mobileUserOpen = true
      }
      el.chatContainer.classList.toggle('hidden', isMobile && !state.mobileChatOpen)
      el.chatContainer.classList.toggle('flex', !isMobile || state.mobileChatOpen)
      if (state.currentUser) showUser()
    })

    if (el.mobileLayoutBtn) {
      el.mobileLayoutBtn.addEventListener('click', function () {
        if (!isAdmin()) return toast('Accès admin requis')
        el.toggleLayoutModeBtn.click()
      })
    }
    if (el.mobileAdminBtn) {
      el.mobileAdminBtn.addEventListener('click', function () {
        if (!isAdmin()) return toast('Accès admin requis')
        el.openAdminPanelBtn.click()
      })
    }
  }

  function init() {
    var savedLayout = readLayout()
    if (Array.isArray(savedLayout) && savedLayout.length) {
      state.layout = savedLayout.map(function (s) {
        return { num: s.num, x: s.x, y: s.y, w: 4.6, h: 11.4 }
      })
    }
    renderSpots()
    state.mobileChatOpen = window.innerWidth >= 768
    el.chatContainer.classList.toggle('hidden', window.innerWidth < 768)
    el.chatContainer.classList.toggle('flex', window.innerWidth >= 768)
    if (el.mobileLayoutBtn) el.mobileLayoutBtn.classList.add('hidden')
    if (el.mobileAdminBtn) el.mobileAdminBtn.classList.add('hidden')
    bindFirebase()
    initEvents()
  }

  document.addEventListener('DOMContentLoaded', init)
}
if (window.__parkewoBooted) {
  // Prevent multiple bootstrap in case of duplicated imports.
} else {
  window.__parkewoBooted = true

  var DEFAULT_LAYOUT = [
    { num: 1, x: 7.865879834913661, y: 15.569334291064568, w: 4.6, h: 11.4 },
    { num: 2, x: 12.327038679309304, y: 15.710258748278763, w: 4.6, h: 11.4 },
    { num: 3, x: 17.190558018963955, y: 15.851183205492958, w: 4.6, h: 11.4 },
    { num: 4, x: 27.955364622417434, y: 16.133032119921346, w: 4.6, h: 11.4 },
    { num: 5, x: 27.722317688791286, y: 68.13415683195902, w: 4.6, h: 11.4 },
    { num: 6, x: 17.291417218085492, y: 48.827506193614425, w: 4.6, h: 11.4 },
    { num: 7, x: 16.991310201916175, y: 63.34272528667641, w: 4.6, h: 11.4 },
    { num: 8, x: 4.28508791526068, y: 82.36752701059264, w: 4.6, h: 11.4 },
    { num: 9, x: 52, y: 5, w: 4.6, h: 11.4 },
    { num: 10, x: 57.4, y: 5, w: 4.6, h: 11.4 },
    { num: 11, x: 62.8, y: 5, w: 4.6, h: 11.4 },
    { num: 12, x: 68.2, y: 5, w: 4.6, h: 11.4 },
    { num: 13, x: 73.6, y: 5, w: 4.6, h: 11.4 },
    { num: 14, x: 79, y: 5, w: 4.6, h: 11.4 },
    { num: 15, x: 84.4, y: 5, w: 4.6, h: 11.4 },
    { num: 16, x: 32.986051060784575, y: 14.074860217371501, w: 4.6, h: 11.4 },
    { num: 17, x: 29.5, y: 36.2, w: 4.6, h: 11.4 },
    { num: 18, x: 35, y: 36.2, w: 4.6, h: 11.4 },
    { num: 19, x: 40.4, y: 36.2, w: 4.6, h: 11.4 },
    { num: 20, x: 45.8, y: 36.2, w: 4.6, h: 11.4 },
    { num: 21, x: 51.2, y: 36.2, w: 4.6, h: 11.4 },
    { num: 22, x: 56.6, y: 36.2, w: 4.6, h: 11.4 },
    { num: 23, x: 62, y: 36.2, w: 4.6, h: 11.4 },
    { num: 24, x: 67.4, y: 36.2, w: 4.6, h: 11.4 },
  ]

  var KEYS = {
    layout: 'parkewo_spot_layout_local',
  }

  var state = {
    currentUser: null,
    users: {},
    spots: {},
    messages: [],
    layout: DEFAULT_LAYOUT.slice(),
    layoutMode: false,
    selectedSpot: null,
    dragging: false,
    dx: 0,
    dy: 0,
  }

  var el = {
    parkingSpots: document.getElementById('parking-spots'),
    loginModal: document.getElementById('login-modal'),
    loginForm: document.getElementById('login-form'),
    accountEmail: document.getElementById('account-email'),
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
    chatMessages: document.getElementById('chat-messages'),
    toggleChatBtn: document.getElementById('toggle-chat'),
    chatContainer: document.getElementById('chat-container'),
    chatBody: document.getElementById('chat-body'),
    suggestSpotBtn: document.getElementById('suggest-spot-btn'),
    toggleLayoutModeBtn: document.getElementById('toggle-layout-mode-btn'),
    layoutPanel: document.getElementById('layout-panel'),
    layoutSelectedLabel: document.getElementById('layout-selected-label'),
    layoutCoords: document.getElementById('layout-coords'),
    layoutWidthInput: document.getElementById('layout-width-input'),
    layoutHeightInput: document.getElementById('layout-height-input'),
    copyLayoutBtn: document.getElementById('copy-layout-btn'),
    resetLayoutBtn: document.getElementById('reset-layout-btn'),
    openAdminPanelBtn: document.getElementById('open-admin-panel-btn'),
    closeAdminPanelBtn: document.getElementById('close-admin-panel-btn'),
    adminPanel: document.getElementById('admin-panel'),
    adminOccupiedList: document.getElementById('admin-occupied-list'),
    adminUsersList: document.getElementById('admin-users-list'),
    totalSpots: document.getElementById('total-spots'),
    occupiedSpots: document.getElementById('occupied-spots'),
    freeSpots: document.getElementById('free-spots'),
    toast: document.getElementById('toast'),
  }

  function fb() {
    if (!window.firebaseReady) return null
    return {
      db: window.firebaseDb,
      auth: window.firebaseAuth,
      ref: window.firebaseRef,
      set: window.firebaseSet,
      get: window.firebaseGet,
      remove: window.firebaseRemove,
      push: window.firebasePush,
      onValue: window.firebaseOnValue,
      signOut: window.firebaseSignOut,
      onAuthStateChanged: window.firebaseOnAuthStateChanged,
      signInWithEmailAndPassword: window.firebaseSignInWithEmailAndPassword,
    }
  }

  function readLayout() {
    try {
      var raw = localStorage.getItem(KEYS.layout)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function saveLayout() {
    localStorage.setItem(KEYS.layout, JSON.stringify(state.layout))
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n))
  }

  function isAdmin() {
    return Boolean(state.currentUser && state.currentUser.isAdmin)
  }

  function mySpot() {
    for (var num in state.spots) {
      if (state.spots[num] && state.spots[num].userId === (state.currentUser && state.currentUser.id)) return num
    }
    return null
  }

  function toast(msg) {
    if (!el.toast) return
    el.toast.textContent = msg
    el.toast.classList.remove('hidden')
    el.toast.classList.remove('opacity-0')
    el.toast.classList.add('opacity-100')
    clearTimeout(toast._t)
    toast._t = setTimeout(function () {
      el.toast.classList.remove('opacity-100')
      el.toast.classList.add('opacity-0')
      el.toast.classList.add('hidden')
    }, 1800)
  }

  function addMessage(m) {
    if (!el.chatMessages) return
    var row = document.createElement('div')
    row.className = 'rounded-xl border border-white/10 bg-slate-800/70 p-3 text-sm text-slate-100'
    row.innerHTML =
      '<div class="mb-1 flex items-center justify-between gap-2"><strong class="text-emerald-300">' +
      (m.userName || 'Utilisateur') +
      '</strong><span class="text-xs text-slate-400">' +
      new Date(m.timestamp || Date.now()).toLocaleTimeString() +
      '</span></div>' +
      '<p class="text-slate-200">' +
      (m.message || '') +
      '</p>'
    el.chatMessages.appendChild(row)
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight
  }

  function renderAdminPanel() {
    if (!el.adminOccupiedList || !el.adminUsersList) return
    el.adminOccupiedList.innerHTML = ''
    var occupied = Object.entries(state.spots).filter(function (entry) { return Boolean(entry[1] && entry[1].userId) })
    occupied.forEach(function (entry) {
      var li = document.createElement('li')
      li.className = 'flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-sm'
      li.innerHTML =
        '<span>Place ' + entry[0] + ' - ' + (entry[1].userName || 'Inconnu') + '</span>' +
        '<button data-action="free" data-spot="' + entry[0] + '" class="rounded-md bg-rose-500 px-2 py-1 text-xs font-semibold text-white">Libérer</button>'
      el.adminOccupiedList.appendChild(li)
    })

    el.adminUsersList.innerHTML = ''
    Object.values(state.users).forEach(function (u) {
      var li = document.createElement('li')
      li.className = 'flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-sm'
      li.innerHTML =
        '<span>' + (u.name || u.email || u.id) + (u.isAdmin ? ' (admin)' : '') + '</span>' +
        '<button data-action="del-user" data-user="' + u.id + '" class="rounded-md bg-rose-500 px-2 py-1 text-xs font-semibold text-white">Supprimer</button>'
      el.adminUsersList.appendChild(li)
    })
  }

  function showUser() {
    if (!state.currentUser) return
    el.userPanel.classList.remove('hidden')
    el.loginModal.classList.add('hidden')
    el.currentUserName.textContent = state.currentUser.name || state.currentUser.email || 'Utilisateur'
    el.currentUserClass.textContent = state.currentUser.role || 'Utilisateur'
    var mine = mySpot()
    el.currentUserStatus.textContent = mine ? 'Place occupée' : 'Aucune place'
    el.currentUserSpot.textContent = mine ? '#' + mine : '-'
    el.openAdminPanelBtn.classList.toggle('hidden', !isAdmin())
    el.toggleLayoutModeBtn.classList.toggle('hidden', !isAdmin())
  }

  function paintSpots() {
    Array.from(el.parkingSpots.children).forEach(function (node) {
      var spotNum = node.dataset.spot
      var spot = state.spots[spotNum]
      var occupied = Boolean(spot && spot.userId)
      node.className =
        'group absolute rounded-lg border-2 transition ' +
        (occupied
          ? 'border-rose-300/90 bg-rose-500/40'
          : 'border-emerald-200/90 bg-emerald-500/30 hover:bg-emerald-500/45')

      node.innerHTML = occupied
        ? '<div class="h-full w-full p-1 text-[10px] leading-tight text-white"><div class="font-bold">#' + spotNum + '</div><div class="truncate">' + (spot.userName || '') + '</div><div class="truncate text-[9px] text-slate-100/90">' + (spot.userClass || '') + '</div></div>'
        : '<div class="flex h-full items-center justify-center text-xs font-semibold text-white">#' + spotNum + '</div>'
    })
    el.totalSpots.textContent = String(state.layout.length)
    var occupiedCount = Object.values(state.spots).filter(function (s) { return Boolean(s && s.userId) }).length
    el.occupiedSpots.textContent = String(occupiedCount)
    el.freeSpots.textContent = String(Math.max(0, state.layout.length - occupiedCount))
    renderAdminPanel()
    if (state.currentUser) showUser()
  }

  function renderSpots() {
    el.parkingSpots.innerHTML = ''
    state.layout.forEach(function (s) {
      var b = document.createElement('button')
      b.type = 'button'
      b.dataset.spot = String(s.num)
      b.style.left = s.x + '%'
      b.style.top = s.y + '%'
      b.style.width = s.w + '%'
      b.style.height = s.h + '%'
      b.addEventListener('click', function () {
        if (state.layoutMode && isAdmin()) return selectSpot(String(s.num))
        if (!state.currentUser) return toast('Connecte-toi d’abord')
        occupySpot(String(s.num))
      })
      b.addEventListener('mousedown', function (e) {
        if (!state.layoutMode || !isAdmin()) return
        state.selectedSpot = String(s.num)
        state.dragging = true
        state.dx = (e.offsetX / b.clientWidth) * s.w
        state.dy = (e.offsetY / b.clientHeight) * s.h
        selectSpot(String(s.num))
      })
      el.parkingSpots.appendChild(b)
    })
    paintSpots()
  }

  function selectSpot(num) {
    state.selectedSpot = num
    var s = state.layout.find(function (x) { return String(x.num) === String(num) })
    if (!s) return
    el.layoutPanel.classList.remove('hidden')
    el.layoutSelectedLabel.textContent = '#' + s.num
    el.layoutCoords.textContent = 'x: ' + s.x.toFixed(2) + ' | y: ' + s.y.toFixed(2)
    el.layoutWidthInput.value = String(s.w)
    el.layoutHeightInput.value = String(s.h)
  }

  async function occupySpot(num) {
    var f = fb()
    if (!f || !state.currentUser) return
    var mine = mySpot()
    if (mine && mine !== num) return toast('Tu occupes déjà une place')
    var payload = {
      userId: state.currentUser.id,
      userName: state.currentUser.name || state.currentUser.email || 'Utilisateur',
      userClass: state.currentUser.role || 'Utilisateur',
      timestamp: Date.now(),
    }
    await f.set(f.ref(f.db, 'parkingSpots/' + num), payload)
  }

  async function freeSpot(num) {
    var f = fb()
    if (!f) return
    var spot = state.spots[num]
    if (!spot) return
    var mine = state.currentUser && spot.userId === state.currentUser.id
    if (!mine && !isAdmin()) return toast('Accès refusé')
    await f.remove(f.ref(f.db, 'parkingSpots/' + num))
  }

  function loadData() {
    var f = fb()
    if (!f) return

    f.onAuthStateChanged(f.auth, async function (user) {
      if (!user) {
        state.currentUser = null
        localStorage.removeItem('parkewo_auth_uid')
        el.userPanel.classList.add('hidden')
        el.loginModal.classList.remove('hidden')
        return
      }

      localStorage.setItem('parkewo_auth_uid', user.uid)
      var profileSnap = await f.get(f.ref(f.db, 'users/' + user.uid))
      var profile = profileSnap.val()
      if (!profile) {
        await f.signOut(f.auth)
        toast('Compte non autorisé. Profil absent dans la DB.')
        return
      }
      state.currentUser = profile
      state.users[user.uid] = profile
      showUser()
      paintSpots()
    })

    f.onValue(f.ref(f.db, 'users'), function (s) {
      state.users = s.val() || {}
      renderAdminPanel()
    })

    f.onValue(f.ref(f.db, 'parkingSpots'), function (s) {
      state.spots = s.val() || {}
      paintSpots()
    })

    f.onValue(f.ref(f.db, 'messages'), function (s) {
      var data = s.val() || {}
      state.messages = Object.keys(data).map(function (k) { return data[k] }).sort(function (a, b) { return (a.timestamp || 0) - (b.timestamp || 0) })
      el.chatMessages.innerHTML = ''
      state.messages.forEach(addMessage)
    })
  }

  function init() {
    var saved = readLayout()
    if (Array.isArray(saved) && saved.length) {
      state.layout = saved.map(function (s) {
        return { num: s.num, x: s.x, y: s.y, w: 4.6, h: 11.4 }
      })
    }
    renderSpots()
    loadData()

    el.loginForm.addEventListener('submit', async function (e) {
      e.preventDefault()
      var f = fb()
      if (!f || !f.auth || !f.signInWithEmailAndPassword) return toast('Firebase Auth indisponible')
      var email = String(el.accountEmail.value || '').trim()
      var password = String(el.accountPassword.value || '')
      if (!email || !password) return toast('Email et mot de passe requis')
      try {
        await f.signInWithEmailAndPassword(f.auth, email, password)
      } catch {
        toast('Identifiants invalides')
      }
    })

    el.logoutBtn.addEventListener('click', async function () {
      var f = fb()
      if (f && f.auth && f.signOut) await f.signOut(f.auth)
    })

    el.releaseSpotBtn.addEventListener('click', function () {
      var mine = mySpot()
      if (mine) freeSpot(mine)
    })

    el.sendMessageBtn.addEventListener('click', async function () {
      var f = fb()
      if (!f || !state.currentUser) return toast('Connexion requise')
      var msg = el.chatInput.value.trim()
      if (!msg) return
      var data = {
        spotNum: mySpot(),
        userId: state.currentUser.id,
        userName: state.currentUser.name || state.currentUser.email || 'Utilisateur',
        userClass: state.currentUser.role || 'Utilisateur',
        message: msg,
        timestamp: Date.now(),
      }
      await f.push(f.ref(f.db, 'messages'), data)
      el.chatInput.value = ''
    })

    var collapsed = false
    el.toggleChatBtn.addEventListener('click', function () {
      collapsed = !collapsed
      el.chatBody.classList.toggle('hidden', collapsed)
      el.chatContainer.classList.toggle('h-[58px]', collapsed)
      el.chatContainer.classList.toggle('h-[300px]', !collapsed)
      el.chatContainer.classList.toggle('md:h-[360px]', !collapsed)
      el.toggleChatBtn.textContent = collapsed ? '+' : '−'
    })

    el.toggleLayoutModeBtn.addEventListener('click', function () {
      if (!isAdmin()) return toast('Accès admin requis')
      state.layoutMode = !state.layoutMode
      el.toggleLayoutModeBtn.textContent = state.layoutMode ? 'Placement ON' : 'Mode placement'
      if (!state.layoutMode) el.layoutPanel.classList.add('hidden')
    })

    el.layoutWidthInput.addEventListener('input', function () {
      if (!isAdmin() || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      s.w = Number(el.layoutWidthInput.value)
      s.x = clamp(s.x, 0, 100 - s.w)
      saveLayout()
      renderSpots()
      selectSpot(state.selectedSpot)
    })

    el.layoutHeightInput.addEventListener('input', function () {
      if (!isAdmin() || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      s.h = Number(el.layoutHeightInput.value)
      s.y = clamp(s.y, 0, 100 - s.h)
      saveLayout()
      renderSpots()
      selectSpot(state.selectedSpot)
    })

    el.copyLayoutBtn.addEventListener('click', function () {
      if (!isAdmin()) return
      navigator.clipboard.writeText(JSON.stringify(state.layout, null, 2))
    })

    el.resetLayoutBtn.addEventListener('click', function () {
      if (!isAdmin()) return
      state.layout = DEFAULT_LAYOUT.slice()
      saveLayout()
      renderSpots()
    })

    el.openAdminPanelBtn.addEventListener('click', function () {
      if (isAdmin()) el.adminPanel.classList.remove('hidden')
    })
    el.closeAdminPanelBtn.addEventListener('click', function () {
      el.adminPanel.classList.add('hidden')
    })
    el.adminPanel.addEventListener('click', function (e) {
      var t = e.target
      if (!(t instanceof HTMLElement) || !isAdmin()) return
      if (t.dataset.action === 'free') freeSpot(t.dataset.spot)
      if (t.dataset.action === 'del-user') {
        var uid = t.dataset.user
        if (!uid || (state.currentUser && uid === state.currentUser.id)) return
        var f = fb()
        if (f) f.remove(f.ref(f.db, 'users/' + uid))
      }
    })

    window.addEventListener('mousemove', function (e) {
      if (!state.dragging || !state.layoutMode || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      var r = el.parkingSpots.getBoundingClientRect()
      s.x = clamp(((e.clientX - r.left) / r.width) * 100 - state.dx, 0, 100 - s.w)
      s.y = clamp(((e.clientY - r.top) / r.height) * 100 - state.dy, 0, 100 - s.h)
      saveLayout()
      renderSpots()
      selectSpot(state.selectedSpot)
    })
    window.addEventListener('mouseup', function () {
      state.dragging = false
    })
  }

  document.addEventListener('DOMContentLoaded', init)
}
if (!window.__parkewoBooted) {
  window.__parkewoBooted = true

  var DEFAULT_LAYOUT = [
    { num: 1, x: 7.865879834913661, y: 15.569334291064568, w: 4.6, h: 11.4 },
    { num: 2, x: 12.327038679309304, y: 15.710258748278763, w: 4.6, h: 11.4 },
    { num: 3, x: 17.190558018963955, y: 15.851183205492958, w: 4.6, h: 11.4 },
    { num: 4, x: 27.955364622417434, y: 16.133032119921346, w: 4.6, h: 11.4 },
    { num: 5, x: 27.722317688791286, y: 68.13415683195902, w: 4.6, h: 11.4 },
    { num: 6, x: 17.291417218085492, y: 48.827506193614425, w: 4.6, h: 11.4 },
    { num: 7, x: 16.991310201916175, y: 63.34272528667641, w: 4.6, h: 11.4 },
    { num: 8, x: 4.28508791526068, y: 82.36752701059264, w: 4.6, h: 11.4 },
    { num: 9, x: 52, y: 5, w: 4.6, h: 11.4 },
    { num: 10, x: 57.4, y: 5, w: 4.6, h: 11.4 },
    { num: 11, x: 62.8, y: 5, w: 4.6, h: 11.4 },
    { num: 12, x: 68.2, y: 5, w: 4.6, h: 11.4 },
    { num: 13, x: 73.6, y: 5, w: 4.6, h: 11.4 },
    { num: 14, x: 79, y: 5, w: 4.6, h: 11.4 },
    { num: 15, x: 84.4, y: 5, w: 4.6, h: 11.4 },
    { num: 16, x: 32.986051060784575, y: 14.074860217371501, w: 4.6, h: 11.4 },
    { num: 17, x: 29.5, y: 36.2, w: 4.6, h: 11.4 },
    { num: 18, x: 35, y: 36.2, w: 4.6, h: 11.4 },
    { num: 19, x: 40.4, y: 36.2, w: 4.6, h: 11.4 },
    { num: 20, x: 45.8, y: 36.2, w: 4.6, h: 11.4 },
    { num: 21, x: 51.2, y: 36.2, w: 4.6, h: 11.4 },
    { num: 22, x: 56.6, y: 36.2, w: 4.6, h: 11.4 },
    { num: 23, x: 62, y: 36.2, w: 4.6, h: 11.4 },
    { num: 24, x: 67.4, y: 36.2, w: 4.6, h: 11.4 },
  ]

  var KEYS = { layout: 'parkewo_spot_layout_local' }
  var state = { currentUser: null, users: {}, spots: {}, layout: DEFAULT_LAYOUT.slice(), layoutMode: false, selectedSpot: null, dragging: false, dx: 0, dy: 0 }

  var el = {
    parkingSpots: document.getElementById('parking-spots'),
    loginModal: document.getElementById('login-modal'),
    loginForm: document.getElementById('login-form'),
    accountEmail: document.getElementById('account-email'),
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

  function fb() {
    if (!window.firebaseReady) return null
    return {
      db: window.firebaseDatabase,
      auth: window.firebaseAuth,
      ref: window.firebaseRef,
      set: window.firebaseSet,
      onValue: window.firebaseOnValue,
      push: window.firebasePush,
      remove: window.firebaseRemove,
      signInWithEmailAndPassword: window.firebaseSignInWithEmailAndPassword,
      signOut: window.firebaseSignOut,
      onAuthStateChanged: window.firebaseOnAuthStateChanged,
    }
  }
  function readLayout() { try { var r = localStorage.getItem(KEYS.layout); return r ? JSON.parse(r) : null } catch { return null } }
  function saveLayout() { localStorage.setItem(KEYS.layout, JSON.stringify(state.layout)) }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)) }
  function isAdmin() { return Boolean(state.currentUser && state.currentUser.isAdmin) }
  function mySpot() { for (var n in state.spots) if (state.spots[n] && state.spots[n].userId === (state.currentUser && state.currentUser.id)) return n; return null }
  function toast(m) { el.toast.textContent = m; el.toast.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(function () { el.toast.classList.add('hidden') }, 1700) }

  function paintStats() {
    var occ = Object.keys(state.spots).length
    el.totalSpots.textContent = String(state.layout.length)
    el.occupiedSpots.textContent = String(occ)
    el.freeSpots.textContent = String(state.layout.length - occ)
    if (state.currentUser) el.currentUserSpot.textContent = mySpot() ? 'Ta place: ' + mySpot() : 'Ta place: aucune'
  }

  function renderAdminPanel() {
    if (!isAdmin()) return
    var occupied = Object.entries(state.spots)
    el.adminOccupiedList.innerHTML = occupied.length ? occupied.map(function (x) { return '<div class="flex justify-between rounded border border-white/10 px-2 py-1"><span>Place ' + x[0] + ' · ' + x[1].userName + '</span><button data-action="free" data-spot="' + x[0] + '" class="text-amber-300">Libérer</button></div>' }).join('') : '<p class="text-slate-400">Aucune place occupée.</p>'
    var users = Object.values(state.users)
    el.adminUsersList.innerHTML = users.length ? users.map(function (u) { return '<div class="flex justify-between rounded border border-white/10 px-2 py-1"><span>' + u.name + '</span>' + (u.isAdmin ? '<span class="text-violet-300">Admin</span>' : '<button data-action="del-user" data-user="' + u.id + '" class="text-rose-300">Supprimer</button>') + '</div>' }).join('') : '<p class="text-slate-400">Aucun utilisateur actif.</p>'
  }

  function paintSpots() {
    document.querySelectorAll('.parking-spot').forEach(function (spotEl) {
      var data = state.spots[spotEl.dataset.spot]
      var owner = spotEl.querySelector('.spot-owner-info')
      spotEl.className = 'parking-spot absolute flex min-h-[52px] min-w-[30px] items-center justify-center rounded-lg border-2 shadow-lg transition'
      if (!data) { spotEl.classList.add('border-emerald-300/80', 'bg-emerald-500/75'); owner.classList.add('hidden'); owner.innerHTML = ''; return }
      if (data.userId === (state.currentUser && state.currentUser.id)) spotEl.classList.add('border-sky-300/90', 'bg-sky-500/85')
      else spotEl.classList.add('border-rose-300/80', 'bg-rose-500/80')
      owner.classList.remove('hidden')
      owner.innerHTML = '<div class="font-semibold">' + data.userName + '</div><div>' + data.userClass + '</div>'
    })
    paintStats()
    renderAdminPanel()
  }

  function renderSpots() {
    el.parkingSpots.innerHTML = state.layout.map(function (s) { return '<button type="button" class="parking-spot absolute flex min-h-[52px] min-w-[30px] items-center justify-center rounded-lg border-2 shadow-lg transition" data-spot="' + s.num + '" style="left:' + s.x + '%;top:' + s.y + '%;width:' + s.w + '%;height:' + s.h + '%"><span class="pointer-events-none text-sm font-black text-white drop-shadow md:text-lg">' + s.num + '</span><div class="spot-owner-info pointer-events-none absolute left-1/2 top-[calc(100%+2px)] hidden w-max max-w-[160px] -translate-x-1/2 rounded-md border border-white/10 bg-slate-950/95 px-2 py-1 text-[10px] leading-tight text-white shadow-lg md:text-[11px]"></div></button>' }).join('')
    document.querySelectorAll('.parking-spot').forEach(function (spotEl) {
      spotEl.addEventListener('click', function () { onSpotClick(spotEl.dataset.spot) })
      spotEl.addEventListener('mousedown', function (e) { startDrag(e, spotEl.dataset.spot) })
    })
    paintSpots()
  }

  function showUser() {
    el.userPanel.classList.remove('hidden')
    el.currentUserName.textContent = 'Nom: ' + state.currentUser.name
    el.currentUserClass.textContent = 'Classe/Role: ' + state.currentUser.role
    el.currentUserStatus.textContent = state.currentUser.isAdmin ? 'Statut: Admin' : 'Statut: Utilisateur'
    el.toggleLayoutModeBtn.classList.toggle('hidden', !isAdmin())
    el.openAdminPanelBtn.classList.toggle('hidden', !isAdmin())
  }

  function freeSpot(num) {
    var f = fb()
    if (!f || !state.currentUser) return
    delete state.spots[num]
    f.remove(f.ref(f.db, 'parkingSpots/' + num))
    paintSpots()
  }

  function onSpotClick(num) {
    var f = fb()
    if (!f) return toast('Firebase non configuré')
    if (state.layoutMode && isAdmin()) return selectSpot(num)
    if (!state.currentUser) return toast('Connecte-toi d’abord')
    if (state.spots[num] && state.spots[num].userId === state.currentUser.id) return freeSpot(num)
    if (state.spots[num]) return toast('Place déjà occupée')
    if (mySpot()) return toast('Tu as déjà une place')
    var data = { userId: state.currentUser.id, userName: state.currentUser.name, userClass: state.currentUser.role, isStudent: false }
    state.spots[num] = data
    f.set(f.ref(f.db, 'parkingSpots/' + num), data)
    paintSpots()
  }

  function addMessage(msg) {
    var own = msg.userId === (state.currentUser && state.currentUser.id)
    var line = document.createElement('div')
    line.className = 'max-w-[85%] rounded-xl px-3 py-2 text-sm shadow ' + (own ? 'ml-auto bg-emerald-500 text-slate-950' : 'bg-slate-700/80 text-slate-100')
    line.innerHTML = '<div class="mb-1 text-[11px] font-semibold opacity-80">' + (msg.spotNum ? 'Place ' + msg.spotNum : msg.userName) + '</div><div>' + msg.message + '</div>'
    el.chatMessages.appendChild(line)
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight
  }

  function selectSpot(num) {
    state.selectedSpot = num
    var s = state.layout.find(function (x) { return String(x.num) === String(num) })
    if (!s) return
    el.layoutPanel.classList.remove('hidden')
    el.layoutSelectedLabel.textContent = 'Place sélectionnée: ' + s.num
    el.layoutCoords.textContent = 'x: ' + s.x.toFixed(1) + '%, y: ' + s.y.toFixed(1) + '%, w: ' + s.w.toFixed(1) + '%, h: ' + s.h.toFixed(1) + '%'
    el.layoutWidthInput.value = String(s.w)
    el.layoutHeightInput.value = String(s.h)
  }

  function startDrag(e, num) {
    if (!state.layoutMode || !isAdmin()) return
    var s = state.layout.find(function (x) { return String(x.num) === String(num) })
    if (!s) return
    var r = el.parkingSpots.getBoundingClientRect()
    state.dx = ((e.clientX - r.left) / r.width) * 100 - s.x
    state.dy = ((e.clientY - r.top) / r.height) * 100 - s.y
    state.selectedSpot = num
    state.dragging = true
  }

  function loadData() {
    var f = fb()
    if (!f) return toast('Firebase non configuré')
    f.onAuthStateChanged(f.auth, function (user) {
      if (!user) {
        state.currentUser = null
        localStorage.removeItem('parkewo_auth_uid')
        el.userPanel.classList.add('hidden')
        el.loginModal.classList.remove('hidden')
        return
      }
      localStorage.setItem('parkewo_auth_uid', user.uid)
    })
    f.onValue(f.ref(f.db, 'users'), function (s) {
      state.users = s.val() || {}
      var uid = localStorage.getItem('parkewo_auth_uid')
      if (uid && state.users[uid]) { state.currentUser = state.users[uid]; el.loginModal.classList.add('hidden'); showUser() }
      renderAdminPanel()
    })
    f.onValue(f.ref(f.db, 'parkingSpots'), function (s) { state.spots = s.val() || {}; paintSpots() })
    f.onValue(f.ref(f.db, 'messages'), function (s) {
      var arr = Object.values(s.val() || {}).sort(function (a, b) { return a.timestamp - b.timestamp })
      el.chatMessages.innerHTML = ''
      arr.forEach(addMessage)
    })
  }

  function init() {
    var saved = readLayout()
    if (Array.isArray(saved) && saved.length) state.layout = saved.map(function (s) { return { num: s.num, x: s.x, y: s.y, w: 4.6, h: 11.4 } })
    renderSpots()
    loadData()

    el.loginForm.addEventListener('submit', async function (e) {
      e.preventDefault()
      var f = fb()
      if (!f || !f.auth || !f.signInWithEmailAndPassword) return toast('Firebase Auth indisponible')
      var email = String(el.accountEmail.value || '').trim()
      var password = String(el.accountPassword.value || '')
      if (!email || !password) return toast('Email et mot de passe requis')
      try {
        var cred = await f.signInWithEmailAndPassword(f.auth, email, password)
        var uid = cred.user.uid
        var profile = state.users[uid] || { id: uid, name: email.split('@')[0], role: 'Utilisateur', isAdmin: false, email: email }
        state.currentUser = profile
        state.users[uid] = profile
        localStorage.setItem('parkewo_auth_uid', uid)
        f.set(f.ref(f.db, 'users/' + uid), profile)
        el.loginModal.classList.add('hidden')
        showUser()
        paintSpots()
      } catch {
        toast('Identifiants Firebase invalides')
      }
    })

    el.logoutBtn.addEventListener('click', async function () {
      var f = fb()
      if (f && f.auth && f.signOut) { try { await f.signOut(f.auth) } catch {} }
      state.currentUser = null
      localStorage.removeItem('parkewo_auth_uid')
      el.userPanel.classList.add('hidden')
      el.loginModal.classList.remove('hidden')
    })

    el.releaseSpotBtn.addEventListener('click', function () { if (mySpot()) freeSpot(mySpot()) })
    el.sendMessageBtn.addEventListener('click', function () {
      var f = fb()
      if (!f || !state.currentUser) return
      var msg = el.chatInput.value.trim()
      if (!msg) return
      el.chatInput.value = ''
      f.push(f.ref(f.db, 'messages'), { spotNum: mySpot(), userId: state.currentUser.id, userName: state.currentUser.name, userClass: state.currentUser.role, message: msg, timestamp: Date.now() })
    })

    var collapsed = false
    el.toggleChatBtn.addEventListener('click', function () {
      collapsed = !collapsed
      el.chatBody.classList.toggle('hidden', collapsed)
      el.chatContainer.classList.toggle('h-[58px]', collapsed)
      el.chatContainer.classList.toggle('h-[300px]', !collapsed)
      el.chatContainer.classList.toggle('md:h-[360px]', !collapsed)
      el.toggleChatBtn.textContent = collapsed ? '+' : '−'
    })

    el.toggleLayoutModeBtn.addEventListener('click', function () {
      if (!isAdmin()) return toast('Accès admin requis')
      state.layoutMode = !state.layoutMode
      el.toggleLayoutModeBtn.textContent = state.layoutMode ? 'Placement ON' : 'Mode placement'
      if (!state.layoutMode) el.layoutPanel.classList.add('hidden')
    })
    el.openAdminPanelBtn.addEventListener('click', function () { if (isAdmin()) el.adminPanel.classList.remove('hidden') })
    el.closeAdminPanelBtn.addEventListener('click', function () { el.adminPanel.classList.add('hidden') })

    el.adminPanel.addEventListener('click', function (e) {
      var t = e.target
      if (!(t instanceof HTMLElement) || !isAdmin()) return
      if (t.dataset.action === 'free') freeSpot(t.dataset.spot)
      if (t.dataset.action === 'del-user') {
        var uid = t.dataset.user
        if (!uid || uid === state.currentUser.id) return
        var f = fb()
        if (f) f.remove(f.ref(f.db, 'users/' + uid))
      }
    })

    el.layoutWidthInput.addEventListener('input', function () {
      if (!isAdmin() || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      s.w = Number(el.layoutWidthInput.value)
      s.x = clamp(s.x, 0, 100 - s.w)
      saveLayout(); renderSpots(); selectSpot(state.selectedSpot)
    })
    el.layoutHeightInput.addEventListener('input', function () {
      if (!isAdmin() || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      s.h = Number(el.layoutHeightInput.value)
      s.y = clamp(s.y, 0, 100 - s.h)
      saveLayout(); renderSpots(); selectSpot(state.selectedSpot)
    })
    el.copyLayoutBtn.addEventListener('click', function () { if (isAdmin()) navigator.clipboard.writeText(JSON.stringify(state.layout, null, 2)) })
    el.resetLayoutBtn.addEventListener('click', function () { if (isAdmin()) { state.layout = DEFAULT_LAYOUT.slice(); saveLayout(); renderSpots() } })

    window.addEventListener('mousemove', function (e) {
      if (!state.dragging || !state.layoutMode || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      var r = el.parkingSpots.getBoundingClientRect()
      s.x = clamp(((e.clientX - r.left) / r.width) * 100 - state.dx, 0, 100 - s.w)
      s.y = clamp(((e.clientY - r.top) / r.height) * 100 - state.dy, 0, 100 - s.h)
      saveLayout(); renderSpots(); selectSpot(state.selectedSpot)
    })
    window.addEventListener('mouseup', function () { state.dragging = false })
  }

  document.addEventListener('DOMContentLoaded', init)
}
if (!window.__parkewoBooted) {
  window.__parkewoBooted = true

  var PREDEFINED_ACCOUNTS = [
    { id: 'admin', label: 'Admin principal', password: 'admin123', name: 'Admin', role: 'Administration', isStudent: false, isAdmin: true },
    { id: 'eleve_1', label: 'Élève - Alex Martin', password: 'alex123', name: 'Alex Martin', role: '3ème A', isStudent: true, isAdmin: false },
    { id: 'eleve_2', label: 'Élève - Lina Perez', password: 'lina123', name: 'Lina Perez', role: '3ème B', isStudent: true, isAdmin: false },
    { id: 'prof_1', label: 'Prof - M. Dupont', password: 'dupont123', name: 'M. Dupont', role: 'Professeur', isStudent: false, isAdmin: false },
  ]

  var DEFAULT_LAYOUT = [
    { num: 1, x: 7.865879834913661, y: 15.569334291064568, w: 4.6, h: 11.4 },
    { num: 2, x: 12.327038679309304, y: 15.710258748278763, w: 4.6, h: 11.4 },
    { num: 3, x: 17.190558018963955, y: 15.851183205492958, w: 4.6, h: 11.4 },
    { num: 4, x: 27.955364622417434, y: 16.133032119921346, w: 4.6, h: 11.4 },
    { num: 5, x: 27.722317688791286, y: 68.13415683195902, w: 4.6, h: 11.4 },
    { num: 6, x: 17.291417218085492, y: 48.827506193614425, w: 4.6, h: 11.4 },
    { num: 7, x: 16.991310201916175, y: 63.34272528667641, w: 4.6, h: 11.4 },
    { num: 8, x: 4.28508791526068, y: 82.36752701059264, w: 4.6, h: 11.4 },
    { num: 9, x: 52, y: 5, w: 4.6, h: 11.4 },
    { num: 10, x: 57.4, y: 5, w: 4.6, h: 11.4 },
    { num: 11, x: 62.8, y: 5, w: 4.6, h: 11.4 },
    { num: 12, x: 68.2, y: 5, w: 4.6, h: 11.4 },
    { num: 13, x: 73.6, y: 5, w: 4.6, h: 11.4 },
    { num: 14, x: 79, y: 5, w: 4.6, h: 11.4 },
    { num: 15, x: 84.4, y: 5, w: 4.6, h: 11.4 },
    { num: 16, x: 32.986051060784575, y: 14.074860217371501, w: 4.6, h: 11.4 },
    { num: 17, x: 29.5, y: 36.2, w: 4.6, h: 11.4 },
    { num: 18, x: 35, y: 36.2, w: 4.6, h: 11.4 },
    { num: 19, x: 40.4, y: 36.2, w: 4.6, h: 11.4 },
    { num: 20, x: 45.8, y: 36.2, w: 4.6, h: 11.4 },
    { num: 21, x: 51.2, y: 36.2, w: 4.6, h: 11.4 },
    { num: 22, x: 56.6, y: 36.2, w: 4.6, h: 11.4 },
    { num: 23, x: 62, y: 36.2, w: 4.6, h: 11.4 },
    { num: 24, x: 67.4, y: 36.2, w: 4.6, h: 11.4 },
  ]

  var KEYS = { spots: 'parkewo_spots_local', messages: 'parkewo_messages_local', users: 'parkewo_users_local', layout: 'parkewo_spot_layout_local' }
  var state = { currentUser: null, users: {}, spots: {}, layout: DEFAULT_LAYOUT.slice(), layoutMode: false, selectedSpot: null, dragging: false, dragDX: 0, dragDY: 0 }

  var el = {
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

  function read(k, fallback) { try { var raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback } catch { return fallback } }
  function write(k, value) { localStorage.setItem(k, JSON.stringify(value)) }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)) }
  function isAdmin() { return Boolean(state.currentUser && state.currentUser.isAdmin) }
  function mySpot() { for (var n in state.spots) if (state.spots[n] && state.spots[n].userId === (state.currentUser && state.currentUser.id)) return n; return null }
  function fb() {
    if (!window.firebaseReady) return null
    return {
      db: window.firebaseDatabase,
      auth: window.firebaseAuth,
      ref: window.firebaseRef,
      set: window.firebaseSet,
      onValue: window.firebaseOnValue,
      push: window.firebasePush,
      remove: window.firebaseRemove,
      signInWithEmailAndPassword: window.firebaseSignInWithEmailAndPassword,
      signOut: window.firebaseSignOut,
      onAuthStateChanged: window.firebaseOnAuthStateChanged,
    }
  }

  function toast(message) {
    el.toast.textContent = message
    el.toast.classList.remove('hidden')
    clearTimeout(toast._t)
    toast._t = setTimeout(function () { el.toast.classList.add('hidden') }, 1700)
  }

  function paintStats() {
    var occupied = Object.keys(state.spots).length
    el.totalSpots.textContent = String(state.layout.length)
    el.occupiedSpots.textContent = String(occupied)
    el.freeSpots.textContent = String(state.layout.length - occupied)
    if (state.currentUser) el.currentUserSpot.textContent = mySpot() ? 'Ta place: ' + mySpot() : 'Ta place: aucune'
  }

  function renderAdminPanel() {
    if (!isAdmin()) return
    var occupied = Object.entries(state.spots)
    el.adminOccupiedList.innerHTML = occupied.length ? occupied.map(function (x) { return '<div class="flex justify-between rounded border border-white/10 px-2 py-1"><span>Place ' + x[0] + ' · ' + x[1].userName + '</span><button data-action="free" data-spot="' + x[0] + '" class="text-amber-300">Libérer</button></div>' }).join('') : '<p class="text-slate-400">Aucune place occupée.</p>'
    var users = Object.values(state.users)
    el.adminUsersList.innerHTML = users.length ? users.map(function (u) { return '<div class="flex justify-between rounded border border-white/10 px-2 py-1"><span>' + u.name + ' (' + u.id + ')</span>' + (u.isAdmin ? '<span class="text-violet-300">Admin</span>' : '<button data-action="del-user" data-user="' + u.id + '" class="text-rose-300">Supprimer</button>') + '</div>' }).join('') : '<p class="text-slate-400">Aucun utilisateur actif.</p>'
  }

  function paintSpots() {
    document.querySelectorAll('.parking-spot').forEach(function (spotEl) {
      var data = state.spots[spotEl.dataset.spot]
      var owner = spotEl.querySelector('.spot-owner-info')
      spotEl.className = 'parking-spot absolute flex min-h-[52px] min-w-[30px] items-center justify-center rounded-lg border-2 shadow-lg transition'
      if (!data) { spotEl.classList.add('border-emerald-300/80', 'bg-emerald-500/75'); owner.classList.add('hidden'); owner.innerHTML = ''; return }
      if (data.userId === (state.currentUser && state.currentUser.id)) spotEl.classList.add('border-sky-300/90', 'bg-sky-500/85')
      else spotEl.classList.add('border-rose-300/80', 'bg-rose-500/80')
      owner.classList.remove('hidden')
      owner.innerHTML = '<div class="font-semibold">' + data.userName + '</div><div>' + data.userClass + '</div>'
    })
    paintStats()
    renderAdminPanel()
  }

  function renderSpots() {
    el.parkingSpots.innerHTML = state.layout.map(function (s) { return '<button type="button" class="parking-spot absolute flex min-h-[52px] min-w-[30px] items-center justify-center rounded-lg border-2 shadow-lg transition" data-spot="' + s.num + '" style="left:' + s.x + '%;top:' + s.y + '%;width:' + s.w + '%;height:' + s.h + '%"><span class="pointer-events-none text-sm font-black text-white drop-shadow md:text-lg">' + s.num + '</span><div class="spot-owner-info pointer-events-none absolute left-1/2 top-[calc(100%+2px)] hidden w-max max-w-[160px] -translate-x-1/2 rounded-md border border-white/10 bg-slate-950/95 px-2 py-1 text-[10px] leading-tight text-white shadow-lg md:text-[11px]"></div></button>' }).join('')
    document.querySelectorAll('.parking-spot').forEach(function (spotEl) {
      spotEl.addEventListener('click', function () { onSpotClick(spotEl.dataset.spot) })
      spotEl.addEventListener('mousedown', function (e) { startDrag(e, spotEl.dataset.spot) })
    })
    paintSpots()
  }

  function showUser() {
    el.userPanel.classList.remove('hidden')
    el.currentUserName.textContent = 'Nom: ' + state.currentUser.name
    el.currentUserClass.textContent = 'Classe/Role: ' + state.currentUser.role
    el.currentUserStatus.textContent = state.currentUser.isAdmin ? 'Statut: Admin' : (state.currentUser.isStudent ? 'Statut: Étudiant' : 'Statut: Personnel')
    var v = isAdmin()
    el.toggleLayoutModeBtn.classList.toggle('hidden', !v)
    el.openAdminPanelBtn.classList.toggle('hidden', !v)
  }

  function freeSpot(num) {
    delete state.spots[num]
    var f = fb()
    if (f) f.remove(f.ref(f.db, 'parkingSpots/' + num))
    else write(KEYS.spots, state.spots)
    paintSpots()
  }

  function onSpotClick(num) {
    if (state.layoutMode && isAdmin()) return selectSpot(num)
    if (!state.currentUser) return toast('Connecte-toi d’abord')
    if (state.spots[num] && state.spots[num].userId === state.currentUser.id) return freeSpot(num)
    if (state.spots[num]) return toast('Place déjà occupée')
    if (mySpot()) return toast('Tu as déjà une place')
    var data = { userId: state.currentUser.id, userName: state.currentUser.name, userClass: state.currentUser.role, isStudent: state.currentUser.isStudent }
    state.spots[num] = data
    var f = fb()
    if (f) f.set(f.ref(f.db, 'parkingSpots/' + num), data)
    else write(KEYS.spots, state.spots)
    paintSpots()
  }

  function addMessage(msg) {
    var own = msg.userId === (state.currentUser && state.currentUser.id)
    var line = document.createElement('div')
    line.className = 'max-w-[85%] rounded-xl px-3 py-2 text-sm shadow ' + (own ? 'ml-auto bg-emerald-500 text-slate-950' : 'bg-slate-700/80 text-slate-100')
    line.innerHTML = '<div class="mb-1 text-[11px] font-semibold opacity-80">' + (msg.spotNum ? 'Place ' + msg.spotNum : msg.userName) + '</div><div>' + msg.message + '</div>'
    el.chatMessages.appendChild(line)
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight
  }

  function selectSpot(num) {
    state.selectedSpot = num
    var s = state.layout.find(function (x) { return String(x.num) === String(num) })
    if (!s) return
    el.layoutPanel.classList.remove('hidden')
    el.layoutSelectedLabel.textContent = 'Place sélectionnée: ' + s.num
    el.layoutCoords.textContent = 'x: ' + s.x.toFixed(1) + '%, y: ' + s.y.toFixed(1) + '%, w: ' + s.w.toFixed(1) + '%, h: ' + s.h.toFixed(1) + '%'
    el.layoutWidthInput.value = String(s.w)
    el.layoutHeightInput.value = String(s.h)
  }

  function startDrag(e, num) {
    if (!state.layoutMode || !isAdmin()) return
    var s = state.layout.find(function (x) { return String(x.num) === String(num) })
    if (!s) return
    var r = el.parkingSpots.getBoundingClientRect()
    state.dragDX = ((e.clientX - r.left) / r.width) * 100 - s.x
    state.dragDY = ((e.clientY - r.top) / r.height) * 100 - s.y
    state.selectedSpot = num
    state.dragging = true
  }

  function loadData() {
    var f = fb()
    if (!f) {
      state.users = read(KEYS.users, {})
      state.spots = read(KEYS.spots, {})
      var msgs = read(KEYS.messages, [])
      var uid = localStorage.getItem('parkewo_userId')
      state.currentUser = uid ? state.users[uid] || null : null
      if (state.currentUser) { el.loginModal.classList.add('hidden'); showUser() }
      el.chatMessages.innerHTML = ''
      msgs.sort(function (a, b) { return a.timestamp - b.timestamp }).forEach(addMessage)
      paintSpots()
      return
    }
    f.onValue(f.ref(f.db, 'users'), function (s) {
      state.users = s.val() || {}
      var uid = localStorage.getItem('parkewo_auth_uid')
      if (uid && state.users[uid]) { state.currentUser = state.users[uid]; el.loginModal.classList.add('hidden'); showUser() }
      renderAdminPanel()
    })
    f.onAuthStateChanged(f.auth, function (authUser) {
      if (!authUser) {
        state.currentUser = null
        localStorage.removeItem('parkewo_auth_uid')
        return
      }
      localStorage.setItem('parkewo_auth_uid', authUser.uid)
    })
    f.onValue(f.ref(f.db, 'parkingSpots'), function (s) { state.spots = s.val() || {}; paintSpots() })
    f.onValue(f.ref(f.db, 'messages'), function (s) {
      var arr = Object.values(s.val() || {}).sort(function (a, b) { return a.timestamp - b.timestamp })
      el.chatMessages.innerHTML = ''
      arr.forEach(addMessage)
    })
  }

  function init() {
    var saved = read(KEYS.layout, null)
    if (Array.isArray(saved) && saved.length) {
      state.layout = saved.map(function (s) {
        return { num: s.num, x: s.x, y: s.y, w: 4.6, h: 11.4 }
      })
    }

    PREDEFINED_ACCOUNTS.forEach(function (a) {
      var o = document.createElement('option')
      o.value = a.id
      o.textContent = a.label
      el.accountId.appendChild(o)
    })

    renderSpots()
    loadData()
    if (!state.currentUser) el.loginModal.classList.remove('hidden')

    el.loginForm.addEventListener('submit', async function (e) {
      e.preventDefault()
      var acc = PREDEFINED_ACCOUNTS.find(function (a) { return a.id === el.accountId.value })
      if (!acc || acc.password !== el.accountPassword.value) return toast('Identifiants invalides')
      var f = fb()
      if (f && f.auth && f.signInWithEmailAndPassword) {
        try {
          var cred = await f.signInWithEmailAndPassword(f.auth, acc.email, el.accountPassword.value)
          state.currentUser = {
            id: cred.user.uid,
            name: acc.name,
            role: acc.role,
            isStudent: acc.isStudent,
            isAdmin: acc.isAdmin,
            accountId: acc.id,
            email: acc.email,
          }
          state.users[state.currentUser.id] = state.currentUser
          localStorage.setItem('parkewo_auth_uid', state.currentUser.id)
          f.set(f.ref(f.db, 'users/' + state.currentUser.id), state.currentUser)
        } catch {
          return toast('Échec login Firebase (compte à créer dans Auth)')
        }
      } else {
        state.currentUser = { id: acc.id, name: acc.name, role: acc.role, isStudent: acc.isStudent, isAdmin: acc.isAdmin, accountId: acc.id }
        state.users[state.currentUser.id] = state.currentUser
        localStorage.setItem('parkewo_userId', state.currentUser.id)
        write(KEYS.users, state.users)
      }
      el.loginModal.classList.add('hidden')
      showUser()
      paintSpots()
    })

    el.logoutBtn.addEventListener('click', async function () {
      if (!state.currentUser) return
      var uid = state.currentUser.id
      var f = fb()
      if (f) {
        f.remove(f.ref(f.db, 'users/' + uid))
        if (f.auth && f.signOut) {
          try { await f.signOut(f.auth) } catch {}
        }
      }
      else { delete state.users[uid]; write(KEYS.users, state.users) }
      state.currentUser = null
      localStorage.removeItem('parkewo_userId')
      localStorage.removeItem('parkewo_auth_uid')
      el.userPanel.classList.add('hidden')
      el.loginModal.classList.remove('hidden')
    })

    el.releaseSpotBtn.addEventListener('click', function () { if (mySpot()) freeSpot(mySpot()) })

    el.sendMessageBtn.addEventListener('click', function () {
      if (!state.currentUser) return
      var msg = el.chatInput.value.trim()
      if (!msg) return
      el.chatInput.value = ''
      var data = { spotNum: mySpot(), userId: state.currentUser.id, userName: state.currentUser.name, userClass: state.currentUser.role, message: msg, timestamp: Date.now() }
      var f = fb()
      if (f) f.push(f.ref(f.db, 'messages'), data)
      else { var arr = read(KEYS.messages, []); arr.push(data); write(KEYS.messages, arr); addMessage(data) }
    })

    var collapsed = false
    el.toggleChatBtn.addEventListener('click', function () {
      collapsed = !collapsed
      el.chatBody.classList.toggle('hidden', collapsed)
      el.chatContainer.classList.toggle('h-[58px]', collapsed)
      el.chatContainer.classList.toggle('h-[300px]', !collapsed)
      el.chatContainer.classList.toggle('md:h-[360px]', !collapsed)
      el.toggleChatBtn.textContent = collapsed ? '+' : '−'
    })

    el.toggleLayoutModeBtn.addEventListener('click', function () {
      if (!isAdmin()) return toast('Accès admin requis')
      state.layoutMode = !state.layoutMode
      el.toggleLayoutModeBtn.textContent = state.layoutMode ? 'Placement ON' : 'Mode placement'
      if (!state.layoutMode) el.layoutPanel.classList.add('hidden')
    })

    el.openAdminPanelBtn.addEventListener('click', function () { if (isAdmin()) el.adminPanel.classList.remove('hidden') })
    el.closeAdminPanelBtn.addEventListener('click', function () { el.adminPanel.classList.add('hidden') })
    el.adminPanel.addEventListener('click', function (e) {
      var t = e.target
      if (!(t instanceof HTMLElement) || !isAdmin()) return
      if (t.dataset.action === 'free') freeSpot(t.dataset.spot)
      if (t.dataset.action === 'del-user' && t.dataset.user !== 'admin') { delete state.users[t.dataset.user]; write(KEYS.users, state.users); paintSpots() }
    })

    el.layoutWidthInput.addEventListener('input', function () {
      if (!isAdmin() || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      s.w = Number(el.layoutWidthInput.value)
      s.x = clamp(s.x, 0, 100 - s.w)
      write(KEYS.layout, state.layout)
      renderSpots()
      selectSpot(state.selectedSpot)
    })
    el.layoutHeightInput.addEventListener('input', function () {
      if (!isAdmin() || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      s.h = Number(el.layoutHeightInput.value)
      s.y = clamp(s.y, 0, 100 - s.h)
      write(KEYS.layout, state.layout)
      renderSpots()
      selectSpot(state.selectedSpot)
    })

    el.copyLayoutBtn.addEventListener('click', function () {
      if (!isAdmin()) return
      navigator.clipboard.writeText(JSON.stringify(state.layout, null, 2))
      toast('Layout copié')
    })
    el.resetLayoutBtn.addEventListener('click', function () {
      if (!isAdmin()) return
      state.layout = DEFAULT_LAYOUT.slice()
      write(KEYS.layout, state.layout)
      renderSpots()
    })

    window.addEventListener('mousemove', function (e) {
      if (!state.dragging || !state.layoutMode || !state.selectedSpot) return
      var s = state.layout.find(function (x) { return String(x.num) === String(state.selectedSpot) })
      if (!s) return
      var r = el.parkingSpots.getBoundingClientRect()
      s.x = clamp(((e.clientX - r.left) / r.width) * 100 - state.dragDX, 0, 100 - s.w)
      s.y = clamp(((e.clientY - r.top) / r.height) * 100 - state.dragDY, 0, 100 - s.h)
      write(KEYS.layout, state.layout)
      renderSpots()
      selectSpot(state.selectedSpot)
    })
    window.addEventListener('mouseup', function () { state.dragging = false })
  }

  document.addEventListener('DOMContentLoaded', init)
}
