const Plinko = (() => {
  const $ = id => document.getElementById(id);
  const ROWS = 12;
  // 13 bins; each table returns ~99% (binomial weighting)
  const TABLES = {
    low:    [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high:   [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  };
  let cv, ctx, W, H, S, GAP, TOP;
  const balls = [];
  let raf = 0;

  function pegXY(r, j) { return [W / 2 + (j - (r + 2) / 2) * S, TOP + r * GAP]; }

  function drawBoard() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#c9d3df';
    for (let r = 0; r < ROWS; r++) {
      for (let j = 0; j < r + 3; j++) {
        const [x, y] = pegXY(r, j);
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function renderBins(hit) {
    const t = TABLES[$('plinko-risk').value];
    $('plinko-bins').innerHTML = t.map((m, i) => {
      const heat = Math.min(1, Math.log10(m + 1) / Math.log10(171));
      return `<div class="pbin${hit === i ? ' hit' : ''}" style="--heat:${heat.toFixed(2)}">${m}×</div>`;
    }).join('');
  }

  function drop() {
    const b = $('plinko-bet').value;
    if (!Wallet.stake(b)) return;
    const stake = Math.floor(b);
    const risk = $('plinko-risk').value;
    const path = Array.from({ length: ROWS }, () => UI.rand(2)); // 1 = right
    balls.push({ stake, risk, path, t: 0 });
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function ballPos(ball) {
    // t in [0,1): straight drop onto the top peg; then one unit of t per row, bouncing ±S/2
    if (ball.t < 1) return [W / 2, TOP - GAP + GAP * ball.t - 8];
    const step = Math.min(Math.floor(ball.t) - 1, ROWS);
    const frac = Math.min(ball.t - 1 - step, 1);
    let x = W / 2;
    for (let i = 0; i < step; i++) x += (ball.path[i] ? 1 : -1) * S / 2;
    const y0 = TOP + step * GAP - 8;
    if (step >= ROWS) return [x, y0];
    return [x + (ball.path[step] ? 1 : -1) * (S / 2) * frac, y0 + GAP * frac - Math.sin(frac * Math.PI) * 12];
  }

  function frame() {
    drawBoard();
    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];
      ball.t += 0.09;
      const [x, y] = ballPos(ball);
      ctx.fillStyle = '#f5b301';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      if (ball.t >= ROWS + 1) { balls.splice(i, 1); land(ball); }
    }
    raf = balls.length ? requestAnimationFrame(frame) : 0;
    if (!raf) drawBoard();
  }

  function land(ball) {
    const bin = ball.path.reduce((a, b) => a + b, 0);
    const mult = TABLES[ball.risk][bin];
    const ret = Math.round(ball.stake * mult * 100) / 100;
    if (ret) Wallet.credit(ret);
    if ($('plinko-risk').value === ball.risk) renderBins(bin);
    UI.result('plinko-result', `${mult}× — ${ret >= ball.stake ? 'won' : 'returned'} ${UI.fmt(ret)}`, ret > ball.stake ? 'win' : ret < ball.stake ? 'lose' : '');
    Wallet.record('Plinko', `${ball.risk} risk · ${mult}×`, ball.stake, ret);
  }

  function init() {
    cv = $('plinko-canvas'); ctx = cv.getContext('2d');
    W = cv.width; H = cv.height;
    S = W / (ROWS + 2);       // horizontal peg spacing
    GAP = (H - 50) / ROWS;    // vertical row spacing
    TOP = 34;
    drawBoard(); renderBins();
    $('plinko-drop').addEventListener('click', drop);
    $('plinko-risk').addEventListener('change', () => renderBins());
  }
  return { init };
})();
