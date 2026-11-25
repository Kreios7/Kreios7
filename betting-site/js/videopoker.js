const VideoPoker = (() => {
  const $ = id => document.getElementById(id);
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  // 9/6 Jacks or Better
  const PAYS = [
    ['Royal Flush', 800], ['Straight Flush', 50], ['Four of a Kind', 25], ['Full House', 9],
    ['Flush', 6], ['Straight', 4], ['Three of a Kind', 3], ['Two Pair', 2], ['Jacks or Better', 1],
  ];
  let deck = [], hand = [], held = [false, false, false, false, false], phase = 'idle', stake = 0;

  function shuffle() {
    deck = [];
    for (const s of SUITS) for (let r = 0; r < 13; r++) deck.push({ r, s });
    for (let i = deck.length - 1; i > 0; i--) { const j = UI.rand(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  }

  function evaluate(h) {
    const ranks = h.map(c => c.r).sort((a, b) => a - b);
    const counts = {};
    ranks.forEach(r => { counts[r] = (counts[r] || 0) + 1; });
    const groups = Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const flush = h.every(c => c.s === h[0].s);
    const uniq = new Set(ranks).size === 5;
    const wheel = ranks.join() === '0,1,2,3,12'; // A-2-3-4-5
    const straight = uniq && (ranks[4] - ranks[0] === 4 || wheel);
    if (straight && flush && ranks[0] === 8) return 0;
    if (straight && flush) return 1;
    if (groups[0][1] === 4) return 2;
    if (groups[0][1] === 3 && groups[1][1] === 2) return 3;
    if (flush) return 4;
    if (straight) return 5;
    if (groups[0][1] === 3) return 6;
    if (groups[0][1] === 2 && groups[1][1] === 2) return 7;
    if (groups[0][1] === 2 && +groups[0][0] >= 9) return 8; // pair of J (index 9) or better
    return -1;
  }

  function renderPaytable(hit) {
    const bet = Math.floor($('vp-bet').value) || 0;
    $('vp-paytable').innerHTML = PAYS.map(([name, m], i) =>
      `<tr class="${hit === i ? 'hit' : ''}"><td>${name}</td><td>${m}×</td><td>${bet ? UI.fmt(bet * m) : ''}</td></tr>`).join('');
  }

  function render(fresh) {
    $('vp-hand').classList.toggle('fresh', !!fresh);
    $('vp-hand').innerHTML = (hand.length ? hand : Array(5).fill(null)).map((c, i) => {
      if (!c) return `<div class="vp-slot"><div class="pcard back"><span></span></div></div>`;
      const red = c.s === '♥' || c.s === '♦';
      return `<button class="vp-slot${held[i] ? ' held' : ''}" data-i="${i}" ${phase !== 'hold' ? 'disabled' : ''}>
        <div class="pcard${red ? ' red' : ''}"><span>${RANKS[c.r]}</span><span class="suit-big">${c.s}</span><span style="text-align:right">${RANKS[c.r]}</span></div>
        <span class="vp-held">${held[i] ? 'HELD' : ''}</span></button>`;
    }).join('');
  }

  function deal() {
    if (phase === 'hold') return draw();
    const b = $('vp-bet').value;
    if (!Wallet.stake(b)) return;
    stake = Math.floor(b);
    shuffle();
    hand = deck.splice(0, 5);
    held = [false, false, false, false, false];
    phase = 'hold';
    const e = evaluate(hand);
    $('vp-hint').textContent = e >= 0 ? `You have ${PAYS[e][0]}. Tap cards to hold, then Draw.` : 'Tap cards to hold, then Draw.';
    $('vp-deal').textContent = 'Draw';
    UI.result('vp-result', '');
    renderPaytable(e >= 0 ? e : undefined);
    render(true);
  }

  function draw() {
    hand = hand.map((c, i) => held[i] ? c : deck.shift());
    phase = 'idle';
    const e = evaluate(hand);
    const ret = e >= 0 ? stake * PAYS[e][1] : 0;
    if (ret) Wallet.credit(ret);
    UI.result('vp-result', e >= 0 ? `${PAYS[e][0]}! Pays ${UI.fmt(ret)}` : 'No winning hand', ret > stake ? 'win' : ret === stake ? '' : 'lose');
    Wallet.record('Video Poker', e >= 0 ? PAYS[e][0] : 'No win', stake, ret);
    $('vp-hint').textContent = 'Press Deal to play again.';
    $('vp-deal').textContent = 'Deal';
    renderPaytable(e >= 0 ? e : undefined);
    render();
  }

  function init() {
    render(); renderPaytable();
    $('vp-deal').addEventListener('click', deal);
    $('vp-bet').addEventListener('input', () => phase === 'idle' && renderPaytable());
    $('vp-hand').addEventListener('click', e => {
      const s = e.target.closest('.vp-slot[data-i]');
      if (!s || phase !== 'hold') return;
      held[+s.dataset.i] = !held[+s.dataset.i];
      render();
    });
  }
  return { init, _evaluate: evaluate };
})();
