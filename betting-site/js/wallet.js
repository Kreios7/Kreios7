// Play-money wallet + bet history, persisted in localStorage.
const Wallet = (() => {
  const KEY = 'kreiosbet:v1';
  const START = 1000;
  let state = load();

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s.balance === 'number') return s;
    } catch (e) { /* storage unavailable */ }
    return { balance: START, history: [], openBets: [] };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  const listeners = [];
  function emit(dir) { save(); listeners.forEach(fn => fn(state.balance, dir)); }

  return {
    get balance() { return state.balance; },
    get history() { return state.history; },
    get openBets() { return state.openBets; },
    onChange(fn) { listeners.push(fn); },

    // Deduct a stake. Returns false if insufficient funds / invalid.
    stake(amount) {
      amount = Math.floor(Number(amount));
      if (!(amount > 0)) { UI.toast('Enter a valid stake'); return false; }
      if (amount > state.balance) { UI.toast('Insufficient balance — grab free credits'); return false; }
      state.balance -= amount;
      emit('down');
      return true;
    },
    credit(amount) {
      amount = Math.round(amount * 100) / 100;
      if (amount <= 0) return;
      state.balance = Math.round((state.balance + amount) * 100) / 100;
      emit('up');
    },
    record(game, details, stake, ret) {
      state.history.unshift({ t: Date.now(), game, details, stake, ret });
      state.history = state.history.slice(0, 300);
      save();
    },
    saveOpenBets() { save(); },
    topUp() {
      if (state.balance >= 500) { UI.toast('Free credits are available when balance is under 500'); return; }
      state.balance += 1000; emit('up'); UI.toast('+1,000 free credits');
    },
    reset() { state = { balance: START, history: [], openBets: [] }; emit(); },
  };
})();

const UI = {
  fmt(n) { return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }); },
  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(UI._t);
    UI._t = setTimeout(() => el.classList.remove('show'), 2200);
  },
  result(id, text, cls) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = 'result' + (cls ? ' ' + cls : '');
  },
  rand(n) { // crypto-backed integer in [0, n)
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  },
  randFloat() { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; },
};
