// Site configuration. Edit this file to switch features on.
const CONFIG = {
  region: 'AU',
  minAge: 18,

  // Licensed Australian wagering providers you have been APPROVED to promote through their affiliate/partner program.
  // Leave empty until accepted. Never add offshore operators or online casinos — promoting those to Australians
  // is an offence under the Interactive Gambling Act 2001.
  // Shape: { name: 'Example Bet', url: 'https://…your tracking link…', licence: 'NT Racing Commission' }
  // Do NOT add sign-up bonus or "bonus bet" wording: inducements are restricted in NSW and other states.
  partners: [],

  // Demo coin store (simulated purchases only — no payment is taken).
  // While the store is enabled, the bookmaker partner slot is switched off: selling simulated gambling and
  // referring the same players to real-money bookmakers shouldn't be combined.
  storeEnabled: true,

  // Show a disabled placeholder where partner links would go (useful while developing; set false for launch).
  showPartnerPlaceholder: true,
};
