# Kreios Bet — Casino & Sportsbook (play money)

A browser-only online casino and sportsbook demo. Everything runs client-side with **virtual credits that have no cash value** — there are no real deposits, wagers or payouts.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
cd betting-site
python3 -m http.server 8000   # then visit http://localhost:8000
```

It can also be hosted as-is on GitHub Pages or any static host.

## Features

**Casino**
- 🎰 **Slots** — 3 weighted reels, paytable up to 50×
- 🃏 **Blackjack** — 6-deck shoe, hit/stand/double, dealer stands on 17, blackjack pays 3:2
- 🎡 **Roulette** — European single-zero board, straight-up (35:1), dozens/columns (2:1), red/black/odd/even/high/low (1:1). Left-click places a chip, right-click removes it
- 🚀 **Crash** — rising multiplier with manual or auto cash-out, 1% house edge
- 🔻 **Plinko** — 12-row board with low / medium / high risk tables (up to 170×), ~99% RTP
- 💣 **Mines** — 5×5 grid, pick 1–24 mines, cash out any time, ~99% RTP
- 🎲 **Dice** — set a target and roll over or under it; payout = 99 ÷ win chance
- ♠️ **Video Poker** — Jacks or Better with the 9/6 paytable, hold and draw

**Sportsbook**
- Soccer (1X2), basketball, American football, tennis and ice hockey with fictional teams
- Odds derived from team ratings with a bookmaker margin, plus live odds drift
- Bet slip with singles and parlays
- "Play next round" simulates full-time results, settles open bets and pays out

**Account**
- Starts with 1,000 credits; free top-ups when the balance drops under 500
- Bet history with staked/returned/net stats
- Balance, history and fixtures persist in `localStorage`

## Structure

```
index.html
css/styles.css
js/wallet.js      balance, history, shared UI helpers, crypto RNG
js/slots.js
js/blackjack.js
js/roulette.js
js/crash.js
js/plinko.js
js/mines.js
js/dice.js
js/videopoker.js
js/sports.js      fixtures, odds, bet slip, settlement
js/app.js         routing (#home, #casino-<game>, #sports, #history)
```

## Note on real-money operation

Running a real-money casino or sportsbook requires gambling licences in each jurisdiction served, age and identity verification (KYC), anti-money-laundering controls, certified RNGs, responsible-gambling tooling and a licensed payment processor. This project is a front-end demo only.
