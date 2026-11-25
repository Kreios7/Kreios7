const Slots = (() => {
  // Weighted reel strip
  const STRIP = [
    ...Array(6).fill('🍒'), ...Array(5).fill('🍋'), ...Array(5).fill('🍇'),
    ...Array(3).fill('🔔'), ...Array(2).fill('7️⃣'), '💎',
  ];
  const TRIPLE = { '💎': 50, '7️⃣': 25, '🔔': 10, '🍋': 5, '🍇': 5, '🍒': 4 };
  let spinning = false;

  function payout(r) {
    if (r[0] === r[1] && r[1] === r[2]) return TRIPLE[r[0]];
    if (r.filter(s => s === '🍒').length === 2) return 2;
    return 0;
  }

  function spin() {
    if (spinning) return;
    const bet = document.getElementById('slots-bet').value;
    if (!Wallet.stake(bet)) return;
    const stake = Math.floor(bet);
    spinning = true;
    UI.result('slots-result', '');
    const reels = [...document.querySelectorAll('#reels .reel')];
    const final = reels.map(() => STRIP[UI.rand(STRIP.length)]);
    reels.forEach((el, i) => {
      el.classList.add('spinning');
      const iv = setInterval(() => { el.textContent = STRIP[UI.rand(STRIP.length)]; }, 70);
      setTimeout(() => {
        clearInterval(iv);
        el.classList.remove('spinning');
        el.textContent = final[i];
        if (i === reels.length - 1) finish(final, stake);
      }, 600 + i * 400);
    });
  }

  function finish(r, stake) {
    spinning = false;
    const mult = payout(r);
    const ret = stake * mult;
    if (ret) {
      Wallet.credit(ret);
      UI.result('slots-result', `${r.join(' ')} — you win ${UI.fmt(ret)} (${mult}×)!`, 'win');
    } else {
      UI.result('slots-result', `${r.join(' ')} — no win`, 'lose');
    }
    Wallet.record('Slots', r.join(''), stake, ret);
  }

  function init() { document.getElementById('slots-spin').addEventListener('click', spin); }
  return { init };
})();
