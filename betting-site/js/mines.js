const Mines = (() => {
  const $ = id => document.getElementById(id);
  const N = 25, EDGE = 0.99;
  let mines = new Set(), revealed = new Set(), count = 3, stake = 0, active = false;

  const multFor = k => { // multiplier after k safe reveals
    let m = EDGE;
    for (let i = 0; i < k; i++) m *= (N - i) / (N - count - i);
    return Math.floor(m * 100) / 100;
  };

  function build() {
    const g = $('mines-grid');
    g.innerHTML = '';
    for (let i = 0; i < N; i++) {
      const b = document.createElement('button');
      b.className = 'mtile'; b.dataset.i = i; b.disabled = true;
      b.setAttribute('aria-label', 'Tile ' + (i + 1));
      g.appendChild(b);
    }
  }

  function updateStats() {
    const k = revealed.size;
    $('mines-mult').textContent = (k ? multFor(k) : 1).toFixed(2) + '×';
    $('mines-next').textContent = active && k < N - count ? multFor(k + 1).toFixed(2) + '×' : '—';
    $('mines-value').textContent = active && k ? UI.fmt(Math.floor(stake * multFor(k) * 100) / 100) : '—';
    $('mines-cashout').disabled = !active || !k;
  }

  function start() {
    const c = Math.floor($('mines-count').value);
    if (!(c >= 1 && c <= 24)) return UI.toast('Choose between 1 and 24 mines');
    const b = $('mines-bet').value;
    if (!Wallet.stake(b)) return;
    stake = Math.floor(b); count = c; active = true;
    mines = new Set(); revealed = new Set();
    while (mines.size < count) mines.add(UI.rand(N));
    build();
    document.querySelectorAll('.mtile').forEach(t => { t.disabled = false; });
    $('mines-start').disabled = true;
    UI.result('mines-result', '');
    updateStats();
  }

  function pick(i) {
    if (!active || revealed.has(i)) return;
    const tile = document.querySelector(`.mtile[data-i="${i}"]`);
    if (mines.has(i)) {
      tile.classList.add('boom'); tile.textContent = '💣';
      end(false);
      return;
    }
    revealed.add(i);
    tile.classList.add('gem'); tile.textContent = '💎'; tile.disabled = true;
    if (revealed.size === N - count) return cashOut(); // all gems found
    updateStats();
  }

  function cashOut() {
    if (!active || !revealed.size) return;
    end(true);
  }

  function end(won) {
    active = false;
    const k = revealed.size;
    const ret = won ? Math.floor(stake * multFor(k) * 100) / 100 : 0;
    if (ret) Wallet.credit(ret);
    document.querySelectorAll('.mtile').forEach(t => {
      const i = +t.dataset.i;
      t.disabled = true;
      if (!revealed.has(i)) {
        if (mines.has(i) && !t.classList.contains('boom')) { t.textContent = '💣'; t.classList.add('dim'); }
        else if (!mines.has(i)) { t.textContent = '💎'; t.classList.add('dim'); }
      }
    });
    $('mines-start').disabled = false;
    UI.result('mines-result', won
      ? `Cashed out at ${multFor(k).toFixed(2)}× — +${UI.fmt(ret - stake)}`
      : `Boom! Mine after ${k} gem${k === 1 ? '' : 's'} — lost ${UI.fmt(stake)}`, won ? 'win' : 'lose');
    Wallet.record('Mines', `${count} mines · ${k} gems${won ? ` · ${multFor(k).toFixed(2)}×` : ' · hit mine'}`, stake, ret);
    updateStats();
  }

  function init() {
    build(); updateStats();
    $('mines-start').addEventListener('click', start);
    $('mines-cashout').addEventListener('click', cashOut);
    $('mines-grid').addEventListener('click', e => { const t = e.target.closest('.mtile'); if (t && !t.disabled) pick(+t.dataset.i); });
  }
  return { init };
})();
