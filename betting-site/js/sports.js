const Sports = (() => {
  const $ = id => document.getElementById(id);
  const KEY = 'kreiosbet:fixtures:v2';
  const MARGIN = 1.06; // bookmaker overround

  // Australian competitions. Fixtures, ratings and odds are SAMPLE data, not real markets.
  // Head-to-head markets are 2-way except soccer (1X2), matching how AU bookmakers price them.
  const SPORTS = {
    afl: { name: 'AFL', icon: '🏉', draw: false, leagues: {
      'AFL Premiership': ['Adelaide', 'Brisbane Lions', 'Carlton', 'Collingwood', 'Essendon', 'Fremantle', 'Geelong', 'Gold Coast',
        'GWS Giants', 'Hawthorn', 'Melbourne', 'North Melbourne', 'Port Adelaide', 'Richmond', 'St Kilda', 'Sydney', 'West Coast', 'Western Bulldogs'],
    }},
    nrl: { name: 'NRL', icon: '🏉', draw: false, leagues: {
      'NRL Telstra Premiership': ['Broncos', 'Raiders', 'Bulldogs', 'Sharks', 'Dolphins', 'Titans', 'Sea Eagles', 'Storm',
        'Knights', 'Cowboys', 'Eels', 'Panthers', 'Rabbitohs', 'Dragons', 'Roosters', 'Warriors', 'Wests Tigers'],
    }},
    cricket: { name: 'Cricket', icon: '🏏', draw: false, leagues: {
      'Big Bash League': ['Adelaide Strikers', 'Brisbane Heat', 'Hobart Hurricanes', 'Melbourne Renegades',
        'Melbourne Stars', 'Perth Scorchers', 'Sydney Sixers', 'Sydney Thunder'],
    }},
    soccer: { name: 'Soccer', icon: '⚽', draw: true, leagues: {
      'A-League Men': ['Adelaide United', 'Auckland FC', 'Brisbane Roar', 'Central Coast Mariners', 'Macarthur FC', 'Melbourne City',
        'Melbourne Victory', 'Newcastle Jets', 'Perth Glory', 'Sydney FC', 'Wellington Phoenix', 'Western Sydney Wanderers'],
    }},
    basketball: { name: 'Basketball', icon: '🏀', draw: false, leagues: {
      'NBL': ['Adelaide 36ers', 'Brisbane Bullets', 'Cairns Taipans', 'Illawarra Hawks', 'Melbourne United',
        'New Zealand Breakers', 'Perth Wildcats', 'South East Melbourne Phoenix', 'Sydney Kings', 'Tasmania JackJumpers'],
    }},
  };
  const MAX_GAMES_PER_LEAGUE = 5;

  const rating = name => { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0; return 60 + (h % 40); };

  let fixtures = [];
  let filter = 'all';
  let slip = []; // {eventId, pick, label, odds, stake}
  let mode = 'single';
  let round = 1;

  function save() { try { localStorage.setItem(KEY, JSON.stringify({ fixtures, round })); } catch (e) {} }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.fixtures?.length) { fixtures = s.fixtures; round = s.round || 1; return; } } catch (e) {}
    generate();
  }

  function probs(sport, home, away) {
    const diff = (rating(home) + 4 - rating(away)) / 12; // +4 home advantage
    const pHome = 1 / (1 + Math.exp(-diff));
    if (!SPORTS[sport].draw) return { home: pHome, away: 1 - pHome };
    const pDraw = 0.27 * (1 - Math.abs(pHome - 0.5));
    return { home: pHome * (1 - pDraw), draw: pDraw, away: (1 - pHome) * (1 - pDraw) };
  }
  const toOdds = p => Math.max(1.01, Math.round((1 / (p * MARGIN)) * 100) / 100);

  function generate() {
    fixtures = [];
    let id = Date.now();
    for (const [sport, def] of Object.entries(SPORTS)) {
      for (const [league, teams] of Object.entries(def.leagues)) {
        const t = [...teams];
        for (let i = t.length - 1; i > 0; i--) { const j = UI.rand(i + 1); [t[i], t[j]] = [t[j], t[i]]; }
        for (let i = 0; i + 1 < t.length && i / 2 < MAX_GAMES_PER_LEAGUE; i += 2) {
          const p = probs(sport, t[i], t[i + 1]);
          const odds = {};
          for (const k in p) odds[k] = toOdds(p[k]);
          const kick = new Date(Date.now() + (1 + UI.rand(72)) * 3600e3);
          fixtures.push({ id: String(id++), sport, league, home: t[i], away: t[i + 1], odds, p, kick: kick.toISOString(), status: 'open' });
        }
      }
    }
    save();
  }

  function genScore(ev) {
    const r = UI.randFloat();
    const outcome = r < ev.p.home ? 'home' : (ev.p.draw && r < ev.p.home + ev.p.draw) ? 'draw' : 'away';
    const pick = (lo, hi) => lo + UI.rand(hi - lo + 1);
    let a, b;
    switch (ev.sport) {
      case 'afl': a = pick(45, 125); b = pick(45, 125); break;
      case 'nrl': a = pick(4, 40); b = pick(4, 40); break;
      case 'cricket': a = pick(125, 215); b = pick(125, 215); break;
      case 'soccer': a = pick(0, 4); b = pick(0, 4); break;
      case 'basketball': a = pick(75, 115); b = pick(75, 115); break;
    }
    if (outcome === 'draw') b = a;
    else {
      if (a === b) a++;
      const [hi, lo] = a > b ? [a, b] : [b, a];
      [a, b] = outcome === 'home' ? [hi, lo] : [lo, hi];
    }
    return { outcome, score: formatScore(ev.sport, a, b, outcome) };
  }

  // AFL: goals.behinds (total), e.g. 12.10 (82). Cricket: runs/wickets.
  function aflScore(pts) {
    let g = Math.round(pts / 6.8), bh = pts - 6 * g;
    while (bh < 0) { g--; bh += 6; }
    return `${g}.${bh} (${pts})`;
  }
  function formatScore(sport, a, b, outcome) {
    if (sport === 'afl') return `${aflScore(a)} – ${aflScore(b)}`;
    if (sport === 'cricket') {
      // the losing side is usually bowled out or close to it
      const wk = win => win ? 2 + UI.rand(6) : 6 + UI.rand(5);
      const inns = (runs, w) => w >= 10 ? `${runs} all out` : `${runs}/${w}`;
      return `${inns(a, wk(outcome === 'home'))} – ${inns(b, wk(outcome === 'away'))}`;
    }
    return `${a} – ${b}`;
  }

  // ---------- Rendering ----------
  function renderSportList() {
    const list = $('sport-list');
    const count = s => fixtures.filter(f => f.status === 'open' && (s === 'all' || f.sport === s)).length;
    const btn = (key, label) => `<button data-sport="${key}" class="${filter === key ? 'active' : ''}"><span>${label}</span><span>${count(key)}</span></button>`;
    list.innerHTML = btn('all', '🏆 All sports') + Object.entries(SPORTS).map(([k, s]) => btn(k, `${s.icon} ${s.name}`)).join('');
    $('sport-title').textContent = filter === 'all' ? `All sports · Round ${round}` : SPORTS[filter].name;
  }

  function renderEvents() {
    const wrap = $('events');
    const evs = fixtures.filter(f => filter === 'all' || f.sport === filter);
    let html = '', lastLeague = '';
    for (const ev of evs) {
      const key = ev.sport + ev.league;
      if (key !== lastLeague) { html += `<div class="league">${SPORTS[ev.sport].icon} ${ev.league}</div>`; lastLeague = key; }
      const when = ev.status === 'settled'
        ? `<span class="event-score">FT ${ev.score}</span>`
        : new Date(ev.kick).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
      const labels = { home: '1', draw: 'X', away: '2' };
      const odds = Object.keys(ev.odds).map(k => {
        const sel = slip.some(s => s.eventId === ev.id && s.pick === k) ? ' selected' : '';
        const mv = ev.move?.[k] ? ' ' + ev.move[k] : '';
        const dis = ev.status !== 'open' ? ' disabled' : '';
        return `<button class="odd${sel}${mv}" data-ev="${ev.id}" data-pick="${k}"${dis}><small>${labels[k]}</small><strong>${ev.odds[k].toFixed(2)}</strong></button>`;
      }).join('');
      html += `<div class="event"><div class="event-teams">${ev.home} <span class="muted">vs</span> ${ev.away}<small>${when}</small></div><div class="odds">${odds}</div></div>`;
    }
    wrap.innerHTML = html || '<p class="muted">No events.</p>';
  }

  function slipLabel(ev, pick) { return pick === 'draw' ? 'Draw' : pick === 'home' ? ev.home : ev.away; }

  function renderSlip() {
    const items = $('slip-items'), footer = $('slip-footer');
    document.querySelectorAll('#slip-mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    if (!slip.length) { items.innerHTML = '<p class="muted">Click odds to add selections.</p>'; footer.innerHTML = ''; return; }
    items.innerHTML = slip.map((s, i) => {
      const ev = fixtures.find(f => f.id === s.eventId);
      const stakeInput = mode === 'single'
        ? `<input type="number" min="1" value="${s.stake || ''}" placeholder="Stake" data-stake="${i}">` : '';
      return `<div class="slip-item"><button class="remove" data-remove="${i}">×</button>
        <div class="pick">${s.label} <span style="color:var(--gold)">@ ${s.odds.toFixed(2)}</span></div>
        <div class="match">${ev.home} vs ${ev.away}</div>
        <div class="row">${stakeInput}<span class="muted" data-ret="${i}"></span></div></div>`;
    }).join('');

    if (mode === 'parlay') {
      const conflict = new Set(slip.map(s => s.eventId)).size !== slip.length;
      const total = slip.reduce((a, s) => a * s.odds, 1);
      footer.innerHTML = `<div class="slip-summary"><span>Multi odds</span><strong>${total.toFixed(2)}</strong></div>
        <label class="slip-summary"><span>Stake</span><input type="number" min="1" id="parlay-stake" value="${renderSlip.parlayStake || ''}"></label>
        <div class="slip-summary"><span>Potential return</span><strong id="parlay-ret">—</strong></div>
        ${conflict ? '<p class="muted" style="color:var(--red)">Multis can\'t include two picks from the same match.</p>' : ''}
        ${slip.length < 2 ? '<p class="muted">Add at least 2 selections for a multi.</p>' : ''}
        <button class="btn btn-primary" id="place-bet" ${conflict || slip.length < 2 ? 'disabled' : ''}>Place multi</button>`;
    } else {
      footer.innerHTML = `<div class="slip-summary"><span>Total stake</span><strong id="single-total">0</strong></div>
        <div class="slip-summary"><span>Potential return</span><strong id="single-ret">0</strong></div>
        <button class="btn btn-primary" id="place-bet">Place ${slip.length} bet${slip.length > 1 ? 's' : ''}</button>`;
    }
    updateReturns();
  }

  function updateReturns() {
    if (mode === 'single') {
      let st = 0, ret = 0;
      slip.forEach((s, i) => {
        const v = Math.floor(s.stake) || 0;
        st += v; ret += v * s.odds;
        const el = document.querySelector(`[data-ret="${i}"]`);
        if (el) el.textContent = v ? `Returns ${UI.fmt(v * s.odds)}` : '';
      });
      if ($('single-total')) { $('single-total').textContent = UI.fmt(st); $('single-ret').textContent = UI.fmt(ret); }
    } else if ($('parlay-ret')) {
      const v = Math.floor(renderSlip.parlayStake) || 0;
      const total = slip.reduce((a, s) => a * s.odds, 1);
      $('parlay-ret').textContent = v ? UI.fmt(v * total) : '—';
    }
  }

  function renderOpenBets() {
    const el = $('open-bets');
    const bets = Wallet.openBets;
    if (!bets.length) { el.innerHTML = '<p class="muted">No open bets.</p>'; return; }
    el.innerHTML = bets.map(b => `<div class="open-bet"><strong>${b.type === 'parlay' ? `${b.legs.length}-leg multi` : b.legs[0].label}</strong>
      @ ${b.odds.toFixed(2)} · stake ${UI.fmt(b.stake)}<br><span class="muted">${b.legs.map(l => l.match).join(' · ')}</span></div>`).join('');
  }

  function renderAll() { renderSportList(); renderEvents(); renderSlip(); renderOpenBets(); }

  // ---------- Actions ----------
  function toggleSelection(evId, pick) {
    const ev = fixtures.find(f => f.id === evId);
    if (!ev || ev.status !== 'open') return;
    const i = slip.findIndex(s => s.eventId === evId && s.pick === pick);
    if (i >= 0) slip.splice(i, 1);
    else {
      // only one pick per match: replace any other pick from the same event
      slip = slip.filter(s => s.eventId !== evId);
      slip.push({ eventId: evId, pick, label: slipLabel(ev, pick), odds: ev.odds[pick], stake: '' });
    }
    renderEvents(); renderSlip();
  }

  function placeBets() {
    const mk = s => { const ev = fixtures.find(f => f.id === s.eventId); return { eventId: s.eventId, pick: s.pick, label: s.label, odds: s.odds, match: `${ev.home} v ${ev.away}` }; };
    if (mode === 'single') {
      const valid = slip.filter(s => Math.floor(s.stake) > 0);
      if (!valid.length) return UI.toast('Enter a stake for at least one selection');
      const total = valid.reduce((a, s) => a + Math.floor(s.stake), 0);
      if (!Wallet.stake(total)) return;
      valid.forEach(s => Wallet.openBets.push({ id: Date.now() + Math.random(), type: 'single', legs: [mk(s)], odds: s.odds, stake: Math.floor(s.stake) }));
      slip = slip.filter(s => !valid.includes(s));
      UI.toast(`${valid.length} bet${valid.length > 1 ? 's' : ''} placed`);
    } else {
      const st = Math.floor(renderSlip.parlayStake);
      if (!(st > 0)) return UI.toast('Enter a stake for the multi');
      if (!Wallet.stake(st)) return;
      const odds = Math.round(slip.reduce((a, s) => a * s.odds, 1) * 100) / 100;
      Wallet.openBets.push({ id: Date.now(), type: 'parlay', legs: slip.map(mk), odds, stake: st });
      slip = []; renderSlip.parlayStake = '';
      UI.toast('Multi placed');
    }
    Wallet.saveOpenBets();
    renderAll();
  }

  function simulateRound() {
    const open = fixtures.filter(f => f.status === 'open');
    if (!open.length) return;
    open.forEach(ev => { const r = genScore(ev); ev.status = 'settled'; ev.result = r.outcome; ev.score = r.score; ev.move = null; });
    slip = [];
    // settle bets
    let won = 0, lost = 0, paid = 0;
    const remaining = [];
    for (const b of Wallet.openBets) {
      const evs = b.legs.map(l => fixtures.find(f => f.id === l.eventId));
      if (evs.some(e => !e || e.status !== 'settled')) { remaining.push(b); continue; }
      const win = b.legs.every((l, i) => evs[i].result === l.pick);
      const ret = win ? Math.round(b.stake * b.odds * 100) / 100 : 0;
      if (win) { won++; paid += ret; Wallet.credit(ret); } else lost++;
      const desc = b.legs.map((l, i) => `${l.label} (${evs[i].score})`).join(' + ');
      Wallet.record(b.type === 'parlay' ? `Multi ×${b.legs.length}` : 'Sports', desc + ` @ ${b.odds.toFixed(2)}`, b.stake, ret);
    }
    Wallet.openBets.length = 0;
    Wallet.openBets.push(...remaining);
    Wallet.saveOpenBets();
    save();
    renderAll();
    const btn = $('simulate');
    btn.textContent = '↻ Load next fixtures';
    btn.dataset.next = '1';
    if (won || lost) UI.toast(`Results in: ${won} won, ${lost} lost${paid ? ` · paid ${UI.fmt(paid)}` : ''}`);
    else UI.toast('Full-time results are in');
  }

  function nextFixtures() {
    round++;
    generate();
    const btn = $('simulate');
    btn.textContent = '▶ Play next round of matches';
    delete btn.dataset.next;
    renderAll();
  }

  // Small live odds drift to make the board feel alive
  function drift() {
    const open = fixtures.filter(f => f.status === 'open');
    if (!open.length || document.hidden) return;
    const ev = open[UI.rand(open.length)];
    const keys = Object.keys(ev.odds);
    const k = keys[UI.rand(keys.length)];
    const delta = (UI.rand(2) ? 1 : -1) * (0.02 + UI.rand(6) / 100);
    ev.odds[k] = Math.max(1.01, Math.round((ev.odds[k] + delta) * 100) / 100);
    ev.move = { [k]: delta > 0 ? 'up' : 'down' };
    // keep slip odds in sync (accepting price changes)
    slip.forEach(s => { if (s.eventId === ev.id && s.pick === k) s.odds = ev.odds[k]; });
    save();
    // update just the affected button in place so clicks are never swallowed by a re-render
    const btn = document.querySelector(`.odd[data-ev="${ev.id}"][data-pick="${k}"]`);
    if (btn) {
      btn.querySelector('strong').textContent = ev.odds[k].toFixed(2);
      btn.classList.remove('up', 'down');
      btn.classList.add(ev.move[k]);
    }
    if (slip.some(s => s.eventId === ev.id && s.pick === k)) renderSlip();
  }

  // Bets on fixtures that no longer exist (e.g. after the fixture list changes) are voided and refunded.
  function voidOrphanBets() {
    const ids = new Set(fixtures.map(f => f.id));
    const keep = [];
    let refunded = 0;
    for (const b of Wallet.openBets) {
      if (b.legs.every(l => ids.has(l.eventId))) { keep.push(b); continue; }
      refunded += b.stake;
      Wallet.record('Sports', `Void: ${b.legs.map(l => l.label).join(' + ')} (fixture removed)`, b.stake, b.stake);
    }
    if (!refunded) return;
    Wallet.openBets.length = 0;
    Wallet.openBets.push(...keep);
    Wallet.credit(refunded);
    Wallet.saveOpenBets();
  }

  function init() {
    load();
    voidOrphanBets();
    if (fixtures.every(f => f.status === 'settled')) { $('simulate').textContent = '↻ Load next fixtures'; $('simulate').dataset.next = '1'; }
    $('sport-list').addEventListener('click', e => { const b = e.target.closest('[data-sport]'); if (b) { filter = b.dataset.sport; renderSportList(); renderEvents(); } });
    $('events').addEventListener('click', e => { const b = e.target.closest('.odd'); if (b && !b.disabled) toggleSelection(b.dataset.ev, b.dataset.pick); });
    $('slip-mode').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) { mode = b.dataset.mode; renderSlip(); } });
    $('slip-items').addEventListener('click', e => { const b = e.target.closest('[data-remove]'); if (b) { slip.splice(+b.dataset.remove, 1); renderEvents(); renderSlip(); } });
    $('slip-items').addEventListener('input', e => { if (e.target.dataset.stake != null) { slip[+e.target.dataset.stake].stake = e.target.value; updateReturns(); } });
    $('slip-footer').addEventListener('input', e => { if (e.target.id === 'parlay-stake') { renderSlip.parlayStake = e.target.value; updateReturns(); } });
    $('slip-footer').addEventListener('click', e => { if (e.target.id === 'place-bet') placeBets(); });
    $('simulate').addEventListener('click', e => e.currentTarget.dataset.next ? nextFixtures() : simulateRound());
    setInterval(drift, 2500);
    renderAll();
  }
  return { init, renderAll };
})();
