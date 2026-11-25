const Blackjack = (() => {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let shoe = [], player = [], dealer = [], bet = 0, active = false;
  const $ = id => document.getElementById(id);

  function newShoe() {
    shoe = [];
    for (let d = 0; d < 6; d++) for (const s of SUITS) for (const r of RANKS) shoe.push({ r, s });
    for (let i = shoe.length - 1; i > 0; i--) { const j = UI.rand(i + 1); [shoe[i], shoe[j]] = [shoe[j], shoe[i]]; }
  }
  function draw() { if (shoe.length < 60) newShoe(); return shoe.pop(); }

  function score(hand) {
    let total = 0, aces = 0;
    for (const c of hand) {
      if (c.hidden) continue;
      if (c.r === 'A') { total += 11; aces++; }
      else total += ['J', 'Q', 'K'].includes(c.r) ? 10 : Number(c.r);
    }
    while (total > 21 && aces) { total -= 10; aces--; }
    return total;
  }
  const isBJ = h => h.length === 2 && score(h) === 21;

  function cardEl(c) {
    const d = document.createElement('div');
    const red = c.s === '♥' || c.s === '♦';
    d.className = 'pcard' + (red ? ' red' : '') + (c.hidden ? ' back' : '');
    d.innerHTML = `<span>${c.r}</span><span class="suit-big">${c.s}</span><span style="text-align:right">${c.r}</span>`;
    return d;
  }
  function render() {
    $('bj-player').replaceChildren(...player.map(cardEl));
    $('bj-dealer').replaceChildren(...dealer.map(cardEl));
    $('bj-player-score').textContent = player.length ? `(${score(player)})` : '';
    $('bj-dealer-score').textContent = dealer.length ? `(${score(dealer)})` : '';
  }
  function setButtons(playing) {
    $('bj-deal').disabled = playing;
    $('bj-hit').disabled = !playing;
    $('bj-stand').disabled = !playing;
    $('bj-double').disabled = !playing || player.length !== 2 || Wallet.balance < bet;
  }

  function deal() {
    const b = $('bj-bet').value;
    if (!Wallet.stake(b)) return;
    bet = Math.floor(b);
    if (!shoe.length) newShoe();
    player = [draw(), draw()];
    dealer = [draw(), { ...draw(), hidden: true }];
    active = true;
    UI.result('bj-result', '');
    render();
    if (isBJ(player)) return stand();
    setButtons(true);
  }
  function hit() {
    player.push(draw());
    render();
    if (score(player) > 21) return end('Bust! Dealer wins.', 0);
    if (score(player) === 21) return stand();
    setButtons(true);
  }
  function double() {
    if (!Wallet.stake(bet)) return;
    bet *= 2;
    player.push(draw());
    render();
    if (score(player) > 21) return end('Bust on the double. Dealer wins.', 0);
    stand();
  }
  function stand() {
    setButtons(false);
    $('bj-deal').disabled = true;
    dealer[1].hidden = false;
    render();
    const pBJ = isBJ(player), dBJ = isBJ(dealer);
    if (pBJ || dBJ) {
      if (pBJ && dBJ) return end('Both have Blackjack — push.', bet);
      if (pBJ) return end('Blackjack! Pays 3:2.', bet * 2.5);
      return end('Dealer has Blackjack.', 0);
    }
    const step = () => {
      if (score(dealer) < 17) { dealer.push(draw()); render(); setTimeout(step, 450); return; }
      const p = score(player), d = score(dealer);
      if (d > 21) end('Dealer busts — you win!', bet * 2);
      else if (p > d) end(`You win ${p} to ${d}!`, bet * 2);
      else if (p < d) end(`Dealer wins ${d} to ${p}.`, 0);
      else end(`Push at ${p}.`, bet);
    };
    setTimeout(step, 450);
  }
  function end(msg, ret) {
    active = false;
    if (dealer[1]) dealer[1].hidden = false;
    render();
    if (ret) Wallet.credit(ret);
    UI.result('bj-result', msg + (ret > bet ? ` +${UI.fmt(ret - bet)}` : ''), ret > bet ? 'win' : ret === bet ? '' : 'lose');
    Wallet.record('Blackjack', `${score(player)} vs ${score(dealer)}`, bet, ret);
    setButtons(false);
  }

  function init() {
    $('bj-deal').addEventListener('click', deal);
    $('bj-hit').addEventListener('click', () => active && hit());
    $('bj-stand').addEventListener('click', () => active && stand());
    $('bj-double').addEventListener('click', () => active && double());
  }
  return { init };
})();
