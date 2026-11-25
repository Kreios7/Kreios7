const Dice = (() => {
  const $ = id => document.getElementById(id);
  let dir = 'under', rolling = false;
  const past = [];

  const target = () => +$('dice-target').value;
  const chance = () => dir === 'under' ? target() : 100 - target();
  const payout = () => Math.floor((99 / chance()) * 10000) / 10000;

  function update() {
    const t = target();
    $('dice-target-label').textContent = t;
    $('dice-target-label2').textContent = t;
    $('dice-chance').textContent = chance() + '%';
    $('dice-payout').textContent = payout().toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + '×';
    const pct = ((t - 2) / 96) * 100;
    const track = $('dice-target');
    track.style.setProperty('--split', pct + '%');
    track.classList.toggle('over', dir === 'over');
    document.querySelectorAll('.dice-dir button').forEach(b => b.classList.toggle('active', b.dataset.dir === dir));
  }

  function roll() {
    if (rolling) return;
    const b = $('dice-bet').value;
    if (!Wallet.stake(b)) return;
    const stake = Math.floor(b);
    rolling = true;
    const t = target(), d = dir, mult = payout();
    const result = UI.rand(10000) / 100; // 0.00 – 99.99
    const el = $('dice-roll');
    el.className = 'dice-roll';
    let n = 0;
    const iv = setInterval(() => {
      el.textContent = (UI.rand(10000) / 100).toFixed(2);
      if (++n > 10) {
        clearInterval(iv);
        el.textContent = result.toFixed(2);
        const win = d === 'under' ? result < t : result >= t;
        const ret = win ? Math.floor(stake * mult * 100) / 100 : 0;
        if (ret) Wallet.credit(ret);
        el.classList.add(win ? 'win' : 'lose');
        $('dice-marker').style.left = `calc(${result}% - 2px)`;
        $('dice-marker').className = 'dice-marker show ' + (win ? 'win' : 'lose');
        UI.result('dice-result', win ? `Rolled ${result.toFixed(2)} — won ${UI.fmt(ret)}` : `Rolled ${result.toFixed(2)} — lost`, win ? 'win' : 'lose');
        Wallet.record('Dice', `${d} ${t} · rolled ${result.toFixed(2)}`, stake, ret);
        past.unshift({ result, win });
        $('dice-history').innerHTML = past.slice(0, 15).map(p => `<span class="${p.win ? 'hi' : 'lo'}">${p.result.toFixed(2)}</span>`).join('');
        rolling = false;
      }
    }, 45);
  }

  function init() {
    $('dice-target').addEventListener('input', update);
    document.querySelector('.dice-dir').addEventListener('click', e => {
      const b = e.target.closest('[data-dir]');
      if (b) { dir = b.dataset.dir; update(); }
    });
    $('dice-go').addEventListener('click', roll);
    update();
  }
  return { init };
})();
