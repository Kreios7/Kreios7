(() => {
  const $ = id => document.getElementById(id);
  const VIEWS = ['home', 'casino', 'sports', 'history'];
  const GAMES = ['slots', 'blackjack', 'roulette', 'crash'];

  function renderBalance(_, dir) {
    const el = $('balance');
    el.textContent = UI.fmt(Wallet.balance);
    if (dir) { el.classList.remove('flash-up', 'flash-down'); void el.offsetWidth; el.classList.add('flash-' + dir); }
  }

  function showGame(g) {
    GAMES.forEach(x => { $('game-' + x).hidden = x !== g; });
    document.querySelectorAll('#casino-tabs button').forEach(b => b.classList.toggle('active', b.dataset.game === g));
  }

  function renderHistory() {
    const h = Wallet.history;
    const staked = h.reduce((a, r) => a + r.stake, 0);
    const returned = h.reduce((a, r) => a + r.ret, 0);
    const wins = h.filter(r => r.ret > r.stake).length;
    const net = returned - staked;
    $('stats').innerHTML = [
      ['Bets placed', h.length],
      ['Total staked', UI.fmt(staked)],
      ['Total returned', UI.fmt(returned)],
      ['Net result', `<span class="${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : ''}${UI.fmt(net)}</span>`],
      ['Win rate', h.length ? Math.round((wins / h.length) * 100) + '%' : '—'],
    ].map(([k, v]) => `<div class="stat"><small>${k}</small><strong>${v}</strong></div>`).join('');
    $('history-body').innerHTML = h.length ? h.map(r => {
      const p = r.ret - r.stake;
      return `<tr><td>${new Date(r.t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        <td>${r.game}</td><td>${r.details}</td><td>${UI.fmt(r.stake)}</td>
        <td class="${p > 0 ? 'pos' : p < 0 ? 'neg' : ''}">${UI.fmt(r.ret)}</td></tr>`;
    }).join('') : '<tr><td colspan="5" class="muted">No bets yet.</td></tr>';
  }

  function route() {
    const [view, game] = (location.hash.slice(1) || 'home').split('-');
    const v = VIEWS.includes(view) ? view : 'home';
    VIEWS.forEach(x => { $('view-' + x).hidden = x !== v; });
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === v));
    if (v === 'casino') showGame(GAMES.includes(game) ? game : document.querySelector('#casino-tabs .active')?.dataset.game || 'slots');
    if (v === 'sports') Sports.renderAll();
    if (v === 'history') renderHistory();
    window.scrollTo(0, 0);
  }

  document.addEventListener('DOMContentLoaded', () => {
    Wallet.onChange(renderBalance);
    renderBalance();
    Slots.init(); Blackjack.init(); Roulette.init(); Crash.init(); Sports.init();

    $('casino-tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-game]');
      if (b) location.hash = 'casino-' + b.dataset.game;
    });
    $('topup').addEventListener('click', () => Wallet.topUp());
    // two-step confirm (browser confirm() dialogs are blocked in some embeds)
    $('reset').addEventListener('click', e => {
      const btn = e.currentTarget;
      if (!btn.dataset.armed) {
        btn.dataset.armed = '1';
        btn.textContent = 'Click again to reset balance and clear history';
        setTimeout(() => { delete btn.dataset.armed; btn.textContent = 'Reset account'; }, 4000);
        return;
      }
      delete btn.dataset.armed;
      btn.textContent = 'Reset account';
      Wallet.reset(); renderHistory(); Sports.renderAll();
      UI.toast('Account reset to 1,000 credits');
    });
    window.addEventListener('hashchange', route);
    route();
  });
})();
