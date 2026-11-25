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

**Sportsbook (Australia)**
- AFL, NRL, Big Bash League cricket, A-League Men (1X2) and NBL
- **Sample** fixtures and odds (derived from placeholder team ratings with a bookmaker margin), clearly labelled as not live markets
- AFL scores in goals.behinds (total) format, cricket in runs/wickets
- Bet slip with singles and multis
- "Play next round" simulates full-time results, settles open bets and pays out

**Australian compliance**
- 18+ age gate before any play
- Rotating national gambling taglines (e.g. "Chances are you're about to lose.")
- Gambling Help Online (1800 858 858) and BetStop on every page
- Safer gambling page: reality-check reminders and take-a-break (24h / 7d / 30d, can't be cancelled early)
- Partner slot for licensed Australian bookmakers, sportsbook only, configured in `js/config.js` and disabled until you're approved. Never add online casinos or offshore operators — promoting them to Australians is illegal under the Interactive Gambling Act 2001

**Account**
- Starts with 1,000 credits; free top-ups when the balance drops under 500
- Bet history with staked/returned/net stats
- Balance, history and fixtures persist in `localStorage`

## Structure

```
index.html
css/styles.css
js/config.js      partner links and site settings
js/compliance.js  age gate, taglines, reality check, take-a-break, partner slot
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
js/app.js         routing (#home, #casino-<game>, #sports, #history, #safer)
```

## Real odds (next step)

The sportsbook uses sample data. Real AFL/NRL/BBL/A-League/NBL odds from Australian bookmakers can come from an odds data API, but the key must stay secret, so the odds need to be fetched by a small server or scheduled job and saved as a file the site reads, not fetched directly from the browser.

## Note on real-money operation

Running a real-money casino or sportsbook requires gambling licences in each jurisdiction served, age and identity verification (KYC), anti-money-laundering controls, certified RNGs, responsible-gambling tooling and a licensed payment processor. This project is a front-end demo only.
