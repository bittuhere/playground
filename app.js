(() => {
  "use strict";

  // Localhost/LAN uses the dependency-free Python account store. Render and
  // other public hosts use Firebase Auth + Realtime Database.
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBCe1Hu8zxap5YnWlX9J3kD8jL7H2FZ7nI",
    authDomain: "playground-bittuhere.firebaseapp.com",
    databaseURL: "https://playground-bittuhere-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "playground-bittuhere",
    storageBucket: "playground-bittuhere.firebasestorage.app",
    messagingSenderId: "330243946282",
    appId: "1:330243946282:web:e6b7b7d34170de67311053"
  };
  let firebaseApi = null;
  const APP_BUILD = "username-auth-2026-09-15";

  const DEFAULT_PROFILE = {
    displayName: "",
    username: "",
    avatar: "blue",
    joined: "",
    status: "",
    about: ""
  };

  const FALLBACK_GAMES = [
    { id: "tic-tac-toe", title: "Tic Tac Toe", file: "ttt.html", image: "/games/ttt.svg", category: "Casual", accent: "violet", description: "A quick classic for two players. Take the center and make your move.", players: "2 players", status: "placeholder" },
    { id: "rock-paper-scissors", title: "Rock Paper Scissors", file: "rps.html", image: "/games/rps.svg", category: "Casual", accent: "orange", description: "Challenge the computer and see who can build the longest win streak.", players: "1 player", status: "placeholder" },
    { id: "traffic-rider", title: "Traffic Rider", file: "car.html", image: "/games/car.svg", category: "Racing", accent: "green", description: "Ride through the traffic, chase a high score, and keep your eyes on the road.", players: "1 player", status: "placeholder" },
    { id: "space-builder", title: "Space Builder", file: "space-builder.html", image: "/games/space-builder.svg", category: "Building", accent: "blue", description: "Design a tiny universe, connect the stars, and build something that feels like home.", players: "1–4 players", status: "coming-soon", comingSoonText: "Coming soon — this community experience is still being assembled." }
  ];

  const MARKET_ITEMS = [
    { id: "neon-visor", name: "Neon Visor", kind: "Accessory", price: 350, accent: "blue", icon: "✦", description: "A bright visor for late-night adventures." },
    { id: "violet-hoodie", name: "Violet Hoodie", kind: "Clothing", price: 220, accent: "violet", icon: "◆", description: "Cozy, clean, and ready for any experience." },
    { id: "sunset-pack", name: "Sunset Pack", kind: "Back accessory", price: 480, accent: "orange", icon: "▰", description: "Take the warm glow of sunset with you." },
    { id: "mint-boots", name: "Mint Boots", kind: "Footwear", price: 180, accent: "green", icon: "◒", description: "A fresh step for your next big move." },
    { id: "star-crown", name: "Star Crown", kind: "Accessory", price: 620, accent: "rose", icon: "★", description: "For builders, dreamers, and champions." },
    { id: "pixel-pet", name: "Pixel Pet", kind: "Shoulder buddy", price: 400, accent: "blue", icon: "●", description: "A little digital friend that follows your style." }
  ];

  const BASE_INVENTORY = [
    { id: "starter-shirt", name: "Starter Tee", kind: "Clothing", accent: "blue", icon: "◼", free: true },
    { id: "starter-backpack", name: "Starter Backpack", kind: "Back accessory", accent: "green", icon: "▣", free: true }
  ];

  const COMMUNITIES = [
    { id: "builders-lab", name: "Builders Lab", members: "12.4K", accent: "blue", icon: "◆", description: "Share builds, learn fast, and make something surprising." },
    { id: "casual-corner", name: "Casual Corner", members: "8.7K", accent: "violet", icon: "✦", description: "A friendly home for small games and big laughs." },
    { id: "road-runners", name: "Road Runners", members: "4.1K", accent: "green", icon: "▰", description: "Race fans, time trials, and the perfect line." },
    { id: "creative-studio", name: "Creative Studio", members: "19.2K", accent: "rose", icon: "●", description: "Art, design, music, and creative experiments." }
  ];

  const EVENTS = [
    { id: "game-night", name: "Community Game Night", date: "Tonight", time: "8:00 PM", accent: "violet", icon: "✦", description: "Jump into a rotating lineup of quick community games." },
    { id: "creator-showcase", name: "Creator Showcase", date: "Saturday", time: "6:30 PM", accent: "blue", icon: "◆", description: "See what new creators are building and share feedback." },
    { id: "road-race", name: "Midnight Road Race", date: "Oct 02", time: "9:00 PM", accent: "green", icon: "▰", description: "A friendly time trial for the fastest riders." }
  ];

  // Social data is account-backed now. Empty arrays are intentional: no fake
  // players or placeholder conversations are shown before real users connect.
  const AVATAR_OPTIONS = [
    { id: "blue", name: "Ocean Blue", price: 0, icon: "◈" },
    { id: "pink", name: "Rose Pink", price: 0, icon: "✦" },
    { id: "green", name: "Mint Green", price: 0, icon: "●" },
    { id: "orange", name: "Sunset Orange", price: 0, icon: "◒" },
    { id: "purple", name: "Violet Purple", price: 0, icon: "◆" },
    { id: "ice", name: "Ice Prism", price: 150, icon: "❄" },
    { id: "ember", name: "Ember Glow", price: 180, icon: "✹" },
    { id: "aurora", name: "Aurora", price: 220, icon: "☄" },
    { id: "cobalt", name: "Cobalt Core", price: 250, icon: "⬢" },
    { id: "berry", name: "Berry Pop", price: 275, icon: "●" },
    { id: "lime", name: "Lime Circuit", price: 300, icon: "⚡" },
    { id: "midnight", name: "Midnight", price: 325, icon: "☾" },
    { id: "coral", name: "Coral Wave", price: 350, icon: "≈" },
    { id: "royal", name: "Royal Facet", price: 400, icon: "♢" },
    { id: "gold", name: "Gold Badge", price: 500, icon: "★" },
    { id: "nebula", name: "Nebula", price: 550, icon: "✺" },
    { id: "cyber", name: "Cyber Grid", price: 600, icon: "▦" },
    { id: "lava", name: "Lava Stone", price: 700, icon: "⬟" },
    { id: "mono", name: "Mono Slate", price: 750, icon: "□" },
    { id: "pixel", name: "Pixel Hero", price: 900, icon: "▣" }
  ];

  const FAQS = [
    { question: "How do I add a new game?", answer: "Put the HTML file and its optional image in site/games/. Then add one object to site/games/info.json and press Refresh games in Discover." },
    { question: "What image formats are supported?", answer: "SVG, PNG, JPG, JPEG, and WEBP logos are supported. Use the image filename in info.json, such as image: \"my-game.svg\"." },
    { question: "Can I use this on a LAN or Render?", answer: "Yes. run.py binds to 0.0.0.0 and reads the PORT environment variable automatically. Use python run.py locally or as the Render start command." },
    { question: "Where is profile data stored?", answer: "Localhost uses site/data/users.json. Public hosting uses Firebase Authentication and Realtime Database. Local storage is reserved for device-only UI preferences and the prototype credit wallet." }
  ];

  const state = {
    route: getRoute(),
    backendMode: detectBackendMode(),
    authenticated: false,
    authReady: false,
    authMode: "login",
    authError: "",
    authBusy: false,
    authValues: {},
    user: null,
    profile: { ...DEFAULT_PROFILE },
    games: [],
    activity: [],
    people: [],
    friends: [],
    pendingFriends: [],
    incomingRequests: [],
    conversations: [],
    chatMessages: [],
    activeConversation: null,
    authTransitionDirection: "",
    pendingDialogResolve: null,
    purchasedAvatars: readArray("playground-purchased-avatars"),
    filter: "All",
    search: "",
    favorites: readArray("playground-favorites"),
    purchasedItems: readArray("playground-purchased"),
    equippedItems: readArray("playground-equipped"),
    joinedCommunities: readArray("playground-communities"),
    rsvps: readArray("playground-rsvps"),
    readMessages: readArray("playground-read-messages"),
    friendRequests: readArray("playground-friend-requests"),
    balance: readNumber("playground-balance", 1250),
    profileTab: "about",
    faqOpen: null,
    modalGame: null,
    modalPreviousFocus: null,
    actionModalPreviousFocus: null,
    playerMuted: false,
    playerMenuOpen: false,
    orientationGame: null,
    orientationLocked: false,
    orientationDismissed: false,
    motionReduced: Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)
  };

  console.info(`[Playground ${APP_BUILD}] ${state.backendMode === "firebase" ? "Firebase hosted" : "Local Python"} backend selected for ${window.location.hostname}`);

  const main = document.getElementById("mainContent");
  const searchInput = document.getElementById("globalSearch");
  const sidebar = document.getElementById("sidebar");
  const authHeaderButton = document.getElementById("authHeaderButton");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const gameModal = document.getElementById("gameModal");
  const profileModal = document.getElementById("profileModal");
  const feedbackModal = document.getElementById("feedbackModal");
  const actionModal = document.getElementById("actionModal");

  function detectBackendMode() {
    const override = new URLSearchParams(window.location.search).get("backend");
    if (override === "local" || override === "firebase") return override;
    const hostname = window.location.hostname.toLowerCase().replace(/^www\./, "");
    // Render's public hostname must always use Firebase, even if the reverse
    // proxy or a local preview changes the apparent network address.
    const isKnownPublicHost = hostname === "playground-bittuhere.onrender.com" || hostname.endsWith(".onrender.com");
    if (isKnownPublicHost) return "firebase";
    const isPrivateIpv4 = /^(10|127)\.\d+\.\d+\.\d+$/.test(hostname) || /^192\.168\.\d+\.\d+$/.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname) || /^169\.254\.\d+\.\d+$/.test(hostname);
    const isLocalHost = hostname === "localhost" || hostname === "0.0.0.0" || hostname === "::1" || hostname.endsWith(".local") || isPrivateIpv4;
    return isLocalHost ? "local" : "firebase";
  }

  function getRoute() {
    return (window.location.hash.replace(/^#/, "").split("?")[0] || "home").toLowerCase();
  }

  function navigate(route) {
    const next = route || "home";
    if (window.location.hash === `#${next}`) {
      state.route = next;
      render();
      scrollToTop();
    } else {
      window.location.hash = next;
    }
    closeProfileMenu();
    sidebar.classList.remove("open");
    document.getElementById("mobileMenu").setAttribute("aria-expanded", "false");
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: state.motionReduced ? "auto" : "smooth" });
  }

  function icon(name, className = "") {
    return `<svg class="${className}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
  }

  function safeClass(value, fallback = "blue") {
    const cleaned = String(value || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
    return cleaned || fallback;
  }

  function initials(value) {
    const parts = String(value || "Player").trim().split(/\\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "P";
  }

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  function readNumber(key, fallback) {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  }

  function persistArray(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function persistBalance() { localStorage.setItem("playground-balance", String(state.balance)); }
  function gameById(id) { return state.games.find((game) => game.id === id); }
  function titleCase(value) { return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

  function avatarOption(id) { return AVATAR_OPTIONS.find((option) => option.id === id) || AVATAR_OPTIONS[0]; }
  function avatarOwned(id) { const option = avatarOption(id); return option.price === 0 || state.purchasedAvatars.includes(id); }
  function avatarPickerMarkup(selected) {
    return `<div class="avatar-picker-grid">${AVATAR_OPTIONS.map((option) => {
      const owned = avatarOwned(option.id);
      return `<button type="button" class="avatar-picker-option ${selected === option.id ? "active" : ""} ${owned ? "" : "locked"}" data-action="choose-avatar" data-avatar-color="${option.id}"><span class="avatar avatar-${option.id} avatar-md"><span class="avatar-symbol">${option.icon}</span><span class="avatar-initials">${initials(state.profile.displayName)}</span></span><span class="avatar-picker-copy"><strong>${option.name}</strong><small>${owned ? option.price === 0 ? "Free" : "Owned" : `<span class="coin-icon">R</span> ${option.price} credits`}</small></span>${owned ? selected === option.id ? icon("check") : "" : icon("lock")}</button>`;
    }).join("")}</div>`;
  }

  function chooseAvatar(id) {
    const option = avatarOption(id);
    if (!avatarOwned(id)) {
      openActionModal(`Unlock ${option.name}`, `<div class="avatar-purchase"><span class="avatar avatar-xl avatar-${option.id}"><span class="avatar-symbol">${option.icon}</span><span class="avatar-initials">${initials(state.profile.displayName)}</span></span><p>Unlock this premium avatar for <strong><span class="coin-icon">R</span> ${option.price} credits</strong>.</p></div><div class="form-footer"><button class="button secondary" data-action="close-modal">Not now</button><button class="button" data-action="purchase-avatar" data-avatar-id="${option.id}">Unlock avatar</button></div>`);
      return;
    }
    updateAvatar(id);
    if (state.route !== "avatar") closeModal();
  }

  function purchaseAvatar(id) {
    const option = avatarOption(id);
    if (!option || avatarOwned(id)) return chooseAvatar(id);
    if (state.balance < option.price) { showToast("You need more credits for this avatar.", "error"); return; }
    state.balance -= option.price;
    state.purchasedAvatars = [...new Set([...state.purchasedAvatars, id])];
    persistBalance();
    persistArray("playground-purchased-avatars", state.purchasedAvatars);
    closeModal();
    updateAvatar(id);
    showToast(`${option.name} unlocked and equipped.`);
  }

  async function initFirebase() {
    if (firebaseApi) return firebaseApi;
    const [{ initializeApp }, authModule, databaseModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js")
    ]);
    const firebaseApp = initializeApp(FIREBASE_CONFIG);
    const auth = authModule.getAuth(firebaseApp);
    const database = databaseModule.getDatabase(firebaseApp, FIREBASE_CONFIG.databaseURL);
    firebaseApi = { ...authModule, ...databaseModule, app: firebaseApp, auth, database };
    return firebaseApi;
  }

  const FIREBASE_USERNAME_DOMAIN = "playground-bittuhere.firebaseapp.com";

  function firebaseUid() { return firebaseApi?.auth?.currentUser?.uid || ""; }
  function firebaseRef(path) { return firebaseApi.ref(firebaseApi.database, path); }
  function firebaseAuthEmail(identifier) {
    const value = String(identifier || "").trim().toLowerCase();
    return value.includes("@") ? value : `${value}@${FIREBASE_USERNAME_DOMAIN}`;
  }
  async function firebaseRead(path) {
    const snapshot = await firebaseApi.get(firebaseRef(path));
    return snapshot.exists() ? snapshot.val() : null;
  }

  function firebaseProfileFromUser(user, stored = {}) {
    return {
      username: String(stored.username || user.email?.split("@")[0] || user.uid.slice(0, 12)).toLowerCase(),
      displayName: stored.displayName || user.displayName || user.email?.split("@")[0] || "Player",
      avatar: stored.avatar || "blue",
      joined: stored.joined || new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date()),
      status: stored.status || "Ready to play",
      about: stored.about || ""
    };
  }

  async function loadFirebaseProfile(user = firebaseApi?.auth?.currentUser) {
    if (!user) return { ...DEFAULT_PROFILE };
    const stored = await firebaseRead(`users/${user.uid}`) || {};
    return firebaseProfileFromUser(user, stored);
  }

  async function writeFirebaseProfile(data = {}) {
    const user = firebaseApi?.auth?.currentUser;
    if (!user) throw new Error("Not authenticated");
    const current = firebaseProfileFromUser(user, { ...state.profile, ...data });
    const privateProfile = { ...current, email: user.email || "", updatedAt: Date.now() };
    const publicProfile = { username: current.username, displayName: current.displayName, avatar: current.avatar, status: current.status, updatedAt: Date.now() };
    await firebaseApi.update(firebaseRef("/"), { [`users/${user.uid}`]: privateProfile, [`publicProfiles/${user.uid}`]: publicProfile });
    state.profile = current;
    return current;
  }

  async function loadFirebaseSocial() {
    const uid = firebaseUid();
    if (!uid) return;
    const [publicProfiles, friendsData, pendingData, incomingData, conversationsData] = await Promise.all([
      firebaseRead("publicProfiles"),
      firebaseRead(`friends/${uid}`),
      firebaseRead(`pendingRequests/${uid}`),
      firebaseRead(`friendRequests/${uid}`),
      firebaseRead(`userConversations/${uid}`)
    ]);
    const people = Object.entries(publicProfiles || {}).filter(([personUid]) => personUid !== uid).map(([personUid, person]) => ({ uid: personUid, ...person }));
    const friendIds = Object.keys(friendsData || {}).filter((key) => friendsData[key] === true || typeof friendsData[key] === "object");
    const pendingIds = Object.keys(pendingData || {});
    state.people = people;
    state.friends = friendIds.map((friendUid) => people.find((person) => person.uid === friendUid) || { uid: friendUid, username: friendUid, displayName: friendUid, avatar: "blue" });
    state.pendingFriends = pendingIds.map((friendUid) => people.find((person) => person.uid === friendUid) || { uid: friendUid, username: friendUid, displayName: friendUid, avatar: "blue" });
    state.incomingRequests = Object.entries(incomingData || {}).map(([fromUid, request]) => ({ uid: fromUid, ...request }));
    state.conversations = Object.entries(conversationsData || {}).map(([id, conversation]) => ({ id, ...conversation })).sort((a, b) => Number(b.lastAt || 0) - Number(a.lastAt || 0));
    await loadFirebaseConversation();
  }

  async function sendFirebaseFriendRequest(username) {
    const target = state.people.find((person) => person.username === username);
    const from = firebaseApi?.auth?.currentUser;
    if (!target || !from) throw new Error("Player not found");
    const request = { fromUid: from.uid, fromUsername: state.profile.username, fromDisplayName: state.profile.displayName, fromAvatar: state.profile.avatar || "blue", targetUid: target.uid, createdAt: Date.now() };
    await firebaseApi.update(firebaseRef("/"), { [`friendRequests/${target.uid}/${from.uid}`]: request, [`pendingRequests/${from.uid}/${target.uid}`]: { uid: target.uid, username: target.username, displayName: target.displayName, avatar: target.avatar, createdAt: Date.now() } });
  }

  function conversationId(firstUid, secondUid) { return [String(firstUid), String(secondUid)].sort().join("__"); }

  async function loadFirebaseConversation() {
    const id = state.activeConversation;
    if (!id) { state.chatMessages = []; return; }
    const messages = await firebaseRead(`conversations/${id}/messages`);
    state.chatMessages = Object.entries(messages || {}).map(([messageId, message]) => ({ id: messageId, ...message })).sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
  }

  async function sendFirebaseMessage(targetUid, text) {
    const from = firebaseApi?.auth?.currentUser;
    if (!from || !targetUid || !text.trim()) throw new Error("Message cannot be empty.");
    const target = state.people.find((person) => person.uid === targetUid) || state.friends.find((person) => person.uid === targetUid);
    if (!target) throw new Error("Player not found.");
    const id = conversationId(from.uid, targetUid);
    const messageKey = firebaseApi.push(firebaseRef(`conversations/${id}/messages`)).key;
    const now = Date.now();
    const message = { senderUid: from.uid, senderUsername: state.profile.username, senderDisplayName: state.profile.displayName, text: text.trim().slice(0, 1000), createdAt: now };
    const mine = { otherUid: targetUid, otherUsername: target.username, otherDisplayName: target.displayName, otherAvatar: target.avatar || "blue", lastMessage: message.text, lastAt: now };
    const theirs = { otherUid: from.uid, otherUsername: state.profile.username, otherDisplayName: state.profile.displayName, otherAvatar: state.profile.avatar || "blue", lastMessage: message.text, lastAt: now };
    await firebaseApi.update(firebaseRef("/"), {
      [`conversations/${id}/members/${from.uid}`]: true,
      [`conversations/${id}/members/${targetUid}`]: true,
      [`conversations/${id}/messages/${messageKey}`]: message,
      [`userConversations/${from.uid}/${id}`]: mine,
      [`userConversations/${targetUid}/${id}`]: theirs
    });
    state.activeConversation = id;
    await loadFirebaseConversation();
  }

  async function acceptFirebaseFriendRequest(request) {
    const uid = firebaseUid();
    if (!uid || !request?.fromUid) throw new Error("Request is no longer available.");
    await firebaseApi.update(firebaseRef("/"), {
      [`friends/${uid}/${request.fromUid}`]: true,
      [`friends/${request.fromUid}/${uid}`]: true,
      [`friendRequests/${uid}/${request.fromUid}`]: null,
      [`pendingRequests/${request.fromUid}/${uid}`]: null
    });
    await loadFirebaseSocial();
  }

  async function declineFirebaseFriendRequest(request) {
    const uid = firebaseUid();
    if (!uid || !request?.fromUid) throw new Error("Request is no longer available.");
    await firebaseApi.update(firebaseRef("/"), {
      [`friendRequests/${uid}/${request.fromUid}`]: null,
      [`pendingRequests/${request.fromUid}/${uid}`]: null
    });
    await loadFirebaseSocial();
  }

  async function submitFirebaseAuth(form) {
    if (state.authBusy) return;
    const register = state.authMode === "register";
    const data = Object.fromEntries(new FormData(form).entries());
    state.authValues = { ...state.authValues, ...data };
    const identifier = String(data.identifier || "").trim();
    if (register && String(data.password) !== String(data.confirmPassword)) {
      state.authError = "Passwords do not match.";
      renderAuth();
      return;
    }
    if (register && (String(data.displayName || "").trim().length < 2 || String(data.displayName || "").trim().length > 40)) {
      state.authError = "Display name must be 2–40 characters.";
      renderAuth();
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/i.test(identifier) && (register || !identifier.includes("@"))) {
      state.authError = register ? "Username must be 3–20 characters using letters, numbers, or underscores." : "Enter your username or email.";
      renderAuth();
      return;
    }
    state.authBusy = true;
    state.authError = "";
    const submit = form.querySelector(".auth-submit");
    if (submit) { submit.disabled = true; submit.innerHTML = `<span class="auth-spinner"></span> ${register ? "Creating account" : "Signing in"}...`; }
    try {
      if (register) {
        const username = identifier.toLowerCase();
        const authEmail = firebaseAuthEmail(username);
        const credential = await firebaseApi.createUserWithEmailAndPassword(firebaseApi.auth, authEmail, String(data.password));
        await firebaseApi.updateProfile(credential.user, { displayName: String(data.displayName).trim() });
        const usernameRef = firebaseRef(`usernames/${username}`);
        const reservation = await firebaseApi.runTransaction(usernameRef, (current) => current === null ? credential.user.uid : undefined);
        if (!reservation.committed) {
          await firebaseApi.deleteUser(credential.user);
          throw Object.assign(new Error("That username is already registered."), { payload: { error: "That username is already registered." } });
        }
        await writeFirebaseProfile({ username, displayName: String(data.displayName).trim() });
      } else {
        const credential = await firebaseApi.signInWithEmailAndPassword(firebaseApi.auth, firebaseAuthEmail(identifier), String(data.password));
        // Accounts created by the previous email-required version can still
        // sign in with their old email once. After that, migrate their Auth
        // identifier to the username-based synthetic address.
        if (identifier.includes("@")) {
          try {
            const stored = await firebaseRead(`users/${credential.user.uid}`) || {};
            const username = String(stored.username || "").toLowerCase();
            const usernameEmail = username ? firebaseAuthEmail(username) : "";
            if (usernameEmail && credential.user.email !== usernameEmail) await firebaseApi.updateEmail(credential.user, usernameEmail);
          } catch { /* Legacy migration is best-effort and never blocks login. */ }
        }
      }
      state.authValues = {};
      state.authError = "";
      // onAuthStateChanged completes the signed-in boot sequence.
    } catch (error) {
      state.authBusy = false;
      state.authError = error?.payload?.error || (register && error?.code === "auth/email-already-in-use" ? "That username is already registered." : firebaseAuthMessage(error)) || "Firebase could not complete that request.";
      renderAuth();
    }
  }

  function firebaseAuthMessage(error) {
    const code = String(error?.code || "");
    const rawMessage = String(error?.message || "");
    const messages = {
      "auth/invalid-credential": "Incorrect username, email, or password.",
      "auth/invalid-login-credentials": "Incorrect username, email, or password.",
      "auth/email-already-in-use": "That account identifier is already registered.",
      "auth/weak-password": "Choose a stronger password of at least 8 characters.",
      "auth/invalid-email": "That username could not be converted into a valid Firebase identifier.",
      "auth/operation-not-allowed": "Firebase Email/Password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.",
      "auth/unauthorized-domain": "This hosted domain is not authorized in Firebase Authentication settings.",
      "auth/network-request-failed": "Firebase could not reach the network. Check the connection and try again.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "PERMISSION_DENIED": "Firebase rejected the database request. Paste the latest Realtime Database rules and try again."
    };
    if (messages[code]) return messages[code];
    if (/permission_denied|permission denied/i.test(`${code} ${rawMessage}`)) return messages.PERMISSION_DENIED;
    if (code) return `Firebase request failed (${code}).`;
    return "";
  }

  async function getJSON(url, options) {
    const response = await fetch(url, options);
    let payload = null;
    try { payload = await response.json(); } catch { /* non-JSON response */ }
    if (!response.ok) {
      const error = new Error(`Request failed (${response.status})`);
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  async function loadData() {
    try {
      const profilePromise = state.backendMode === "firebase" ? loadFirebaseProfile() : getJSON("/api/profile");
      const [gamesData, profileData] = await Promise.all([getJSON("/api/games"), profilePromise]);
      state.games = Array.isArray(gamesData.games) && gamesData.games.length ? gamesData.games : FALLBACK_GAMES;
      state.profile = { ...state.profile, ...(profileData || {}) };
    } catch (error) {
      if (error?.payload?.authenticated === false) {
        await logout();
        return;
      }
      state.games = FALLBACK_GAMES;
      showToast("Running in offline preview mode. Local game files still work after starting run.py.", "error");
    }
    render();
    loadActivity();
    loadSocial();
  }

  async function loadActivity() {
    if (state.backendMode === "firebase") {
      state.activity = [];
      return;
    }
    try {
      const data = await getJSON("/api/activity");
      state.activity = Array.isArray(data.items) ? data.items : [];
      if (state.route === "home") render();
    } catch { /* Activity is optional; the app stays usable. */ }
  }

  async function loadSocial() {
    if (state.backendMode === "firebase") {
      try { await loadFirebaseSocial(); if (["home", "friends", "messages"].includes(state.route)) render(); } catch { /* Empty social state is safe until the first connection. */ }
      return;
    }
    try {
      const [peopleData, friendData, messageData] = await Promise.all([getJSON("/api/people"), getJSON("/api/friends"), getJSON("/api/messages")]);
      state.people = Array.isArray(peopleData.people) ? peopleData.people : [];
      state.friends = Array.isArray(friendData.friends) ? friendData.friends : [];
      state.pendingFriends = Array.isArray(friendData.pending) ? friendData.pending : [];
      state.incomingRequests = Array.isArray(friendData.incoming) ? friendData.incoming : [];
      state.conversations = Array.isArray(messageData.conversations) ? messageData.conversations : [];
      if (state.activeConversation) {
        const selected = state.conversations.find((conversation) => conversation.id === state.activeConversation);
        state.chatMessages = selected?.messages || [];
      }
      if (["home", "friends", "messages"].includes(state.route)) render();
    } catch { /* Social data is optional for an account with no connections. */ }
  }

  function syncProfileUi() {
    document.body.classList.toggle("auth-gate", !state.authenticated);
    document.querySelectorAll("#topProfileName, #menuProfileName").forEach((element) => { element.textContent = state.profile.displayName; });
    document.querySelectorAll("#topProfileInitials").forEach((element) => { element.textContent = initials(state.profile.displayName); });
    const menuHandle = document.getElementById("menuProfileHandle");
    if (menuHandle) menuHandle.textContent = state.profile.username ? `@${state.profile.username}` : "";
    document.querySelectorAll("[data-avatar]").forEach((element) => {
      [...element.classList].filter((name) => name.startsWith("avatar-") && !["avatar-sm", "avatar-md", "avatar-lg", "avatar-xl"].includes(name)).forEach((name) => element.classList.remove(name));
      element.classList.add(`avatar-${safeClass(state.profile.avatar)}`);
      element.dataset.avatar = state.profile.avatar || "blue";
    });
    if (authHeaderButton) authHeaderButton.textContent = state.authenticated ? "" : "Sign in";
    const balance = document.getElementById("balanceValue");
    if (balance) balance.textContent = state.balance.toLocaleString();
    const friendsBadge = document.getElementById("friendsCountBadge");
    if (friendsBadge) { friendsBadge.hidden = state.friends.length === 0; friendsBadge.textContent = state.friends.length.toLocaleString(); }
    const notificationDot = document.querySelector(".notification-dot");
    if (notificationDot) notificationDot.hidden = state.incomingRequests.length === 0;
    document.documentElement.classList.toggle("reduce-motion", state.motionReduced);
  }

  function setActiveNav() {
    document.querySelectorAll(".side-link[data-route]").forEach((link) => link.classList.toggle("active", link.dataset.route === state.route));
    document.title = state.authenticated ? `${titleCase(state.route)} — Playground` : "Welcome — Playground";
  }

  function authValue(name) { return escapeHtml(state.authValues[name] || ""); }

  function renderAuth() {
    syncProfileUi();
    const register = state.authMode === "register";
    const direction = state.authTransitionDirection ? ` auth-enter-${state.authTransitionDirection}` : "";
    main.innerHTML = `<div class="auth-page view-transition is-visible"><div class="auth-card"><div class="auth-brand"><span class="brand-mark" aria-hidden="true"><span></span></span><span>PLAYGROUND</span></div><div class="auth-dynamic${direction}"><div class="auth-kicker">${register ? "Create your account" : "Welcome back"}</div><h1>${register ? "Make your mark." : "Sign in to play."}</h1><p class="auth-subtitle">${register ? "Create a free account and keep your profile, favorites, and experiences together." : "Log in to continue to your experiences and friends."}</p><div class="auth-tabs" role="tablist" aria-label="Account access"><button class="auth-tab ${!register ? "active" : ""}" data-auth-mode="login" role="tab" aria-selected="${!register}">Log in</button><button class="auth-tab ${register ? "active" : ""}" data-auth-mode="register" role="tab" aria-selected="${register}">Register</button></div><form id="authForm" novalidate>${register ? `<div class="auth-field"><label for="authDisplayName">Display name</label><input id="authDisplayName" name="displayName" maxlength="40" autocomplete="name" value="${authValue("displayName")}" placeholder="How should we call you?" required></div>` : ""}<div class="auth-field"><label for="authIdentifier">${register ? "Username" : "Username or email"}</label><input id="authIdentifier" name="identifier" maxlength="120" type="text" autocomplete="username" value="${authValue("identifier")}" placeholder="${register ? "Choose a username" : "Enter your username or email"}" required></div><div class="auth-field"><div class="auth-label-row"><label for="authPassword">Password</label></div><div class="password-wrap"><input id="authPassword" name="password" type="password" minlength="8" maxlength="128" autocomplete="${register ? "new-password" : "current-password"}" value="${authValue("password")}" placeholder="${register ? "At least 8 characters" : "Your password"}" required><button type="button" class="password-toggle" data-action="toggle-password" aria-label="Show password">${icon("eye")}</button></div></div>${register ? `<div class="auth-field"><label for="authConfirm">Confirm password</label><div class="password-wrap"><input id="authConfirm" name="confirmPassword" type="password" minlength="8" maxlength="128" autocomplete="new-password" value="${authValue("confirmPassword")}" placeholder="Repeat your password" required><button type="button" class="password-toggle" data-action="toggle-password" aria-label="Show password">${icon("eye")}</button></div></div>` : ""}<div class="auth-error" id="authError" role="alert" ${state.authError ? "" : "hidden"}>${escapeHtml(state.authError)}</div><button class="button auth-submit" type="submit">${register ? "Create account" : "Log in"} ${icon("chevron-right")}</button></form><p class="auth-terms">By continuing, you agree to keep the community safe and respectful.</p></div></div><div class="auth-aside"><div class="auth-aside-glow"></div><div class="auth-aside-orbit"></div><span class="auth-aside-icon">✦</span><strong>${register ? "Your next chapter starts here." : "Everything you love, in one place."}</strong><span>Experiences, creations, and your people — all saved to your account.</span></div></div>`;
    state.authTransitionDirection = "";
    bindAuthEvents();
  }

  function bindAuthEvents() {
    document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => {
      const nextMode = button.dataset.authMode;
      if (nextMode === state.authMode) return;
      const currentForm = document.getElementById("authForm");
      if (currentForm) state.authValues = { ...state.authValues, ...Object.fromEntries(new FormData(currentForm).entries()) };
      state.authTransitionDirection = nextMode === "register" ? "right" : "left";
      state.authMode = nextMode;
      state.authError = "";
      renderAuth();
    }));
    const form = document.getElementById("authForm");
    if (form) form.addEventListener("submit", (event) => { event.preventDefault(); submitAuth(form); });
  }

  async function submitAuth(form) {
    if (state.backendMode === "firebase") {
      await submitFirebaseAuth(form);
      return;
    }
    if (state.authBusy) return;
    const register = state.authMode === "register";
    const data = Object.fromEntries(new FormData(form).entries());
    state.authValues = { ...state.authValues, ...data };
    if (register && String(data.password) !== String(data.confirmPassword)) {
      state.authError = "Passwords do not match.";
      renderAuth();
      return;
    }
    state.authBusy = true;
    state.authError = "";
    const submit = form.querySelector(".auth-submit");
    if (submit) { submit.disabled = true; submit.innerHTML = `<span class="auth-spinner"></span> ${register ? "Creating account" : "Signing in"}...`; }
    try {
      const payload = register ? { username: data.identifier, displayName: data.displayName, email: data.email, password: data.password } : { identifier: data.identifier, password: data.password };
      const result = await getJSON(register ? "/api/auth/register" : "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      state.authenticated = true;
      state.authReady = true;
      state.authBusy = false;
      state.authError = "";
      state.authValues = {};
      state.user = result.user || null;
      state.profile = { ...state.profile, ...(result.profile || {}) };
      syncProfileUi();
      render();
      loadData();
      showToast(register ? "Account created. Welcome to Playground." : "Welcome back.");
    } catch (error) {
      let message = "We could not complete that request. Please try again.";
      try { message = error?.payload?.error || message; } catch { /* keep generic */ }
      // getJSON keeps the response deliberately small; read the server error with a second request is not useful here.
      state.authError = message;
      state.authBusy = false;
      renderAuth();
    }
  }

  async function boot() {
    if (state.backendMode === "firebase") {
      try {
        await initFirebase();
        await new Promise((resolve) => {
          let firstAuthEvent = true;
          firebaseApi.onAuthStateChanged(firebaseApi.auth, async (user) => {
            state.authenticated = Boolean(user);
            state.authReady = true;
            state.authBusy = false;
            state.user = user || null;
            if (user) {
              try { state.profile = await loadFirebaseProfile(user); } catch { state.profile = firebaseProfileFromUser(user); }
              loadData();
            } else {
              renderAuth();
            }
            if (firstAuthEvent) { firstAuthEvent = false; resolve(); }
          });
        });
      } catch (error) {
        state.authBusy = false;
        state.authReady = true;
        state.authError = firebaseAuthMessage(error) || "Firebase could not initialize. Check the Realtime Database URL, authorized domains, and Email/Password provider.";
        renderAuth();
      }
      return;
    }
    try {
      const session = await getJSON("/api/auth/me");
      state.authenticated = Boolean(session.authenticated);
      state.authReady = true;
      state.user = session.user || null;
      state.profile = { ...state.profile, ...(session.profile || {}) };
    } catch {
      state.authenticated = false;
      state.authReady = true;
    }
    if (state.authenticated) loadData(); else renderAuth();
  }

  async function logout() {
    if (state.backendMode === "firebase") {
      try { await firebaseApi.signOut(firebaseApi.auth); } catch { /* clear the UI even if Firebase is temporarily unavailable */ }
    } else {
      try { await getJSON("/api/auth/logout", { method: "POST" }); } catch { /* clear local state even if the server is unavailable */ }
    }
    state.authenticated = false;
    state.user = null;
    state.authBusy = false;
    state.authError = "";
    state.authMode = "login";
    state.authValues = {};
    closeProfileMenu();
    renderAuth();
    showToast("You have been signed out.");
  }

  function filteredGames() {
    const query = state.search.trim().toLowerCase();
    return state.games.filter((game) => {
      const categoryMatch = state.filter === "All" || state.filter === "Coming soon" ? (state.filter === "All" || game.status === "coming-soon") : game.category === state.filter;
      const queryMatch = !query || [game.title, game.category, game.description, game.players].join(" ").toLowerCase().includes(query);
      return categoryMatch && queryMatch;
    });
  }

  function statusDetails(game) {
    if (game.status === "ready") return { label: "Ready to play", icon: "play", className: "ready" };
    if (game.status === "coming-soon") return { label: "Coming soon", icon: "clock", className: "soon" };
    return { label: "Not installed", icon: "download", className: "offline" };
  }

  function cover(game, extraClass = "") {
    const accent = safeClass(game.accent);
    const status = statusDetails(game);
    const iconText = game.id === "tic-tac-toe" ? "×  ○" : game.id === "rock-paper-scissors" ? "✦" : game.id === "traffic-rider" ? "▰" : "◆";
    const logo = game.image ? `<img class="game-cover-image" src="${escapeHtml(game.image)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">` : "";
    return `<div class="game-cover cover-${accent} ${extraClass}">${logo}<div class="cover-fallback" ${game.image ? "hidden" : ""}><span class="cover-icon">${iconText}</span></div><span class="cover-scrim"></span><span class="cover-tag">${escapeHtml(game.category || "Experience")}</span>${game.status === "placeholder" ? `<span class="placeholder-label">GAME FILE NEEDED</span>` : ""}<span class="cover-status ${status.className}"><i></i> ${escapeHtml(status.label)}</span></div>`;
  }

  function gameCard(game) {
    const favorite = state.favorites.includes(game.id);
    const stateLabel = game.status === "ready" ? (favorite ? "Saved" : escapeHtml(game.category || "Game")) : statusDetails(game).label;
    return `<article class="game-card" data-game-id="${escapeHtml(game.id)}" tabindex="0" role="button" aria-label="Open ${escapeHtml(game.title)}"><div class="card-cover-wrap">${cover(game)}</div><div class="game-info"><div class="game-title-row"><h3>${escapeHtml(game.title)}</h3>${favorite ? `<span class="saved-mark">${icon("star")}</span>` : ""}</div><div class="game-meta"><span>${escapeHtml(game.players || "Experience")}</span><span>${stateLabel}</span></div></div></article>`;
  }

  function renderGameGrid(games, emptyMessage = "No experiences match your search.") {
    if (!games.length) return `<div class="empty-card" style="grid-column:1/-1">${icon("search")}<div><strong>No experiences found</strong><p>${escapeHtml(emptyMessage)}</p></div></div>`;
    return games.map(gameCard).join("");
  }

  function render() {
    state.route = getRoute();
    if (!state.authenticated) {
      renderAuth();
      return;
    }
    setActiveNav();
    syncProfileUi();
    const view = {
      home: renderHome,
      discover: renderDiscover,
      profile: renderProfile,
      friends: renderFriends,
      messages: renderMessages,
      marketplace: renderMarketplace,
      avatar: renderAvatar,
      inventory: renderInventory,
      groups: renderGroups,
      events: renderEvents,
      create: renderCreate,
      settings: renderSettings,
      help: renderHelp
    }[state.route] || renderHome;
    main.innerHTML = `<div class="view-transition">${view()}</div>`;
    requestAnimationFrame(() => main.querySelector(".view-transition")?.classList.add("is-visible"));
    bindViewEvents();
  }

  function renderHome() {
    const games = state.games.length ? state.games : FALLBACK_GAMES;
    const feature = games.find((game) => game.status === "ready") || games.find((game) => game.status !== "coming-soon") || games[0];
    const activity = state.activity;
    const activityMarkup = activity.length ? activity.slice(0, 3).map(activityItem).join("") : `<div class="empty-activity">${icon("users")}<strong>No friend activity yet</strong><span>Add friends to see their updates here.</span><button class="text-button" data-route="friends">Find friends ${icon("chevron-right")}</button></div>`;
    return `<div class="page-container">
      <section class="hero" aria-label="Welcome"><div class="hero-grid"></div><div class="hero-orb" aria-hidden="true"></div><div class="hero-content"><div class="hero-eyebrow"><i></i> Welcome back</div><h1>What will you<br>play today?</h1><p>Discover new experiences, meet friends, and make your next favorite memory.</p><div class="hero-actions"><button class="button play-button" data-game-id="${escapeHtml(feature.id)}">${icon("play")} ${feature.status === "ready" ? "Play something" : "Explore an experience"}</button><button class="button secondary" data-route="discover">Explore</button></div></div></section>
      <section class="home-pulse" aria-label="Your Playground overview"><div class="pulse-card"><span class="pulse-icon">${icon("play")}</span><div><strong>${games.filter((game) => game.status === "ready").length}</strong><small>Playable now</small></div></div><div class="pulse-card"><span class="pulse-icon green">${icon("users")}</span><div><strong>${state.friends.length}</strong><small>Friends online</small></div></div><div class="pulse-card"><span class="pulse-icon yellow">${icon("star")}</span><div><strong>${state.favorites.length}</strong><small>Saved experiences</small></div></div><div class="pulse-card pulse-highlight"><span class="pulse-icon purple">${icon("sparkles")}</span><div><strong>${state.incomingRequests.length ? state.incomingRequests.length : "Ready"}</strong><small>${state.incomingRequests.length ? "Requests waiting" : "Your next session"}</small></div><button class="text-button" data-route="${state.incomingRequests.length ? "friends" : "discover"}">${state.incomingRequests.length ? "Review" : "Explore"} ${icon("chevron-right")}</button></div></section>
      <section class="section"><div class="section-heading"><h2>Continue playing</h2><button class="text-button" data-route="discover">See all ${icon("chevron-right")}</button></div><div class="continue-grid"><article class="feature-game" data-game-id="${escapeHtml(feature.id)}" tabindex="0" role="button"><div class="feature-light"></div><div class="feature-shape"></div><div class="feature-copy"><span class="eyebrow">${feature.status === "ready" ? "Ready to play" : feature.status === "coming-soon" ? "Coming soon" : "Your next experience"}</span><h3>${escapeHtml(feature.title)}</h3><p>${escapeHtml(feature.description)}</p><button class="button" data-game-id="${escapeHtml(feature.id)}">Open experience ${icon("chevron-right")}</button></div></article><div class="activity-panel"><div class="activity-head"><h3>Friend activity</h3><button class="text-button" data-route="friends">View all</button></div>${activityMarkup}</div></div></section>
      <section class="section"><div class="section-heading"><h2>Recommended for you</h2><button class="text-button" data-route="discover">Browse all ${icon("chevron-right")}</button></div><div class="card-grid">${renderGameGrid(games.slice(0, 4))}</div></section>
      <section class="section"><div class="section-heading"><h2>Made for you</h2><span class="muted" style="font-size:12px">Fresh picks from the community</span></div><div class="card-grid">${renderGameGrid([...games].reverse().slice(0, 4))}</div></section>
    </div>`;
  }

  function activityItem(item) {
    return `<div class="activity-item"><span class="avatar avatar-${safeClass(item.avatar)}"><span class="avatar-initials">${initials(item.name)}</span></span><div class="activity-copy"><strong>${escapeHtml(item.name)}</strong> ${escapeHtml(item.text)}<small>${escapeHtml(item.time)}</small></div><button class="activity-action" data-route="profile">View</button></div>`;
  }

  function renderDiscover() {
    const categories = ["All", ...new Set(state.games.map((game) => game.category).filter(Boolean)), "Coming soon"];
    const shown = filteredGames();
    return `<div class="page-container"><div class="page-heading"><div><h1>Discover</h1><p>Find your next adventure from experiences made by the community.</p></div><button class="button secondary" data-action="refresh-games">${icon("refresh")} Refresh games</button></div>${state.search ? `<div class="banner">${icon("search")}<p>Showing results for <strong>${escapeHtml(state.search)}</strong>. <button class="text-button" data-action="clear-search">Clear search</button></p></div>` : ""}<div class="discovery-toolbar">${categories.map((category) => `<button class="filter-button ${state.filter === category ? "active" : ""}" data-filter="${escapeHtml(category)}">${category === "Coming soon" ? icon("clock") : ""}${escapeHtml(category)}</button>`).join("")}<span class="toolbar-spacer"></span><button class="sort-select custom-control" data-action="sort-games" aria-label="Sort experiences">${icon("sliders")} Sort</button></div><div class="section-heading"><h2>${state.filter === "All" ? "All experiences" : escapeHtml(state.filter)}</h2><span class="muted" style="font-size:12px">${shown.length} experience${shown.length === 1 ? "" : "s"}</span></div><div class="card-grid">${renderGameGrid(shown)}</div><section class="section"><div class="install-callout">${icon("download")}<div><strong>Bring your own games</strong><p>Drop an HTML file and optional SVG or PNG logo into <code>site/games/</code>, add its metadata to <code>info.json</code>, then use Refresh games.</p></div></div></section></div>`;
  }

  function renderProfile() {
    const p = state.profile;
    const tab = state.profileTab;
    let tabContent = "";
    if (tab === "creations") {
      const created = state.games.filter((game) => game.status === "ready");
      tabContent = `<div class="profile-tab-heading"><h2>Creations</h2><span class="muted">${created.length} published</span></div><div class="card-grid">${renderGameGrid(created, "Your ready HTML games will appear here.")}</div>`;
    } else if (tab === "favorites") {
      const saved = state.games.filter((game) => state.favorites.includes(game.id));
      tabContent = `<div class="profile-tab-heading"><h2>Favorites</h2><span class="muted">${saved.length} saved</span></div><div class="card-grid">${renderGameGrid(saved, "Click the star in an experience to save it here.")}</div>`;
    } else {
      tabContent = `<div class="info-grid"><div class="info-card"><div class="info-icon">${icon("compass")}</div><h3>Currently exploring</h3><p>${escapeHtml(state.games[0]?.title || "the platform")}</p></div><div class="info-card"><div class="info-icon">${icon("users")}</div><h3>Friends</h3><p>${state.friends.length ? `${state.friends.length} connection${state.friends.length === 1 ? "" : "s"} in your circle.` : "You have not added any friends yet."}</p></div><div class="info-card"><div class="info-icon">${icon("heart")}</div><h3>Favorite experiences</h3><p>${state.favorites.length ? `${state.favorites.length} saved experience${state.favorites.length === 1 ? "" : "s"}` : "Save experiences to see them here."}</p></div></div>`;
    }
    return `<div class="page-container"><div class="profile-cover"></div><section class="profile-body"><div class="profile-avatar-wrap"><span class="avatar avatar-${safeClass(p.avatar)} avatar-xl"><span class="avatar-initials">${initials(p.displayName)}</span></span></div><div class="profile-actions"><button class="button secondary" data-action="edit-profile">${icon("edit")} Edit profile</button><button class="button ghost" data-action="share-profile">${icon("share")} Share</button></div><div class="profile-details"><h1>${escapeHtml(p.displayName)}</h1><span class="handle">@${escapeHtml(p.username)}</span><p>${escapeHtml(p.about || "No bio yet.")}</p><div class="profile-stats"><span><strong>${state.friends.length}</strong> Friends</span><span><strong>${state.games.filter((game) => game.status === "ready").length}</strong> Experiences played</span><span>Joined <strong>${escapeHtml(p.joined)}</strong></span></div></div></section><div class="tab-row">${[["about", "About"], ["creations", "Creations"], ["favorites", "Favorites"]].map(([id, label]) => `<button class="tab-button ${tab === id ? "active" : ""}" data-profile-tab="${id}">${label}</button>`).join("")}</div>${tabContent}</div>`;
  }

  function renderFriends() {
    const connections = state.friends;
    const people = state.people.filter((person) => !connections.some((friend) => friend.uid === person.uid || friend.username === person.username));
    const requests = state.incomingRequests;
    return `<div class="page-container"><div class="page-heading"><div><h1>Friends</h1><p>Connect with real accounts and play together.</p></div><button class="button" data-action="add-friend">${icon("users")} Add friends</button></div>${requests.length ? `<section class="friend-requests-panel"><div class="section-heading"><div><h2>Friend requests</h2><span class="muted">${requests.length} waiting for you</span></div>${icon("bell")}</div><div class="request-list">${requests.map((request) => `<div class="request-row"><span class="avatar avatar-${safeClass(request.fromAvatar || request.avatar)}"><span class="avatar-initials">${initials(request.fromDisplayName || request.displayName || request.fromUsername)}</span></span><div class="friend-copy"><strong>${escapeHtml(request.fromDisplayName || request.displayName || request.fromUsername)}</strong><span>@${escapeHtml(request.fromUsername || request.username || "player")} · wants to be your friend</span></div><button class="button" data-action="accept-friend-request" data-request-uid="${escapeHtml(request.fromUid || request.uid)}">Accept</button><button class="button ghost" data-action="decline-friend-request" data-request-uid="${escapeHtml(request.fromUid || request.uid)}">Decline</button></div>`).join("")}</div></section>` : ""}${connections.length ? `<div class="section-heading"><h2>Your friends</h2><span class="muted">${connections.length} connection${connections.length === 1 ? "" : "s"}</span></div><div class="friends-list">${connections.map((friend) => `<div class="friend-row"><span class="avatar avatar-${safeClass(friend.avatar)}"><span class="avatar-initials">${initials(friend.displayName || friend.username)}</span></span><div class="friend-copy"><strong>${escapeHtml(friend.displayName)}</strong><span>@${escapeHtml(friend.username)}</span></div><span class="friend-status"><i></i>Connected</span><button class="button secondary" data-action="friend-action" data-friend-id="${escapeHtml(friend.username)}">Message</button></div>`).join("")}</div>` : `<div class="empty-card friends-empty">${icon("users")}<div><strong>No friends yet</strong><p>When you add people, your connections will appear here.</p><button class="button secondary" data-action="add-friend" style="margin-top:15px">Find people</button></div></div>`}${people.length ? `<section class="section"><div class="section-heading"><h2>People on Playground</h2><span class="muted">${people.length} account${people.length === 1 ? "" : "s"}</span></div><div class="friends-list">${people.map((person) => `<div class="friend-row"><span class="avatar avatar-${safeClass(person.avatar)}"><span class="avatar-initials">${initials(person.displayName || person.username)}</span></span><div class="friend-copy"><strong>${escapeHtml(person.displayName)}</strong><span>@${escapeHtml(person.username)}</span></div><span class="friend-status"><i></i>${state.pendingFriends.some((pending) => pending.uid === person.uid || pending.username === person.username) ? "Request sent" : "Available"}</span><button class="button secondary" data-action="friend-action" data-friend-id="${escapeHtml(person.username)}">${state.pendingFriends.some((pending) => pending.uid === person.uid || pending.username === person.username) ? "Requested" : "Add friend"}</button></div>`).join("")}</div></section>` : ""}</div>`;
  }

  function formatMessageTime(value) {
    if (!value) return "";
    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  }

  function renderMessages() {
    const currentUid = firebaseUid() || state.profile.username;
    const selected = state.conversations.find((conversation) => conversation.id === state.activeConversation) || state.conversations[0];
    if (selected && state.activeConversation !== selected.id) state.activeConversation = selected.id;
    const messages = selected ? state.chatMessages : [];
    const hasPeople = state.people.length > 0;
    if (!state.conversations.length && !hasPeople) return `<div class="page-container"><div class="page-heading"><div><h1>Messages</h1><p>Your private inbox will appear here.</p></div></div><div class="empty-card messages-empty">${icon("message")}<div><strong>No conversations yet</strong><p>When another registered account is available, you can start a private chat here.</p></div></div></div>`;
    return `<div class="page-container"><div class="page-heading"><div><h1>Messages</h1><p>Private chats for your Playground connections.</p></div><button class="button" data-action="compose-message">${icon("send")} New message</button></div><div class="messages-layout chat-layout"><aside class="messages-list chat-sidebar"><div class="chat-sidebar-head"><strong>Chats</strong><span>${state.conversations.length}</span></div>${state.conversations.length ? state.conversations.map((conversation) => `<button class="message-row conversation-row ${conversation.id === selected?.id ? "active" : ""}" data-action="open-conversation" data-conversation-id="${escapeHtml(conversation.id)}"><span class="avatar avatar-${safeClass(conversation.otherAvatar)}"><span class="avatar-initials">${initials(conversation.otherDisplayName || conversation.otherUsername)}</span></span><span class="message-copy"><strong>${escapeHtml(conversation.otherDisplayName || conversation.otherUsername)}</strong><small>${escapeHtml(conversation.lastMessage || "Start a conversation")}</small></span><span class="message-time">${formatMessageTime(conversation.lastAt)}</span></button>`).join("") : `<div class="chat-sidebar-empty">No chats yet.</div>`}</aside><section class="message-reader chat-window">${selected ? `<div class="chat-header"><span class="avatar avatar-${safeClass(selected.otherAvatar)}"><span class="avatar-initials">${initials(selected.otherDisplayName || selected.otherUsername)}</span></span><div><strong>${escapeHtml(selected.otherDisplayName || selected.otherUsername)}</strong><small>@${escapeHtml(selected.otherUsername || "player")}</small></div><button class="icon-button" data-action="chat-info" aria-label="Chat details">${icon("more")}</button></div><div class="chat-messages" id="chatMessages">${messages.length ? messages.map((message) => { const mine = message.senderUid === firebaseUid() || message.senderUsername === state.profile.username; return `<div class="chat-message ${mine ? "mine" : "theirs"}"><div class="chat-bubble">${escapeHtml(message.text)}<small>${formatMessageTime(message.createdAt)}</small></div></div>`; }).join("") : `<div class="chat-empty"><span class="chat-empty-icon">${icon("message")}</span><strong>Start the conversation</strong><p>Say hello to ${escapeHtml(selected.otherDisplayName || selected.otherUsername)}.</p></div>`}</div><form class="chat-composer" id="chatForm" data-recipient-uid="${escapeHtml(selected.otherUid)}"><input name="body" maxlength="1000" autocomplete="off" placeholder="Write a message..." aria-label="Message" required><button class="send-message-button" type="submit" aria-label="Send message">${icon("send")}</button></form>` : `<div class="message-reader-empty">${icon("message")}<strong>Select a chat</strong><p>Choose a conversation on the left or start a new one.</p></div>`}</section></div></div>`;
  }

  function renderMarketplace() {
    return `<div class="page-container"><div class="page-heading"><div><h1>Marketplace</h1><p>Customize your look with community-made items.</p></div><button class="button secondary" data-action="market-search">${icon("search")} Search catalog</button></div><div class="balance-banner"><span class="coin-icon">R</span><div><strong>${state.balance.toLocaleString()} credits</strong><span>Use your balance to collect items.</span></div><button class="text-button" data-action="earn-credits">How to earn more</button></div><div class="section-heading"><h2>Featured items</h2><span class="muted" style="font-size:12px">Tap an item to equip it after purchase</span></div><div class="item-grid">${MARKET_ITEMS.map(itemCard).join("")}</div></div>`;
  }

  function itemCard(item) {
    const owned = state.purchasedItems.includes(item.id);
    const equipped = state.equippedItems.includes(item.id);
    return `<article class="item-card"><div class="item-art item-art-${safeClass(item.accent)}"><span>${item.icon}</span>${equipped ? `<b class="equipped-ribbon">Equipped</b>` : ""}</div><div class="item-card-body"><span class="item-kind">${item.kind}</span><h3>${item.name}</h3><p>${item.description}</p><div class="item-footer">${owned ? `<button class="button ${equipped ? "secondary" : ""}" data-action="equip-item" data-item-id="${item.id}">${equipped ? icon("check") + " Equipped" : "Equip"}</button>` : `<button class="button" data-action="purchase-item" data-item-id="${item.id}"><span class="coin-icon">R</span> ${item.price}</button>`}</div></div></article>`;
  }

  function renderAvatar() {
    const selected = avatarOption(state.profile.avatar).id;
    const selectedOption = avatarOption(selected);
    return `<div class="page-container"><div class="page-heading"><div><h1>Avatar</h1><p>Choose a look that follows you across Playground.</p></div><button class="button secondary" data-action="save-avatar">${icon("check")} Save look</button></div><div class="avatar-editor"><div class="avatar-stage avatar-stage-${safeClass(selected)}"><div class="avatar-glow"></div><span class="avatar avatar-xl avatar-${safeClass(selected)}"><span class="avatar-symbol">${selectedOption.icon}</span><span class="avatar-initials">${initials(state.profile.displayName)}</span></span><span class="avatar-stage-label">${escapeHtml(state.profile.displayName)} · ${escapeHtml(selectedOption.name)}</span></div><div class="avatar-editor-panel"><div class="section-heading"><div><h2>Avatar collection</h2><span class="muted">Free and premium looks</span></div><span class="avatar-credit-balance"><span class="coin-icon">R</span> ${state.balance.toLocaleString()}</span></div>${avatarPickerMarkup(selected)}<div class="avatar-divider"></div><div class="section-heading"><h2>Style ideas</h2><button class="text-button" data-route="marketplace">Marketplace ${icon("chevron-right")}</button></div><div class="style-suggestions">${MARKET_ITEMS.slice(0, 3).map((item) => `<button class="style-suggestion" data-route="marketplace"><span class="item-art mini item-art-${safeClass(item.accent)}">${item.icon}</span><span><strong>${item.name}</strong><small>${item.kind}</small></span>${icon("chevron-right")}</button>`).join("")}</div></div></div></div>`;
  }

  function renderInventory() {
    const owned = [...BASE_INVENTORY, ...MARKET_ITEMS.filter((item) => state.purchasedItems.includes(item.id))];
    return `<div class="page-container"><div class="page-heading"><div><h1>Inventory</h1><p>Your collection, ready for the next adventure.</p></div><button class="button secondary" data-route="marketplace">${icon("shopping-bag")} Browse marketplace</button></div><div class="inventory-summary"><div><strong>${owned.length}</strong><span>Total items</span></div><div><strong>${state.equippedItems.length}</strong><span>Equipped</span></div><div><strong>${state.purchasedItems.length}</strong><span>Collected</span></div></div><div class="inventory-grid">${owned.map((item) => { const equipped = state.equippedItems.includes(item.id); return `<article class="inventory-card"><div class="item-art item-art-${safeClass(item.accent)}"><span>${item.icon}</span></div><div><span class="item-kind">${item.kind}</span><h3>${item.name}</h3><button class="button ${equipped ? "secondary" : ""}" data-action="equip-item" data-item-id="${item.id}">${equipped ? icon("check") + " Equipped" : "Equip item"}</button></div></article>`; }).join("")}</div></div>`;
  }

  function renderGroups() {
    return `<div class="page-container"><div class="page-heading"><div><h1>Communities</h1><p>Find your people and build something together.</p></div><button class="button secondary" data-action="community-search">${icon("search")} Find a community</button></div><div class="community-grid">${COMMUNITIES.map((community) => { const joined = state.joinedCommunities.includes(community.id); return `<article class="community-card"><div class="community-art community-art-${community.accent}">${community.icon}</div><div class="community-body"><div class="community-meta"><span>${community.members} members</span>${joined ? `<span class="joined-pill">Joined</span>` : ""}</div><h2>${community.name}</h2><p>${community.description}</p><button class="button ${joined ? "secondary" : ""}" data-action="toggle-community" data-community-id="${community.id}">${joined ? icon("check") + " Joined" : icon("users") + " Join community"}</button></div></article>`; }).join("")}</div></div>`;
  }

  function renderEvents() {
    return `<div class="page-container"><div class="page-heading"><div><h1>Events</h1><p>See what is happening across the platform.</p></div><button class="button secondary" data-action="calendar-reminder">${icon("calendar")} My reminders</button></div><div class="events-list">${EVENTS.map((event) => { const joined = state.rsvps.includes(event.id); return `<article class="event-row"><div class="event-date"><strong>${event.date.split(" ")[0]}</strong><span>${event.date.split(" ").slice(1).join(" ") || "EVENT"}</span></div><div class="event-art event-art-${event.accent}">${event.icon}</div><div class="event-copy"><span class="item-kind">${event.time}</span><h2>${event.name}</h2><p>${event.description}</p></div><button class="button ${joined ? "secondary" : ""}" data-action="toggle-rsvp" data-event-id="${event.id}">${joined ? icon("check") + " Going" : "RSVP"}</button></article>`; }).join("")}</div></div>`;
  }

  function renderCreate() {
    const ready = state.games.filter((game) => game.status === "ready").length;
    const soon = state.games.filter((game) => game.status === "coming-soon").length;
    return `<div class="page-container"><div class="page-heading"><div><h1>Create</h1><p>Build an experience, share it, and invite the world in.</p></div><button class="button" data-action="refresh-games">${icon("refresh")} Sync games folder</button></div><div class="banner">${icon("check")}<p><strong>Local game hosting is enabled.</strong> Add an HTML game and a metadata entry in <code>site/games/</code> to publish it in this dashboard.</p></div><div class="create-stats"><div><span class="create-stat-icon">${icon("play")}</span><div><strong>${ready}</strong><small>Playable now</small></div></div><div><span class="create-stat-icon">${icon("clock")}</span><div><strong>${soon}</strong><small>Coming soon</small></div></div><div><span class="create-stat-icon">${icon("sparkles")}</span><div><strong>SVG + PNG</strong><small>Logo support</small></div></div></div><div class="info-grid"><div class="info-card"><div class="info-icon">${icon("plus-square")}</div><h3>Start from a file</h3><p>Put your self-contained HTML game in the games folder. No build step is required.</p><button class="text-button" data-action="open-addon-help" style="margin-top:14px">View addon format</button></div><div class="info-card"><div class="info-icon">${icon("box")}</div><h3>Manage game metadata</h3><p>Edit <code>info.json</code> to set titles, descriptions, categories, status, and SVG or PNG cover logos.</p><button class="text-button" data-action="open-addon-help" style="margin-top:14px">See an example</button></div><div class="info-card"><div class="info-icon">${icon("help-circle")}</div><h3>Need a hand?</h3><p>Open the help page for setup notes or send feedback to the local Python server.</p><button class="text-button" data-route="help" style="margin-top:14px">Open help</button></div></div><section class="section"><div class="section-heading"><h2>Experience library</h2><button class="text-button" data-route="discover">Open Discover</button></div><div class="card-grid">${renderGameGrid(state.games, "Add HTML files to site/games/ to see them here.")}</div></section></div>`;
  }

  function renderSettings() {
    const p = state.profile;
    const option = avatarOption(p.avatar);
    return `<div class="page-container"><div class="page-heading"><div><h1>Settings</h1><p>Manage your profile and app preferences.</p></div></div><div class="settings-layout"><div class="settings-nav"><button class="active">Account</button><button data-action="edit-profile">Profile</button><button data-action="feedback">Feedback</button></div><section class="settings-panel"><h2>Account details</h2><p>Your profile is saved securely by the active account backend.</p><form id="settingsForm"><div class="form-grid"><div class="form-field"><label for="displayName">Display name</label><input id="displayName" name="displayName" maxlength="80" value="${escapeHtml(p.displayName)}" required><span class="form-help">This is the name shown to other players.</span></div><div class="form-field"><label for="username">Username</label><input id="username" name="username" maxlength="80" value="${escapeHtml(p.username)}" readonly><span class="form-help">Usernames are fixed after registration.</span></div><div class="form-field"><label for="status">Status</label><input id="status" name="status" maxlength="80" value="${escapeHtml(p.status || "")}"></div><div class="form-field"><label>Avatar</label><input type="hidden" id="settingsAvatarValue" name="avatar" value="${escapeHtml(option.id)}"><button type="button" class="custom-field-picker" data-action="settings-avatar"><span class="avatar avatar-${option.id} avatar-sm"><span class="avatar-symbol">${option.icon}</span><span class="avatar-initials">${initials(p.displayName)}</span></span><span><strong>${escapeHtml(option.name)}</strong><small>Choose from your collection</small></span>${icon("chevron-down")}</button></div><div class="form-field full"><label for="about">About</label><textarea id="about" name="about" maxlength="240">${escapeHtml(p.about || "")}</textarea></div></div><div class="form-footer"><button type="button" class="button secondary" data-action="reset-settings">Reset</button><button type="submit" class="button">Save changes ${icon("check")}</button></div></form></section></div></div>`;
  }

  function renderHelp() {
    return `<div class="page-container"><div class="page-heading"><div><h1>Help</h1><p>Everything you need to get this local-first app running.</p></div><button class="button" data-action="feedback">${icon("message")} Send feedback</button></div><div class="faq-list">${FAQS.map((faq, index) => `<article class="faq-item ${state.faqOpen === index ? "open" : ""}"><button class="faq-question" data-action="toggle-faq" data-faq-index="${index}"><span>${faq.question}</span>${icon("chevron-down")}</button><div class="faq-answer"><p>${faq.answer}</p></div></article>`).join("")}</div><div class="info-grid help-cards"><div class="info-card"><div class="info-icon">${icon("download")}</div><h3>Add a game</h3><p>Place HTML and a logo in site/games/, update info.json, then refresh Discover.</p></div><div class="info-card"><div class="info-icon">${icon("settings")}</div><h3>Server features</h3><p>Static files, discovery, profile persistence, safe paths, health checks, Render PORT, and friendly errors.</p></div><div class="info-card"><div class="info-icon">${icon("send")}</div><h3>Still stuck?</h3><p>Send a note to the local feedback endpoint. It is stored in site/data/feedback.jsonl.</p></div></div></div>`;
  }

  function openGame(gameId) {
    const game = gameById(gameId);
    if (!game) return;
    exitLandscape();
    state.orientationGame = null;
    state.modalGame = game;
    state.modalPreviousFocus = document.activeElement;
    gameModal.classList.remove("experience-modal");
    const favorite = state.favorites.includes(game.id);
    const status = statusDetails(game);
    const isReady = game.status === "ready";
    const cta = isReady ? `${icon("play")} Play now` : game.status === "coming-soon" ? `${icon("clock")} Coming soon` : `${icon("download")} Show setup`;
    gameModal.innerHTML = `<div class="modal-header"><div class="modal-title-line"><span class="modal-live-dot ${status.className}"></span><h2 id="gameModalTitle">Experience details</h2></div><button class="modal-close" data-action="close-modal" aria-label="Close">${icon("x")}</button></div><div class="modal-game-top"><div class="modal-cover">${cover(game, "modal-cover-art")}</div><div class="modal-game-copy"><span class="game-category">${escapeHtml(game.category || "Experience")}</span><h2>${escapeHtml(game.title)}</h2><p>${escapeHtml(game.description)}</p><div class="modal-game-stats"><div><strong>${escapeHtml(game.players || "Community")}</strong><span>Players</span></div><div><strong>${escapeHtml(status.label)}</strong><span>Availability</span></div></div><div class="modal-cta-row"><button class="button ${isReady ? "" : "secondary"}" data-action="launch-game">${cta}</button><button class="button secondary" data-action="favorite-game">${icon("star")} ${favorite ? "Saved" : "Save"}</button></div></div></div>${game.status === "coming-soon" ? `<div class="game-frame-wrap"><div class="coming-soon-panel">${icon("sparkles")}<div><strong>${escapeHtml(game.comingSoonText || "This experience is coming soon.")}</strong><p>Follow the experience by saving it to your favorites. We will keep the placeholder ready for the HTML addon.</p></div></div></div>` : game.status === "placeholder" ? `<div class="game-frame-wrap"><div class="install-callout">${icon("download")}<div><strong>This experience needs its game file</strong><p>Put <code>${escapeHtml(game.file)}</code> inside <code>site/games/</code>. Then press Refresh games and it will open in the immersive player automatically.</p></div></div></div>` : `<div class="game-ready-note">${icon("sparkles")} This experience opens in the immersive player. Your dashboard stays behind it, just like a platform game launch.</div>`}`;
    openModal(gameModal);
  }

  function launchGame() {
    if (!state.modalGame) return;
    if (state.modalGame.status === "coming-soon") {
      setFavorite(state.modalGame.id, true);
      showToast("Saved. We will keep this experience on your radar.");
      openGame(state.modalGame.id);
      return;
    }
    if (state.modalGame.status !== "ready") {
      showToast(`Add ${state.modalGame.file} to site/games/ to play it.`, "error");
      return;
    }
    enterExperience(state.modalGame);
  }

  function landscapeRequested(game) {
    return game?.orientation === "landscape";
  }

  function shouldShowOrientationPrompt() {
    if (!state.orientationGame || !landscapeRequested(state.orientationGame) || state.orientationLocked || state.orientationDismissed) return false;
    const narrow = window.matchMedia ? window.matchMedia("(max-width: 900px)").matches : window.innerWidth <= 900;
    const portrait = window.matchMedia ? window.matchMedia("(orientation: portrait)").matches : window.innerHeight > window.innerWidth;
    return narrow && portrait;
  }

  function refreshOrientationUi() {
    const overlay = document.getElementById("orientationOverlay");
    const exitButton = document.getElementById("orientationExit");
    const show = shouldShowOrientationPrompt();
    if (overlay) overlay.hidden = !show;
    if (exitButton) exitButton.hidden = !state.orientationLocked;
  }

  async function enterLandscape() {
    if (!state.orientationGame) return;
    let fullscreenStarted = false;
    try {
      if (!document.fullscreenElement && gameModal.requestFullscreen) {
        await gameModal.requestFullscreen();
        fullscreenStarted = true;
      }
    } catch { /* Some browsers only allow orientation lock from an installed PWA. */ }
    try {
      const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
      const lock = orientation?.lock || screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;
      if (typeof lock === "function") {
        await lock.call(orientation || screen, "landscape");
        state.orientationLocked = true;
        state.orientationDismissed = false;
        refreshOrientationUi();
        showToast("Landscape mode enabled.");
        return;
      }
    } catch { /* Fall through to the manual rotation prompt. */ }
    if (fullscreenStarted && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    state.orientationLocked = false;
    refreshOrientationUi();
    showToast("Rotate your device sideways to continue. This browser does not allow automatic locking.", "error");
  }

  function continueWithoutLandscape() {
    state.orientationDismissed = true;
    refreshOrientationUi();
    showToast("Continuing in the current orientation.");
  }

  function exitLandscape() {
    try {
      const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
      const unlock = orientation?.unlock || screen.unlockOrientation || screen.mozUnlockOrientation || screen.msUnlockOrientation;
      if (typeof unlock === "function") unlock.call(orientation || screen);
    } catch { /* Ignore unsupported orientation APIs. */ }
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    state.orientationLocked = false;
    state.orientationDismissed = false;
    refreshOrientationUi();
  }

  function enterExperience(game) {
    state.modalGame = game;
    state.playerMuted = false;
    state.playerMenuOpen = false;
    state.orientationGame = game;
    state.orientationLocked = false;
    state.orientationDismissed = false;
    gameModal.classList.add("experience-modal");
    const orientationPrompt = landscapeRequested(game) ? `<div class="orientation-overlay" id="orientationOverlay" hidden><div class="rotate-phone"><span class="rotate-phone-screen"></span></div><h3>Rotate your phone</h3><p>${escapeHtml(game.title)} is designed for landscape play.</p><div class="orientation-actions"><button class="button" data-action="enter-landscape">${icon("maximize")} Rotate to landscape</button><button class="button ghost" data-action="continue-portrait">Continue here</button></div></div>` : "";
    const landscapeMenuAction = landscapeRequested(game) ? `<button data-action="exit-landscape">${icon("minimize")}<span><strong>Exit landscape</strong><small>Unlock device orientation</small></span>${icon("chevron-right")}</button>` : "";
    gameModal.innerHTML = `<div class="experience-player"><div class="player-viewport"><iframe class="game-frame immersive-frame" id="gameFrame" title="${escapeHtml(game.title)}" allow="fullscreen; autoplay; gamepad" src="about:blank"></iframe><div class="player-loading" id="playerLoading"><div class="player-loader"><span></span><span></span><span></span></div><h3>Joining experience</h3><p>Loading ${escapeHtml(game.title)}...</p></div><button class="player-menu-button player-menu-overlay" data-action="open-player-menu" aria-label="Open experience menu"><span class="brand-mark" aria-hidden="true"><span></span></span></button>${orientationPrompt}<div class="player-menu-shade" id="playerMenuShade" data-action="close-player-menu" hidden></div><aside class="player-menu-sheet" id="playerMenuSheet" aria-hidden="true"><div class="player-menu-header"><div><span class="player-menu-kicker">EXPERIENCE MENU</span><h3>${escapeHtml(game.title)}</h3></div><button class="player-icon-button" data-action="close-player-menu" aria-label="Close experience menu">${icon("x")}</button></div><div class="player-menu-profile"><span class="avatar avatar-${safeClass(state.profile.avatar)}"><span class="avatar-initials">${initials(state.profile.displayName)}</span></span><div><strong>${escapeHtml(state.profile.displayName)}</strong><small>@${escapeHtml(state.profile.username)}</small></div><span class="player-online-pill"><i></i> In server</span></div><div class="player-menu-stats"><div><strong>1</strong><span>Players in server</span></div><div><strong>${state.friends.length}</strong><span>Friends connected</span></div><div><strong>Live</strong><span>Server status</span></div></div><div class="player-menu-actions"><button data-action="respawn-game">${icon("refresh")}<span><strong>Respawn</strong><small>Reload this experience</small></span>${icon("chevron-right")}</button><button data-action="toggle-mute">${icon("volume")}<span><strong>Sound</strong><small>Toggle experience audio</small></span>${icon("chevron-right")}</button><button data-action="toggle-player-fullscreen">${icon("maximize")}<span><strong>Fullscreen</strong><small>Use the full display</small></span>${icon("chevron-right")}</button>${landscapeMenuAction}<button class="leave-action" data-action="leave-game">${icon("log-out")}<span><strong>Leave game</strong><small>Return to the Playground dashboard</small></span>${icon("chevron-right")}</button></div></aside></div></div>`;
    openModal(gameModal);
    refreshOrientationUi();
    const frame = document.getElementById("gameFrame");
    const loading = document.getElementById("playerLoading");
    if (frame) {
      frame.addEventListener("load", () => {
        setExperienceMute(state.playerMuted);
        window.setTimeout(() => loading?.classList.add("loaded"), 280);
      }, { once: true });
      window.setTimeout(() => { frame.src = `/games/${encodeURIComponent(game.file)}`; }, state.motionReduced ? 0 : 360);
    }
    // The play click is the user gesture, so browsers that allow it can enter fullscreen immediately.
    if (gameModal.requestFullscreen && !document.fullscreenElement) {
      const fullscreenResult = gameModal.requestFullscreen();
      fullscreenResult?.catch?.(() => {});
    }
  }

  function goBackToDetails() {
    exitLandscape();
    if (state.modalGame) openGame(state.modalGame.id);
  }

  function setPlayerMenu(open) {
    state.playerMenuOpen = open;
    const sheet = document.getElementById("playerMenuSheet");
    const shade = document.getElementById("playerMenuShade");
    if (sheet) { sheet.classList.toggle("open", open); sheet.setAttribute("aria-hidden", String(!open)); }
    if (shade) shade.hidden = !open;
  }

  function respawnGame() {
    setPlayerMenu(false);
    const frame = document.getElementById("gameFrame");
    if (!frame) return;
    try { frame.contentWindow?.postMessage({ type: "playground-respawn" }, "*"); } catch { /* reload below is the reliable fallback */ }
    const current = frame.src;
    frame.src = "about:blank";
    window.setTimeout(() => { frame.src = current; }, state.motionReduced ? 0 : 160);
    showToast("Respawning experience...");
  }

  function setExperienceMute(muted) {
    const frame = document.getElementById("gameFrame");
    if (!frame) return;
    try {
      frame.contentDocument?.querySelectorAll("audio, video").forEach((media) => { media.muted = muted; });
    } catch { /* A future cross-origin addon can still receive the message below. */ }
    frame.contentWindow?.postMessage({ type: "playground-mute", muted }, "*");
  }

  function openModal(modal) {
    modalBackdrop.hidden = false;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const focusable = modal.querySelector("button, input, textarea, select, iframe");
    if (focusable) setTimeout(() => focusable.focus(), 0);
  }

  function closeModal() {
    if (state.pendingDialogResolve) {
      const resolver = state.pendingDialogResolve;
      state.pendingDialogResolve = null;
      resolver(null);
    }
    setPlayerMenu(false);
    exitLandscape();
    [gameModal, profileModal, feedbackModal, actionModal].forEach((modal) => { modal.hidden = true; modal.innerHTML = ""; modal.classList.remove("experience-modal"); });
    modalBackdrop.hidden = true;
    document.body.style.overflow = "";
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    if (state.modalPreviousFocus && document.contains(state.modalPreviousFocus)) state.modalPreviousFocus.focus();
    state.modalGame = null;
    state.orientationGame = null;
  }

  function openProfileEditor() {
    const p = state.profile;
    profileModal.innerHTML = `<div class="modal-header"><h2 id="profileModalTitle">Edit profile</h2><button class="modal-close" data-action="close-modal" aria-label="Close">${icon("x")}</button></div><div class="modal-body"><div class="profile-modal-head"><span class="avatar avatar-${safeClass(p.avatar)} avatar-lg"><span class="avatar-initials">${initials(p.displayName)}</span></span><div><h2>${escapeHtml(p.displayName)}</h2><p>Your profile is saved by the active account backend.</p></div></div><form id="profileForm"><div class="form-grid"><div class="form-field full"><label for="modalDisplayName">Display name</label><input id="modalDisplayName" name="displayName" maxlength="80" value="${escapeHtml(p.displayName)}" required></div><div class="form-field"><label for="modalUsername">Username</label><input id="modalUsername" name="username" maxlength="80" value="${escapeHtml(p.username)}" readonly></div><div class="form-field"><label>Avatar</label><input type="hidden" id="modalAvatar" name="avatar" value="${escapeHtml(avatarOption(p.avatar).id)}"><button type="button" class="custom-field-picker" data-action="profile-avatar"><span class="avatar avatar-${safeClass(p.avatar)} avatar-sm"><span class="avatar-symbol">${avatarOption(p.avatar).icon}</span><span class="avatar-initials">${initials(p.displayName)}</span></span><span><strong>${escapeHtml(avatarOption(p.avatar).name)}</strong><small>Choose from your collection</small></span>${icon("chevron-down")}</button></div><div class="form-field full"><label for="modalAbout">About</label><textarea id="modalAbout" name="about" maxlength="240">${escapeHtml(p.about || "")}</textarea></div></div><div class="form-footer"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button class="button" type="submit">Save changes ${icon("check")}</button></div></form></div>`;
    openModal(profileModal);
  }

  function openFeedback() {
    feedbackModal.innerHTML = `<div class="modal-header"><h2 id="feedbackModalTitle">Send feedback</h2><button class="modal-close" data-action="close-modal" aria-label="Close">${icon("x")}</button></div><div class="modal-body"><p class="muted" style="margin-top:0">This sends a note to the local Python server. It is stored in site/data/feedback.jsonl.</p><form id="feedbackForm"><div class="form-field"><label for="feedbackMessage">Message</label><textarea id="feedbackMessage" maxlength="1000" required placeholder="Tell us what you would improve..."></textarea></div><div class="form-footer"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button class="button" type="submit">Send feedback ${icon("check")}</button></div></form></div>`;
    openModal(feedbackModal);
  }

  function openActionModal(title, body, className = "") {
    state.actionModalPreviousFocus = document.activeElement;
    actionModal.className = `modal small-modal ${className}`;
    actionModal.innerHTML = `<div class="modal-header"><h2 id="actionModalTitle">${escapeHtml(title)}</h2><button class="modal-close" data-action="close-modal" aria-label="Close">${icon("x")}</button></div><div class="modal-body">${body}</div>`;
    openModal(actionModal);
  }


  function resolveDialog(value) {
    const resolver = state.pendingDialogResolve;
    state.pendingDialogResolve = null;
    closeModal();
    resolver?.(value);
  }

  function showSelect(title, options, selected = "") {
    return new Promise((resolve) => {
      state.pendingDialogResolve = resolve;
      openActionModal(title, `<div class="custom-select-list" role="listbox" aria-label="${escapeHtml(title)}">${options.map((option) => `<button class="custom-select-option ${option.value === selected ? "active" : ""}" data-action="select-option" data-select-value="${escapeHtml(option.value)}"><span>${escapeHtml(option.label)}</span>${option.description ? `<small>${escapeHtml(option.description)}</small>` : ""}${option.value === selected ? icon("check") : icon("chevron-right")}</button>`).join("")}</div><div class="form-footer"><button class="button secondary" data-action="close-modal">Cancel</button></div>`);
    });
  }

  function showConfirm(title, message, confirmLabel = "Continue") {
    return new Promise((resolve) => {
      state.pendingDialogResolve = resolve;
      openActionModal(title, `<p class="dialog-message">${message}</p><div class="form-footer"><button class="button secondary" data-action="dialog-cancel">Cancel</button><button class="button" data-action="dialog-confirm">${escapeHtml(confirmLabel)}</button></div>`);
    });
  }

  function showPrompt(title, label, placeholder = "") {
    return new Promise((resolve) => {
      state.pendingDialogResolve = resolve;
      openActionModal(title, `<form id="customPromptForm"><div class="form-field"><label for="customPromptInput">${escapeHtml(label)}</label><input id="customPromptInput" name="value" maxlength="120" placeholder="${escapeHtml(placeholder)}" required></div><div class="form-footer"><button type="button" class="button secondary" data-action="dialog-cancel">Cancel</button><button class="button" type="submit">Continue</button></div></form>`);
      window.setTimeout(() => document.getElementById("customPromptInput")?.focus(), 0);
    });
  }

  function openNotifications() {
    const requests = state.incomingRequests;
    const messages = state.conversations.filter((conversation) => conversation.lastAt && !state.readMessages.includes(conversation.id));
    const body = `<div class="notification-list">${requests.length ? requests.map((request) => `<div class="notification-row actionable"><span class="avatar avatar-${safeClass(request.fromAvatar || request.avatar)}"><span class="avatar-initials">${initials(request.fromDisplayName || request.displayName || request.fromUsername)}</span></span><div><strong>${escapeHtml(request.fromDisplayName || request.displayName || request.fromUsername)} sent you a friend request</strong><p>@${escapeHtml(request.fromUsername || request.username || "player")} wants to connect with you.</p><small>Waiting for your response</small></div><button class="button" data-action="accept-friend-request" data-request-uid="${escapeHtml(request.fromUid || request.uid)}">Accept</button></div>`).join("") : ""}${messages.length ? messages.map((conversation) => `<button class="notification-row" data-action="open-conversation" data-conversation-id="${escapeHtml(conversation.id)}"><span class="notification-icon">${icon("message")}</span><div><strong>New message from ${escapeHtml(conversation.otherDisplayName || conversation.otherUsername)}</strong><p>${escapeHtml(conversation.lastMessage || "Open your chat to read it.")}</p><small>${formatMessageTime(conversation.lastAt)}</small></div>${icon("chevron-right")}</button>`).join("") : ""}${!requests.length && !messages.length ? `<div class="empty-card notification-empty">${icon("bell")}<div><strong>You are all caught up</strong><p>New friend requests and messages will appear here.</p></div></div>` : ""}</div><div class="form-footer"><button class="button secondary" data-action="close-modal">Done</button><button class="button" data-action="mark-notifications-read">${icon("check")} Mark all read</button></div>`;
    openActionModal("Notifications", body);
  }

  function openFriendPicker() {
    const suggestions = state.people.filter((person) => !state.pendingFriends.some((pending) => pending.username === person.username));
    openActionModal("Add friends", `<p class="muted" style="margin-top:0">Choose another registered account to send a friend request to.</p><div class="suggestion-list">${suggestions.length ? suggestions.map((person) => `<div class="suggestion-row"><span class="avatar avatar-${safeClass(person.avatar)}"><span class="avatar-initials">${initials(person.displayName || person.username)}</span></span><div><strong>${escapeHtml(person.displayName)}</strong><small>@${escapeHtml(person.username)}</small></div><button class="button secondary" data-action="send-friend-request" data-friend-id="${escapeHtml(person.username)}">Add</button></div>`).join("") : `<div class="empty-card">${icon("users")}<div><strong>No other accounts yet</strong><p>Invite someone to register, then they will appear here.</p></div></div>`}</div>`);
  }

  async function openCompose() {
    if (!state.people.length) {
      openActionModal("New message", `<div class="empty-card">${icon("users")}<div><strong>No recipients yet</strong><p>Another registered account will appear here when it is available.</p></div></div><div class="form-footer"><button class="button" data-action="close-modal">Done</button></div>`);
      return;
    }
    const options = state.people.map((person) => ({ value: person.uid, label: `${person.displayName} (@${person.username})`, description: state.friends.some((friend) => friend.uid === person.uid) ? "Friend" : "Playground member" }));
    const targetUid = await showSelect("Choose a player", options, "");
    if (targetUid) openComposeForRecipient(targetUid);
  }

  function openComposeForRecipient(targetUid) {
    const target = state.people.find((person) => person.uid === targetUid) || state.friends.find((person) => person.uid === targetUid);
    if (!target) return;
    openActionModal(`Message ${target.displayName}`, `<form id="composeForm" data-recipient-uid="${escapeHtml(targetUid)}"><div class="compose-recipient"><span class="avatar avatar-${safeClass(target.avatar)}"><span class="avatar-initials">${initials(target.displayName)}</span></span><div><strong>${escapeHtml(target.displayName)}</strong><small>@${escapeHtml(target.username)}</small></div></div><div class="form-field" style="margin-top:14px"><label for="composeBody">Message</label><textarea id="composeBody" name="body" maxlength="1000" required placeholder="Write something friendly..."></textarea></div><div class="form-footer"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button class="button" type="submit">${icon("send")} Send</button></div></form>`);
  }

  function closeProfileMenu() {
    const menu = document.getElementById("profileMenu");
    const trigger = document.getElementById("profileTrigger");
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function showToast(message, type = "success") {
    const stack = document.getElementById("toastStack");
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.innerHTML = `${icon(type === "error" ? "help-circle" : "check")}<span>${escapeHtml(message)}</span>`;
    stack.appendChild(toast);
    setTimeout(() => { toast.classList.add("hide"); setTimeout(() => toast.remove(), 220); }, 3600);
  }

  function setFavorite(gameId, active) {
    state.favorites = active ? [...new Set([...state.favorites, gameId])] : state.favorites.filter((id) => id !== gameId);
    persistArray("playground-favorites", state.favorites);
  }

  function updateAvatar(color) {
    state.profile.avatar = avatarOption(color).id;
    syncProfileUi();
    if (state.route === "avatar") render();
    saveProfileData({ avatar: state.profile.avatar }, false);
  }

  async function saveProfileData(data, closeAfter = true) {
    try {
      const updated = state.backendMode === "firebase" ? await writeFirebaseProfile(data) : await getJSON("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      state.profile = { ...state.profile, ...updated };
      if (closeAfter) closeModal();
      syncProfileUi();
      render();
      if (closeAfter) showToast("Profile changes saved.");
    } catch (error) {
      if (error?.payload?.authenticated === false) {
        await logout();
        return;
      }
      state.profile = { ...state.profile, ...data };
      if (closeAfter) closeModal();
      render();
      showToast(closeAfter ? "Saved for this session. Start run.py to persist it." : "Look updated for this session.");
    }
  }

  async function saveProfile(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    if (!String(data.displayName || "").trim() || !String(data.username || "").trim()) {
      showToast("Display name and username are required.", "error");
      return;
    }
    await saveProfileData(data, true);
  }

  async function purchaseItem(itemId) {
    const item = MARKET_ITEMS.find((entry) => entry.id === itemId);
    if (!item || state.purchasedItems.includes(itemId)) return;
    if (state.balance < item.price) {
      showToast("You need more credits for this item.", "error");
      return;
    }
    const confirmed = await showConfirm(`Buy ${item.name}?`, `This item costs <strong><span class="coin-icon">R</span> ${item.price} credits</strong>. Your remaining balance will be ${(state.balance - item.price).toLocaleString()} credits.`, "Buy item");
    if (!confirmed) return;
    state.balance -= item.price;
    state.purchasedItems = [...state.purchasedItems, itemId];
    persistBalance();
    persistArray("playground-purchased", state.purchasedItems);
    render();
    showToast(`${item.name} added to your inventory.`);
  }

  function equipItem(itemId) {
    const item = [...MARKET_ITEMS, ...BASE_INVENTORY].find((entry) => entry.id === itemId);
    if (!item) return;
    const already = state.equippedItems.includes(itemId);
    state.equippedItems = already ? state.equippedItems.filter((id) => id !== itemId) : [...state.equippedItems.filter((id) => id !== itemId), itemId];
    persistArray("playground-equipped", state.equippedItems);
    render();
    showToast(already ? `${item.name} unequipped.` : `${item.name} equipped.`);
  }

  async function sendFriendRequest(username) {
    try {
      if (state.backendMode === "firebase") await sendFirebaseFriendRequest(username);
      else await getJSON("/api/friends/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) });
      if (!state.friendRequests.includes(username)) state.friendRequests.push(username);
      persistArray("playground-friend-requests", state.friendRequests);
      state.pendingFriends = [...state.pendingFriends, state.people.find((person) => person.username === username)].filter(Boolean);
      render();
      closeModal();
      showToast("Friend request sent.");
    } catch (error) {
      showToast(error?.payload?.error || "Could not send the friend request.", "error");
    }
  }


  async function acceptFriendRequest(request) {
    try {
      if (state.backendMode === "firebase") await acceptFirebaseFriendRequest(request);
      else await getJSON("/api/friends/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: request.username || request.fromUsername }) });
      await loadSocial();
      render();
      showToast(`${request.fromDisplayName || request.displayName || request.fromUsername || request.username} is now your friend.`);
    } catch (error) { showToast(error?.payload?.error || "Could not accept that request.", "error"); }
  }

  async function declineFriendRequest(request) {
    try {
      if (state.backendMode === "firebase") await declineFirebaseFriendRequest(request);
      else await getJSON("/api/friends/decline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: request.username || request.fromUsername }) });
      await loadSocial();
      render();
      showToast("Friend request declined.");
    } catch (error) { showToast(error?.payload?.error || "Could not decline that request.", "error"); }
  }

  async function openConversation(id) {
    state.activeConversation = id;
    if (!state.readMessages.includes(id)) { state.readMessages.push(id); persistArray("playground-read-messages", state.readMessages); }
    try {
      if (state.backendMode === "firebase") await loadFirebaseConversation();
      else state.chatMessages = state.conversations.find((conversation) => conversation.id === id)?.messages || [];
    } catch { state.chatMessages = []; }
    navigate("messages");
  }

  async function sendMessage(targetUid, text) {
    const clean = String(text || "").trim();
    if (!clean) return;
    try {
      if (state.backendMode === "firebase") await sendFirebaseMessage(targetUid, clean);
      else {
        await getJSON("/api/messages/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: state.people.find((person) => person.uid === targetUid || person.username === targetUid)?.username || targetUid, message: clean }) });
        const messageData = await getJSON("/api/messages");
        state.conversations = Array.isArray(messageData.conversations) ? messageData.conversations : [];
        state.activeConversation = messageData.activeConversation || state.activeConversation;
        state.chatMessages = state.conversations.find((conversation) => conversation.id === state.activeConversation)?.messages || [];
      }
      render();
      window.setTimeout(() => { const chat = document.getElementById("chatMessages"); if (chat) chat.scrollTop = chat.scrollHeight; }, 0);
    } catch (error) { showToast(error?.payload?.error || "Message could not be sent.", "error"); }
  }

  function renderActionResult(message) { showToast(message); }

  function bindViewEvents() {
    const settingsForm = document.getElementById("settingsForm");
    if (settingsForm) settingsForm.addEventListener("submit", (event) => { event.preventDefault(); saveProfile(settingsForm); });
  }

  document.addEventListener("click", (event) => {
    const routeTarget = event.target.closest("[data-route]");
    if (routeTarget) { event.preventDefault(); navigate(routeTarget.dataset.route); return; }
    const gameTarget = event.target.closest("[data-game-id]");
    if (gameTarget) { openGame(gameTarget.dataset.gameId); return; }
    const filterTarget = event.target.closest("[data-filter]");
    if (filterTarget) { state.filter = filterTarget.dataset.filter; render(); return; }
    const profileTab = event.target.closest("[data-profile-tab]");
    if (profileTab) { state.profileTab = profileTab.dataset.profileTab; render(); return; }
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (action === "select-option") { resolveDialog(actionTarget.dataset.selectValue); return; }
    if (action === "dialog-confirm") { resolveDialog(true); return; }
    if (action === "dialog-cancel") { resolveDialog(false); return; }
    if (action === "close-modal") closeModal();
    if (action === "launch-game") launchGame();
    if (action === "open-player-menu") setPlayerMenu(true);
    if (action === "close-player-menu") setPlayerMenu(false);
    if (action === "respawn-game") respawnGame();
    if (action === "player-settings") { setPlayerMenu(false); showToast("Experience settings are using your dashboard preferences."); }
    if (action === "leave-game") closeModal();
    if (action === "enter-landscape") enterLandscape();
    if (action === "continue-portrait") continueWithoutLandscape();
    if (action === "exit-landscape") { setPlayerMenu(false); exitLandscape(); }
    if (action === "back-to-details") goBackToDetails();
    if (action === "toggle-player-fullscreen") {
      setPlayerMenu(false);
      if (document.fullscreenElement) document.exitFullscreen?.(); else {
        const fullscreenResult = gameModal.requestFullscreen?.();
        fullscreenResult?.catch?.(() => showToast("Full screen is unavailable here.", "error"));
      }
    }
    if (action === "toggle-mute") {
      state.playerMuted = !state.playerMuted;
      setExperienceMute(state.playerMuted);
      const soundIcon = actionTarget.querySelector("svg");
      if (soundIcon) soundIcon.outerHTML = icon(state.playerMuted ? "volume-off" : "volume"); else actionTarget.innerHTML = icon(state.playerMuted ? "volume-off" : "volume");
      setPlayerMenu(false);
      showToast(state.playerMuted ? "Experience sound muted." : "Experience sound on.");
    }
    if (action === "toggle-password") {
      const input = actionTarget.closest(".password-wrap")?.querySelector("input");
      if (input) { input.type = input.type === "password" ? "text" : "password"; const visible = input.type === "text"; actionTarget.setAttribute("aria-label", visible ? "Hide password" : "Show password"); actionTarget.innerHTML = icon(visible ? "eye-off" : "eye"); }
    }
    if (action === "edit-profile") openProfileEditor();
    if (action === "settings-avatar" || action === "profile-avatar") {
      showSelect("Choose an avatar", AVATAR_OPTIONS.filter((option) => avatarOwned(option.id)).map((option) => ({ value: option.id, label: option.name, description: option.price === 0 ? "Free avatar" : "Unlocked avatar" })), state.profile.avatar).then((value) => {
        if (!value) return;
        const input = document.getElementById(action === "settings-avatar" ? "settingsAvatarValue" : "modalAvatar");
        const button = actionTarget;
        const option = avatarOption(value);
        if (input) input.value = value;
        if (button) button.innerHTML = `<span class="avatar avatar-${option.id} avatar-sm"><span class="avatar-symbol">${option.icon}</span><span class="avatar-initials">${initials(state.profile.displayName)}</span></span><span><strong>${escapeHtml(option.name)}</strong><small>Choose from your collection</small></span>${icon("chevron-down")}`;
      });
    }
    if (action === "feedback") openFeedback();
    if (action === "refresh-games") { loadData().then(() => showToast("Game folder refreshed.")); }
    if (action === "sort-games") {
      showSelect("Sort experiences", [{ value: "featured", label: "Featured", description: "Recommended order" }, { value: "az", label: "Name A–Z", description: "Alphabetical" }, { value: "ready", label: "Ready to play", description: "Playable experiences first" }], "featured").then((value) => { if (value === "az") state.games.sort((a, b) => a.title.localeCompare(b.title)); if (value === "ready") state.games.sort((a, b) => Number(b.status === "ready") - Number(a.status === "ready")); if (value) render(); });
    }
    if (action === "clear-search") { state.search = ""; searchInput.value = ""; render(); }
    if (action === "favorite-game" && state.modalGame) {
      const active = !state.favorites.includes(state.modalGame.id);
      setFavorite(state.modalGame.id, active);
      showToast(active ? "Saved to favorites." : "Removed from favorites.");
      openGame(state.modalGame.id);
    }
    if (action === "share-profile") {
      const url = window.location.href.split("#")[0] + "#profile";
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(() => showToast("Profile link copied."), () => showToast(`Profile link: ${url}`));
      else showToast(`Profile link: ${url}`);
    }
    if (action === "add-friend") openFriendPicker();
    if (action === "send-friend-request") sendFriendRequest(actionTarget.dataset.friendId);
    if (action === "friend-action") {
      const username = actionTarget.dataset.friendId;
      if (username && !state.friends.some((friend) => friend.username === username)) sendFriendRequest(username);
      else { const friend = state.friends.find((entry) => entry.username === username); state.activeConversation = state.conversations.find((conversation) => conversation.otherUid === friend?.uid)?.id || null; navigate("messages"); }
    }
    if (action === "accept-friend-request") acceptFriendRequest(state.incomingRequests.find((request) => String(request.fromUid || request.uid) === String(actionTarget.dataset.requestUid)) || {});
    if (action === "decline-friend-request") declineFriendRequest(state.incomingRequests.find((request) => String(request.fromUid || request.uid) === String(actionTarget.dataset.requestUid)) || {});
    if (action === "open-conversation") openConversation(actionTarget.dataset.conversationId);
    if (action === "chat-info") showToast("Chat details are limited to the people in this conversation.");
    if (action === "compose-message") openCompose();
    if (action === "open-message") {
      const messageId = actionTarget.dataset.messageId;
      state.activeConversation = messageId;
      if (!state.readMessages.includes(messageId)) state.readMessages.push(messageId);
      persistArray("playground-read-messages", state.readMessages);
      render();
    }
    if (action === "reply-message") openCompose();
    if (action === "mark-unread") {
      state.readMessages = state.readMessages.filter((id) => id !== actionTarget.dataset.messageId);
      persistArray("playground-read-messages", state.readMessages);
      render();
    }
    if (action === "purchase-item") purchaseItem(actionTarget.dataset.itemId);
    if (action === "equip-item") equipItem(actionTarget.dataset.itemId);
    if (action === "choose-avatar") chooseAvatar(actionTarget.dataset.avatarColor);
    if (action === "purchase-avatar") purchaseAvatar(actionTarget.dataset.avatarId);
    if (action === "save-avatar") saveProfileData({ avatar: state.profile.avatar }, true);
    if (action === "market-search") showPrompt("Search catalog", "What are you looking for?", "Try visor, boots, or crown").then((query) => { if (query) showToast(`Catalog search for “${query}” is ready.`); });
    if (action === "earn-credits") showToast("Complete community events and creator challenges to earn more credits.");
    if (action === "toggle-community") {
      const id = actionTarget.dataset.communityId;
      state.joinedCommunities = state.joinedCommunities.includes(id) ? state.joinedCommunities.filter((item) => item !== id) : [...state.joinedCommunities, id];
      persistArray("playground-communities", state.joinedCommunities);
      render();
      showToast(state.joinedCommunities.includes(id) ? "Community joined." : "Community left.");
    }
    if (action === "community-search") showToast("Community search is ready — featured communities are shown below.");
    if (action === "toggle-rsvp") {
      const id = actionTarget.dataset.eventId;
      state.rsvps = state.rsvps.includes(id) ? state.rsvps.filter((item) => item !== id) : [...state.rsvps, id];
      persistArray("playground-rsvps", state.rsvps);
      render();
      showToast(state.rsvps.includes(id) ? "RSVP saved to your events." : "RSVP removed.");
    }
    if (action === "calendar-reminder") showToast(state.rsvps.length ? `${state.rsvps.length} event reminder${state.rsvps.length === 1 ? "" : "s"} saved.` : "RSVP to an event to create a reminder.");
    if (action === "toggle-faq") {
      const item = actionTarget.closest(".faq-item");
      const index = Number(actionTarget.dataset.faqIndex);
      const opening = state.faqOpen !== index;
      document.querySelectorAll(".faq-item.open").forEach((openItem) => openItem.classList.remove("open"));
      if (opening) item?.classList.add("open");
      state.faqOpen = opening ? index : null;
    }
    if (action === "open-addon-help") openActionModal("info.json format", `<p class="muted" style="margin-top:0">Add a new object to <code>site/games/info.json</code>. The HTML file can be added now or later.</p><pre class="code-block">{\n  "id": "my-game",\n  "title": "My Game",\n  "file": "my-game.html",\n  "image": "my-game.svg",\n  "category": "Casual",\n  "accent": "blue",\n  "description": "A short description.",\n  "players": "1 player",\n  "orientation": "landscape",\n  "status": "coming-soon"\n}</pre><div class="form-footer"><button class="button" data-action="close-modal">Got it</button></div>`);
    if (action === "reset-settings") { render(); showToast("Settings reset."); }
    if (action === "mark-notifications-read") { state.readMessages = [...new Set([...state.readMessages, ...state.conversations.map((conversation) => conversation.id)])]; persistArray("playground-read-messages", state.readMessages); closeModal(); showToast("Notifications marked as read."); }
    if (action === "menu-logout") logout();
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id === "profileForm") { event.preventDefault(); saveProfile(event.target); }
    if (event.target.id === "feedbackForm") {
      event.preventDefault();
      const message = event.target.querySelector("textarea").value.trim();
      const saveFeedback = state.backendMode === "firebase" ? firebaseApi.push(firebaseRef(`feedback/${firebaseUid()}`), { message, at: Date.now() }) : getJSON("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      Promise.resolve(saveFeedback).then(() => { closeModal(); showToast("Thanks — feedback saved."); }).catch(() => { closeModal(); showToast("Feedback could not be saved right now.", "error"); });
    }
    if (event.target.id === "customPromptForm") {
      event.preventDefault();
      resolveDialog(String(new FormData(event.target).get("value") || "").trim());
    }
    if (event.target.id === "chatForm") {
      event.preventDefault();
      const form = event.target;
      const input = form.elements.body;
      const text = input.value;
      input.value = "";
      sendMessage(form.dataset.recipientUid, text);
    }
    if (event.target.id === "composeForm") {
      event.preventDefault();
      const form = event.target;
      const body = String(new FormData(form).get("body") || "").trim();
      closeModal();
      sendMessage(form.dataset.recipientUid, body);
    }
  });

  document.getElementById("profileTrigger").addEventListener("click", (event) => {
    event.stopPropagation();
    const menu = document.getElementById("profileMenu");
    const open = menu.hidden;
    menu.hidden = !open;
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (event) => { if (!event.target.closest(".top-actions")) closeProfileMenu(); });
  document.getElementById("notificationsBtn").addEventListener("click", openNotifications);
  document.getElementById("messagesBtn").addEventListener("click", () => navigate("messages"));
  document.getElementById("mobileMenu").addEventListener("click", (event) => {
    const open = sidebar.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });
  document.getElementById("menuLogout").addEventListener("click", logout);
  if (authHeaderButton) authHeaderButton.addEventListener("click", () => { if (state.authenticated) logout(); else { state.authMode = "login"; renderAuth(); } });
  modalBackdrop.addEventListener("click", closeModal);
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value;
    if (state.route !== "discover") window.location.hash = "discover";
    else render();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== searchInput && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) { event.preventDefault(); searchInput.focus(); }
    if (event.key === "Escape") { if (state.playerMenuOpen) setPlayerMenu(false); else if (!gameModal.hidden || !profileModal.hidden || !feedbackModal.hidden || !actionModal.hidden) closeModal(); else closeProfileMenu(); }
    if ((event.key === "Enter" || event.key === " ") && event.target.matches(".game-card, .feature-game")) { event.preventDefault(); openGame(event.target.dataset.gameId); }
  });
  window.addEventListener("hashchange", () => { state.route = getRoute(); render(); scrollToTop(); });
  window.addEventListener("orientationchange", refreshOrientationUi);
  window.addEventListener("resize", refreshOrientationUi);
  window.addEventListener("error",  () => showToast("A UI error was caught. You can keep using the app or refresh this page.", "error"));
  window.addEventListener("unhandledrejection", () => showToast("A network action did not finish. Please try again.", "error"));

  searchInput.value = state.search;
  boot();
})();

