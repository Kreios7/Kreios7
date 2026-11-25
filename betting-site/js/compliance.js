// Australian safer-gambling features: 18+ age gate, national gambling taglines, support links,
// reality checks, take-a-break, and the (sports-only) partner slot.
const Compliance = (() => {
  const $ = id => document.getElementById(id);
  const KEY = 'kreiosbet:compliance:v1';

  // Taglines from Australia's national consistent gambling messaging (in use since 2023).
  const TAGLINES = [
    'Chances are you’re about to lose.',
    'Think. Is this a bet you really want to place?',
    'What’s gambling really costing you?',
    'What are you really gambling with?',
    'You win some. You lose more.',
    'What are you prepared to lose today? Set a deposit limit.',
    'Imagine what you could be buying instead.',
  ];
  const SUPPORT = 'For free and confidential support call 1800 858 858 or visit gamblinghelponline.org.au';

  let state = load();
  const sessionStart = Date.now();
  let realityTimer = 0;

  function load() {
    try { return { ageOk: false, breakUntil: 0, reality: 0, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
    catch (e) { return { ageOk: false, breakUntil: 0, reality: 0 }; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ } }

  const tagline = () => TAGLINES[UI.rand(TAGLINES.length)];
  const onBreak = () => state.breakUntil > Date.now();
  const fmtDate = t => new Date(t).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  // ---- Age gate ----
  function showAgeGate() {
    const g = $('agegate');
    g.hidden = state.ageOk;
    document.body.classList.toggle('locked', !state.ageOk);
  }

  // ---- Break / self-exclusion (demo-level; BetStop is the real national register) ----
  function renderBreak() {
    const on = onBreak();
    $('break-banner').hidden = !on;
    if (on) $('break-until').textContent = fmtDate(state.breakUntil);
    $('break-status').textContent = on ? `On a break until ${fmtDate(state.breakUntil)}. Breaks can't be cancelled early.` : 'No break active.';
    document.querySelectorAll('[data-break]').forEach(b => { b.disabled = on; });
  }
  function startBreak(hours) {
    const btn = document.querySelector(`[data-break="${hours}"]`);
    if (!btn.dataset.armed) { // two-step confirm
      document.querySelectorAll('[data-break]').forEach(b => { delete b.dataset.armed; b.textContent = b.dataset.label; });
      btn.dataset.armed = '1';
      btn.textContent = 'Click again to confirm';
      setTimeout(() => { delete btn.dataset.armed; btn.textContent = btn.dataset.label; }, 4000);
      return;
    }
    state.breakUntil = Date.now() + hours * 3600e3;
    document.querySelectorAll('[data-break]').forEach(b => { delete b.dataset.armed; b.textContent = b.dataset.label; });
    save(); renderBreak();
    UI.toast('Break started. Play is paused until ' + fmtDate(state.breakUntil));
  }

  // ---- Reality check ----
  function scheduleReality() {
    clearInterval(realityTimer);
    if (!state.reality) return;
    realityTimer = setInterval(() => {
      const mins = Math.round((Date.now() - sessionStart) / 60000);
      const h = Wallet.history.filter(r => r.t >= sessionStart);
      const net = h.reduce((a, r) => a + r.ret - r.stake, 0);
      const spent = typeof Store !== 'undefined' ? Store.spentSince(sessionStart) : 0;
      $('reality-text').textContent =
        `You've been playing for ${mins} minute${mins === 1 ? '' : 's'}. This session: ${h.length} bets, net ${net >= 0 ? '+' : ''}${UI.fmt(net)} credits` +
        (spent ? `, and ${spent.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })} spent in the demo store.` : '.');
      $('reality').hidden = false;
    }, state.reality * 60000);
  }
  function tickSession() {
    const m = Math.floor((Date.now() - sessionStart) / 60000);
    $('session-time').textContent = m < 1 ? 'under a minute' : `${m} min`;
  }

  // ---- Partner slot (sportsbook only) ----
  function renderPartners() {
    const el = $('partner-slot');
    const p = CONFIG.partners;
    if (CONFIG.storeEnabled) { el.innerHTML = ''; return; } // never mix paid credits with bookmaker referrals
    if (!p.length) {
      el.innerHTML = CONFIG.showPartnerPlaceholder
        ? `<div class="partner placeholder"><span class="ad-label">Partner slot · disabled</span>
           <p>Links to licensed Australian bookmakers will appear here once you're approved for a partner program. Configure them in <code>js/config.js</code>.</p></div>`
        : '';
      return;
    }
    el.innerHTML = `<div class="partner"><span class="ad-label">Advertisement · 18+</span>
      ${p.map(x => `<a class="btn partner-link" href="${x.url}" target="_blank" rel="sponsored noopener">Bet with ${x.name}</a>
        <small class="muted">Licensed by ${x.licence}</small>`).join('')}
      <p class="tagline">${tagline()}</p>
      <p class="muted small">${SUPPORT}. Self-exclude at betstop.gov.au.</p></div>`;
  }

  function init() {
    $('footer-tagline').textContent = tagline();
    $('sports-tagline').textContent = tagline();

    $('age-yes').addEventListener('click', () => { state.ageOk = true; save(); showAgeGate(); });
    $('age-no').addEventListener('click', () => { $('age-under').hidden = false; $('age-buttons').hidden = true; });

    document.querySelectorAll('[data-break]').forEach(b => {
      b.dataset.label = b.textContent;
      b.addEventListener('click', () => startBreak(+b.dataset.break));
    });

    const sel = $('reality-interval');
    sel.value = String(state.reality);
    sel.addEventListener('change', () => { state.reality = +sel.value; save(); scheduleReality(); UI.toast(state.reality ? `Reality check every ${state.reality} min` : 'Reality check off'); });
    $('reality-continue').addEventListener('click', () => { $('reality').hidden = true; });
    $('reality-stop').addEventListener('click', () => { $('reality').hidden = true; location.hash = 'safer'; });

    showAgeGate(); renderBreak(); renderPartners(); scheduleReality(); tickSession();
    setInterval(() => { tickSession(); if (state.breakUntil && !onBreak()) { state.breakUntil = 0; save(); renderBreak(); } }, 30000);
  }

  return {
    init,
    // Called by Wallet.stake before any bet is accepted.
    canPurchase() {
      if (!state.ageOk) { showAgeGate(); return false; }
      if (onBreak()) { UI.toast(`Purchases are paused during your break (until ${fmtDate(state.breakUntil)})`); return false; }
      return true;
    },
    canPlay() {
      if (!state.ageOk) { showAgeGate(); return false; }
      if (onBreak()) { UI.toast(`You're on a break until ${fmtDate(state.breakUntil)}`); return false; }
      return true;
    },
  };
})();
