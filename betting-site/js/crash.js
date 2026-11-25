const Crash = (() => {
  const $ = id => document.getElementById(id);
  let running = false, cashed = false, stake = 0, crashAt = 1, mult = 1, start = 0, raf = 0, auto = 0;
  let points = [];
  const past = [];

  // 1% house edge, heavy-tailed distribution
  function genCrash() {
    const r = UI.randFloat();
    if (r < 0.01) return 1.0;
    return Math.max(1, Math.floor((0.99 / (1 - r)) * 100) / 100);
  }

  function draw(busted) {
    const cv = $('crash-canvas'), ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#1f2630'; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, H * i / 5); ctx.lineTo(W, H * i / 5); ctx.stroke(); }
    if (points.length < 2) return;
    const maxT = Math.max(8, points[points.length - 1][0]);
    const maxM = Math.max(2, mult * 1.1);
    ctx.beginPath();
    points.forEach(([t, m], i) => {
      const x = (t / maxT) * (W - 20) + 10;
      const y = H - 10 - ((m - 1) / (maxM - 1)) * (H - 40);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.strokeStyle = busted ? '#ef4444' : '#22c55e';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  function startRound() {
    if (running) return;
    const b = $('crash-bet').value;
    if (!Wallet.stake(b)) return;
    stake = Math.floor(b);
    auto = parseFloat($('crash-auto').value) || 0;
    crashAt = genCrash();
    running = true; cashed = false; mult = 1; points = []; start = performance.now();
    $('crash-mult').className = 'crash-mult';
    $('crash-start').disabled = true;
    $('crash-cashout').disabled = false;
    UI.result('crash-result', '');
    tick();
  }

  function tick() {
    const t = (performance.now() - start) / 1000;
    mult = Math.floor(Math.pow(Math.E, 0.12 * t) * 100) / 100;
    if (!cashed && auto >= 1.01 && mult >= auto) { mult = auto; cashOut(); }
    if (mult >= crashAt) { mult = crashAt; points.push([t, mult]); return bust(); }
    points.push([t, mult]);
    $('crash-mult').textContent = mult.toFixed(2) + '×';
    draw(false);
    raf = requestAnimationFrame(tick);
  }

  function cashOut() {
    if (!running || cashed) return;
    cashed = true;
    const ret = Math.floor(stake * mult * 100) / 100;
    Wallet.credit(ret);
    $('crash-cashout').disabled = true;
    UI.result('crash-result', `Cashed out at ${mult.toFixed(2)}× — +${UI.fmt(ret - stake)}`, 'win');
    Wallet.record('Crash', `Cashed @ ${mult.toFixed(2)}× (bust ${crashAt.toFixed(2)}×)`, stake, ret);
  }

  function bust() {
    cancelAnimationFrame(raf);
    running = false;
    const el = $('crash-mult');
    el.textContent = `BUST @ ${crashAt.toFixed(2)}×`;
    el.className = 'crash-mult ' + (cashed ? 'cashed' : 'busted');
    draw(true);
    $('crash-start').disabled = false;
    $('crash-cashout').disabled = true;
    if (!cashed) {
      UI.result('crash-result', `Busted at ${crashAt.toFixed(2)}× — lost ${UI.fmt(stake)}`, 'lose');
      Wallet.record('Crash', `Busted @ ${crashAt.toFixed(2)}×`, stake, 0);
    }
    past.unshift(crashAt);
    $('crash-history').innerHTML = past.slice(0, 15)
      .map(m => `<span class="${m < 2 ? 'lo' : 'hi'}">${m.toFixed(2)}×</span>`).join('');
  }

  function init() {
    $('crash-start').addEventListener('click', startRound);
    $('crash-cashout').addEventListener('click', cashOut);
    draw(false);
  }
  return { init };
})();
