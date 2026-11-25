// DEMO coin store. Purchases are simulated: there is no payment form, no card details are collected,
// and no money is charged. It shows the safeguards a real social-casino store would need in Australia:
// AUD prices incl. GST, player-set spending limits with a cooling-off period, purchase history,
// purchases blocked during a break, and no pressure tactics.
const Store = (() => {
  const $ = id => document.getElementById(id);
  const PACKS = [
    { id: 'p5', credits: 5000, price: 4.99 },
    { id: 'p10', credits: 12000, price: 9.99 },
    { id: 'p20', credits: 30000, price: 19.99 },
    { id: 'p50', credits: 80000, price: 49.99 },
  ];
  const COOL_OFF_HOURS = 24;
  const MAX_LIMIT = 1000;
  let selected = null;

  const aud = n => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
  const gst = price => Math.round((price / 11) * 100) / 100; // GST included in the price = price ÷ 11
  const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return +d; };
  const startOfMonth = () => { const d = new Date(startOfDay()); d.setDate(1); return +d; };
  const spentSince = t => Math.round(Wallet.purchases.filter(p => p.t >= t).reduce((a, p) => a + p.price, 0) * 100) / 100;
  const fmtDate = t => new Date(t).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  function limits() {
    const L = Wallet.limits;
    if (L.pending && Date.now() >= L.pending.at) {
      L.daily = L.pending.daily; L.monthly = L.pending.monthly; L.pending = null;
      Wallet.save();
    }
    return L;
  }

  // Returns null if allowed, otherwise the reason it isn't.
  function blockReason(price) {
    const L = limits();
    if (spentSince(startOfDay()) + price > L.daily) return `Over your daily limit of ${aud(L.daily)}`;
    if (spentSince(startOfMonth()) + price > L.monthly) return `Over your monthly limit of ${aud(L.monthly)}`;
    return null;
  }

  function renderPacks() {
    $('store-packs').innerHTML = PACKS.map(p => {
      const reason = blockReason(p.price);
      return `<div class="pack">
        <div class="pack-credits">${UI.fmt(p.credits)}<small>credits</small></div>
        <div class="pack-price">${aud(p.price)}</div>
        <small class="muted">incl. ${aud(gst(p.price))} GST</small>
        <button class="btn btn-primary" data-pack="${p.id}" ${reason ? 'disabled' : ''}>Buy</button>
        <small class="pack-note">${reason || '&nbsp;'}</small>
      </div>`;
    }).join('');
  }

  function renderLimits() {
    const L = limits();
    const day = spentSince(startOfDay()), month = spentSince(startOfMonth());
    const bar = (v, max) => `<div class="meter${v >= max ? ' full' : ''}"><span style="width:${Math.min(100, max ? (v / max) * 100 : 100)}%"></span></div>`;
    $('limit-usage').innerHTML = `
      <div class="usage"><div class="usage-row"><span>Today</span><strong>${aud(day)} of ${aud(L.daily)}</strong></div>${bar(day, L.daily)}</div>
      <div class="usage"><div class="usage-row"><span>This month</span><strong>${aud(month)} of ${aud(L.monthly)}</strong></div>${bar(month, L.monthly)}</div>`;
    if (document.activeElement !== $('limit-daily')) $('limit-daily').value = L.daily;
    if (document.activeElement !== $('limit-monthly')) $('limit-monthly').value = L.monthly;
    $('limit-pending').textContent = L.pending
      ? `Increase to ${aud(L.pending.daily)} a day / ${aud(L.pending.monthly)} a month takes effect ${fmtDate(L.pending.at)}.`
      : '';
  }

  function renderHistory() {
    const rows = Wallet.purchases;
    $('purchase-body').innerHTML = rows.length
      ? rows.slice(0, 50).map(p => `<tr><td>${fmtDate(p.t)}</td><td>${UI.fmt(p.credits)} credits</td><td>${aud(p.price)}</td></tr>`).join('')
      : '<tr><td colspan="3" class="muted">No purchases yet.</td></tr>';
    $('purchase-total').textContent = aud(spentSince(0));
  }

  function render() { if (CONFIG.storeEnabled) { renderPacks(); renderLimits(); renderHistory(); } }

  function saveLimits() {
    const d = Math.floor(+$('limit-daily').value), m = Math.floor(+$('limit-monthly').value);
    if (!(d >= 0 && m >= 0 && d <= MAX_LIMIT && m <= MAX_LIMIT)) return UI.toast(`Limits must be between $0 and ${aud(MAX_LIMIT)}`);
    if (d > m) return UI.toast('Your daily limit can’t be higher than your monthly limit');
    const L = limits();
    if (d <= L.daily && m <= L.monthly) {
      // decreases apply immediately and cancel any pending increase
      L.daily = d; L.monthly = m; L.pending = null;
      UI.toast('Limits lowered. This applies now.');
    } else {
      L.daily = Math.min(L.daily, d); L.monthly = Math.min(L.monthly, m);
      L.pending = { daily: d, monthly: m, at: Date.now() + COOL_OFF_HOURS * 3600e3 };
      UI.toast(`Limit increases take effect in ${COOL_OFF_HOURS} hours`);
    }
    Wallet.save();
    render();
  }

  function openCheckout(id) {
    if (!Compliance.canPurchase()) return;
    const p = PACKS.find(x => x.id === id);
    const reason = blockReason(p.price);
    if (reason) return UI.toast(reason);
    selected = p;
    $('checkout-credits').textContent = UI.fmt(p.credits) + ' credits';
    $('checkout-price').textContent = aud(p.price);
    $('checkout-gst').textContent = aud(gst(p.price));
    $('checkout').hidden = false;
    $('checkout-confirm').focus();
  }

  function confirm() {
    if (!selected) return;
    const p = selected;
    selected = null;
    $('checkout').hidden = true;
    if (!Compliance.canPurchase() || blockReason(p.price)) return; // re-check at confirm time
    Wallet.purchase(p);
    UI.toast(`Demo purchase complete: +${UI.fmt(p.credits)} credits. No money was charged.`);
    render();
  }

  function init() {
    if (!CONFIG.storeEnabled) { document.querySelector('.nav a[data-nav="store"]').remove(); return; }
    $('store-packs').addEventListener('click', e => { const b = e.target.closest('[data-pack]'); if (b && !b.disabled) openCheckout(b.dataset.pack); });
    $('limit-save').addEventListener('click', saveLimits);
    $('checkout-confirm').addEventListener('click', confirm);
    $('checkout-cancel').addEventListener('click', () => { selected = null; $('checkout').hidden = true; });
    render();
  }

  return { init, render, spentSince };
})();
