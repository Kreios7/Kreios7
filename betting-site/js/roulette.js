const Roulette = (() => {
  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const color = n => n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black';
  // key -> { label, payout (to 1), test(n) }
  const OUTSIDE = {
    low:   { label: '1–18', pay: 1, test: n => n >= 1 && n <= 18 },
    even:  { label: 'Even', pay: 1, test: n => n !== 0 && n % 2 === 0 },
    red:   { label: 'Red', pay: 1, test: n => REDS.has(n) },
    black: { label: 'Black', pay: 1, test: n => n !== 0 && !REDS.has(n) },
    odd:   { label: 'Odd', pay: 1, test: n => n % 2 === 1 },
    high:  { label: '19–36', pay: 1, test: n => n >= 19 },
    d1:    { label: '1st 12', pay: 2, test: n => n >= 1 && n <= 12 },
    d2:    { label: '2nd 12', pay: 2, test: n => n >= 13 && n <= 24 },
    d3:    { label: '3rd 12', pay: 2, test: n => n >= 25 },
    c1:    { label: 'Col 1', pay: 2, test: n => n !== 0 && n % 3 === 1 },
    c2:    { label: 'Col 2', pay: 2, test: n => n !== 0 && n % 3 === 2 },
    c3:    { label: 'Col 3', pay: 2, test: n => n !== 0 && n % 3 === 0 },
  };
  let bets = {}; // key -> amount
  let spinning = false;
  const $ = id => document.getElementById(id);

  function betInfo(key) {
    if (key.startsWith('n')) { const num = +key.slice(1); return { label: String(num), pay: 35, test: n => n === num }; }
    return OUTSIDE[key];
  }

  function build() {
    const board = $('rl-board');
    const zero = cell('n0', '0', 'green');
    board.appendChild(zero);
    // rows top->bottom: 3,6,9..36 / 2,5..35 / 1,4..34
    for (let row = 3; row >= 1; row--) {
      for (let col = 0; col < 12; col++) {
        const n = col * 3 + row;
        const c = cell('n' + n, n, color(n));
        c.style.gridRow = 4 - row; c.style.gridColumn = col + 2;
        board.appendChild(c);
      }
    }
    const out = $('rl-outside');
    for (const k of Object.keys(OUTSIDE)) {
      const c = cell(k, OUTSIDE[k].label, '');
      if (k === 'red') c.style.background = '#b91c1c';
      if (k === 'black') c.style.background = '#1f1f1f';
      out.appendChild(c);
    }
  }
  function cell(key, label, cls) {
    const d = document.createElement('div');
    d.className = 'rl-cell ' + cls;
    d.dataset.key = key;
    d.textContent = label;
    d.addEventListener('click', () => place(key));
    d.addEventListener('contextmenu', e => { e.preventDefault(); remove(key); });
    return d;
  }
  function total() { return Object.values(bets).reduce((a, b) => a + b, 0); }
  function place(key) {
    if (spinning) return;
    const chip = Math.floor($('rl-chip').value);
    if (!(chip > 0)) return UI.toast('Enter a valid chip size');
    if (total() + chip > Wallet.balance) return UI.toast('Not enough balance for that chip');
    bets[key] = (bets[key] || 0) + chip;
    renderChips();
  }
  function remove(key) { if (spinning) return; delete bets[key]; renderChips(); }
  function renderChips() {
    document.querySelectorAll('.rl-cell').forEach(c => {
      c.querySelector('.chip')?.remove();
      const amt = bets[c.dataset.key];
      if (amt) { const s = document.createElement('span'); s.className = 'chip'; s.textContent = amt; c.appendChild(s); }
    });
    $('rl-total').textContent = UI.fmt(total());
  }

  function spin() {
    if (spinning) return;
    const t = total();
    if (!t) return UI.toast('Place a bet on the board first');
    if (!Wallet.stake(t)) return;
    spinning = true;
    document.querySelectorAll('.rl-cell.hit').forEach(c => c.classList.remove('hit'));
    UI.result('rl-result', '');
    const wheel = $('wheel'), num = $('wheel-num');
    wheel.classList.add('spinning');
    const iv = setInterval(() => { num.textContent = UI.rand(37); }, 60);
    const n = UI.rand(37);
    setTimeout(() => {
      clearInterval(iv);
      wheel.classList.remove('spinning');
      num.textContent = n;
      num.style.color = color(n) === 'red' ? '#ef4444' : color(n) === 'green' ? '#22c55e' : '#e6edf3';
      let ret = 0;
      const winners = [];
      for (const [k, amt] of Object.entries(bets)) {
        const b = betInfo(k);
        if (b.test(n)) { ret += amt * (b.pay + 1); winners.push(b.label); }
      }
      document.querySelector(`.rl-cell[data-key="n${n}"]`)?.classList.add('hit');
      if (ret) Wallet.credit(ret);
      const msg = `${n} ${color(n).toUpperCase()}` + (ret ? ` — winners: ${winners.join(', ')}. Return ${UI.fmt(ret)}` : ' — no winning bets');
      UI.result('rl-result', msg, ret > t ? 'win' : ret ? '' : 'lose');
      Wallet.record('Roulette', `${n} ${color(n)} · ${Object.keys(bets).length} bets`, t, ret);
      spinning = false;
    }, 2200);
  }

  function init() {
    build();
    $('rl-spin').addEventListener('click', spin);
    $('rl-clear').addEventListener('click', () => { if (!spinning) { bets = {}; renderChips(); } });
  }
  return { init };
})();
